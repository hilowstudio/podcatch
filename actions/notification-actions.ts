
'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getNotifications() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        const now = new Date();
        const notifications = await prisma.notification.findMany({
            where: {
                userId: session.user.id,
                OR: [{ queuedUntil: null }, { queuedUntil: { lte: now } }],
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 20,
        });
        return notifications;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

export async function getUnreadCount() {
    const session = await auth();
    if (!session?.user?.id) return 0;

    try {
        const now = new Date();
        const count = await prisma.notification.count({
            where: {
                userId: session.user.id,
                read: false,
                OR: [{ queuedUntil: null }, { queuedUntil: { lte: now } }],
            },
        });
        return count;
    } catch (error) {
        return 0;
    }
}

export async function markNotificationRead(notificationId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    try {
        // Verify ownership
        const notification = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId: session.user.id,
            },
        });

        if (!notification) {
            return { success: false, error: 'Notification not found' };
        }

        await prisma.notification.update({
            where: { id: notificationId },
            data: { read: true },
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to mark as read' };
    }
}

export async function markAllRead() {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    try {
        await prisma.notification.updateMany({
            where: {
                userId: session.user.id,
                read: false,
            },
            data: { read: true },
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function getNotificationHistory(days: number = 30) {
    const session = await auth();
    if (!session?.user?.id) return { notifications: [], count: 0 };

    try {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const [notifications, count] = await Promise.all([
            prisma.notification.findMany({
                where: { userId: session.user.id, createdAt: { gte: since } },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.notification.count({
                where: { userId: session.user.id, createdAt: { gte: since } },
            }),
        ]);
        return { notifications, count };
    } catch (error) {
        return { notifications: [], count: 0 };
    }
}
