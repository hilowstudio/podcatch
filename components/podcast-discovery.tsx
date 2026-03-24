'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, Check, Loader2 } from 'lucide-react';
import { searchItunesAction } from '@/actions/itunes';
import { addFeed } from '@/actions/feed-actions';
import { toast } from 'sonner';
import type { PodcastResult } from '@/lib/itunes';

export function PodcastDiscovery() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PodcastResult[]>([]);
    const [isSearching, startSearch] = useTransition();
    const [addedUrls, setAddedUrls] = useState<Set<string>>(new Set());
    const [addingUrl, setAddingUrl] = useState<string | null>(null);

    const handleSearch = () => {
        if (!query.trim()) return;
        startSearch(async () => {
            const podcasts = await searchItunesAction(query.trim());
            setResults(podcasts);
        });
    };

    const handleSubscribe = async (podcast: PodcastResult) => {
        setAddingUrl(podcast.feedUrl);
        try {
            const formData = new FormData();
            formData.set('url', podcast.feedUrl);
            const result = await addFeed(formData);
            if (result.success) {
                setAddedUrls(prev => new Set(prev).add(podcast.feedUrl));
                toast.success(`Subscribed to ${podcast.title}`);
            } else {
                if (result.error?.includes('already added')) {
                    setAddedUrls(prev => new Set(prev).add(podcast.feedUrl));
                }
                toast.error(result.error || 'Failed to subscribe');
            }
        } catch {
            toast.error('Failed to subscribe');
        } finally {
            setAddingUrl(null);
        }
    };

    return (
        <div className="space-y-6">
            <form
                onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
                className="flex gap-2"
            >
                <Input
                    placeholder="Search for podcasts..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1"
                />
                <Button type="submit" disabled={isSearching || !query.trim()}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    <span className="ml-2 hidden sm:inline">Search</span>
                </Button>
            </form>

            {results.length > 0 && (
                <div className="grid gap-3">
                    {results.map((podcast) => {
                        const isAdded = addedUrls.has(podcast.feedUrl);
                        const isAdding = addingUrl === podcast.feedUrl;

                        return (
                            <Card key={podcast.feedUrl}>
                                <CardContent className="flex items-center gap-4 p-4">
                                    {podcast.image && (
                                        <img
                                            src={podcast.image}
                                            alt={podcast.title}
                                            className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium truncate">{podcast.title}</h3>
                                        <p className="text-sm text-muted-foreground truncate">{podcast.author}</p>
                                    </div>
                                    <Button
                                        variant={isAdded ? "secondary" : "default"}
                                        size="sm"
                                        className="flex-shrink-0 gap-1.5"
                                        disabled={isAdded || isAdding}
                                        onClick={() => handleSubscribe(podcast)}
                                    >
                                        {isAdded ? (
                                            <><Check className="h-4 w-4" /> Added</>
                                        ) : isAdding ? (
                                            <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
                                        ) : (
                                            <><Plus className="h-4 w-4" /> Subscribe</>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {results.length === 0 && !isSearching && query && (
                <p className="text-center text-muted-foreground py-8">
                    No podcasts found. Try a different search term.
                </p>
            )}
        </div>
    );
}
