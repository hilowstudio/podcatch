'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateDigestPreference(frequency: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    if (!['NONE', 'DAILY', 'WEEKLY'].includes(frequency)) {
        return { success: false, error: 'Invalid frequency' };
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: { digestFrequency: frequency },
    });

    revalidatePath('/settings');
    return { success: true };
}

export async function getDigestPreference() {
    const session = await auth();
    if (!session?.user?.id) return 'NONE';

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { digestFrequency: true },
    });

    return user?.digestFrequency || 'NONE';
}

export async function updateScheduleSettings(settings: {
    timezone: string;
    deliveryTime: string;
    quietStart: string;
    quietEnd: string;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            timezone: settings.timezone,
            digestDeliveryTime: settings.deliveryTime,
            quietHoursStart: settings.quietStart === 'off' ? null : settings.quietStart || null,
            quietHoursEnd: settings.quietStart === 'off' ? null : settings.quietEnd || null,
        },
    });

    revalidatePath('/settings');
    return { success: true };
}
