'use server';


import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getUserSubscriptionPlan } from '@/lib/subscription';

export async function updateBrandVoice(voice: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const plan = await getUserSubscriptionPlan();
    if (!plan.canUseBrandVoice) {
        return { success: false, error: 'Brand voice requires the Basic or Pro plan.' };
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { brandVoice: voice },
        });
        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        console.error('Failed to update voice:', error);
        return { success: false, error: 'Database error' };
    }
}

export async function getBrandVoice() {
    const session = await auth();
    if (!session?.user?.id) return '';

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { brandVoice: true }
    });
    return user?.brandVoice || '';
}
