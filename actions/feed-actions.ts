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

        // Check if feed exists globally
        let feed = await prisma.feed.findUnique({
            where: {
                url: validation.data.url,
            },
        });

        if (feed) {
            // Check if user already subscribed
            const existingSubscription = await prisma.subscription.findUnique({
                where: {
                    userId_feedId: {
                        userId: session.user.id,
                        feedId: feed.id,
                    },
                },
            });

            if (existingSubscription) {
                return {
                    success: false,
                    error: 'You have already added this podcast feed',
                };
            }

            // Create subscription to existing feed
            await prisma.subscription.create({
                data: {
                    userId: session.user.id,
                    feedId: feed.id,
                },
            });
        } else {
            // Create new feed AND subscription
            feed = await prisma.feed.create({
                data: {
                    url,
                    title: null,
                    image: null,
                    // userId: session.user.id, // Deprecated, but create subscription below
                    subscriptions: {
                        create: {
                            userId: session.user.id
                        }
                    }
                },
            });

            // Trigger Inngest only for new feeds (or we could trigger refresh)
            await inngest.send({
                name: 'feed/check.requested',
                data: {
                    feedId: feed.id,
                },
            });
        }

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

        const subscriptions = await prisma.subscription.findMany({
            where: {
                userId: currentUserId,
            },
            include: {
                feed: {
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
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Map back to feed structure for frontend compatibility
        return subscriptions.map(sub => sub.feed);


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

        // Delete the subscription, not the feed
        // We verify ownership by the where clause on delete?
        // No, verify existence first.

        const subscription = await prisma.subscription.findFirst({
            where: {
                feedId: feedId,
                userId: session.user.id,
            },
        });

        if (!subscription) {
            return { success: false, error: 'Feed not found in your library' };
        }

        await prisma.subscription.delete({
            where: {
                id: subscription.id,
            },
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
