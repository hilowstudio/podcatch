'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getUserSubscriptionPlan } from '@/lib/subscription';

export async function toggleAutoProcess(feedId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    const plan = await getUserSubscriptionPlan();
    if (!plan.canAutoProcess) {
        return { success: false, error: 'Upgrade to Basic or Pro to use auto-process' };
    }

    const subscription = await prisma.subscription.findUnique({
        where: {
            userId_feedId: {
                userId: session.user.id,
                feedId,
            },
        },
    });

    if (!subscription) {
        return { success: false, error: 'Subscription not found' };
    }

    const updated = await prisma.subscription.update({
        where: { id: subscription.id },
        data: { autoProcess: !subscription.autoProcess },
    });

    revalidatePath(`/feeds/${feedId}`);
    return { success: true, autoProcess: updated.autoProcess };
}
