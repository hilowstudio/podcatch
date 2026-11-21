// Pure player rules, kept apart from React and the database so they can be
// tested directly (logic.test.ts).

export type QueueEntry = { episodeId: string; position: number };

/** Position for an episode added to the end of Up next. */
export function positionAtEnd(queue: QueueEntry[]): number {
    if (queue.length === 0) return 1;
    return Math.max(...queue.map((q) => q.position)) + 1;
}

/**
 * Position for "Play next": straight after the episode playing now when it's
 * in the queue, otherwise at the front.
 */
export function positionNext(queue: QueueEntry[], currentEpisodeId?: string | null): number {
    const sorted = [...queue].sort((a, b) => a.position - b.position);
    if (sorted.length === 0) return 1;
    const i = currentEpisodeId ? sorted.findIndex((q) => q.episodeId === currentEpisodeId) : -1;
    if (i === -1) return sorted[0].position - 1;
    const after = sorted[i + 1];
    return after ? (sorted[i].position + after.position) / 2 : sorted[i].position + 1;
}

/** The position changes that move one episode up or down by one place. */
export function moveUpdates(queue: QueueEntry[], episodeId: string, direction: 'up' | 'down'): QueueEntry[] {
    const sorted = [...queue].sort((a, b) => a.position - b.position);
    const i = sorted.findIndex((q) => q.episodeId === episodeId);
    const j = direction === 'up' ? i - 1 : i + 1;
    if (i === -1 || j < 0 || j >= sorted.length) return [];
    return [
        { episodeId: sorted[i].episodeId, position: sorted[j].position },
        { episodeId: sorted[j].episodeId, position: sorted[i].position },
    ];
}

/** The episode after `currentEpisodeId` in Up next, if any. */
export function nextInQueue(queue: QueueEntry[], currentEpisodeId: string | null): string | null {
    const sorted = [...queue].sort((a, b) => a.position - b.position).filter((q) => q.episodeId !== currentEpisodeId);
    return sorted[0]?.episodeId ?? null;
}

/**
 * Where to start an episode. A finished episode, or one within its last
 * 30 seconds, starts again from the top; otherwise it resumes a few seconds
 * early so the listener catches the sentence they left in.
 */
export function resumeAt(positionSec: number | null | undefined, durationSec: number | null | undefined, completed: boolean): number {
    if (completed || !positionSec || positionSec < 5) return 0;
    if (durationSec && positionSec > durationSec - 30) return 0;
    return Math.max(0, positionSec - 3);
}

/** Whether a listen counts as finished (within 30 s of the end, or the end). */
export function isFinished(positionSec: number, durationSec: number | null | undefined): boolean {
    return !!durationSec && durationSec > 0 && positionSec >= durationSec - 30;
}

export type SleepMode = { kind: 'off' } | { kind: 'minutes'; minutes: number } | { kind: 'end-of-episode' };

/** When a minutes timer stops playback, as a timestamp; null for the other modes. */
export function sleepDeadline(mode: SleepMode, now: number): number | null {
    return mode.kind === 'minutes' ? now + mode.minutes * 60_000 : null;
}

/** Short label for the sleep timer button. */
export function sleepLabel(mode: SleepMode, now: number, deadline: number | null): string {
    if (mode.kind === 'off') return 'Sleep timer';
    if (mode.kind === 'end-of-episode') return 'Sleep: end';
    const left = Math.max(0, Math.ceil(((deadline ?? now) - now) / 60_000));
    return `Sleep: ${left} min`;
}

export const SPEEDS = [0.8, 1, 1.1, 1.2, 1.3, 1.5, 1.75, 2] as const;
export const SKIP_CHOICES = [5, 10, 15, 30, 45, 60] as const;
