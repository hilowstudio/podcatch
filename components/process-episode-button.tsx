'use client';

import { useState, useTransition } from 'react';
import { processEpisodeAction } from '@/actions/process-episode-action';
import { Button } from '@/components/ui/button';
import { PlayCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProcessEpisodeButtonProps {
    episodeId: string;
    status: string;
}

export function ProcessEpisodeButton({ episodeId, status }: ProcessEpisodeButtonProps) {
    const [isPending, startTransition] = useTransition();

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
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
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
    );
}
