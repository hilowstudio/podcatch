'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { updateDigestPreference } from '@/actions/digest-actions';
import { useState } from 'react';
import { toast } from 'sonner';

interface DigestSettingsProps {
    initialFrequency: string;
}

export function DigestSettings({ initialFrequency }: DigestSettingsProps) {
    const [frequency, setFrequency] = useState(initialFrequency);
    const [isLoading, setIsLoading] = useState(false);

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

    return (
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
                {frequency === 'DAILY' && 'You will receive a daily summary of new episodes at 8am UTC.'}
                {frequency === 'WEEKLY' && 'You will receive a weekly summary every Monday at 8am UTC.'}
            </p>
        </div>
    );
}
