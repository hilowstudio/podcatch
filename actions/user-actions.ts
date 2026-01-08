'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function updateApiKeys(formData: FormData) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const openaiApiKey = formData.get('openaiApiKey') as string;

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                openaiKey: openaiApiKey || null,
            },
        });

        revalidatePath('/settings');

        return { success: true };
    } catch (error) {
        console.error('Error updating API keys:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update API keys',
        };
    }
}

import { getUserSubscriptionPlan } from '@/lib/subscription';

export async function updateClaudeSettings(formData: FormData) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const subscriptionPlan = await getUserSubscriptionPlan();
        if (!subscriptionPlan.isPro) {
            return { success: false, error: 'Pro subscription required for Claude features' };
        }

        const claudeApiKey = formData.get('claudeApiKey') as string;
        const claudeProjectId = formData.get('claudeProjectId') as string;
        const autoSyncToClaude = formData.get('autoSyncToClaude') === 'on';

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                claudeApiKey: claudeApiKey || null,
                claudeProjectId: claudeProjectId || null,
                autoSyncToClaude,
            },
        });

        revalidatePath('/settings');

        return { success: true };
    } catch (error) {
        console.error('Error updating Claude settings:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update Claude settings',
        };
    }
}
