'use client';

import { useAudio } from '@/components/audio-provider';
import { SPEEDS } from '@/lib/player/logic';

/** "Speed for this show": a show's own speed, or the person's usual speed. */
export function ShowSpeed({ feedId, feedTitle }: { feedId: string; feedTitle: string | null }) {
    const { prefs, setShowSpeed } = useAudio();
    const value = prefs.showSpeeds[feedId];
    return (
        <div className="flex flex-wrap items-center gap-2 text-sm">
            <label htmlFor={`speed-${feedId}`} className="text-muted-foreground">Speed for {feedTitle ?? 'this show'}</label>
            <select
                id={`speed-${feedId}`}
                value={value ? String(value) : ''}
                onChange={(e) => setShowSpeed(feedId, e.target.value ? parseFloat(e.target.value) : null)}
                className="min-h-11 rounded-md border bg-background px-2 font-mono tabular-nums"
            >
                <option value="">Your usual speed</option>
                {SPEEDS.map((s) => <option key={s} value={String(s)}>{s}×</option>)}
            </select>
        </div>
    );
}
