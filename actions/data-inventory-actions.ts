'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function getDataInventory() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const userId = session.user.id;

    const [user, subscriptionCount, episodeCount, collectionCount, promptCount, snipCount, notificationCount, entityCount, usageThisMonth] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                email: true,
                image: true,
                brandVoice: true,
                digestFrequency: true,
                timezone: true,
                createdAt: true,
                stripeSubscriptionId: true,
                stripePriceId: true,
                stripeCurrentPeriodEnd: true,
                webhookUrl: true,
                readwiseApiKey: true,
                notionAccessToken: true,
                googleDriveRefreshToken: true,
                tanaApiToken: true,
                slackWebhookUrl: true,
                claudeApiKey: true,
                geminiApiKey: true,
                deepgramApiKey: true,
            },
        }),
        prisma.subscription.count({ where: { userId } }),
        prisma.episode.count({
            where: { feed: { subscriptions: { some: { userId } } }, status: 'COMPLETED' },
        }),
        prisma.collection.count({ where: { userId } }),
        prisma.customPrompt.count({ where: { userId } }),
        prisma.snip.count({ where: { userId } }),
        prisma.notification.count({ where: { userId } }),
        prisma.entity.count({
            where: { episodes: { some: { feed: { subscriptions: { some: { userId } } } } } },
        }),
        prisma.usageLog.count({
            where: {
                userId,
                createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
            },
        }),
    ]);

    if (!user) return null;

    return {
        account: {
            name: user.name,
            email: user.email,
            hasAvatar: !!user.image,
            createdAt: user.createdAt.toISOString(),
            hasSubscription: !!user.stripeSubscriptionId,
            subscriptionEnd: user.stripeCurrentPeriodEnd?.toISOString() || null,
        },
        content: {
            subscriptions: subscriptionCount,
            episodesProcessed: episodeCount,
            collections: collectionCount,
            customPrompts: promptCount,
            snips: snipCount,
            notifications: notificationCount,
            entities: entityCount,
        },
        integrations: {
            webhook: !!user.webhookUrl,
            readwise: !!user.readwiseApiKey,
            notion: !!user.notionAccessToken,
            googleDrive: !!user.googleDriveRefreshToken,
            tana: !!user.tanaApiToken,
            slack: !!user.slackWebhookUrl,
            claude: !!user.claudeApiKey,
            gemini: !!user.geminiApiKey,
            deepgram: !!user.deepgramApiKey,
        },
        preferences: {
            hasBrandVoice: !!user.brandVoice,
            digestFrequency: user.digestFrequency,
            timezone: user.timezone,
        },
        usage: {
            processedThisMonth: usageThisMonth,
        },
    };
}
