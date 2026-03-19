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

        await prisma.user.update({
            where: {
                id: session.metadata.userId,
            },
            data: {
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: new Date(
                    (subscription as any).current_period_end * 1000
                ),
            },
        });

        revalidatePath('/', 'layout');
    }

    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object as any;
        const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string,
            { expand: ['items.data.price'] }
        ) as Stripe.Subscription;

        await prisma.user.update({
            where: {
                stripeSubscriptionId: subscription.id,
            },
            data: {
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: new Date(
                    (subscription as any).current_period_end * 1000
                ),
            },
        });

        revalidatePath('/', 'layout');
    }

    return new NextResponse(null, { status: 200 });
}
