import { getFeeds } from '@/actions/feed-actions';
import { FeedGrid } from '@/components/feed-grid';
import { AddFeedDialog } from '@/components/add-feed-dialog';
import { Rss, Search, Mic, BookOpen } from 'lucide-react';

export async function FeedList({ userId }: { userId: string }) {
    const feeds = await getFeeds();

    if (feeds.length === 0) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
                <Rss className="h-20 w-20 text-primary/30 mb-6" />
                <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome to Podcatch</h2>
                <p className="text-muted-foreground max-w-md mb-8">
                    Add your first podcast to get started. We'll transcribe episodes and extract AI-powered insights automatically.
                </p>

                <AddFeedDialog />

                <div className="mt-12 w-full max-w-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-4">How it works</p>
                    <div className="grid gap-4 text-left">
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <Search className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium">1. Search or paste a feed URL</p>
                                <p className="text-xs text-muted-foreground">Find any podcast by name or paste an RSS/YouTube URL</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <Mic className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium">2. Process episodes with AI</p>
                                <p className="text-xs text-muted-foreground">Transcription, summaries, key takeaways, and entity extraction</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <BookOpen className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium">3. Build your knowledge base</p>
                                <p className="text-xs text-muted-foreground">Search, chat, and sync insights to your favorite tools</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <FeedGrid feeds={feeds} />;
}

