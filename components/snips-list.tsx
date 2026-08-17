'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAudio } from '@/components/audio-provider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Play, Youtube, Trash2, Link2, Scissors } from 'lucide-react';
import { toggleSnipPublic, deleteSnip } from '@/actions/snip-actions';

type Snip = {
    id: string;
    startTime: number;
    endTime: number;
    content: string | null;
    note: string | null;
    title: string | null;
    isPublic: boolean;
    createdAt: string;
    episode: {
        id: string;
        title: string;
        audioUrl: string;
        youtubeId: string | null;
        feed: { title: string | null; image: string | null };
    };
};

function fmt(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function SnipsList({ snips: initial }: { snips: Snip[] }) {
    const [snips, setSnips] = useState(initial);
    const [busy, setBusy] = useState<string | null>(null);
    const { play, seek } = useAudio();

    if (snips.length === 0) {
        return (
            <div className="rounded-xl border-2 border-dashed py-16 text-center">
                <Scissors className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-4 font-medium">No highlights yet</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                    While listening, save a moment from any episode. Your highlights collect here, ready to revisit or share.
                </p>
            </div>
        );
    }

    function handlePlay(snip: Snip) {
        if (snip.episode.youtubeId) return;
        play({
            id: snip.episode.id,
            title: snip.episode.title,
            audioUrl: snip.episode.audioUrl,
            image: snip.episode.feed.image,
            feedTitle: snip.episode.feed.title || undefined,
        });
        // Let the source load before seeking to the highlight's start.
        setTimeout(() => seek(snip.startTime), 400);
    }

    async function handleToggle(snip: Snip, next: boolean) {
        setBusy(snip.id);
        // Optimistic — revert on failure.
        setSnips(prev => prev.map(s => (s.id === snip.id ? { ...s, isPublic: next } : s)));
        const res = await toggleSnipPublic(snip.id, next);
        setBusy(null);
        if (!res.success) {
            setSnips(prev => prev.map(s => (s.id === snip.id ? { ...s, isPublic: !next } : s)));
            toast.error('Could not update sharing');
            return;
        }
        if (next) {
            await copyLink(snip.id, 'Public link copied to clipboard');
        }
    }

    async function copyLink(snipId: string, msg = 'Link copied') {
        const url = `${window.location.origin}/snip/${snipId}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.success(msg);
        } catch {
            toast.error('Copy failed — the link is ' + url);
        }
    }

    async function handleDelete(snip: Snip) {
        setBusy(snip.id);
        const res = await deleteSnip(snip.id);
        setBusy(null);
        if (res.success) {
            setSnips(prev => prev.filter(s => s.id !== snip.id));
            toast.success('Highlight deleted');
        } else {
            toast.error('Delete failed');
        }
    }

    return (
        <ul className="space-y-4">
            {snips.map(snip => (
                <li key={snip.id} className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        {snip.episode.feed.image && (
                            <Image
                                src={snip.episode.feed.image}
                                alt=""
                                width={40}
                                height={40}
                                className="h-10 w-10 flex-none rounded-md object-cover"
                            />
                        )}
                        <div className="min-w-0 flex-1">
                            <Link href={`/episodes/${snip.episode.id}`} className="line-clamp-1 text-sm font-medium hover:underline">
                                {snip.episode.title}
                            </Link>
                            <p className="font-mono text-xs text-muted-foreground">
                                {snip.episode.feed.title} · {fmt(snip.startTime)}–{fmt(snip.endTime)}
                            </p>
                        </div>
                    </div>

                    {snip.content ? (
                        <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-foreground/90">“{snip.content}”</p>
                    ) : (
                        <p className="mt-3 text-sm italic text-muted-foreground">{snip.note || 'Saved moment'}</p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
                        {snip.episode.youtubeId ? (
                            <a
                                href={`https://www.youtube.com/watch?v=${snip.episode.youtubeId}&t=${Math.floor(snip.startTime)}s`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button variant="outline" size="sm" className="gap-1.5">
                                    <Youtube className="h-4 w-4" /> Watch
                                </Button>
                            </a>
                        ) : (
                            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handlePlay(snip)}>
                                <Play className="h-4 w-4" /> Play
                            </Button>
                        )}

                        <div className="ml-auto flex items-center gap-3">
                            {snip.isPublic && (
                                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => copyLink(snip.id)}>
                                    <Link2 className="h-4 w-4" /> Copy link
                                </Button>
                            )}
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Switch
                                    checked={snip.isPublic}
                                    disabled={busy === snip.id}
                                    onCheckedChange={next => handleToggle(snip, next)}
                                    aria-label="Share publicly"
                                />
                                Public
                            </label>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                disabled={busy === snip.id}
                                onClick={() => handleDelete(snip)}
                                aria-label="Delete highlight"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
