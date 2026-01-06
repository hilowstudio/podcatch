'use client';

import { useState } from 'react';
import { processEpisode } from '@/actions/process-episode-action';
import { Button } from '@/components/ui/button';
import { PlayCircle, Loader2, CheckCircle2 } from 'lucide-react';

type ProcessEpisodeButtonProps = {
    episodeId: string;
    status: string;
};

export function ProcessEpisodeButton({ episodeId, status }: ProcessEpisodeButtonProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    if (status === 'PROCESSING' || status === 'COMPLETED') {
        return null; // Don't show button if already processing or done
    }

    const handleProcess = async () => {
        setIsProcessing(true);
        try {
            await processEpisode(episodeId);
            // Button will disappear on next render due to status change
        } catch (error) {
            console.error('Error:', error);
            setIsProcessing(false);
        }
    };

    return (
        <Button
            onClick={handleProcess}
            disabled={isProcessing}
            size="sm"
            className="gap-2"
        >
            {isProcessing ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting...
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
