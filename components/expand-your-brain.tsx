'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Plus, Check, Loader2, Crown } from 'lucide-react';
import { getDiscoverySuggestions } from '@/actions/discovery-actions';
import { addFeed } from '@/actions/feed-actions';

type Result = Awaited<ReturnType<typeof getDiscoverySuggestions>>;
type Suggestion = Result['suggestions'][number];

export function ExpandYourBrain() {
    const [state, setState] = useState<Result | null>(null);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState<Set<string>>(new Set());
    const [adding, setAdding] = useState<string | null>(null);

    useEffect(() => {
        let live = true;
        getDiscoverySuggestions()
            .then(r => { if (live) { setState(r); setLoading(false); } })
            .catch(() => { if (live) setLoading(false); });
        return () => { live = false; };
    }, []);

    async function subscribe(s: Suggestion) {
        setAdding(s.feedUrl);
        try {
            const fd = new FormData();
            fd.set('url', s.feedUrl);
            const res = await addFeed(fd);
            if (res.success || res.error?.includes('already added')) {
                setAdded(prev => new Set(prev).add(s.feedUrl));
                toast.success(`Added ${s.title} to your library`);
            } else {
                toast.error(res.error || 'Could not add podcast');
            }
        } catch {
            toast.error('Could not add podcast');
        } finally {
            setAdding(null);
        }
    }

    const Header = (
        <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Expand your brain</h2>
            <span className="hidden text-sm text-muted-foreground sm:inline">
                · new shows to add, matched to what your library is about
            </span>
        </div>
    );

    if (loading) {
        return (
            <section>
                {Header}
                <div className="grid gap-3 sm:grid-cols-2">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className="h-[92px] animate-pulse rounded-xl border bg-muted/40" />
                    ))}
                </div>
            </section>
        );
    }

    if (!state) return null;

    if (state.locked) {
        return (
            <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
                <Crown className="mx-auto h-8 w-8 text-primary" />
                <h2 className="mt-2 font-semibold">Discover new shows for your brain</h2>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                    On Basic and Pro, we suggest podcasts you&rsquo;ve never heard of, based on the topics your library is built around.
                </p>
                <Link href="/pricing" className="mt-3 inline-block">
                    <Button size="sm">Upgrade</Button>
                </Link>
            </section>
        );
    }

    if (state.suggestions.length === 0) {
        return (
            <section>
                {Header}
                <div className="rounded-xl border-2 border-dashed py-10 text-center">
                    <p className="text-sm text-muted-foreground">
                        {state.topics.length === 0
                            ? 'Process a few episodes and we’ll suggest new shows based on what your library is about.'
                            : 'No new shows to suggest right now — you already follow the closest matches. Nice.'}
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section>
            {Header}
            <div className="grid gap-3 sm:grid-cols-2">
                {state.suggestions.map(s => {
                    const isAdded = added.has(s.feedUrl);
                    const isAdding = adding === s.feedUrl;
                    return (
                        <Card key={s.feedUrl} className="overflow-hidden">
                            <CardContent className="flex items-center gap-3 p-3">
                                {s.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={s.image} alt="" className="h-16 w-16 flex-none rounded-lg object-cover" />
                                ) : (
                                    <div className="h-16 w-16 flex-none rounded-lg bg-muted" />
                                )}
                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate font-medium">{s.title}</h3>
                                    <p className="truncate text-xs text-muted-foreground">{s.author}</p>
                                    <Badge variant="secondary" className="mt-1 max-w-full truncate text-[11px] font-normal">
                                        Because you follow {s.reason}
                                    </Badge>
                                </div>
                                <Button
                                    variant={isAdded ? 'secondary' : 'default'}
                                    size="sm"
                                    className="flex-none gap-1.5"
                                    disabled={isAdded || isAdding}
                                    onClick={() => subscribe(s)}
                                >
                                    {isAdded ? <><Check className="h-4 w-4" /> Added</>
                                        : isAdding ? <><Loader2 className="h-4 w-4 animate-spin" /></>
                                            : <><Plus className="h-4 w-4" /> Add</>}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </section>
    );
}
