'use server';

import { revalidatePath } from 'next/cache';
import { inngest } from '@/lib/inngest/client';

export async function processEpisode(episodeId: string) {
    try {
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
