'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getUserSubscriptionPlan } from '@/lib/subscription';

export async function updateIntegrations(data: {
    slackWebhookUrl?: string | null;
    obsidianVaultName?: string | null;
}) {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const plan = await getUserSubscriptionPlan();
    if (!plan.canUseIntegrations) {
        throw new Error('Integrations require the Basic or Pro plan.');
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            slackWebhookUrl: data.slackWebhookUrl,
            obsidianVaultName: data.obsidianVaultName,
        },
    });

    revalidatePath('/profile');
}
