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
                toast('Transcribing. It’s usually ready in a few minutes.');
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
                variant="outline"
                className="min-h-11 gap-2"
            >
                {isPending ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Starting
                    </>
                ) : (
                    <>
                        <PlayCircle className="h-4 w-4" aria-hidden />
                        {status === 'FAILED' ? 'Try transcribing again' : 'Transcribe'}
                    </>
                )}
            </Button>

            {upgradeData && (
                <Card role="status" className="border-primary/20 bg-primary/5">
                    <CardContent className="flex items-start gap-3 p-4">
                        <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" aria-hidden />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">This month’s transcriptions are used</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {upgradeData.currentPlan} includes {upgradeData.limit} a month. Listening is still unlimited.
                                {upgradeData.nextPlan ? ` ${upgradeData.nextPlan} includes more.` : ''}
                            </p>
                            <Button asChild size="sm" variant="outline" className="mt-2 min-h-11">
                                <Link href="/pricing">See plans</Link>
                            </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="size-11 flex-shrink-0" onClick={() => setUpgradeData(null)} aria-label="Dismiss">
                            <X className="h-4 w-4" aria-hidden />
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
