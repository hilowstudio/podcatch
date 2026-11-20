'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NotificationBell } from '@/components/notification-bell';
import { UserMenu } from '@/components/auth/user-menu';
import { SubscriptionPlan } from '@/lib/subscription';
import { NAV_PLACES, isBareRoute } from '@/lib/nav';
import { cn } from '@/lib/utils';

interface SiteHeaderClientProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
    subscriptionPlan?: SubscriptionPlan;
    usageCount?: number;
}

export function SiteHeaderClient({ user, subscriptionPlan, usageCount = 0 }: SiteHeaderClientProps) {
    const pathname = usePathname();
    if (isBareRoute(pathname)) return null;

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-x">
            <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
                <Link
                    href="/"
                    className="rounded-md font-display text-xl font-bold tracking-tight text-foreground no-underline"
                >
                    Podcatch
                </Link>

                {user ? (
                    <>
                        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 md:flex">
                            {NAV_PLACES.map((place) => {
                                const current = place.match(pathname);
                                return (
                                    <Link
                                        key={place.href}
                                        href={place.href}
                                        aria-current={current ? 'page' : undefined}
                                        className={cn(
                                            'inline-flex min-h-11 items-center rounded-md px-3 text-sm transition-colors',
                                            current
                                                ? 'bg-accent font-semibold text-foreground'
                                                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                                        )}
                                    >
                                        {place.label}
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="ml-auto flex items-center gap-1">
                            <NotificationBell />
                            <UserMenu user={user} subscriptionPlan={subscriptionPlan} usageCount={usageCount} />
                        </div>
                    </>
                ) : (
                    <nav aria-label="Main" className="ml-auto flex items-center gap-1">
                        <Link href="/pricing" className="hidden min-h-11 items-center rounded-md px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground sm:inline-flex">
                            Pricing
                        </Link>
                        <Link href="/auth/signin" className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                            Sign in
                        </Link>
                        <Link href="/auth/signup" className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                            Start free
                        </Link>
                    </nav>
                )}
            </div>
        </header>
    );
}
