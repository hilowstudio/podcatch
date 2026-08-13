import { inngest } from '@/lib/inngest/client';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

/** Feed/episode text is third-party — escape before interpolating into email HTML. */
function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export const sendDigest = inngest.createFunction(
    {
        id: 'send-digest',
        name: 'Send Email Digest',
    },
    { cron: '0 * * * *' }, // Every hour — checks each user's preferred delivery time
    async ({ step }) => {
        const today = new Date();
        const utcDay = today.getUTCDay();
        // A user's local Monday can land on UTC Sunday (far-east zones) or UTC
        // Monday (everywhere else), so cast a wide net here and confirm the user's
        // *local* weekday in the filter below.
        const maybeWeekly = utcDay === 0 || utcDay === 1;

        const users = await step.run('fetch-digest-users', async () => {
            const allUsers = await prisma.user.findMany({
                where: {
                    OR: [
                        { digestFrequency: 'DAILY' },
                        ...(maybeWeekly ? [{ digestFrequency: 'WEEKLY' as const }] : []),
                    ],
                },
                select: {
                    id: true,
                    email: true,
                    lastDigestAt: true,
                    digestFrequency: true,
                    timezone: true,
                    digestDeliveryTime: true,
                    quietHoursStart: true,
                    quietHoursEnd: true,
                },
            });

            // Send only when the CURRENT hour and weekday in the user's own
            // timezone match their preference. hourCycle 'h23' keeps midnight as
            // "00" (under hour12:false some locales render it "24", which never
            // matches a "00:00" preference).
            return allUsers.filter(user => {
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

                if (localHour !== preferredHour) return false;
                // Weekly digests go out on the user's local Monday only.
                if (user.digestFrequency === 'WEEKLY' && localWeekday !== 'Mon') return false;

                // Skip if already sent recently (guards against double-sends)
                if (user.lastDigestAt) {
                    const hoursSinceLastDigest = (today.getTime() - user.lastDigestAt.getTime()) / (1000 * 60 * 60);
                    if (hoursSinceLastDigest < 20) return false;
                }

                return true;
            });
        });

        let sentCount = 0;

        for (const user of users) {
            const sent = await step.run(`send-digest-${user.id}`, async () => {
                const since = user.lastDigestAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

                const episodes = await prisma.episode.findMany({
                    where: {
                        status: 'COMPLETED',
                        updatedAt: { gte: since },
                        feed: {
                            subscriptions: {
                                some: { userId: user.id },
                            },
                        },
                    },
                    include: {
                        insight: { select: { summary: true, keyTakeaways: true } },
                        feed: { select: { title: true } },
                    },
                    orderBy: { publishedAt: 'desc' },
                    take: 20,
                });

                if (episodes.length === 0) return false;

                const episodeHtml = episodes.map(ep => `
                    <div style="margin-bottom: 24px; border-bottom: 1px solid #eee; padding-bottom: 16px;">
                        <h3 style="margin: 0 0 4px;">${escapeHtml(ep.title)}</h3>
                        <p style="color: #666; font-size: 12px; margin: 0 0 8px;">${escapeHtml(ep.feed.title || '')}</p>
                        <p style="margin: 0 0 8px;">${escapeHtml(ep.insight?.summary || '')}</p>
                        <ul style="margin: 0; padding-left: 20px;">
                            ${((ep.insight?.keyTakeaways as string[]) || []).slice(0, 3).map(t => `<li>${escapeHtml(t)}</li>`).join('')}
                        </ul>
                    </div>
                `).join('');

                const frequency = user.digestFrequency === 'DAILY' ? 'Daily' : 'Weekly';

                const resend = new Resend(process.env.RESEND_API_KEY);
                await resend.emails.send({
                    from: `Podcatch <digest@${process.env.RESEND_DOMAIN || 'podcatch.app'}>`,
                    to: user.email,
                    subject: `Your ${frequency} Podcast Digest - ${episodes.length} new episode${episodes.length > 1 ? 's' : ''}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h1 style="font-size: 24px;">Your ${frequency} Digest</h1>
                            <p style="color: #666;">${episodes.length} episode${episodes.length > 1 ? 's' : ''} processed since your last digest.</p>
                            ${episodeHtml}
                            <p style="color: #999; font-size: 12px; margin-top: 32px;">
                                <a href="${process.env.NEXTAUTH_URL}/settings">Manage digest settings</a>
                            </p>
                        </div>
                    `,
                });

                return true;
            });

            // Mark as sent in a SEPARATE step so a retry after a failed DB write
            // cannot re-run the (non-idempotent) email send above and double-deliver.
            if (sent) {
                await step.run(`mark-digest-sent-${user.id}`, async () => {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { lastDigestAt: new Date() },
                    });
                });
                sentCount++;
            }
        }

        return { usersProcessed: users.length, emailsSent: sentCount };
    }
);
