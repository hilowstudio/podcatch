'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export interface RecommendedEpisode {
    id: string;
    title: string;
    publishedAt: string;
    feedTitle: string | null;
    feedImage: string | null;
}

/** The caller's cached "For You" picks (nightly-refreshed), closest match first. */
export async function getRecommendations(limit = 6): Promise<RecommendedEpisode[]> {
    const session = await auth();
    if (!session?.user?.id) return [];

    const recs = await prisma.recommendation.findMany({
        where: { userId: session.user.id },
        orderBy: { score: 'asc' },
        take: limit,
        select: {
            episode: {
                select: {
                    id: true,
                    title: true,
                    publishedAt: true,
                    feed: { select: { title: true, image: true } },
                },
            },
        },
    });

    return recs.map(r => ({
        id: r.episode.id,
        title: r.episode.title,
        publishedAt: r.episode.publishedAt.toISOString(),
        feedTitle: r.episode.feed.title,
        feedImage: r.episode.feed.image,
    }));
}
