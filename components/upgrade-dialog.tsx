'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Info } from 'lucide-react';

interface UpgradeNoticeProps {
    currentPlan: string;
    limit: number;
    onDismiss: () => void;
}

export function UpgradeNotice({
    currentPlan,
    limit,
    onDismiss,
}: UpgradeNoticeProps) {
    return (
        <div className="rounded-lg border bg-muted/50 p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                    Monthly limit reached
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                    You've processed {limit} episodes this month on the {currentPlan} plan.
                    You can <Link href="/pricing" className="text-primary underline hover:no-underline">view available plans</Link> or
                    wait until your limit resets next month.
                </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onDismiss} className="shrink-0">
                Dismiss
            </Button>
        </div>
    );
}
