import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';
import { PLANS, TRIAL_DAYS } from '@/lib/stripe-config';

const settingsUrl = process.env.NEXTAUTH_URL + '/settings';

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id || !session.user.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get priceId from body if available
        let priceId = PLANS.monthly.priceId;
        try {
            const body = await req.json();
            if (body.priceId && Object.values(PLANS).some(p => p.priceId === body.priceId)) {
                priceId = body.priceId;
            }
        } catch (e) {
            // Body might be empty, use default
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                stripeCustomerId: true,
                stripeSubscriptionId: true,
            },
        });

        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        // If user already has a Stripe Customer ID, reuse it
        let customerId = user.stripeCustomerId;

        // If user has a subscription, redirect to billing portal (manage subscription)
        if (user.stripeSubscriptionId && user.stripeCustomerId) {
            const stripeSession = await stripe.billingPortal.sessions.create({
                customer: user.stripeCustomerId,
                return_url: settingsUrl,
            });

            return NextResponse.json({ url: stripeSession.url });
        }

        // If no customer ID exists, create one (OPTIONAL: In simple flow, Checkout can create customer)
        // But creating it ensures we have it linked
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: session.user.email,
                metadata: {
                    userId: session.user.id
                }
            });
            customerId = customer.id;

            // Save it immediately so next time we reuse it
            await prisma.user.update({
                where: { id: session.user.id },
                data: { stripeCustomerId: customerId }
            });
        }

        const stripeSession = await stripe.checkout.sessions.create({
            success_url: settingsUrl,
            cancel_url: settingsUrl,
            payment_method_types: ['card'],
            mode: 'subscription',
            billing_address_collection: 'auto',
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            allow_promotion_codes: true,
            subscription_data: {
                trial_period_days: TRIAL_DAYS,
            },
            metadata: {
                userId: session.user.id,
            },
        });

        return NextResponse.json({ url: stripeSession.url });

    } catch (error) {
        console.error('[STRIPE_POST_ERROR]', error);
        // Return the actual error message in dev mode for easier debugging
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return new NextResponse(message, { status: 500 });
    }
}
