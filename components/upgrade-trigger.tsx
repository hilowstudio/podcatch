'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Tier = 'BASIC' | 'PRO';

interface UpgradeTriggerProps {
    isUnlocked: boolean;
    requiredTier: Tier;
    children: React.ReactNode;
    className?: string; // wrapper class
}

export function UpgradeTrigger({ isUnlocked, requiredTier, children, className }: UpgradeTriggerProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const handleUpgrade = () => {
        router.push('/pricing?onboarding=false'); // Redirect to pricing
    };

    if (isUnlocked) {
        return <>{children}</>;
    }

    return (
        <>
            <div
                className={`relative group cursor-pointer ${className || ''}`}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(true);
                }}
            >
                {/* Overlay/Badge */}
                <div className="flex items-center">
                    <div className="opacity-50 pointer-events-none select-none grayscale transition-opacity group-hover:opacity-75">
                        {children}
                    </div>
                    <Badge
                        variant="secondary"
                        className="absolute right-2 top-1/2 -translate-y-1/2 shadow-sm border bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-all gap-1 pointer-events-none"
                    >
                        <Crown className="w-3 h-3 text-primary fill-primary" />
                        <span className="font-bold text-[10px] tracking-wide">{requiredTier}</span>
                    </Badge>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="mx-auto bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 p-3 rounded-full mb-4 w-fit">
                            <Crown className="h-8 w-8 text-primary" />
                        </div>
                        <DialogTitle className="text-center text-xl">Unlock {requiredTier} Features</DialogTitle>
                        <DialogDescription className="text-center pt-2">
                            This feature is available on the <strong>{requiredTier}</strong> plan.
                            Upgrade now to access it instantly.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2 mt-4">
                        <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white border-0" onClick={handleUpgrade}>
                            Start 3-Day Free Trial
                        </Button>
                        <Button variant="ghost" onClick={() => setOpen(false)}>
                            Maybe Later
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
