'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { updateDigestPreference, setRewindEnabled } from '@/actions/digest-actions';
import { useState } from 'react';
import { toast } from 'sonner';

interface DigestSettingsProps {
    initialFrequency: string;
    initialRewindEnabled: boolean;
}

export function DigestSettings({ initialFrequency, initialRewindEnabled }: DigestSettingsProps) {
    const [frequency, setFrequency] = useState(initialFrequency);
    const [rewind, setRewind] = useState(initialRewindEnabled);
    const [isLoading, setIsLoading] = useState(false);
    const [rewindBusy, setRewindBusy] = useState(false);

    async function handleChange(value: string) {
        setIsLoading(true);
        try {
            const result = await updateDigestPreference(value);
            if (result.success) {
                setFrequency(value);
                toast.success(value === 'NONE' ? 'Digest disabled' : `${value.toLowerCase().replace(/^\w/, c => c.toUpperCase())} digest enabled`);
            } else {
                toast.error(result.error || 'Failed to update');
            }
        } catch {
            toast.error('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleRewindToggle(next: boolean) {
        setRewindBusy(true);
        setRewind(next); // optimistic
        const result = await setRewindEnabled(next);
        setRewindBusy(false);
        if (!result.success) {
            setRewind(!next);
            toast.error(result.error || 'Failed to update');
            return;
        }
        toast.success(next ? 'Weekly Rewind enabled' : 'Weekly Rewind disabled');
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="digest-frequency">Email Digest</Label>
                <Select value={frequency} onValueChange={handleChange} disabled={isLoading}>
                    <SelectTrigger id="digest-frequency" className="w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="NONE">Off</SelectItem>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    {frequency === 'NONE' && 'You will not receive email digests.'}
                    {frequency === 'DAILY' && 'You will receive a daily summary of new episodes at your delivery time.'}
                    {frequency === 'WEEKLY' && 'You will receive a weekly summary every Monday at your delivery time.'}
                </p>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div className="space-y-1">
                    <Label htmlFor="rewind-toggle" className="cursor-pointer">Weekly Rewind</Label>
                    <p className="max-w-md text-xs text-muted-foreground">
                        Every Sunday, we resurface a few of your saved highlights so they stick. Sent only while your email digest is on.
                    </p>
                </div>
                <Switch
                    id="rewind-toggle"
                    checked={rewind}
                    disabled={rewindBusy}
                    onCheckedChange={handleRewindToggle}
                    aria-label="Weekly Rewind"
                />
            </div>
        </div>
    );
}
