'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Pause, Play, X } from 'lucide-react';
import { useAudio, useAudioTime } from '@/components/audio-provider';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { NowPlaying, SpeedMenu, currentChapter, useNowPlayingExtras } from '@/components/now-playing';
import { clock } from '@/lib/player/format';

/**
 * The player bar that stays at the bottom of every page while something is
 * playing. On phones it's a compact strip above the bottom bar; tap it to open
 * the full player. On larger screens it carries the main controls inline.
 */
export function StickyPlayer() {
    const { currentEpisode, isPlaying, toggle, duration, seek, close, skipBack, skipForward, prefs, signedIn } = useAudio();
    const t = useAudioTime();
    const [open, setOpen] = useState(false);
    const extras = useNowPlayingExtras(currentEpisode?.id, signedIn);

    if (!currentEpisode) return null;

    const chapter = currentChapter(extras.chapters, t);
    const pct = duration ? Math.min(100, (t / duration) * 100) : 0;
    const subtitle = chapter?.title ?? currentEpisode.feedTitle ?? '';

    return (
        <>
            <div role="region" aria-label="Player" className="sticky-player fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
                <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-muted md:hidden">
                    <span className="block h-0.5 bg-primary" style={{ width: `${pct}%` }} />
                </span>
                <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2 sm:px-6 md:gap-4 md:py-3">
                    <button
                        onClick={() => setOpen(true)}
                        className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg text-left md:flex-[0_1_18rem]"
                        aria-label={`Open player: ${currentEpisode.title}${isPlaying ? ', playing' : ', paused'}`}
                    >
                        {currentEpisode.image ? (
                            <Image src={currentEpisode.image} alt="" width={44} height={44} className="size-11 flex-none rounded-md object-cover" />
                        ) : (
                            <span aria-hidden className="grid size-11 flex-none place-items-center rounded-md bg-secondary font-display text-xs text-muted-foreground">
                                {(currentEpisode.feedTitle || 'P').slice(0, 2).toUpperCase()}
                            </span>
                        )}
                        <span className="min-w-0 leading-tight">
                            <span className="block truncate text-sm font-semibold">{currentEpisode.title}</span>
                            <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
                        </span>
                    </button>

                    <div className="flex flex-none items-center gap-1">
                        <Button variant="ghost" className="hidden size-11 font-mono text-xs sm:inline-flex" onClick={skipBack} aria-label={`Back ${prefs.skipBackSec} seconds`}>
                            −{prefs.skipBackSec}
                        </Button>
                        <Button className="size-11 rounded-full" onClick={toggle} aria-label={isPlaying ? 'Pause' : 'Play'}>
                            {isPlaying ? <Pause className="h-5 w-5" aria-hidden /> : <Play className="ml-0.5 h-5 w-5" aria-hidden />}
                        </Button>
                        <Button variant="ghost" className="hidden size-11 font-mono text-xs sm:inline-flex" onClick={skipForward} aria-label={`Forward ${prefs.skipForwardSec} seconds`}>
                            +{prefs.skipForwardSec}
                        </Button>
                    </div>

                    <div className="hidden min-w-0 flex-1 items-center gap-3 font-mono text-xs tabular-nums text-muted-foreground md:flex">
                        <span>{clock(t)}</span>
                        <Slider value={[t]} max={duration || 1} step={1} onValueChange={(v) => seek(v[0])} thumbLabel="Position" valueText={`${clock(t)} of ${clock(duration)}`} />
                        <span>{clock(duration)}</span>
                    </div>

                    <div className="hidden flex-none items-center gap-2 md:flex">
                        <SpeedMenu compact />
                        <Button variant="outline" size="sm" className="min-h-11" onClick={() => setOpen(true)}>Open player</Button>
                        <Button variant="ghost" size="icon" className="size-11" onClick={close} aria-label="Stop and close the player">
                            <X className="h-4 w-4" aria-hidden />
                        </Button>
                    </div>
                </div>
            </div>
            <NowPlaying open={open} onOpenChange={setOpen} />
        </>
    );
}
