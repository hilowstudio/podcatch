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
        let priceId: string = PLANS.basic.monthly.priceId; // Default to Basic Monthly
        try {
            const body = await req.json();

            // Collect all valid price IDs from the nested PLANS object
            const validPriceIds = new Set<string>();
            Object.values(PLANS).forEach((plan: any) => {
                if (plan.priceId) validPriceIds.add(plan.priceId); // Free
                if (plan.monthly?.priceId) validPriceIds.add(plan.monthly.priceId);
                if (plan.annual?.priceId) validPriceIds.add(plan.annual.priceId);
            });

            if (body.priceId && validPriceIds.has(body.priceId)) {
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

        // If user already has a Stripe Customer ID, ensure it exists in the current environment (Test vs Live)
        let customerId = user.stripeCustomerId;

        if (customerId) {
            try {
                // Verify customer exists in Stripe
                const customer = await stripe.customers.retrieve(customerId);
                if ((customer as any).deleted) {
                    customerId = null; // Customer was deleted in Stripe
                }
            } catch (error) {
                // If ID exists in DB but not in Stripe (e.g. environment switch), reset it
                console.warn(`[STRIPE] Customer ${customerId} not found. Creating new one.`);
                customerId = null;
            }
        }

        if (customerId && user.stripeSubscriptionId) {
            try {
                const stripeSession = await stripe.billingPortal.sessions.create({
                    customer: customerId,
                    return_url: settingsUrl,
                });
                return NextResponse.json({ url: stripeSession.url });
            } catch (e) {
                console.error('[STRIPE_PORTAL]', e);
                // Fall through to checkout if portal fails
            }
        }

        // If no customer ID exists (or was invalid), create one
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: session.user.email,
                metadata: {
                    userId: session.user.id
                }
            });
            customerId = customer.id;

            // Save it immediately
            await prisma.user.update({
                where: { id: session.user.id },
                data: { stripeCustomerId: customerId }
            });
        }

        const isFree = priceId === PLANS.free.priceId;

        const stripeSession = await stripe.checkout.sessions.create({
            success_url: settingsUrl,
            cancel_url: settingsUrl,
            payment_method_types: ['card'],
            mode: isFree ? 'payment' : 'subscription',
            billing_address_collection: 'auto',
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            allow_promotion_codes: true,
            subscription_data: isFree ? undefined : {
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
