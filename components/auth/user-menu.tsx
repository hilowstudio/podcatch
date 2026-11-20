'use client';

import { signOut } from 'next-auth/react';
import { clearClientData } from '@/lib/client-logout';
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
                <Button variant="ghost" className="relative size-11 rounded-full" aria-label="Account and settings">
                    <Avatar>
                        <AvatarImage src={user.image || ''} alt="" />
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
                    <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
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
                                    <span className="text-xs font-normal text-muted-foreground">Plan</span>
                                    <span className="text-sm font-medium">{subscriptionPlan.name}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href="/pricing" className="cursor-pointer">
                                Plans and billing
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}
                <DropdownMenuItem asChild>
                    <Link href="/privacy" className="cursor-pointer">Privacy</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/terms" className="cursor-pointer">Terms</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <a href="mailto:support@podcatch.app" className="cursor-pointer">Contact support</a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={async () => {
                        // Purge cached user data before redirecting, so nothing
                        // bleeds to the next user on a shared device.
                        await clearClientData();
                        signOut({ callbackUrl: '/auth/signin' });
                    }}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
