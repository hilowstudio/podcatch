import { inngest } from '@/lib/inngest/client';
import { prisma } from '@/lib/prisma';
import { resolvePlanKey } from '@/lib/subscription';
import { isTtsConfigured } from '@/lib/tts';
import { isR2Configured } from '@/lib/r2';
import { generateBriefingForUser } from '@/lib/briefings/generate';

/**
 * Weekly per-user "Audio Briefing": a ~3–4 minute narrated recap of the week's
 * episodes and highlights. Opt-in and Pro-only (each run costs TTS + storage),
 * delivered on the user's local Sunday. Gemini drafts the script, Gemini 2.5
 * Flash TTS narrates it, we encode to MP3 and store on R2, then expose it in-app
 * and via the user's private podcast RSS feed.
 */
export const generateBriefing = inngest.createFunction(
    { id: 'generate-briefing', name: 'Generate Audio Briefing', concurrency: { limit: 3 } },
    { cron: '0 * * * *' }, // hourly — confirm each user's local Sunday + hour below
    async ({ step }) => {
        // Hard requirement: without TTS + storage configured there's nothing to do.
        if (!isTtsConfigured() || !isR2Configured()) {
            return { skipped: 'tts-or-storage-not-configured' };
        }

        const today = new Date();
        const utcDay = today.getUTCDay();
        if (utcDay !== 6 && utcDay !== 0 && utcDay !== 1) {
            return { skipped: 'not-near-sunday' };
        }

        const candidates = await step.run('fetch-briefing-candidates', async () => {
            const users = await prisma.user.findMany({
                where: { briefingEnabled: true },
                select: {
                    id: true,
                    timezone: true,
                    digestDeliveryTime: true,
                    lastBriefingAt: true,
                    preferredLanguage: true,
                    stripePriceId: true,
                    stripeCurrentPeriodEnd: true,
                },
            });

            return users.filter(user => {
                if (resolvePlanKey(user.stripePriceId, user.stripeCurrentPeriodEnd) !== 'pro') return false;

                const tz = user.timezone || 'UTC';
                const preferredHour = parseInt((user.digestDeliveryTime || '08:00').split(':')[0]);
                const parts = new Intl.DateTimeFormat('en-US', {
                    timeZone: tz, hour: 'numeric', hourCycle: 'h23', weekday: 'short',
                }).formatToParts(today);
                const localHour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '99');
                const localWeekday = parts.find(p => p.type === 'weekday')?.value ?? '';

                if (localWeekday !== 'Sun' || localHour !== preferredHour) return false;
                if (user.lastBriefingAt) {
                    const days = (today.getTime() - user.lastBriefingAt.getTime()) / 86_400_000;
                    if (days < 6) return false;
                }
                return true;
            });
        });

        let built = 0;

        for (const user of candidates) {
            const done = await step.run(`brief-${user.id}`, async () => {
              try {
                // Idempotency guard: if a briefing already exists for this user this
                // week (e.g. a retry after a partial failure), don't regenerate —
                // TTS is billed, so never double-charge.
                const recent = await prisma.briefing.findFirst({
                    where: { userId: user.id, createdAt: { gte: new Date(today.getTime() - 6 * 86_400_000) } },
                    select: { id: true },
                });
                if (recent) return false;

                // lastBriefingAt is a string here (Inngest serializes step results).
                const since = user.lastBriefingAt ? new Date(user.lastBriefingAt) : new Date(today.getTime() - 7 * 86_400_000);
                const result = await generateBriefingForUser(user.id, since);
                return result.built;
              } catch (err) {
                // One user's failure (TTS/model access, R2, etc.) must not sink the
                // whole batch — log and move on; they'll be retried next week.
                console.error(`[briefing] failed for ${user.id}`, err);
                return false;
              }
            });

            if (done) built++;
        }

        return { candidates: candidates.length, briefingsBuilt: built };
    }
);
