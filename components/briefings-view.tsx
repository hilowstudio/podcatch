'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAudio } from '@/components/audio-provider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Play, Rss, Copy, Headphones, Crown, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { setBriefingEnabled, regenerateFeedToken, generateBriefingNow } from '@/actions/briefing-actions';

type Briefing = { id: string; audioUrl: string; durationSec: number; createdAt: string };

// In-app playback goes through the same-origin audio proxy (like episodes and
// snips do): R2's custom domain sends no CORS headers, so a direct cross-origin
// request yields an opaque response the PWA service worker's audio cache can't
// handle. The RSS enclosure still uses the direct R2 URL, so podcast apps
// download straight from R2 (zero egress) — only in-app plays use the proxy.
function proxied(url: string): string {
    return `/api/audio-proxy?url=${encodeURIComponent(url)}`;
}

function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
function fmtDuration(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
    isPro: boolean;
    initialEnabled: boolean;
    initialRssUrl: string | null;
    briefings: Briefing[];
}

export function BriefingsView({ isPro, initialEnabled, initialRssUrl, briefings }: Props) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const [rssUrl, setRssUrl] = useState(initialRssUrl);
    const [busy, setBusy] = useState(false);
    const [generating, setGenerating] = useState(false);
    const { play } = useAudio();
    const router = useRouter();

    if (!isPro) {
        return (
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-8 text-center">
                <Crown className="mx-auto h-10 w-10 text-primary" />
                <h2 className="mt-3 text-lg font-semibold">Audio Briefings are a Pro feature</h2>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                    Get a narrated weekly recap of your podcast week, delivered to a private podcast feed you can add to any app.
                </p>
                <Link href="/pricing" className="mt-4 inline-block">
                    <Button>Upgrade to Pro</Button>
                </Link>
            </div>
        );
    }

    async function toggle(next: boolean) {
        setBusy(true);
        setEnabled(next); // optimistic
        const res = await setBriefingEnabled(next);
        setBusy(false);
        if (!res.success) {
            setEnabled(!next);
            toast.error(res.error);
            return;
        }
        if (res.rssUrl) setRssUrl(res.rssUrl);
        toast.success(next ? 'Weekly audio briefing on' : 'Weekly audio briefing off');
    }

    async function copyRss() {
        if (!rssUrl) return;
        try {
            await navigator.clipboard.writeText(rssUrl);
            toast.success('Private feed URL copied');
        } catch {
            toast.error('Copy failed');
        }
    }

    async function generateNow() {
        setGenerating(true);
        const res = await generateBriefingNow();
        setGenerating(false);
        if (res.success) {
            toast.success('Briefing generated');
            router.refresh();
        } else {
            toast.error(res.error);
        }
    }

    async function regenerate() {
        setBusy(true);
        const res = await regenerateFeedToken();
        setBusy(false);
        if (res.success) {
            setRssUrl(res.rssUrl);
            toast.success('Feed URL regenerated — the old one no longer works');
        } else {
            toast.error(res.error);
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between gap-4 rounded-xl border p-5">
                <div className="space-y-1">
                    <h2 className="font-semibold">Weekly audio briefing</h2>
                    <p className="max-w-md text-sm text-muted-foreground">
                        Every Sunday we narrate a short recap of your week&rsquo;s episodes and saved highlights.
                    </p>
                </div>
                <Switch checked={enabled} disabled={busy} onCheckedChange={toggle} aria-label="Enable weekly audio briefing" />
            </div>

            {enabled && rssUrl && (
                <div className="rounded-xl border bg-card p-5">
                    <div className="flex items-center gap-2">
                        <Rss className="h-4 w-4 text-primary" />
                        <h3 className="font-medium">Your private podcast feed</h3>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add this URL to Apple Podcasts, Overcast, or any podcast app to get briefings where you already listen.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 font-mono text-xs">{rssUrl}</code>
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={copyRss}>
                            <Copy className="h-4 w-4" /> Copy
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={regenerate} disabled={busy}>
                            <RefreshCw className="h-4 w-4" /> Reset
                        </Button>
                    </div>
                </div>
            )}

            <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-medium">Past briefings</h3>
                    <Button size="sm" className="gap-1.5" onClick={generateNow} disabled={generating}>
                        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {generating ? 'Generating…' : 'Generate now'}
                    </Button>
                </div>
                {generating && (
                    <p className="mb-3 text-xs text-muted-foreground">
                        Drafting and narrating your briefing — this takes up to a minute. You can leave this page.
                    </p>
                )}
                {briefings.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed py-12 text-center">
                        <Headphones className="mx-auto h-10 w-10 text-muted-foreground/40" />
                        <p className="mt-3 text-sm text-muted-foreground">
                            {enabled
                                ? 'Your first briefing arrives this Sunday.'
                                : 'Turn on weekly briefings to start getting them.'}
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {briefings.map(b => (
                            <li key={b.id} className="flex items-center gap-4 rounded-xl border bg-card p-4">
                                <button
                                    onClick={() => play({ id: b.id, title: `Weekly Briefing — ${fmtDate(b.createdAt)}`, audioUrl: proxied(b.audioUrl), feedTitle: 'Podcatch Briefing' })}
                                    aria-label="Play briefing"
                                    className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition-transform hover:scale-105 active:scale-95"
                                >
                                    <Play className="h-5 w-5 translate-x-[1px]" />
                                </button>
                                <div className="min-w-0">
                                    <p className="font-medium">Weekly Briefing</p>
                                    <p className="text-sm text-muted-foreground">
                                        {fmtDate(b.createdAt)} · {fmtDuration(b.durationSec)}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
