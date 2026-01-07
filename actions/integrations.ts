'use server'

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { dispatchWebhook } from '@/lib/webhooks';
import { revalidatePath } from 'next/cache';

export async function updateWebhookUrl(webhookUrl: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { webhookUrl: webhookUrl || null },
        });

        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        console.error('Failed to update webhook URL:', error);
        return { success: false, error: 'Failed to update settings' };
    }
}

export async function updateReadwiseApiKey(apiKey: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { readwiseApiKey: apiKey || null },
        });

        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        console.error('Failed to update Readwise API key:', error);
        return { success: false, error: 'Failed to update settings' };
    }
}

export async function testWebhook(webhookUrl: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    // Simulate a payload
    const dummyPayload = {
        event: 'test.ping',
        message: 'This is a test webhook from Podcatch.',
        timestamp: new Date().toISOString(),
        user: {
            id: session.user.id,
            name: session.user.name || 'Anonymous'
        }
    };

    return await dispatchWebhook(webhookUrl, dummyPayload);
}
