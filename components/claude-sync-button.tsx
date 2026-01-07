'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { syncToClaudeAction } from '@/actions/claude';
import { Loader2, BrainCircuit } from 'lucide-react';
import { toast } from 'sonner';

export function ClaudeSyncButton({ episodeId }: { episodeId: string }) {
    const [isLoading, setIsLoading] = useState(false);

    async function handleSync() {
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

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isLoading}
            className="gap-2"
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <BrainCircuit className="h-4 w-4 text-orange-600" />
            )}
            Send to Claude
        </Button>
    );
}
