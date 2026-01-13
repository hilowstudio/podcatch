'use server';

import { prisma } from '@/lib/prisma';

/**
 * Get episodes for a specific feed
 */
export async function getEpisodesByFeed(feedId: string) {
    try {
        const episodes = await prisma.episode.findMany({
            where: { feedId },
            orderBy: { publishedAt: 'desc' },
            include: {
                insight: {
                    select: {
                        id: true,
                        summary: true,
                    },
                },
            },
        });

        return episodes;
    } catch (error) {
        console.error('Error fetching episodes:', error);
        return [];
    }
}

/**
 * Get a single episode with full insight data
 */
export async function getEpisodeWithInsight(episodeId: string) {
    try {
        const episode = await prisma.episode.findUnique({
            where: { id: episodeId },
            include: {
                feed: {
                    select: {
                        id: true,
                        title: true,
                        image: true,
                    },
                },
                insight: true,
                entities: true,
            },
        });

        return episode;
    } catch (error) {
        console.error('Error fetching episode:', error);
        return null;
    }
}

/**
 * Get recent episodes across all feeds
 */
export async function getRecentEpisodes(limit: number = 10) {
    try {
        const episodes = await prisma.episode.findMany({
            take: limit,
            orderBy: { publishedAt: 'desc' },
            where: {
                status: 'COMPLETED',
            },
            include: {
                feed: {
                    select: {
                        id: true,
                        title: true,
                        image: true,
                    },
                },
                insight: {
                    select: {
                        summary: true,
                    },
                },
            },
        });

        return episodes;
    } catch (error) {
        console.error('Error fetching recent episodes:', error);
        return [];
    }
}

/**
 * Get simple episode status (for polling)
 */
export async function getEpisodeStatus(episodeId: string) {
    try {
        const episode = await prisma.episode.findUnique({
            where: { id: episodeId },
            select: { status: true },
        });
        return episode?.status;
    } catch {
        return null;
    }
}

/**
 * Get minimal episode details for AudioProvider
 */
export async function getEpisodeForPlayer(episodeId: string) {
    try {
        const episode = await prisma.episode.findUnique({
            where: { id: episodeId },
            include: {
                feed: {
                    select: {
                        image: true,
                        title: true,
                    }
                }
            }
        });

        if (!episode) return null;

        return {
            id: episode.id,
            title: episode.title,
            audioUrl: episode.audioUrl,
            image: episode.feed.image,
            feedTitle: episode.feed.title,
        };
    } catch {
        return null;
    }
}

/**
 * Get related episodes (from same feed)
 */
export async function getRelatedEpisodes(feedId: string, currentEpisodeId: string, limit: number = 3) {
    try {
        const episodes = await prisma.episode.findMany({
            where: {
                feedId,
                id: { not: currentEpisodeId },
                status: 'COMPLETED',
            },
            take: limit,
            orderBy: { publishedAt: 'desc' },
        });

        return episodes;
    } catch {
        return [];
    }
}
