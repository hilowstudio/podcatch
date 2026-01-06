'use client';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { SubscriptionPlan } from '@/lib/subscription';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { PLANS, PlanType } from '@/lib/stripe-config';
import { cn } from '@/lib/utils';

interface BillingFormProps {
    subscriptionPlan: SubscriptionPlan & {
        stripeCurrentPeriodEnd?: number | null;
    };
}

export function BillingForm({ subscriptionPlan }: BillingFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [interval, setInterval] = useState<PlanType>('monthly');

    async function onSubmit() {
        setIsLoading(true);

        try {
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId: PLANS[interval].priceId }),
            });

            if (!response.ok) {
                console.error('Failed to create checkout session');
                setIsLoading(false);
                return;
            }

            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Subscription Plan</CardTitle>
                        <CardDescription>
                            You are currently on the <strong>{subscriptionPlan.name}</strong> plan.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                    {subscriptionPlan.description}
                </div>

                {!subscriptionPlan.isPro && (
                    <div className="flex items-center gap-2 rounded-lg border p-1 w-fit">
                        <Button
                            variant={interval === 'monthly' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setInterval('monthly')}
                            className="text-xs"
                        >
                            {PLANS.monthly.label}
                        </Button>
                        <Button
                            variant={interval === 'annual' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setInterval('annual')}
                            className="text-xs"
                        >
                            {PLANS.annual.label}
                        </Button>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col items-start space-y-2 md:flex-row md:justify-between md:space-x-0">
                <Button
                    type="submit"
                    onClick={onSubmit}
                    disabled={isLoading}
                >
                    {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {subscriptionPlan.isPro ? 'Manage Subscription' : `Upgrade to Pro (${interval === 'monthly' ? 'Monthly' : 'Annual'})`}
                </Button>

                {subscriptionPlan.isPro && subscriptionPlan.stripeCurrentPeriodEnd && (
                    <p className="rounded-full text-xs font-medium text-muted-foreground mt-2 md:mt-0">
                        Current period ends on {format(new Date(subscriptionPlan.stripeCurrentPeriodEnd), 'PPP')}
                    </p>
                )}
            </CardFooter>
        </Card>
    );
}
