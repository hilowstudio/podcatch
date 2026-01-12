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
import { PLANS, TRIAL_DAYS } from '@/lib/stripe-config';
import { cn } from '@/lib/utils';

interface BillingFormProps {
    subscriptionPlan: SubscriptionPlan & {
        stripeCurrentPeriodEnd?: number | null;
    };
}

export function BillingForm({ subscriptionPlan }: BillingFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

    async function onSubmit() {
        setIsLoading(true);

        try {
            // Defaulting to PRO plan for the simple billing form upgrade
            const plan = PLANS.pro;
            const priceId = billingCycle === 'monthly' ? plan.monthly.priceId : plan.annual.priceId;

            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId }),
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
                            variant={billingCycle === 'monthly' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setBillingCycle('monthly')}
                            className="text-xs"
                        >
                            Monthly
                        </Button>
                        <Button
                            variant={billingCycle === 'annual' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setBillingCycle('annual')}
                            className="text-xs"
                        >
                            Annual
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
                    {subscriptionPlan.isPro ? 'Manage Subscription' : `Upgrade to Pro (${billingCycle === 'monthly' ? 'Monthly' : 'Annual'})`}
                </Button>

                {!subscriptionPlan.isPro && (
                    <p className="text-xs text-muted-foreground mt-2 md:mt-0">
                        Includes {TRIAL_DAYS}-day free trial. Cancel anytime.
                    </p>
                )}

                {subscriptionPlan.isPro && subscriptionPlan.stripeCurrentPeriodEnd && (
                    <p className="rounded-full text-xs font-medium text-muted-foreground mt-2 md:mt-0">
                        Current period ends on {format(new Date(subscriptionPlan.stripeCurrentPeriodEnd), 'PPP')}
                    </p>
                )}
            </CardFooter>
        </Card>
    );
}
