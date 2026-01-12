import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export async function getEpisodeUsage(userId: string) {
    // For now, simpler implementation: Count episodes created in the current calendar month.
    // Ideally this should align with the billing cycle, but calendar month is a good proxy for MVP.
    // If we have strict billing requirements later, we can fetch the stripeCurrentPeriodStart from DB.

    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const count = await prisma.usageLog.count({
        where: {
            userId: userId,
            action: 'PROCESS_EPISODE',
            createdAt: {
                gte: start,
                lte: end,
            },
        },
    });

    return count;
}
