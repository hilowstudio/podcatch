'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createSnip(episodeId: string, startTime: number, endTime?: number, note?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const calculatedStartTime = endTime ? startTime : Math.max(0, Math.floor(startTime) - 30);
        const calculatedEndTime = endTime ? endTime : Math.floor(startTime);
        const finalNote = note || (endTime ? `Clip (${Math.round(calculatedStartTime)}s - ${Math.round(calculatedEndTime)}s)` : '');

        const snip = await prisma.snip.create({
            data: {
                userId: session.user.id,
                episodeId,
                startTime: calculatedStartTime,
                endTime: calculatedEndTime,
                note: finalNote,
                // Future: Fetch transcript slice for this range
            },
        });

        revalidatePath(`/episodes/${episodeId}`);
        return { success: true, snipId: snip.id };
    } catch (error) {
        console.error('Failed to create snip:', error);
        return { success: false, error: 'Failed to save snip' };
    }
}
