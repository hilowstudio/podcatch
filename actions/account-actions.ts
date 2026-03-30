'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function deleteAccount() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        // Prisma cascade deletes handle all related data
        await prisma.user.delete({
            where: { id: session.user.id },
        });

        return { success: true };
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
