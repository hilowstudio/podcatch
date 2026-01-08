'use client';

import { searchLibrary, SearchResult } from '@/actions/search-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Search, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export function LibrarySearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            const hits = await searchLibrary(query);
            setResults(hits);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Ask your library... (e.g., 'What did they say about AI safety?')"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9 h-12"
                    />
                </div>
                <Button type="submit" size="lg" disabled={isLoading} className="h-12 w-full sm:w-auto">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask AI'}
                </Button>
            </form>

            <div className="space-y-4">
                {results.map((result) => (
                    <Card key={result.id} className="transition-all hover:border-primary/50">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <Link href={`/episodes/${result.episodeId}`} className="font-semibold text-primary hover:underline line-clamp-1">
                                        {result.episodeTitle}
                                    </Link>
                                    <div className="text-xs text-muted-foreground mb-1">
                                        {result.feedTitle} • {result.publishedAt.toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                    {Math.round(result.similarity * 100)}% Match
                                </div>
                            </div>

                            <p className="text-sm text-foreground/80 line-clamp-3">
                                "...{result.content}..."
                            </p>

                            <Link href={`/episodes/${result.episodeId}`}>
                                <Button variant="ghost" size="sm" className="gap-2 h-8 -ml-2 text-muted-foreground hover:text-primary">
                                    <PlayCircle className="h-4 w-4" />
                                    Go to Episode
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}

                {results.length === 0 && !isLoading && query && (
                    <div className="text-center text-muted-foreground py-8">
                        No results found. Try rephrasing your question.
                    </div>
                )}
            </div>
        </div>
    );
}
