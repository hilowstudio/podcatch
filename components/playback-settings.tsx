'use client';

import { useAudio } from '@/components/audio-provider';
import { Switch } from '@/components/ui/switch';
import { SKIP_CHOICES } from '@/lib/player/logic';

export function PlaybackSettings() {
    const { prefs, updatePrefs } = useAudio();
    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <label htmlFor="skip-back" className="text-sm font-medium">Skip back</label>
                    <select
                        id="skip-back"
                        value={prefs.skipBackSec}
                        onChange={(e) => updatePrefs({ skipBackSec: parseInt(e.target.value, 10) })}
                        className="block min-h-11 w-full rounded-md border bg-background px-3"
                    >
                        {SKIP_CHOICES.map((s) => <option key={s} value={s}>{s} seconds</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label htmlFor="skip-forward" className="text-sm font-medium">Skip forward</label>
                    <select
                        id="skip-forward"
                        value={prefs.skipForwardSec}
                        onChange={(e) => updatePrefs({ skipForwardSec: parseInt(e.target.value, 10) })}
                        className="block min-h-11 w-full rounded-md border bg-background px-3"
                    >
                        {SKIP_CHOICES.map((s) => <option key={s} value={s}>{s} seconds</option>)}
                    </select>
                </div>
            </div>

            <label className="flex min-h-11 items-start justify-between gap-4 rounded-lg border bg-card p-4">
                <span>
                    <span className="block text-sm font-medium">Keep playing Up next</span>
                    <span className="block text-sm text-muted-foreground">When an episode ends, start the next one in Up next.</span>
                </span>
                <Switch
                    checked={prefs.continuousPlay}
                    onCheckedChange={(v) => updatePrefs({ continuousPlay: v })}
                    aria-label="Keep playing Up next"
                />
            </label>

            <p className="text-sm text-muted-foreground">
                Your place in each episode, Up next and these settings are saved to your account, so they follow you to any device.
                Podcatch is a web app, so it can’t connect to CarPlay, Android Auto or a watch. On iPhone, the system may stop playback if it closes Podcatch in the background.
            </p>
        </div>
    );
}
