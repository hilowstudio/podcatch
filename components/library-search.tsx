'use client';

import { searchLibrary, SearchResult } from '@/actions/search-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, PlayCircle, Clock, Lightbulb, SearchX } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const SUGGESTED_QUERIES = [
    'What are the key leadership lessons?',
    'How to build better habits?',
    'What books were recommended?',
    'Explain the main argument',
    'What actionable advice was given?',
    'Who were the most mentioned people?',
];

function formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function getEpisodeUrl(result: SearchResult): string {
    const baseUrl = `/episodes/${result.episodeId}`;
    if (result.timestamp !== undefined) {
        return `${baseUrl}?t=${result.timestamp}`;
    }
    return baseUrl;
}

function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text;
    const words = query.trim().split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) return text;

    const pattern = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(pattern);

    return parts.map((part, i) =>
        pattern.test(part) ? (
            <mark key={i} className="bg-primary/20 text-foreground rounded-sm px-0.5">{part}</mark>
        ) : (
            part
        )
    );
}

export function LibrarySearch() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (searchQuery?: string) => {
        const q = searchQuery ?? query;
        if (!q.trim()) return;

        if (searchQuery) setQuery(searchQuery);
        setIsLoading(true);
        setHasSearched(true);
        try {
            const hits = await searchLibrary(q);
            setResults(hits);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch();
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        inputMode="search"
                        placeholder="Ask your library anything..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9 h-12"
                        aria-label="Search your podcast library"
                    />
                </div>
                <Button type="submit" size="lg" disabled={isLoading} className="h-12 w-full sm:w-auto">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
            </form>

            {/* Suggested searches - show when no search has been performed */}
            {!hasSearched && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Lightbulb className="h-4 w-4" />
                        <span>Try asking:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {SUGGESTED_QUERIES.map((suggestion) => (
                            <button
                                key={suggestion}
                                onClick={() => handleSearch(suggestion)}
                                className="text-sm px-3 py-1.5 rounded-full border bg-muted/50 hover:bg-muted hover:border-primary/30 transition-colors text-left"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Results */}
            <div className="space-y-4">
                {results.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                        {results.length} result{results.length !== 1 ? 's' : ''} found
                    </p>
                )}

                {results.map((result) => (
                    <Card key={result.id} className="transition-all hover:border-primary/50">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <Link href={getEpisodeUrl(result)} className="font-semibold text-primary hover:underline line-clamp-1">
                                        {result.episodeTitle}
                                    </Link>
                                    <div className="text-xs text-muted-foreground mb-1">
                                        {result.feedTitle} &middot; {result.publishedAt.toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {result.timestamp !== undefined && (
                                        <Badge variant="secondary" className="text-xs font-mono gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatTimestamp(result.timestamp)}
                                        </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs font-mono">
                                        {Math.round(result.similarity * 100)}%
                                    </Badge>
                                </div>
                            </div>

                            <p className="text-sm text-foreground/80 line-clamp-3">
                                &ldquo;...{highlightMatch(result.content, query)}...&rdquo;
                            </p>

                            <Link href={getEpisodeUrl(result)}>
                                <Button variant="ghost" size="sm" className="gap-2 h-8 -ml-2 text-muted-foreground hover:text-primary">
                                    <PlayCircle className="h-4 w-4" />
                                    {result.timestamp !== undefined ? `Jump to ${formatTimestamp(result.timestamp)}` : 'Go to Episode'}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}

                {/* Empty state after search */}
                {results.length === 0 && hasSearched && !isLoading && (
                    <div className="text-center py-12 space-y-3">
                        <SearchX className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                        <div>
                            <p className="font-medium">No results found</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Try different keywords or a broader question. Results come from your processed episodes only.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
