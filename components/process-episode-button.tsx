'use client';

import { useState, useTransition } from 'react';
import { processEpisodeAction } from '@/actions/process-episode-action';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle, Loader2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface ProcessEpisodeButtonProps {
    episodeId: string;
    status: string;
}

export function ProcessEpisodeButton({ episodeId, status }: ProcessEpisodeButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [upgradeData, setUpgradeData] = useState<{
        currentPlan: string;
        nextPlan: string;
        limit: number;
    } | null>(null);

    if (status === 'PROCESSING' || status === 'COMPLETED') {
        return null;
    }

    const handleProcess = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('episodeId', episodeId);

            const result = await processEpisodeAction(formData);

            if (result.success) {
                toast.success('Processing started');
            } else if (result.upgradeRequired) {
                setUpgradeData({
                    currentPlan: result.plan,
                    nextPlan: result.nextPlan,
                    limit: result.limit
                });
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <div className="space-y-3">
            <Button
                onClick={handleProcess}
                disabled={isPending}
                size="sm"
                className="gap-2"
            >
                {isPending ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Queuing...
                    </>
                ) : (
                    <>
                        <PlayCircle className="h-4 w-4" />
                        Process Episode
                    </>
                )}
            </Button>

            {upgradeData && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="flex items-start gap-3 p-4">
                        <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">Usage Limit Reached</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                You&apos;ve processed {upgradeData.limit} episodes this month on the {upgradeData.currentPlan} plan.
                                Upgrade to {upgradeData.nextPlan} for more.
                            </p>
                            <Link href="/pricing" className="inline-block mt-2">
                                <Button size="sm" variant="outline" className="gap-1.5">
                                    View Plans
                                </Button>
                            </Link>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0" onClick={() => setUpgradeData(null)}>
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
