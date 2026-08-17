import { inngest } from '@/lib/inngest/client';
import { prisma } from '@/lib/prisma';
import { resolvePlanKey } from '@/lib/subscription';
import { Resend } from 'resend';

/** Feed/episode/highlight text is user- and third-party-authored — escape it. */
function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function stamp(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

const HIGHLIGHTS_PER_REWIND = 3;
const MIN_HIGHLIGHTS = 1;

/**
 * Weekly "Rewind" — resurfaces a spaced sample of a user's saved highlights so
 * they stick (the Readwise retention loop). Delivery is gated three ways so it
 * never surprises anyone: the user must already receive Podcatch email
 * (digestFrequency != 'NONE'), be on a paid plan, and not have opted out
 * (rewindEnabled). Goes out on the user's LOCAL Sunday — a different day from the
 * Monday weekly digest — at their chosen delivery hour.
 */
export const sendRewind = inngest.createFunction(
    { id: 'send-rewind', name: 'Send Weekly Rewind' },
    { cron: '0 * * * *' }, // hourly — confirm each user's local Sunday + hour below
    async ({ step }) => {
        const today = new Date();
        const utcDay = today.getUTCDay();
        // A user's local Sunday can fall on UTC Saturday (far-east zones) through
        // UTC Monday (far-west), so cast a wide net and confirm local weekday below.
        if (utcDay !== 6 && utcDay !== 0 && utcDay !== 1) {
            return { skipped: 'not-near-sunday' };
        }

        const candidates = await step.run('fetch-rewind-candidates', async () => {
            const users = await prisma.user.findMany({
                where: {
                    digestFrequency: { not: 'NONE' },
                    rewindEnabled: true,
                },
                select: {
                    id: true,
                    email: true,
                    timezone: true,
                    digestDeliveryTime: true,
                    lastRewindAt: true,
                    stripePriceId: true,
                    stripeCurrentPeriodEnd: true,
                },
            });

            return users.filter(user => {
                // Paid plans only.
                if (resolvePlanKey(user.stripePriceId, user.stripeCurrentPeriodEnd) === 'free') return false;

                const tz = user.timezone || 'UTC';
                const preferredHour = parseInt((user.digestDeliveryTime || '08:00').split(':')[0]);
                const parts = new Intl.DateTimeFormat('en-US', {
                    timeZone: tz,
                    hour: 'numeric',
                    hourCycle: 'h23',
                    weekday: 'short',
                }).formatToParts(today);
                const localHour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '99');
                const localWeekday = parts.find(p => p.type === 'weekday')?.value ?? '';

                if (localWeekday !== 'Sun') return false;
                if (localHour !== preferredHour) return false;

                // Don't re-send within the same week (guards double-sends).
                if (user.lastRewindAt) {
                    const days = (today.getTime() - user.lastRewindAt.getTime()) / 86_400_000;
                    if (days < 6) return false;
                }
                return true;
            });
        });

        let sentCount = 0;

        for (const user of candidates) {
            const sent = await step.run(`send-rewind-${user.id}`, async () => {
                // Pull a pool of the user's highlights that actually have a quote,
                // then take a spaced random sample so the same few don't recur.
                const pool = await prisma.snip.findMany({
                    where: { userId: user.id, content: { not: null } },
                    orderBy: { createdAt: 'asc' },
                    take: 200,
                    select: {
                        startTime: true,
                        content: true,
                        episode: { select: { id: true, title: true, feed: { select: { title: true } } } },
                    },
                });

                if (pool.length < MIN_HIGHLIGHTS) return false;

                const picks = [...pool]
                    .sort(() => Math.random() - 0.5)
                    .slice(0, HIGHLIGHTS_PER_REWIND);

                const appUrl = process.env.NEXTAUTH_URL || 'https://www.podcatch.app';

                const cardsHtml = picks.map(p => {
                    const quote = (p.content || '').slice(0, 320);
                    const link = `${appUrl}/episodes/${p.episode.id}?t=${Math.floor(p.startTime)}`;
                    return `
                        <div style="margin-bottom:20px;padding:16px 18px;border:1px solid #eee;border-radius:12px;">
                            <p style="margin:0 0 10px;font-size:16px;line-height:1.5;color:#111;">&ldquo;${escapeHtml(quote)}&rdquo;</p>
                            <p style="margin:0;font-size:12px;color:#888;">
                                ${escapeHtml(p.episode.feed.title || '')} · ${escapeHtml(p.episode.title)}
                                &nbsp;·&nbsp;<a href="${link}" style="color:#0d757e;">Listen at ${stamp(p.startTime)}</a>
                            </p>
                        </div>`;
                }).join('');

                const resend = new Resend(process.env.RESEND_API_KEY);
                await resend.emails.send({
                    from: `Podcatch <digest@${process.env.RESEND_DOMAIN || 'podcatch.app'}>`,
                    to: user.email,
                    subject: `Your weekly Rewind — ${picks.length} highlight${picks.length > 1 ? 's' : ''} worth revisiting`,
                    html: `
                        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
                            <h1 style="font-size:22px;margin:0 0 4px;">Your weekly Rewind</h1>
                            <p style="color:#666;margin:0 0 20px;">A few moments you saved, brought back so they stick.</p>
                            ${cardsHtml}
                            <p style="color:#999;font-size:12px;margin-top:28px;">
                                <a href="${appUrl}/snips" style="color:#0d757e;">See all your highlights</a>
                                &nbsp;·&nbsp;
                                <a href="${appUrl}/settings" style="color:#999;">Turn off Rewind</a>
                            </p>
                        </div>`,
                });

                return true;
            });

            // Mark sent in a separate step so a retry can't re-fire the (non-idempotent)
            // email send above and double-deliver.
            if (sent) {
                await step.run(`mark-rewind-sent-${user.id}`, async () => {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { lastRewindAt: new Date() },
                    });
                });
                sentCount++;
            }
        }

        return { candidates: candidates.length, emailsSent: sentCount };
    }
);
