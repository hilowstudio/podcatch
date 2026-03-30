'use client';

import { usePathname } from 'next/navigation';
import { SiteNavigation } from '@/components/site-navigation';
import { NotificationBell } from '@/components/notification-bell';
import Link from 'next/link';
import { SubscriptionPlan } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import { SessionTimer } from '@/components/session-timer';

interface SiteHeaderClientProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
    subscriptionPlan?: SubscriptionPlan; // Make optional to avoid strict type breakage on existing usage if any (though usage is only in SiteHeader)
    usageCount?: number;
}

export function SiteHeaderClient({ user, subscriptionPlan, usageCount = 0 }: SiteHeaderClientProps) {
    const pathname = usePathname();

    // Hide header on auth pages
    if (pathname.startsWith('/auth')) {
        return null;
    }

    return (
        <header className="sticky top-0 z-50 w-full shadow-sm bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between pr-4">
                <div className="flex items-center gap-4">
                    <SiteNavigation user={user} subscriptionPlan={subscriptionPlan} usageCount={usageCount} />
                    {!user && (
                        <>
                            <Link href="/pricing" className="text-sm font-medium transition-colors hover:text-primary hidden sm:block">
                                Pricing
                            </Link>
                            <Link href="/auth/signin" className="text-sm font-medium transition-colors hover:text-primary">
                                Log in
                            </Link>
                            <Link href="/auth/signup">
                                <Button size="sm" variant="default">
                                    Sign Up
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {user && <SessionTimer />}
                    <NotificationBell />
                </div>
            </div>
        </header>
    );
}
