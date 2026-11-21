/** 75 -> "1:15", 3725 -> "1:02:05" */
export function clock(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}

/** Rounded minutes for lists: "4 min", "1 h 12 min". */
export function minutesLabel(seconds: number | null | undefined): string | null {
    if (!seconds || seconds <= 0) return null;
    const m = Math.max(1, Math.round(seconds / 60));
    if (m < 60) return `${m} min`;
    return `${Math.floor(m / 60)} h ${m % 60} min`;
}

/** "12 min left" for a partly played episode, or null. */
export function leftLabel(positionSec: number, durationSec: number | null | undefined): string | null {
    if (!durationSec || positionSec < 5) return null;
    const left = minutesLabel(durationSec - positionSec);
    return left ? `${left} left` : null;
}

/** "00:15" / "1:30:45" chapter starts to seconds. */
export function parseStamp(stamp: string): number {
    const parts = stamp.split(':').map((p) => parseInt(p, 10) || 0);
    return parts.reduce((acc, n) => acc * 60 + n, 0);
}

/** Plain words for an episode's processing status. */
export function statusWords(status: string): string {
    switch (status) {
        case 'COMPLETED': return 'transcribed';
        case 'PROCESSING': return 'transcribing now';
        case 'FAILED': return 'couldn’t be transcribed';
        default: return 'not transcribed';
    }
}
