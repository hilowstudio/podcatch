import { prisma } from '@/lib/prisma';

export async function getEpisodeUsage(userId: string) {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

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
