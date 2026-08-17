'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

function getProxiedAudioUrl(url: string): string {
    try {
        const audioOrigin = new URL(url).origin;
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
        if (audioOrigin !== currentOrigin) {
            return `/api/audio-proxy?url=${encodeURIComponent(url)}`;
        }
    } catch {
        return `/api/audio-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
}

function fmt(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

/**
 * A self-contained player bounded to a single snip's [start, end] range. Used on
 * the public share page, so it never touches the global AudioProvider. Playback
 * starts at `start`, and the `timeupdate` handler pauses and resets once `end` is
 * reached — the audio-proxy serves Range requests, so seeking into a long file
 * doesn't download the whole thing.
 */
export function SnipPlayer({ audioUrl, start, end }: { audioUrl: string; start: number; end: number }) {
    const ref = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const a = ref.current;
        if (!a) return;

        const onTime = () => {
            if (a.currentTime >= end) {
                a.pause();
                a.currentTime = start;
                setPlaying(false);
                setProgress(0);
                return;
            }
            const span = end - start;
            setProgress(span > 0 ? Math.max(0, Math.min(1, (a.currentTime - start) / span)) : 0);
        };
        const onPlay = () => setPlaying(true);
        const onPause = () => setPlaying(false);

        a.addEventListener('timeupdate', onTime);
        a.addEventListener('play', onPlay);
        a.addEventListener('pause', onPause);
        return () => {
            a.removeEventListener('timeupdate', onTime);
            a.removeEventListener('play', onPlay);
            a.removeEventListener('pause', onPause);
        };
    }, [start, end]);

    function toggle() {
        const a = ref.current;
        if (!a) return;
        if (playing) {
            a.pause();
        } else {
            if (a.currentTime < start || a.currentTime >= end) a.currentTime = start;
            a.play().catch(err => console.error('Snip playback failed:', err));
        }
    }

    return (
        <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
            <audio ref={ref} src={getProxiedAudioUrl(audioUrl)} preload="metadata" />
            <button
                onClick={toggle}
                aria-label={playing ? 'Pause highlight' : 'Play highlight'}
                className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition-transform hover:scale-105 active:scale-95"
            >
                {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-[1px]" />}
            </button>
            <div className="min-w-0 flex-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full rounded-full bg-primary transition-[width] duration-150"
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-xs text-muted-foreground">
                    <span>{fmt(progress * (end - start))}</span>
                    <span>{fmt(end - start)}</span>
                </div>
            </div>
        </div>
    );
}
