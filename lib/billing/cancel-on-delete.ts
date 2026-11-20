import type Stripe from 'stripe';

// Statuses that can still charge the customer, or turn into a charge.
const LIVE_STATUSES: Stripe.Subscription.Status[] = ['active', 'trialing', 'past_due', 'unpaid', 'incomplete'];

export type CancelResult =
    | { ok: true; cancelled: string[] }
    | { ok: false; error: string };

/**
 * Before an account is deleted, cancel every subscription on its Stripe
 * customer that could still charge. Deleting the account must never leave a
 * paid plan running. If Stripe can't be reached, the caller stops and the
 * account stays, so the person can try again.
 *
 * The stripe client is passed in so this can be tested without the network.
 */
export async function cancelSubscriptionsBeforeDelete(
    stripe: Pick<Stripe, 'subscriptions'>,
    customerId: string | null | undefined,
): Promise<CancelResult> {
    if (!customerId) return { ok: true, cancelled: [] };
    try {
        const cancelled: string[] = [];
        for await (const sub of stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 })) {
            if (!LIVE_STATUSES.includes(sub.status)) continue;
            await stripe.subscriptions.cancel(sub.id);
            cancelled.push(sub.id);
        }
        return { ok: true, cancelled };
    } catch (error) {
        console.error('[deleteAccount] could not cancel Stripe subscriptions', error);
        return { ok: false, error: 'stripe' };
    }
}
