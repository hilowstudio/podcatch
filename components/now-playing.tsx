'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Moon, Pause, Play, Scissors, SkipBack, SkipForward, Volume2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAudio, useAudioTime } from '@/components/audio-provider';
import { createSnip } from '@/actions/snip-actions';
import { getNowPlayingExtras, type NowPlayingExtras } from '@/actions/player-actions';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { clock } from '@/lib/player/format';
import { SPEEDS, sleepLabel, type SleepMode } from '@/lib/player/logic';
import { cn } from '@/lib/utils';

const SLEEP_MINUTES = [5, 10, 15, 30, 45, 60];

export function useNowPlayingExtras(episodeId: string | undefined, signedIn: boolean) {
    const [extras, setExtras] = useState<NowPlayingExtras>({ chapters: [], lines: [] });
    useEffect(() => {
        let live = true;
        if (!episodeId || !signedIn) return;
        getNowPlayingExtras(episodeId).then((x) => { if (live) setExtras(x); }).catch(() => {});
        return () => { live = false; setExtras({ chapters: [], lines: [] }); };
    }, [episodeId, signedIn]);
    return extras;
}

/** The current chapter's title, for the mini player and the scrubber. */
export function currentChapter(chapters: NowPlayingExtras['chapters'], t: number) {
    let current: NowPlayingExtras['chapters'][number] | null = null;
    for (const c of chapters) if (c.start <= t) current = c;
    return current;
}

