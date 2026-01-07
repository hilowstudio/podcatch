'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getChannelDetails, getLatestVideos } from '@/lib/youtube';
import { revalidatePath } from 'next/cache';

export async function subscribeToYoutubeChannel(input: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const channel = await getChannelDetails(input);
        if (!channel) {
            return { success: false, error: 'Channel not found. Try using a Channel ID (UC...) or Handle (@...)' };
        }

        // Check if feed exists
        let feed = await prisma.feed.findFirst({
            where: {
                OR: [
                    { channelId: channel.id },
                    { url: `https://www.youtube.com/channel/${channel.id}` }
                ]
            }
        });

        if (!feed) {
            // Create new Feed
            feed = await prisma.feed.create({
                data: {
                    title: channel.title,
                    url: `https://www.youtube.com/channel/${channel.id}`,
                    channelId: channel.id,
                    type: 'YOUTUBE',
                    image: channel.thumbnailUrl,
                    lastCheckedAt: new Date(),
                }
            });

            // Populate initial videos
            const videos = await getLatestVideos(channel.uploadPlaylistId);
            if (videos.length > 0) {
                await prisma.episode.createMany({
                    data: videos.map(v => ({
                        title: v.title,
                        description: v.description,
                        publishedAt: new Date(v.publishedAt || Date.now()),
                        audioUrl: `https://www.youtube.com/watch?v=${v.id}`, // Placeholder or actual Watch URL
                        videoUrl: `https://www.youtube.com/watch?v=${v.id}`,
                        youtubeId: v.id,
                        feedId: feed!.id, // Non-null assertion safe because create throws or returns
                        guid: v.id,
                    })),
                    skipDuplicates: true,
                });
            }
        }

        // Create subscription
        await prisma.subscription.create({
            data: {
                userId: session.user.id,
                feedId: feed.id,
            },
        });

        revalidatePath('/dashboard');
        return { success: true };

    } catch (error) {
        console.error('Subscribe YouTube Error:', error);
        // Handle unique constraint (already subscribed) gracefully
        if ((error as any).code === 'P2002') {
            return { success: true, message: 'Already subscribed' };
        }
        return { success: false, error: 'Failed to subscribe' };
    }
}
