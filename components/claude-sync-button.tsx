'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { syncToClaudeAction } from '@/actions/claude';
import { Loader2, BrainCircuit } from 'lucide-react';
import { toast } from 'sonner';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface ClaudeSyncButtonProps {
    episodeId: string;
    isConfigured?: boolean;
}

export function ClaudeSyncButton({ episodeId, isConfigured = true }: ClaudeSyncButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    async function handleSync() {
        if (!isConfigured) {
            toast.error('Configure Claude in Settings → Integrations first');
            return;
        }
        setIsLoading(true);
        try {
            const result = await syncToClaudeAction(episodeId);
            if (result.success) {
                toast.success('Sent to Claude Project', {
                    description: 'Transcript and insights added to your project.'
                });
            } else {
                toast.error(result.error || 'Failed to sync');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }

    const button = (
        <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isLoading || !isConfigured}
            className="gap-2"
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Syncing...
                </>
            ) : (
                <>
                    <BrainCircuit className="h-4 w-4 text-orange-600" />
                    Send to Claude
                </>
            )}
        </Button>
    );

    if (!isConfigured) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {button}
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Configure Claude API in Settings → Integrations</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return button;
}

