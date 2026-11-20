'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { cancelSubscriptionsBeforeDelete } from '@/lib/billing/cancel-on-delete';

export async function deleteAccount() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        // A paid plan is cancelled first, so deleting the account can never
        // leave a subscription charging. If Stripe can't be reached, nothing
        // is deleted and the person can try again.
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { stripeCustomerId: true },
        });
        const billing = await cancelSubscriptionsBeforeDelete(stripe, user?.stripeCustomerId);
        if (!billing.ok) {
            return {
                success: false,
                error: "We couldn't cancel your paid plan, so your account wasn't deleted. Try again in a few minutes, or write to support.",
            };
        }

        // Prisma cascade deletes handle all related data
        await prisma.user.delete({
            where: { id: session.user.id },
        });

        return { success: true, cancelledPlan: billing.cancelled.length > 0 };
    } catch (error) {
        console.error('Account deletion failed:', error);
        return { success: false, error: 'Failed to delete account. Please try again or contact support.' };
    }
}

export async function deactivateAccount() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { deactivatedAt: new Date() },
        });
        return { success: true };
    } catch (error) {
        console.error('Account deactivation failed:', error);
        return { success: false, error: 'Failed to deactivate account.' };
    }
}

export async function reactivateAccount() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { deactivatedAt: null },
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to reactivate account.' };
    }
}
