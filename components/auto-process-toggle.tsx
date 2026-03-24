'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toggleAutoProcess } from '@/actions/subscription-actions';
import { useState } from 'react';
import { toast } from 'sonner';

interface AutoProcessToggleProps {
    feedId: string;
    initialValue: boolean;
}

export function AutoProcessToggle({ feedId, initialValue }: AutoProcessToggleProps) {
    const [isAutoProcess, setIsAutoProcess] = useState(initialValue);
    const [isLoading, setIsLoading] = useState(false);

    async function handleToggle() {
        setIsLoading(true);
        try {
            const result = await toggleAutoProcess(feedId);
            if (result.success) {
                setIsAutoProcess(result.autoProcess!);
                toast.success(result.autoProcess ? 'Auto-process enabled' : 'Auto-process disabled');
            } else {
                toast.error(result.error || 'Failed to toggle');
            }
        } catch {
            toast.error('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Switch
                id="auto-process"
                checked={isAutoProcess}
                onCheckedChange={handleToggle}
                disabled={isLoading}
            />
            <Label htmlFor="auto-process" className="text-sm text-muted-foreground">
                Auto-process new episodes
            </Label>
        </div>
    );
}
