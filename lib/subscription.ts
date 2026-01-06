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
            id: true,
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

    let isPro =
        !!user.stripePriceId &&
        (user.stripeCurrentPeriodEnd?.getTime() ?? 0) + DAY_IN_MS > Date.now();

    // Self-healing: If user has a subscription ID but is not Pro (maybe missing priceId or expired/trial issue)
    // Fetch fresh data from Stripe to confirm status (e.g. Trialing)
    if (user.stripeSubscriptionId && !isPro) {
        try {
            const { stripe } = await import('@/lib/stripe');
            const subscription = await stripe.subscriptions.retrieve(
                user.stripeSubscriptionId,
                { expand: ['items.data.price'] }
            );

            // Check if subscription is active or trialing
            const isActive = subscription.status === 'active' || subscription.status === 'trialing';

            if (isActive) {
                // Update DB with fresh data
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        stripePriceId: subscription.items.data[0].price.id,
                        stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                    },
                });

                // Update local state
                user.stripePriceId = subscription.items.data[0].price.id;
                user.stripeCurrentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
                isPro = true;
            }
        } catch (error) {
            console.error('Error syncing subscription:', error);
        }
    }

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
