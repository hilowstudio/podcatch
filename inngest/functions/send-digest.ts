import { inngest } from '@/lib/inngest/client';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

export const sendDigest = inngest.createFunction(
    {
        id: 'send-digest',
        name: 'Send Email Digest',
    },
    { cron: '0 * * * *' }, // Every hour — checks each user's preferred delivery time
    async ({ step }) => {
        const today = new Date();
        const currentUtcHour = today.getUTCHours();
        const isMonday = today.getUTCDay() === 1;

        const users = await step.run('fetch-digest-users', async () => {
            const allUsers = await prisma.user.findMany({
                where: {
                    OR: [
                        { digestFrequency: 'DAILY' },
                        ...(isMonday ? [{ digestFrequency: 'WEEKLY' as const }] : []),
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

            // Filter to users whose preferred delivery hour matches the current hour
            return allUsers.filter(user => {
                const tz = user.timezone || 'UTC';
                const preferredTime = user.digestDeliveryTime || '08:00';
                const preferredHour = parseInt(preferredTime.split(':')[0]);

                // Get current hour in user's timezone
                const formatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: tz,
                    hour: 'numeric',
                    hour12: false,
                });
                const localHour = parseInt(formatter.format(today));

                // Only send if the current hour matches their preferred hour
                if (localHour !== preferredHour) return false;

                // Skip if already sent today
                if (user.lastDigestAt) {
                    const hoursSinceLastDigest = (today.getTime() - user.lastDigestAt.getTime()) / (1000 * 60 * 60);
                    if (hoursSinceLastDigest < 20) return false; // Prevent double-sends
                }

                return true;
            });
        });

        let sentCount = 0;

        for (const user of users) {
            await step.run(`send-digest-${user.id}`, async () => {
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

                if (episodes.length === 0) return;

                const episodeHtml = episodes.map(ep => `
                    <div style="margin-bottom: 24px; border-bottom: 1px solid #eee; padding-bottom: 16px;">
                        <h3 style="margin: 0 0 4px;">${ep.title}</h3>
                        <p style="color: #666; font-size: 12px; margin: 0 0 8px;">${ep.feed.title}</p>
                        <p style="margin: 0 0 8px;">${ep.insight?.summary || ''}</p>
                        <ul style="margin: 0; padding-left: 20px;">
                            ${((ep.insight?.keyTakeaways as string[]) || []).slice(0, 3).map(t => `<li>${t}</li>`).join('')}
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

                await prisma.user.update({
                    where: { id: user.id },
                    data: { lastDigestAt: new Date() },
                });

                sentCount++;
            });
        }

        return { usersProcessed: users.length, emailsSent: sentCount };
    }
);
