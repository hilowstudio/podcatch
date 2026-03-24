'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Loader2 } from 'lucide-react';
import { clonePrompt } from '@/actions/prompt-gallery-actions';
import { toast } from 'sonner';

export function ClonePromptButton({ promptId }: { promptId: string }) {
    const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');

    const handleClone = async () => {
        setState('loading');
        try {
            const result = await clonePrompt(promptId);
            if (result.success) {
                setState('done');
                toast.success('Prompt cloned to your library!');
            } else {
                setState('idle');
                toast.error(result.error || 'Failed to clone');
            }
        } catch {
            setState('idle');
            toast.error('Failed to clone prompt');
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleClone}
            disabled={state !== 'idle'}
        >
            {state === 'loading' ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Cloning...</>
            ) : state === 'done' ? (
                <><Check className="h-3.5 w-3.5" /> Cloned</>
            ) : (
                <><Copy className="h-3.5 w-3.5" /> Clone</>
            )}
        </Button>
    );
}
