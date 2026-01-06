'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { inngest } from '@/lib/inngest/client';
import { addFeedSchema } from '@/lib/validations/feed';
import { auth } from '@/auth';


export async function addFeed(formData: FormData) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return {
                success: false,
                error: 'You must be signed in to add a feed',
            };
        }

        const url = formData.get('url') as string;

        // Validate the URL
        const validation = addFeedSchema.safeParse({ url });

        if (!validation.success) {
            return {
                success: false,
                error: validation.error.issues[0].message,
            };
        }

        // Check if user already has this feed
        const existingFeed = await prisma.feed.findFirst({
            where: {
                url: validation.data.url,
                userId: session.user.id,
            },
        });

        if (existingFeed) {
            return {
                success: false,
                error: 'You have already added this podcast feed',
            };
        }

        // Create the feed with userId (title/image will be populated by Inngest)
        const feed = await prisma.feed.create({
            data: {
                url,
                title: null, // Will be updated by background job
                image: null,
                userId: session.user.id,
            },
        });

        // Trigger the feed check/parsing immediately in background
        await inngest.send({
            name: 'feed/check.requested',
            data: {
                feedId: feed.id,
            },
        });

        revalidatePath('/');

        return { success: true };
    } catch (error) {
        console.error('Error adding feed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to add feed',
        };
    }
}

export async function getFeeds(userId?: string) {
    try {
        let currentUserId = userId;

        if (!currentUserId) {
            const session = await auth();
            if (!session?.user?.id) {
                return [];
            }
            currentUserId = session.user.id;
        }

        const feeds = await prisma.feed.findMany({
            where: {
                userId: currentUserId, // Only return user's own feeds
            },
            include: {
                _count: {
                    select: { episodes: true },
                },
                episodes: {
                    orderBy: { publishedAt: 'desc' },
                    take: 1,
                    select: { publishedAt: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return feeds;
    } catch (error) {
        console.error('Error fetching feeds:', error);
        return [];
    }
}

export async function deleteFeed(feedId: string) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        // Verify user owns this feed
        const feed = await prisma.feed.findUnique({
            where: { id: feedId },
            select: { userId: true },
        });

        if (!feed || feed.userId !== session.user.id) {
            return { success: false, error: 'Feed not found or unauthorized' };
        }

        await prisma.feed.delete({
            where: { id: feedId },
        });

        revalidatePath('/');

        return { success: true };
    } catch (error) {
        console.error('Error deleting feed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete feed',
        };
    }
}
