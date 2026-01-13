'use server';

import { revalidatePath } from 'next/cache';
import { inngest } from '@/lib/inngest/client';
import { auth } from '@/auth';
import { z } from 'zod';
import { getUserSubscriptionPlan } from '@/lib/subscription';
import { getEpisodeUsage } from '@/lib/usage';
import { prisma } from '@/lib/prisma'; // Added prisma

const processEpisodeSchema = z.object({
    episodeId: z.string().cuid(),
});

export async function processEpisodeAction(formData: FormData) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            throw new Error('Unauthorized');
        }

        const episodeId = formData.get('episodeId') as string;

        const plan = await getUserSubscriptionPlan();
        const usage = await getEpisodeUsage(session.user.id);

        if (usage >= plan.maxEpisodesPerMonth) {
            return {
                success: false,
                error: 'Limit reached',
                upgradeRequired: true,
                limit: plan.maxEpisodesPerMonth,
                plan: plan.name,
                nextPlan: plan.name === 'Free' ? 'Basic' : 'Pro'
            };
        }

        const validation = processEpisodeSchema.safeParse({ episodeId });

        if (!validation.success) {
            return {
                success: false,
                error: 'Invalid episode ID',
            };
        }

        // Trigger Inngest processing workflow
        // Validated at Inngest level again for security, but UI check prevents waste
        await inngest.send({
            name: 'episode/process.requested',
            data: {
                episodeId,
            },
        });

        revalidatePath('/feeds/[feedId]', 'page');
        revalidatePath('/episodes/[episodeId]', 'page');

        return { success: true };
    } catch (error) {
        console.error('Error triggering episode processing:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to trigger processing',
        };
    }
}
