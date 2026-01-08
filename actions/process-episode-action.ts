'use server';

import { revalidatePath } from 'next/cache';
import { inngest } from '@/lib/inngest/client';
import { auth } from '@/auth';
import { z } from 'zod';

const processEpisodeSchema = z.object({
    episodeId: z.string().cuid(),
});

export async function processEpisode(episodeId: string) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const validation = processEpisodeSchema.safeParse({ episodeId });

        if (!validation.success) {
            return {
                success: false,
                error: 'Invalid episode ID',
            };
        }

        // Trigger Inngest processing workflow
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
