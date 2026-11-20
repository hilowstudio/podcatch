'use client';

import { useState, useTransition } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { updateScheduleSettings } from '@/actions/digest-actions';

const HOURS = Array.from({ length: 24 }, (_, i) => {
    const h = i.toString().padStart(2, '0');
    return { value: `${h}:00`, label: `${h}:00` };
});

const COMMON_TIMEZONES = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Moscow',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Pacific/Auckland',
];

interface ScheduleSettingsProps {
    initialTimezone: string | null;
    initialDeliveryTime: string | null;
}

export function ScheduleSettings({ initialTimezone, initialDeliveryTime }: ScheduleSettingsProps) {
    const [timezone, setTimezone] = useState(initialTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [deliveryTime, setDeliveryTime] = useState(initialDeliveryTime || '08:00');
    const [isPending, startTransition] = useTransition();

    const save = (next: { timezone: string; deliveryTime: string }) => {
        startTransition(async () => {
            try {
                await updateScheduleSettings(next);
                toast.success('Saved');
            } catch {
                toast.error('That didn’t save. Try again.');
            }
        });
    };

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
                <Label htmlFor="digest-timezone">Time zone</Label>
                <Select
                    value={timezone}
                    onValueChange={(v) => { setTimezone(v); save({ timezone: v, deliveryTime }); }}
                    disabled={isPending}
                >
                    <SelectTrigger id="digest-timezone" className="min-h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {COMMON_TIMEZONES.map(tz => (
                            <SelectItem key={tz} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="digest-time">Send the email at</Label>
                <Select
                    value={deliveryTime}
                    onValueChange={(v) => { setDeliveryTime(v); save({ timezone, deliveryTime: v }); }}
                    disabled={isPending}
                >
                    <SelectTrigger id="digest-time" className="min-h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {HOURS.map(h => (
                            <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
