'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { togglePromptVisibility } from '@/actions/prompt-gallery-actions';
import { toast } from 'sonner';

export function SharePromptToggle({ promptId, initialValue }: { promptId: string; initialValue: boolean }) {
    const [isPublic, setIsPublic] = useState(initialValue);
    const [isPending, setIsPending] = useState(false);

    const handleToggle = async () => {
        setIsPending(true);
        try {
            const result = await togglePromptVisibility(promptId);
            if (result.success) {
                setIsPublic(result.isPublic!);
                toast.success(result.isPublic ? 'Prompt shared to gallery' : 'Prompt removed from gallery');
            } else {
                toast.error(result.error || 'Failed to update');
            }
        } catch {
            toast.error('Failed to update');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Switch
                id={`share-${promptId}`}
                checked={isPublic}
                onCheckedChange={handleToggle}
                disabled={isPending}
            />
            <Label htmlFor={`share-${promptId}`} className="text-xs text-muted-foreground">
                {isPublic ? 'Shared' : 'Share'}
            </Label>
        </div>
    );
}
