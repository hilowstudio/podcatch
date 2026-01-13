'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { SubscriptionPlan } from '@/lib/subscription';
import { UsageBar } from '@/components/usage-bar';

type UserMenuProps = {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
    subscriptionPlan?: SubscriptionPlan;
    usageCount?: number;
};

export function UserMenu({ user, subscriptionPlan, usageCount = 0 }: UserMenuProps) {
    const initials = user.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase() ?? 'U';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                        <AvatarImage src={user.image || ''} alt={user.name || ''} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {subscriptionPlan && (
                    <>
                        <DropdownMenuLabel>
                            <div className="flex flex-col space-y-3">
                                {subscriptionPlan.maxEpisodesPerMonth < 1000 && (
                                    <div className="mb-1">
                                        <UsageBar usage={usageCount} limit={subscriptionPlan.maxEpisodesPerMonth} />
                                    </div>
                                )}
                                <div className="flex flex-col space-y-1">
                                    <span className="text-xs font-normal text-muted-foreground">Current Plan</span>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{subscriptionPlan.name}</span>
                                        {!subscriptionPlan.isPro && (
                                            <Link href="/pricing" className="text-xs text-primary hover:underline ml-2">
                                                Upgrade
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href="/pricing" className="cursor-pointer">
                                <span className="flex items-center w-full">
                                    {subscriptionPlan.isPro ? 'Manage Subscription' : 'Upgrade to Pro'}
                                </span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}
                <DropdownMenuItem
                    className="cursor-pointer text-red-600"
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
