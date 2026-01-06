import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const DAY_IN_MS = 86_400_000;

export type SubscriptionPlan = {
    name: string;
    description: string;
    stripePriceId?: string | null;
    isPro: boolean;
};

export async function getUserSubscriptionPlan() {
    const session = await auth();

    if (!session?.user?.id) {
        return {
            isPro: false,
            name: 'Free',
            description: 'Standard Limits',
            stripePriceId: undefined,
        };
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            stripePriceId: true,
            stripeCurrentPeriodEnd: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
        },
    });

    if (!user) {
        return {
            isPro: false,
            name: 'Free',
            description: 'Standard Limits',
            stripePriceId: undefined,
        };
    }

    const isPro =
        !!user.stripePriceId &&
        (user.stripeCurrentPeriodEnd?.getTime() ?? 0) + DAY_IN_MS > Date.now();

    const plan: SubscriptionPlan = isPro
        ? {
            name: 'Pro',
            description: 'Unlimited AI Processing & Claude Sync',
            stripePriceId: user.stripePriceId || undefined,
            isPro: true,
        }
        : {
            name: 'Free',
            description: 'Standard Limits',
            stripePriceId: undefined,
            isPro: false,
        };

    return {
        ...plan,
        ...user,
        stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd?.getTime(),
    };
}
