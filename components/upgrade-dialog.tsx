'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface UpgradeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentPlan: string;
    nextPlan: string;
    limit: number;
}

export function UpgradeDialog({
    open,
    onOpenChange,
    currentPlan,
    nextPlan,
    limit,
}: UpgradeDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Usage Limit Reached
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-base">
                        You've processed <strong>{limit} episodes</strong> this month, which is the limit for the <strong>{currentPlan}</strong> plan.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                    <p className="text-muted-foreground">
                        Upgrade to <strong>{nextPlan}</strong> to unlock more processing power and deeper insights.
                    </p>
                </div>
                <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Link href="/pricing" className="w-full sm:w-auto">
                        <Button className="w-full">
                            Upgrade to {nextPlan}
                        </Button>
                    </Link>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
