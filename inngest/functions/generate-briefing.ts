import { inngest } from '@/lib/inngest/client';
import { prisma } from '@/lib/prisma';
import { resolvePlanKey } from '@/lib/subscription';
import { languageName } from '@/lib/languages';
import { isTtsConfigured, textToMp3 } from '@/lib/tts';
import { isR2Configured, uploadToR2 } from '@/lib/r2';
import { MODELS } from '@/lib/ai/models';

const MAX_SCRIPT_EPISODES = 12;

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
                // Idempotency guard: if a briefing already exists for this user this
                // week (e.g. a retry after a partial failure), don't regenerate —
                // TTS is billed, so never double-charge.
                const recent = await prisma.briefing.findFirst({
                    where: { userId: user.id, createdAt: { gte: new Date(today.getTime() - 6 * 86_400_000) } },
                    select: { id: true },
                });
                if (recent) return false;

                const since = user.lastBriefingAt || new Date(today.getTime() - 7 * 86_400_000);
                const [episodes, snips] = await Promise.all([
                    prisma.episode.findMany({
                        where: {
                            status: 'COMPLETED',
                            updatedAt: { gte: since },
                            insight: { isNot: null },
                            feed: { subscriptions: { some: { userId: user.id } } },
                        },
                        orderBy: { publishedAt: 'desc' },
                        take: MAX_SCRIPT_EPISODES,
                        select: { title: true, feed: { select: { title: true } }, insight: { select: { summary: true } } },
                    }),
                    prisma.snip.findMany({
                        where: { userId: user.id, content: { not: null }, createdAt: { gte: since } },
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                        select: { content: true },
                    }),
                ]);

                if (episodes.length === 0 && snips.length === 0) return false;

                const material = [
                    ...episodes.map(e => `• ${e.feed.title} — ${e.title}\n${e.insight?.summary ?? ''}`),
                    ...(snips.length ? [`Highlights the listener saved:\n${snips.map(s => `- "${s.content}"`).join('\n')}`] : []),
                ].join('\n\n');

                const langName = languageName(user.preferredLanguage);
                const langLine = langName ? `Write the script in ${langName}.` : '';

                // 1. Draft the spoken script.
                const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
                const { generateText } = await import('ai');
                const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
                const { text: script } = await generateText({
                    model: google(MODELS.synthesis),
                    prompt:
                        `You are the host of a personal weekly audio briefing for one listener, recapping their podcast week. ` +
                        `Using the material below, write a warm, natural spoken-word script of about 450–650 words. ` +
                        `Open with a brief friendly greeting, weave the episodes into 2–4 themes rather than listing them, ` +
                        `mention a saved highlight if relevant, and close with a short sign-off. ` +
                        `Plain spoken prose only — no headings, no markdown, no stage directions, no speaker labels. ${langLine}\n\n` +
                        `MATERIAL:\n${material}`,
                    maxOutputTokens: 2048,
                });

                if (!script.trim()) return false;

                // 2. Narrate → MP3, 3. store on R2.
                const { mp3, durationSec } = await textToMp3(script);
                const key = `briefings/${user.id}/${today.getTime()}.mp3`;
                const audioUrl = await uploadToR2(key, mp3, 'audio/mpeg');

                // 4. Record + meter + mark, atomically.
                await prisma.$transaction([
                    prisma.briefing.create({ data: { userId: user.id, audioUrl, script, durationSec } }),
                    prisma.usageLog.create({ data: { userId: user.id, action: 'BRIEFING', targetId: null } }),
                    prisma.user.update({ where: { id: user.id }, data: { lastBriefingAt: new Date() } }),
                ]);

                return true;
            });

            if (done) built++;
        }

        return { candidates: candidates.length, briefingsBuilt: built };
    }
);
