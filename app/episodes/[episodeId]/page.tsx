import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getEpisodeWithInsight } from '@/actions/episode-actions';
import { ClaudeSyncButton } from '@/components/claude-sync-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, ExternalLink, Lightbulb, MessageSquare, FileText, Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

type PageProps = {
    params: { episodeId: string };
};

export default async function EpisodePage({ params }: PageProps) {
    const { episodeId } = await params;

    const episode = await getEpisodeWithInsight(episodeId);

    if (!episode) {
        notFound();
    }

    const isProcessing = episode.status === 'PROCESSING' || episode.status === 'DISCOVERED';
    const isFailed = episode.status === 'FAILED';
    const hasInsights = episode.insight && episode.status === 'COMPLETED';

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 items-center px-4">
                    <Link
                        href={`/feeds/${episode.feedId}`}
                        className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Back to {episode.feed.title}
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Left Column: Player & Metadata */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-6">
                            {/* Podcast Art */}
                            {episode.feed.image && (
                                <div className="relative aspect-square w-full overflow-hidden rounded-lg shadow-xl">
                                    <Image src={episode.feed.image} alt={episode.title} fill className="object-cover" />
                                </div>
                            )}

                            {/* Audio Player */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Listen</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <audio controls className="w-full" preload="metadata">
                                        <source src={episode.audioUrl} type="audio/mpeg" />
                                        Your browser does not support the audio element.
                                    </audio>
                                </CardContent>
                            </Card>

                            {/* Metadata */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium">Published</p>
                                            <p className="text-muted-foreground">
                                                {format(episode.publishedAt, 'PPP')} ({formatDistanceToNow(episode.publishedAt, { addSuffix: true })})
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <Badge
                                            variant={episode.status === 'COMPLETED' ? 'default' : episode.status === 'FAILED' ? 'destructive' : 'secondary'}
                                        >
                                            {episode.status}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Right Column: Content & Insights */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Title & Description */}
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight mb-4">{episode.title}</h1>
                            {episode.description && (
                                <p className="text-muted-foreground text-lg leading-relaxed">{episode.description}</p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-4 pt-4">
                                <ClaudeSyncButton episodeId={episode.id} />
                            </div>
                        </div>

                        {/* Processing State */}
                        {isProcessing && (
                            <Card className="border-yellow-500/50 bg-yellow-500/5">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                                        <CardTitle>Processing Episode</CardTitle>
                                    </div>
                                    <CardDescription>
                                        We're transcribing this episode and extracting insights. This may take a few minutes depending on
                                        the episode length. Check back soon!
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        )}

                        {/* Failed State */}
                        {isFailed && (
                            <Card className="border-red-500/50 bg-red-500/5">
                                <CardHeader>
                                    <CardTitle className="text-red-600">Processing Failed</CardTitle>
                                    <CardDescription>
                                        We were unable to process this episode. This could be due to an invalid audio URL, network issues,
                                        or API failures. The episode will be retried automatically.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        )}

                        {/* AI Insights */}
                        {hasInsights && episode.insight && (
                            <>
                                {/* Summary */}
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-5 w-5 text-primary" />
                                            <CardTitle>AI Summary</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-lg leading-relaxed">{episode.insight.summary}</p>
                                    </CardContent>
                                </Card>

                                {/* Key Takeaways */}
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <Lightbulb className="h-5 w-5 text-primary" />
                                            <CardTitle>Key Takeaways</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-3">
                                            {(episode.insight.keyTakeaways as string[]).map((takeaway, index) => (
                                                <li key={index} className="flex gap-3">
                                                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                                                        {index + 1}
                                                    </span>
                                                    <span className="leading-relaxed">{takeaway}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>

                                {/* Links Mentioned */}
                                {episode.insight.links && (episode.insight.links as string[]).length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <ExternalLink className="h-5 w-5 text-primary" />
                                                <CardTitle>Links Mentioned</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {(episode.insight.links as string[]).map((link, index) => (
                                                    <li key={index}>
                                                        <a
                                                            href={link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 text-primary hover:underline"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                            {link}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Full Transcript */}
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-primary" />
                                            <CardTitle>Full Transcript</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="prose prose-neutral dark:prose-invert max-w-none">
                                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{episode.insight.transcript}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
