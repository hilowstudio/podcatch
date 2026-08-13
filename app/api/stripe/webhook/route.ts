import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === 'checkout.session.completed') {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
            { expand: ['items.data.price'] }
        ) as Stripe.Subscription;

        if (!session?.metadata?.userId) {
            console.error('Webhook Error: No userId in session metadata', session);
            return new NextResponse('User id is required', { status: 400 });
        }

        console.log(`[WEBHOOK] Updating subscription for user ${session.metadata.userId}`);

        const item = subscription.items.data[0];
        // current_period_end moved onto the subscription *item* in recent API
        // versions; reading it off the Subscription object yields undefined -> an
        // Invalid Date, which makes this write throw so the plan never persists.
        const currentPeriodEnd = item?.current_period_end
            ? new Date(item.current_period_end * 1000)
            : null;

        await prisma.user.update({
            where: {
                id: session.metadata.userId,
            },
            data: {
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                stripePriceId: item.price.id,
                stripeCurrentPeriodEnd: currentPeriodEnd,
            },
        });

        revalidatePath('/', 'layout');
    }

    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object as any;
        // One-off invoices carry no subscription; skip rather than throw on null.
        if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(
                invoice.subscription as string,
                { expand: ['items.data.price'] }
            ) as Stripe.Subscription;

            const item = subscription.items.data[0];
            const currentPeriodEnd = item?.current_period_end
                ? new Date(item.current_period_end * 1000)
                : null;

            // updateMany (not update): a renewal webhook that arrives before the
            // subscription id is stored becomes a no-op instead of a P2025 throw
            // that 500s and makes Stripe retry forever.
            await prisma.user.updateMany({
                where: {
                    stripeSubscriptionId: subscription.id,
                },
                data: {
                    stripePriceId: item.price.id,
                    stripeCurrentPeriodEnd: currentPeriodEnd,
                },
            });

            revalidatePath('/', 'layout');
        }
    }

    return new NextResponse(null, { status: 200 });
}
