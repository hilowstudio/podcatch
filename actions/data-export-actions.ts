'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function exportUserData() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Not authenticated' };
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            brandVoice: true,
            digestFrequency: true,
            createdAt: true,
        },
    });

    const subscriptions = await prisma.subscription.findMany({
        where: { userId },
        include: {
            feed: {
                select: {
                    url: true,
                    title: true,
                    type: true,
                },
            },
        },
    });

    const episodes = await prisma.episode.findMany({
        where: {
            feed: { subscriptions: { some: { userId } } },
            status: 'COMPLETED',
        },
        include: {
            insight: {
                select: {
                    summary: true,
                    keyTakeaways: true,
                    links: true,
                    socialContent: true,
                    chapters: true,
                    transcript: true,
                },
            },
            feed: { select: { title: true, url: true } },
            entities: { select: { name: true, type: true, description: true } },
        },
        orderBy: { publishedAt: 'desc' },
    });

    const collections = await prisma.collection.findMany({
        where: { userId },
        include: {
            episodes: { select: { id: true, title: true } },
            insights: { select: { synthesis: true, createdAt: true } },
        },
    });

    const customPrompts = await prisma.customPrompt.findMany({
        where: { userId },
        select: {
            title: true,
            prompt: true,
            category: true,
            isPublic: true,
            createdAt: true,
        },
    });

    const snips = await prisma.snip.findMany({
        where: { userId },
        select: {
            content: true,
            startTime: true,
            endTime: true,
            note: true,
            createdAt: true,
            episode: { select: { title: true } },
        },
    });

    const notifications = await prisma.notification.findMany({
        where: { userId },
        select: {
            title: true,
            message: true,
            read: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
    });

    const exportData = {
        exportVersion: '1.0',
        exportDate: new Date().toISOString(),
        product: 'Podcatch',
        user: {
            ...user,
            createdAt: user?.createdAt.toISOString(),
        },
        subscriptions: subscriptions.map(s => ({
            feedUrl: s.feed.url,
            feedTitle: s.feed.title,
            feedType: s.feed.type,
            autoProcess: s.autoProcess,
            subscribedAt: s.createdAt.toISOString(),
        })),
        episodes: episodes.map(ep => ({
            title: ep.title,
            audioUrl: ep.audioUrl,
            publishedAt: ep.publishedAt.toISOString(),
            feedTitle: ep.feed.title,
            feedUrl: ep.feed.url,
            summary: ep.insight?.summary,
            keyTakeaways: ep.insight?.keyTakeaways,
            links: ep.insight?.links,
            socialContent: ep.insight?.socialContent,
            chapters: ep.insight?.chapters,
            transcript: ep.insight?.transcript,
            entities: ep.entities,
        })),
        collections: collections.map(c => ({
            title: c.title,
            description: c.description,
            episodes: c.episodes.map(e => e.title),
            syntheses: c.insights.map(i => ({
                synthesis: i.synthesis,
                createdAt: i.createdAt.toISOString(),
            })),
            createdAt: c.createdAt.toISOString(),
        })),
        customPrompts: customPrompts.map(p => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
        })),
        snips: snips.map(s => ({
            content: s.content,
            episodeTitle: s.episode.title,
            startTime: s.startTime,
            endTime: s.endTime,
            note: s.note,
            createdAt: s.createdAt.toISOString(),
        })),
        notifications: notifications.map(n => ({
            ...n,
            createdAt: n.createdAt.toISOString(),
        })),
    };

    return { success: true, data: exportData };
}
