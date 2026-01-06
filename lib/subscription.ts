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

    // Self-healing: Query Stripe if we have a Customer ID but don't think we're Pro
    // This handles cases where the Webhook failed completely (so we have no stripeSubscriptionId)
    // or where we have an ID but the data is stale/missing priceId.
    if (user.stripeCustomerId && !isPro) {
        try {
            const { stripe } = await import('@/lib/stripe');

            // If we have a specific subscription ID, check that first (faster)
            if (user.stripeSubscriptionId) {
                const subscription = await stripe.subscriptions.retrieve(
                    user.stripeSubscriptionId,
                    { expand: ['items.data.price'] }
                );

                if (subscription.status === 'active' || subscription.status === 'trialing') {
                    await syncSubscription(user.id, subscription);
                    isPro = true;
                    user.stripePriceId = subscription.items.data[0].price.id;
                    user.stripeCurrentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
                }
            }
            // Otherwise/Else: List subscriptions for this customer to find any active one
            // (Only do this if the check above didn't pass or didn't exist)
            if (!isPro) {
                const subscriptions = await stripe.subscriptions.list({
                    customer: user.stripeCustomerId,
                    status: 'all', // Fetch all then filter, or specific status. 'all' lets us see trialing.
                    expand: ['data.items.data.price'],
                    limit: 1,
                });

                const activeSub = subscriptions.data.find(sub => sub.status === 'active' || sub.status === 'trialing');

                if (activeSub) {
                    await syncSubscription(user.id, activeSub as any);
                    isPro = true;
                    user.stripePriceId = activeSub.items.data[0].price.id;
                    user.stripeCurrentPeriodEnd = new Date((activeSub as any).current_period_end * 1000);
                }
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

// Helper to update DB with fresh Stripe data
async function syncSubscription(userId: string, subscription: any) {
    if (!subscription.items?.data?.[0]?.price?.id) return;

    await prisma.user.update({
        where: { id: userId },
        data: {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
    });
}
