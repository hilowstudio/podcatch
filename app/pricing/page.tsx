'use client';

import { useState, Suspense } from 'react';
import { PLANS } from '@/lib/stripe-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';

// Helper to format currency
const formatPrice = (amount: number) => `$${amount}`;

export default function PricingPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PricingContent />
        </Suspense>
    );
}

function PricingContent() {
    const [isAnnual, setIsAnnual] = useState(false);
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const searchParams = useSearchParams();
    const isOnboarding = searchParams.get('onboarding') === 'true';

    const handleCheckout = async (priceId: string) => {
        setIsLoading(priceId);
        try {
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error('No checkout URL returned');
                setIsLoading(null);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            setIsLoading(null);
        }
    };

    return (
        <div className="container max-w-6xl mx-auto py-20 px-4">
            <div className="text-center mb-16">
                {isOnboarding ? (
                    <div className="mb-6">
                        <Badge variant="outline" className="mb-4 py-1 px-4 text-sm border-primary text-primary">Step 2 of 2</Badge>
                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
                            Welcome to Podcatch
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Select a plan to complete your account setup. No credit card required for Free tier.
                        </p>
                    </div>
                ) : (
                    <>
                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
                            Simple, Transparent Pricing
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Choose the plan that fits your listening habits. Upgrade or cancel anytime.
                        </p>
                    </>
                )}

                {/* Billing Toggle */}
                <div className="flex items-center justify-center mt-8 gap-4">
                    <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Monthly
                    </span>
                    <Switch
                        checked={isAnnual}
                        onCheckedChange={setIsAnnual}
                        className="data-[state=checked]:bg-primary"
                    />
                    <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Annual <Badge variant="secondary" className="ml-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Save ~15%</Badge>
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* FREE TIER */}
                <Card className="flex flex-col border-2 border-border shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="text-2xl">{PLANS.free.name}</CardTitle>
                        <CardDescription>Perfect for casual listeners.</CardDescription>
                        <div className="mt-4">
                            <span className="text-4xl font-bold">$0</span>
                            <span className="text-muted-foreground">/mo</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ul className="space-y-3">
                            {PLANS.free.marketingFeatures.map((feature) => (
                                <li key={feature} className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span className="text-sm">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => handleCheckout(PLANS.free.priceId)}
                            disabled={isLoading === PLANS.free.priceId}
                        >
                            {isLoading === PLANS.free.priceId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isOnboarding ? 'Select Free Plan' : 'Get Started'}
                        </Button>
                    </CardFooter>
                </Card>

                {/* BASIC TIER */}
                <Card className="flex flex-col border-2 border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-2xl">{PLANS.basic.name}</CardTitle>
                        <CardDescription>For the avid podcast learner.</CardDescription>
                        <div className="mt-4">
                            <span className="text-4xl font-bold">
                                {formatPrice(isAnnual ? PLANS.basic.annual.amount / 12 : PLANS.basic.monthly.amount).split('.')[0]}
                            </span>
                            <span className="text-muted-foreground">/mo</span>
                            {isAnnual && <span className="block text-xs text-muted-foreground mt-1">Billed ${PLANS.basic.annual.amount} yearly</span>}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ul className="space-y-3">
                            {PLANS.basic.marketingFeatures.map((feature) => (
                                <li key={feature} className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span className="text-sm">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            onClick={() => handleCheckout(isAnnual ? PLANS.basic.annual.priceId : PLANS.basic.monthly.priceId)}
                            disabled={!!isLoading}
                        >
                            {isLoading === (isAnnual ? PLANS.basic.annual.priceId : PLANS.basic.monthly.priceId) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Subscribe Basic
                        </Button>
                    </CardFooter>
                </Card>

                {/* PRO TIER */}
                <Card className="flex flex-col border-2 border-primary shadow-lg scale-105 z-10 relative">
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                        POPULAR
                    </div>
                    <CardHeader>
                        <CardTitle className="text-2xl text-primary">{PLANS.pro.name}</CardTitle>
                        <CardDescription>For founders, researchers & creators.</CardDescription>
                        <div className="mt-4">
                            <span className="text-4xl font-bold">
                                {formatPrice(isAnnual ? PLANS.pro.annual.amount / 12 : PLANS.pro.monthly.amount).split('.')[0]}
                            </span>
                            <span className="text-muted-foreground">/mo</span>
                            {isAnnual && <span className="block text-xs text-muted-foreground mt-1">Billed ${PLANS.pro.annual.amount} yearly</span>}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ul className="space-y-3">
                            {PLANS.pro.marketingFeatures.map((feature) => (
                                <li key={feature} className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            variant="default" // Primary color
                            size="lg"
                            onClick={() => handleCheckout(isAnnual ? PLANS.pro.annual.priceId : PLANS.pro.monthly.priceId)}
                            disabled={!!isLoading}
                        >
                            {isLoading === (isAnnual ? PLANS.pro.annual.priceId : PLANS.pro.monthly.priceId) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Go Pro
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Feature Comparison Table */}
            <div className="mt-20">
                <h2 className="text-2xl font-bold text-center mb-12">Compare Plans</h2>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[600px]">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-4 px-4 w-1/4">Feature</th>
                                <th className="text-center py-4 px-4 w-1/4">Free</th>
                                <th className="text-center py-4 px-4 w-1/4">Basic</th>
                                <th className="text-center py-4 px-4 w-1/4 font-bold text-primary">Pro</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Usage & Limits */}
                            <tr className="bg-muted/30">
                                <td colSpan={4} className="py-2 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Usage & Limits</td>
                            </tr>
                            <tr className="border-b hover:bg-muted/50 transition-colors">
                                <td className="py-4 px-4">Episodes per Month</td>
                                <td className="text-center py-4 px-4">3</td>
                                <td className="text-center py-4 px-4">20</td>
                                <td className="text-center py-4 px-4 font-bold text-primary">200</td>
                            </tr>
                            <tr className="border-b hover:bg-muted/50 transition-colors">
                                <td className="py-4 px-4">Transcript Retention</td>
                                <td className="text-center py-4 px-4">Unlimited</td>
                                <td className="text-center py-4 px-4">Unlimited</td>
                                <td className="text-center py-4 px-4">Unlimited</td>
                            </tr>

                            {/* AI & Analysis */}
                            <tr className="bg-muted/30">
                                <td colSpan={4} className="py-2 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider mt-4">AI & Analysis</td>
                            </tr>
                            <tr className="border-b hover:bg-muted/50 transition-colors">
                                <td className="py-4 px-4">AI Summaries</td>
                                <td className="text-center py-4 px-4"><Check className="h-5 w-5 mx-auto text-green-500" /></td>
                                <td className="text-center py-4 px-4"><Check className="h-5 w-5 mx-auto text-green-500" /></td>
                                <td className="text-center py-4 px-4"><Check className="h-5 w-5 mx-auto text-primary" /></td>
                            </tr>
                            <tr className="border-b hover:bg-muted/50 transition-colors">
                                <td className="py-4 px-4">Knowledge Graph</td>
                                <td className="text-center py-4 px-4 text-muted-foreground">—</td>
                                <td className="text-center py-4 px-4"><Check className="h-5 w-5 mx-auto text-green-500" /></td>
                                <td className="text-center py-4 px-4"><Check className="h-5 w-5 mx-auto text-primary" /></td>
                            </tr>
                            <tr className="border-b hover:bg-muted/50 transition-colors">
                                <td className="py-4 px-4">Chat with Library</td>
                                <td className="text-center py-4 px-4 text-muted-foreground">—</td>
                                <td className="text-center py-4 px-4 text-muted-foreground">—</td>
                                <td className="text-center py-4 px-4"><Check className="h-5 w-5 mx-auto text-primary" /></td>
                            </tr>

                            {/* Features */}
                            <tr className="bg-muted/30">
                                <td colSpan={4} className="py-2 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider mt-4">Advanced Features</td>
                            </tr>
                            <tr className="border-b hover:bg-muted/50 transition-colors">
                                <td className="py-4 px-4">Claude Sync</td>
                                <td className="text-center py-4 px-4 text-muted-foreground">—</td>
                                <td className="text-center py-4 px-4 text-muted-foreground">—</td>
                                <td className="text-center py-4 px-4"><Check className="h-5 w-5 mx-auto text-primary" /></td>
                            </tr>
                            <tr className="border-b hover:bg-muted/50 transition-colors">
                                <td className="py-4 px-4">Notion Integration</td>
                                <td className="text-center py-4 px-4 text-muted-foreground">—</td>
                                <td className="text-center py-4 px-4"><Check className="h-5 w-5 mx-auto text-green-500" /></td>
                                <td className="text-center py-4 px-4"><Check className="h-5 w-5 mx-auto text-primary" /></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}