export function SpeedMenu({ compact = false }: { compact?: boolean }) {
    const { playbackRate, setPlaybackRate, currentEpisode, prefs, setShowSpeed, signedIn } = useAudio();
    const feedId = currentEpisode?.feedId;
    const showRate = feedId ? prefs.showSpeeds[feedId] : undefined;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size={compact ? 'sm' : 'default'} className="min-h-11 font-mono tabular-nums" aria-label={`Speed ${playbackRate} times${showRate ? ', set for this show' : ''}`}>
                    {playbackRate}×{showRate && !compact ? <span className="font-sans text-xs text-muted-foreground">this show</span> : null}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Speed</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={String(playbackRate)} onValueChange={(v) => {
                    const rate = parseFloat(v);
                    // A show with its own speed keeps it; others change the usual speed.
                    if (showRate && feedId) setShowSpeed(feedId, rate);
                    else setPlaybackRate(rate);
                }}>
                    {SPEEDS.map((s) => (
                        <DropdownMenuRadioItem key={s} value={String(s)} className="font-mono tabular-nums">{s}×</DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
                {signedIn && feedId && (
                    <>
                        <DropdownMenuSeparator />
                        {showRate ? (
                            <DropdownMenuItem onSelect={() => setShowSpeed(feedId, null)}>Stop using a speed for this show</DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onSelect={() => { setShowSpeed(feedId, playbackRate); toast(`${currentEpisode?.feedTitle ?? 'This show'} will play at ${playbackRate}×`); }}>
                                Always use {playbackRate}× for this show
                            </DropdownMenuItem>
                        )}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function SleepMenu() {
    const { sleep, setSleep } = useAudio();
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (sleep.mode.kind !== 'minutes') return;
        const t = setInterval(() => setNow(Date.now()), 15_000);
        return () => clearInterval(t);
    }, [sleep.mode.kind]);
    const value = sleep.mode.kind === 'minutes' ? `m${sleep.mode.minutes}` : sleep.mode.kind;
    const pick = (v: string) => {
        const mode: SleepMode = v === 'off' ? { kind: 'off' } : v === 'end-of-episode' ? { kind: 'end-of-episode' } : { kind: 'minutes', minutes: parseInt(v.slice(1), 10) };
        setNow(Date.now());
        setSleep(mode);
    };
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className={cn('min-h-11', sleep.mode.kind !== 'off' && 'border-primary')}>
                    <Moon className="h-4 w-4" aria-hidden /> {sleepLabel(sleep.mode, now, sleep.deadline)}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Stop playing</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={value} onValueChange={pick}>
                    <DropdownMenuRadioItem value="off">Off</DropdownMenuRadioItem>
                    {SLEEP_MINUTES.map((m) => <DropdownMenuRadioItem key={m} value={`m${m}`}>In {m} minutes</DropdownMenuRadioItem>)}
                    <DropdownMenuRadioItem value="end-of-episode">At the end of this episode</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function Scrubber({ chapters }: { chapters: NowPlayingExtras['chapters'] }) {
    const { duration, seek } = useAudio();
    const t = useAudioTime();
    const chapter = currentChapter(chapters, t);
    const max = duration || 1;
    return (
        <div>
            <div className="relative">
                <Slider
                    value={[t]}
                    max={max}
                    step={1}
                    onValueChange={(v) => seek(v[0])}
                    thumbLabel="Position"
                    valueText={`${clock(t)} of ${clock(duration)}${chapter ? `, ${chapter.title}` : ''}`}
                    className="py-3"
                />
                {duration > 0 && chapters.slice(1).map((c) => (
                    <span key={c.start} aria-hidden className="pointer-events-none absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-muted-foreground/60" style={{ left: `${(c.start / max) * 100}%` }} />
                ))}
            </div>
            <div className="flex justify-between gap-3 font-mono text-xs tabular-nums text-muted-foreground">
                <span>{clock(t)}</span>
                <span className="truncate font-sans">{chapter?.title ?? ''}</span>
                <span>−{clock(Math.max(0, duration - t))}</span>
            </div>
        </div>
    );
}

function TranscriptFollow({ lines }: { lines: NowPlayingExtras['lines'] }) {
    const { seek } = useAudio();
    const t = useAudioTime();
    const activeIndex = useMemo(() => {
        let idx = -1;
        for (let i = 0; i < lines.length; i++) if (lines[i].start <= t) idx = i;
        return idx;
    }, [lines, t]);
    const activeRef = useRef<HTMLButtonElement | null>(null);
    useEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        activeRef.current?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    }, [activeIndex]);
    return (
        <div className="max-h-[42vh] space-y-3 overflow-y-auto pr-1 font-serif leading-relaxed">
            {lines.map((l, i) => (
                <button
                    key={`${l.start}-${i}`}
                    ref={i === activeIndex ? activeRef : undefined}
                    onClick={() => seek(l.start)}
                    aria-current={i === activeIndex ? 'true' : undefined}
                    className={cn(
                        'block w-full rounded-md px-2 py-1 text-left transition-colors hover:bg-accent',
                        i === activeIndex ? 'text-xl text-foreground' : 'text-base text-muted-foreground',
                    )}
                >
                    <span className="mr-2 font-mono text-xs not-italic text-muted-foreground">{clock(l.start)}</span>
                    {l.text}
                </button>
            ))}
        </div>
    );
}

export function NowPlaying({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
    const { currentEpisode, isPlaying, toggle, seek, skipBack, skipForward, prefs, queue, play, removeFromQueue, close, signedIn, volume, setVolume } = useAudio();
    const t = useAudioTime();
    const extras = useNowPlayingExtras(currentEpisode?.id, signedIn);
    const [snipping, setSnipping] = useState(false);
    if (!currentEpisode) return null;

    const chapterIdx = extras.chapters.findLastIndex((c) => c.start <= t);
    const prevChapter = () => {
        const c = extras.chapters[chapterIdx];
        // Within 3 s of a chapter start, go to the one before it.
        const target = c && t - c.start > 3 ? c : extras.chapters[Math.max(0, chapterIdx - 1)];
        seek(target?.start ?? 0);
    };
    const nextChapter = () => {
        const c = extras.chapters[chapterIdx + 1];
        if (c) seek(c.start);
    };

    const snip = async () => {
        setSnipping(true);
        try {
            const r = await createSnip(currentEpisode.id, t);
            if (r.success) toast('Saved the last 30 seconds to Highlights');
            else toast.error('That didn’t save. Try again.');
        } catch {
            toast.error('That didn’t save. Try again.');
        } finally {
            setSnipping(false);
        }
    };

    const upNext = queue.filter((q) => q.id !== currentEpisode.id);
    const hasTranscript = extras.lines.length > 0;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" hideClose className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
                <div className="flex items-center justify-between px-2 pt-2">
                    <Button variant="ghost" size="icon" className="size-11" onClick={() => onOpenChange(false)} aria-label="Close player">
                        <ChevronDown className="h-5 w-5" aria-hidden />
                    </Button>
                    <SheetTitle className="text-sm font-medium text-muted-foreground">Now playing</SheetTitle>
                    <span className="size-11" />
                </div>
                <SheetDescription className="sr-only">Player controls, transcript, chapters and Up next</SheetDescription>

                <div className="flex items-center gap-4 px-6 pt-2">
                    {currentEpisode.image ? (
                        <Image src={currentEpisode.image} alt="" width={80} height={80} className="size-20 flex-none rounded-xl object-cover" />
                    ) : (
                        <span aria-hidden className="grid size-20 flex-none place-items-center rounded-xl bg-secondary font-display text-xl text-muted-foreground">
                            {(currentEpisode.feedTitle || 'P').slice(0, 2).toUpperCase()}
                        </span>
                    )}
                    <div className="min-w-0">
                        <p className="truncate text-sm text-muted-foreground">{currentEpisode.feedTitle}</p>
                        <Link href={`/episodes/${currentEpisode.id}`} onClick={() => onOpenChange(false)} className="font-display text-lg font-bold leading-snug hover:underline">
                            {currentEpisode.title}
                        </Link>
                    </div>
                </div>

                <div className="px-6 pt-5">
                    <Scrubber chapters={extras.chapters} />
                </div>

                <div className="flex items-center justify-between px-5 py-4">
                    <Button variant="ghost" size="icon" className="size-11" onClick={prevChapter} aria-label={extras.chapters.length ? 'Previous chapter' : 'Back to the start'}>
                        <SkipBack className="h-5 w-5" aria-hidden />
                    </Button>
                    <Button variant="secondary" className="size-14 rounded-full font-mono" onClick={skipBack} aria-label={`Back ${prefs.skipBackSec} seconds`}>
                        −{prefs.skipBackSec}
                    </Button>
                    <Button className="size-[4.5rem] rounded-full" onClick={toggle} aria-label={isPlaying ? 'Pause' : 'Play'}>
                        {isPlaying ? <Pause className="size-7" aria-hidden /> : <Play className="ml-1 size-7" aria-hidden />}
                    </Button>
                    <Button variant="secondary" className="size-14 rounded-full font-mono" onClick={skipForward} aria-label={`Forward ${prefs.skipForwardSec} seconds`}>
                        +{prefs.skipForwardSec}
                    </Button>
                    <Button variant="ghost" size="icon" className="size-11" onClick={nextChapter} disabled={!extras.chapters[chapterIdx + 1]} aria-label="Next chapter">
                        <SkipForward className="h-5 w-5" aria-hidden />
                    </Button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 px-6 pb-4">
                    <SpeedMenu />
                    <SleepMenu />
                    {signedIn && (
                        <Button variant="outline" className="min-h-11" onClick={snip} disabled={snipping}>
                            <Scissors className="h-4 w-4" aria-hidden /> {snipping ? 'Saving' : 'Snip 30 s'}
                        </Button>
                    )}
                </div>

                <div className="hidden items-center gap-3 px-6 pb-4 md:flex">
                    <Volume2 className="h-4 w-4 flex-none text-muted-foreground" aria-hidden />
                    <Slider value={[volume * 100]} max={100} step={1} onValueChange={(v) => setVolume(v[0] / 100)} thumbLabel="Volume" valueText={`${Math.round(volume * 100)} percent`} />
                </div>

                <Tabs defaultValue={hasTranscript ? 'transcript' : 'up-next'} className="flex-1 px-6 pb-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="transcript" className="min-h-10">Transcript</TabsTrigger>
                        <TabsTrigger value="chapters" className="min-h-10">Chapters</TabsTrigger>
                        <TabsTrigger value="up-next" className="min-h-10">Up next{upNext.length ? ` ${upNext.length}` : ''}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="transcript" className="pt-3">
                        {hasTranscript ? (
                            <>
                                <TranscriptFollow lines={extras.lines} />
                                <p className="mt-3 text-xs text-muted-foreground">The transcript is machine-made. Play the moment before you quote it.</p>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                This episode isn’t transcribed. <Link href={`/episodes/${currentEpisode.id}`} onClick={() => onOpenChange(false)} className="text-primary underline">Open the episode</Link> to transcribe it.
                            </p>
                        )}
                    </TabsContent>
                    <TabsContent value="chapters" className="pt-3">
                        {extras.chapters.length ? (
                            <ol className="space-y-1">
                                {extras.chapters.map((c, i) => (
                                    <li key={c.start}>
                                        <button onClick={() => seek(c.start)} aria-current={i === chapterIdx ? 'true' : undefined}
                                            className={cn('flex min-h-11 w-full items-center gap-3 rounded-md px-2 text-left hover:bg-accent', i === chapterIdx && 'bg-accent font-semibold')}>
                                            <span className="font-mono text-xs tabular-nums text-muted-foreground">{clock(c.start)}</span>
                                            <span>{c.title}</span>
                                        </button>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-sm text-muted-foreground">No chapters for this episode.</p>
                        )}
                    </TabsContent>
                    <TabsContent value="up-next" className="pt-3">
                        {upNext.length ? (
                            <ol className="divide-y">
                                {upNext.map((q) => (
                                    <li key={q.id} className="flex items-center gap-2 py-2">
                                        <span className="min-w-0 flex-1 text-sm leading-snug">{q.title}<span className="block text-xs text-muted-foreground">{q.feedTitle}</span></span>
                                        <Button size="icon" variant="secondary" className="size-11" onClick={() => play({ ...q })} aria-label={`Play ${q.title}`}>
                                            <Play className="h-4 w-4" aria-hidden />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="size-11" onClick={() => removeFromQueue(q.id)} aria-label={`Remove ${q.title} from Up next`}>
                                            <X className="h-4 w-4" aria-hidden />
                                        </Button>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-sm text-muted-foreground">Nothing else is queued. <Link href="/up-next" onClick={() => onOpenChange(false)} className="text-primary underline">Up next</Link></p>
                        )}
                    </TabsContent>
                </Tabs>

                <div className="border-t px-6 py-3">
                    <Button variant="ghost" className="min-h-11 text-muted-foreground" onClick={() => { close(); onOpenChange(false); }}>
                        Stop and close the player
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
