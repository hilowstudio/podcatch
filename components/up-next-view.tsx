'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowUp, X } from 'lucide-react';
import { useAudio, useAudioTime } from '@/components/audio-provider';
import { EpisodeActions } from '@/components/episode-actions';
import { ProcessEpisodeButton } from '@/components/process-episode-button';
import { Button } from '@/components/ui/button';
import type { PlayerEpisode } from '@/actions/player-actions';
import { leftLabel, minutesLabel, statusWords } from '@/lib/player/format';
import { formatDistanceToNow } from 'date-fns';

function Art({ e, size = 52 }: { e: Pick<PlayerEpisode, 'image' | 'feedTitle'>; size?: number }) {
    const initials = (e.feedTitle || 'P').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    return e.image ? (
        <Image src={e.image} alt="" width={size} height={size} className="flex-none rounded-lg object-cover" style={{ width: size, height: size }} />
    ) : (
        <span aria-hidden className="grid flex-none place-items-center rounded-lg bg-secondary font-display text-sm text-muted-foreground" style={{ width: size, height: size }}>
            {initials}
        </span>
    );
}

function Progress({ position, duration }: { position: number; duration: number | null }) {
    if (!duration || position < 5) return null;
    const pct = Math.min(100, (position / duration) * 100);
    return (
        <span aria-hidden className="mt-1.5 block h-1 rounded-full bg-muted">
            <span className="block h-1 rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </span>
    );
}

export function UpNextView({
    newEpisodes,
    transcriptionsLeft,
    transcriptionLimit,
    planName,
}: {
    newEpisodes: PlayerEpisode[];
    transcriptionsLeft: number;
    transcriptionLimit: number;
    planName: string;
}) {
    const { queue, currentEpisode, moveInQueue, removeFromQueue, clearQueue, prefs } = useAudio();
    const liveTime = useAudioTime();
    const queuedIds = new Set(queue.map((q) => q.id));
    const fresh = newEpisodes.filter((e) => !queuedIds.has(e.id));

    // A total is only honest when every episode's length is known (lengths
    // are learned the first time an episode loads).
    const allKnown = queue.length > 0 && queue.every((q) => !!q.durationSec);
    const totalLeft = allKnown
        ? queue.reduce((sum, q) => sum + Math.max(0, (q.durationSec ?? 0) - (q.id === currentEpisode?.id ? liveTime : q.positionSec)), 0)
        : 0;

    return (
        <div className="mx-auto flex max-w-7xl flex-wrap gap-12 px-4 py-8 sm:px-6">
            <section aria-labelledby="up-next-heading" className="min-w-0 flex-[1_1_32rem]">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <h1 id="up-next-heading" className="text-3xl font-bold tracking-tight">Up next</h1>
                    {queue.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                            {queue.length} {queue.length === 1 ? 'episode' : 'episodes'}
                            {totalLeft > 0 && ` · about ${minutesLabel(totalLeft)}`}
                        </span>
                    )}
                </div>

                {queue.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-8 text-center">
                        <p className="font-medium">Nothing queued yet.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Choose “Up next” on any episode to line it up. New episodes from your shows are listed {fresh.length ? 'beside this' : 'here when they arrive'}.
                        </p>
                    </div>
                ) : (
                    <ol className="border-t">
                        {queue.map((q, i) => {
                            const playing = q.id === currentEpisode?.id;
                            const pos = playing ? liveTime : q.positionSec;
                            const meta = [
                                q.feedTitle,
                                playing ? 'playing' : null,
                                leftLabel(pos, q.durationSec) ?? minutesLabel(q.durationSec),
                                statusWords(q.status),
                            ].filter(Boolean).join(' · ');
                            return (
                                <li key={q.id} className="flex items-center gap-3 border-b py-3">
                                    <Art e={q} />
                                    <div className="min-w-0 flex-1">
                                        <Link href={`/episodes/${q.id}`} className="-my-2.5 flex min-h-11 items-center font-semibold leading-snug hover:underline">{q.title}</Link>
                                        <span className="block text-sm text-muted-foreground">{meta}</span>
                                        <Progress position={pos} duration={q.durationSec} />
                                        <EpisodeActions episode={q} compact className="mt-2" showQueue={false} />
                                    </div>
                                    <div className="flex flex-none flex-col gap-1 sm:flex-row">
                                        <Button variant="outline" size="icon" className="size-11" disabled={i === 0} onClick={() => moveInQueue(q.id, 'up')} aria-label={`Move ${q.title} up`}>
                                            <ArrowUp className="h-4 w-4" aria-hidden />
                                        </Button>
                                        <Button variant="outline" size="icon" className="size-11" disabled={i === queue.length - 1} onClick={() => moveInQueue(q.id, 'down')} aria-label={`Move ${q.title} down`}>
                                            <ArrowDown className="h-4 w-4" aria-hidden />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="size-11" onClick={() => removeFromQueue(q.id)} aria-label={`Remove ${q.title} from Up next`}>
                                            <X className="h-4 w-4" aria-hidden />
                                        </Button>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                )}

                {queue.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <Button variant="outline" className="min-h-11" onClick={clearQueue}>Clear Up next</Button>
                        <span className="text-sm text-muted-foreground">
                            {prefs.continuousPlay ? 'When an episode ends, the next one starts.' : 'Playback stops when an episode ends.'}{' '}
                            <Link href="/settings#playback" className="text-primary underline">Change this</Link>
                        </span>
                    </div>
                )}
            </section>

            <section aria-labelledby="new-heading" className="min-w-0 flex-[1_1_26rem]">
                <h2 id="new-heading" className="mb-3 mt-2 text-lg font-semibold">New from your shows</h2>
                {fresh.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        You’re caught up: nothing new in the last two weeks. <Link href="/" className="text-primary underline">Your shows</Link>
                    </p>
                ) : (
                    <ul className="flex flex-col gap-3">
                        {fresh.map((e) => (
                            <li key={e.id} className="rounded-xl border bg-card p-4">
                                <Link href={`/episodes/${e.id}`} className="-my-2.5 flex min-h-11 items-center font-semibold leading-snug hover:underline">{e.title}</Link>
                                <span className={`mt-0.5 block text-sm ${e.status === 'FAILED' ? 'text-destructive' : 'text-muted-foreground'}`} role={e.status === 'PROCESSING' ? 'status' : undefined}>
                                    {[e.feedTitle, formatDistanceToNow(new Date(e.publishedAt), { addSuffix: true }), statusWords(e.status)].filter(Boolean).join(' · ')}
                                </span>
                                <Progress position={e.positionSec} duration={e.durationSec} />
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <EpisodeActions episode={e} compact />
                                    {(e.status === 'DISCOVERED' || e.status === 'FAILED') && (
                                        <ProcessEpisodeButton episodeId={e.id} status={e.status} />
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Listening is unlimited on every plan. Transcribing uses your plan
                    {transcriptionLimit < 1000 ? ` (${planName}: ${transcriptionsLeft} of ${transcriptionLimit} left this month)` : ''}.
                </p>
            </section>
        </div>
    );
}
