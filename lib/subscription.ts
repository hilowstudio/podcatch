import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/stripe-config';

const DAY_IN_MS = 86_400_000;

export type SubscriptionPlan = {
    name: string;
    description: string;
    stripePriceId?: string | null;
    isPro: boolean;

    // Feature Gates
    canChatWithLibrary: boolean;
    canUseKnowledgeGraph: boolean;
    canUseIntegrations: boolean;
    canUseBrandVoice: boolean;
    canChatAboutEpisode: boolean;
    canSendToClaude: boolean;
    canUseStudio: boolean;
    canUseCustomPrompts: boolean;
    maxEpisodesPerMonth: number;
};

export async function getUserSubscriptionPlan(): Promise<SubscriptionPlan> {
    const session = await auth();

    const freePlan: SubscriptionPlan = {
        name: 'Free',
        description: 'Standard Limits',
        stripePriceId: undefined,
        isPro: false,
        canChatWithLibrary: false,
        canUseKnowledgeGraph: false,
        canUseIntegrations: false,
        canUseBrandVoice: false,
        canChatAboutEpisode: false,
        canSendToClaude: false,
        canUseStudio: false,
        canUseCustomPrompts: false,
        maxEpisodesPerMonth: 3,
    };

    if (!session?.user?.id) {
        return freePlan;
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
        return freePlan;
    }

    let isPlanActive =
        !!user.stripePriceId &&
        (user.stripeCurrentPeriodEnd?.getTime() ?? 0) + DAY_IN_MS > Date.now();

    // Self-healing: Query Stripe if we have a Customer ID but don't think we're Active
    if (user.stripeCustomerId && !isPlanActive) {
        try {
            const { stripe } = await import('@/lib/stripe');

            // 1. Check specific subscription ID if available
            if (user.stripeSubscriptionId) {
                const subscription = await stripe.subscriptions.retrieve(
                    user.stripeSubscriptionId,
                    { expand: ['items.data.price'] }
                );

                if (subscription.status === 'active' || subscription.status === 'trialing') {
                    await syncSubscription(user.id, subscription);
                    isPlanActive = true;
                    user.stripePriceId = subscription.items.data[0].price.id;
                    user.stripeCurrentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
                }
            }

            // 2. Fallback: List subscriptions for customer
            if (!isPlanActive) {
                const subscriptions = await stripe.subscriptions.list({
                    customer: user.stripeCustomerId,
                    status: 'all',
                    expand: ['data.items.data.price'],
                    limit: 1,
                });

                const activeSub = subscriptions.data.find(sub => sub.status === 'active' || sub.status === 'trialing');

                if (activeSub) {
                    await syncSubscription(user.id, activeSub as any);
                    isPlanActive = true;
                    user.stripePriceId = activeSub.items.data[0].price.id;
                    user.stripeCurrentPeriodEnd = new Date((activeSub as any).current_period_end * 1000);
                }
            }
        } catch (error) {
            console.error('[SUBSCRIPTION_CHECK] Error in self-heal block:', error);
        }
    }

    // Determine basic vs pro
    const isBasic =
        user.stripePriceId === PLANS.basic.monthly.priceId ||
        user.stripePriceId === PLANS.basic.annual.priceId;

    const isPro =
        user.stripePriceId === PLANS.pro.monthly.priceId ||
        user.stripePriceId === PLANS.pro.annual.priceId;

    if (isPro) {
        return {
            name: 'Pro',
            description: 'Unlimited AI Processing & Claude Sync',
            stripePriceId: user.stripePriceId || undefined,
            isPro: true,
            canChatWithLibrary: true,
            canUseKnowledgeGraph: true,
            canUseIntegrations: true,
            canUseBrandVoice: true,
            canChatAboutEpisode: true,
            canSendToClaude: true,
            canUseStudio: true,
            canUseCustomPrompts: true,
            maxEpisodesPerMonth: 200,
        };
    }

    if (isBasic) {
        return {
            name: 'Basic',
            description: 'For the avid podcast learner.',
            stripePriceId: user.stripePriceId || undefined,
            isPro: false,
            // Basic Blocks: Library Chat, Episode Chat, Custom Prompts
            // Implies it HAS: Graph, Integrations, Brand Voice, Studio
            canChatWithLibrary: false,
            canUseKnowledgeGraph: true,
            canUseIntegrations: true,
            canUseBrandVoice: true,
            canChatAboutEpisode: false,
            canSendToClaude: true,
            canUseStudio: true,
            canUseCustomPrompts: false,
            maxEpisodesPerMonth: 20,
        };
    }

    // Default to Free
    return {
        ...freePlan,
        stripePriceId: user.stripePriceId || undefined,
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
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000), // Ensure this is treated as number
        },
    });
}
