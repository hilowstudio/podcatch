'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserMenu } from '@/components/auth/user-menu';
import { SubscriptionPlan } from '@/lib/subscription';
import { UpgradeTrigger } from '@/components/upgrade-trigger';

interface SiteNavigationProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
    subscriptionPlan?: SubscriptionPlan;
}

export function SiteNavigation({ user, subscriptionPlan }: SiteNavigationProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex h-16 items-center px-4">
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] flex flex-col">
                    <SheetHeader className="border-b pb-4 mb-4">
                        <SheetTitle className="sr-only">Navigation</SheetTitle> {/* Accessibility */}
                        <div className="flex justify-center">
                            <div className="relative h-40 w-40 overflow-hidden">
                                <Image
                                    src="/podcatch.png"
                                    alt="Podcatch Logo"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </div>
                    </SheetHeader>

                    {/* Navigation Links */}
                    <div className="flex-1 overflow-y-auto py-4">
                        <nav className="flex flex-col space-y-2">
                            <Link
                                href="/"
                                className="px-4 py-2 hover:bg-muted rounded-md font-medium"
                                onClick={() => setOpen(false)}
                            >
                                Home
                            </Link>
                            {/* Future links: History, Bookmarks, etc. */}
                            {user && (
                                <>
                                    <Link
                                        href="/collections"
                                        className="px-4 py-2 hover:bg-muted rounded-md font-medium"
                                        onClick={() => setOpen(false)}
                                    >
                                        Collections
                                    </Link>
                                    <Link
                                        href="/search"
                                        className="px-4 py-2 hover:bg-muted rounded-md font-medium"
                                        onClick={() => setOpen(false)}
                                    >
                                        Deep Discovery
                                    </Link>
                                    <UpgradeTrigger isUnlocked={!!subscriptionPlan?.canChatWithLibrary} requiredTier="PRO">
                                        <div className={!!subscriptionPlan?.canChatWithLibrary ? "" : "pointer-events-none"}>
                                            <Link
                                                href="/chat"
                                                className="px-4 py-2 hover:bg-muted rounded-md font-medium block"
                                                onClick={() => setOpen(false)}
                                                tabIndex={!!subscriptionPlan?.canChatWithLibrary ? 0 : -1}
                                            >
                                                Chat with Library
                                            </Link>
                                        </div>
                                    </UpgradeTrigger>

                                    <UpgradeTrigger isUnlocked={!!subscriptionPlan?.canUseKnowledgeGraph} requiredTier="BASIC">
                                        <div className={!!subscriptionPlan?.canUseKnowledgeGraph ? "" : "pointer-events-none"}>
                                            <Link
                                                href="/graph"
                                                className="px-4 py-2 hover:bg-muted rounded-md font-medium block"
                                                onClick={() => setOpen(false)}
                                                tabIndex={!!subscriptionPlan?.canUseKnowledgeGraph ? 0 : -1}
                                            >
                                                Knowledge Graph
                                            </Link>
                                        </div>
                                    </UpgradeTrigger>



                                    <UpgradeTrigger isUnlocked={!!subscriptionPlan?.canUseIntegrations} requiredTier="BASIC">
                                        <div className={!!subscriptionPlan?.canUseIntegrations ? "" : "pointer-events-none"}>
                                            <Link
                                                href="/integrations"
                                                className="px-4 py-2 hover:bg-muted rounded-md font-medium block"
                                                onClick={() => setOpen(false)}
                                                tabIndex={!!subscriptionPlan?.canUseIntegrations ? 0 : -1}
                                            >
                                                Integrations
                                            </Link>
                                        </div>
                                    </UpgradeTrigger>

                                    <UpgradeTrigger isUnlocked={!!subscriptionPlan?.canUseBrandVoice} requiredTier="BASIC">
                                        <div className={!!subscriptionPlan?.canUseBrandVoice ? "" : "pointer-events-none"}>
                                            <Link
                                                href="/brand-voice"
                                                className="px-4 py-2 hover:bg-muted rounded-md font-medium block"
                                                onClick={() => setOpen(false)}
                                                tabIndex={!!subscriptionPlan?.canUseBrandVoice ? 0 : -1}
                                            >
                                                Brand Voice
                                            </Link>
                                        </div>
                                    </UpgradeTrigger>
                                </>
                            )}
                        </nav>
                    </div>

                    {/* Footer / User Menu */}
                    {user && (
                        <div className="border-t pt-4 mt-auto">
                            <div className="flex items-center gap-4 px-2">
                                <UserMenu user={user} subscriptionPlan={subscriptionPlan} />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{user.name}</span>
                                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                        {user.email}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
