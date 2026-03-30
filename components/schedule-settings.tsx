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
    initialQuietStart: string | null;
    initialQuietEnd: string | null;
}

export function ScheduleSettings({
    initialTimezone,
    initialDeliveryTime,
    initialQuietStart,
    initialQuietEnd,
}: ScheduleSettingsProps) {
    const [timezone, setTimezone] = useState(initialTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [deliveryTime, setDeliveryTime] = useState(initialDeliveryTime || '08:00');
    const [quietStart, setQuietStart] = useState(initialQuietStart || '');
    const [quietEnd, setQuietEnd] = useState(initialQuietEnd || '');
    const [isPending, startTransition] = useTransition();

    const save = (field: string, value: string) => {
        const updated = {
            timezone: field === 'timezone' ? value : timezone,
            deliveryTime: field === 'deliveryTime' ? value : deliveryTime,
            quietStart: field === 'quietStart' ? value : quietStart,
            quietEnd: field === 'quietEnd' ? value : quietEnd,
        };

        startTransition(async () => {
            try {
                await updateScheduleSettings(updated);
                toast.success('Schedule updated');
            } catch {
                toast.error('Failed to save');
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select
                        value={timezone}
                        onValueChange={(v) => { setTimezone(v); save('timezone', v); }}
                        disabled={isPending}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {COMMON_TIMEZONES.map(tz => (
                                <SelectItem key={tz} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Digest delivery time</Label>
                    <Select
                        value={deliveryTime}
                        onValueChange={(v) => { setDeliveryTime(v); save('deliveryTime', v); }}
                        disabled={isPending}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {HOURS.map(h => (
                                <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div>
                <Label className="mb-3 block">Quiet hours <span className="text-muted-foreground font-normal">(notifications queued, not lost)</span></Label>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Start</Label>
                        <Select
                            value={quietStart}
                            onValueChange={(v) => { setQuietStart(v); save('quietStart', v); }}
                            disabled={isPending}
                        >
                            <SelectTrigger><SelectValue placeholder="Off" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="off">Off</SelectItem>
                                {HOURS.map(h => (
                                    <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">End</Label>
                        <Select
                            value={quietEnd}
                            onValueChange={(v) => { setQuietEnd(v); save('quietEnd', v); }}
                            disabled={isPending || !quietStart || quietStart === 'off'}
                        >
                            <SelectTrigger><SelectValue placeholder="Off" /></SelectTrigger>
                            <SelectContent>
                                {HOURS.map(h => (
                                    <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
}
