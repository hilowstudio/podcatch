import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getPublicEpisodeWithInsight, getRelatedEpisodes } from '@/actions/episode-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, Lightbulb, ExternalLink, PlayCircle, FileText, ArrowLeft } from 'lucide-react';
import { ShareToolbar } from '@/components/share-toolbar';
import { TranscriptViewer } from '@/components/transcript-viewer';
import { ChapterList } from '@/components/chapter-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { EpisodePlayerButton } from '@/components/episode-player-button';
import { Metadata } from 'next';
import { auth } from '@/auth';

type PageProps = {
    params: { id: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const episode = await getPublicEpisodeWithInsight(id);

    if (!episode) {
        return {
            title: 'Episode Not Found',
        };
    }

    return {
        title: `${episode.title} - Podcatch Insight`,
        description: episode.insight?.summary || episode.description || 'AI-generated insights from this podcast episode.',
        openGraph: {
            images: episode.feed.image ? [episode.feed.image] : [],
        },
    };
}

export default async function SharedEpisodePage({ params }: PageProps) {
    const { id } = await params;
    const episode = await getPublicEpisodeWithInsight(id);

    if (!episode) {
        notFound();
    }

    const hasInsights = episode.insight && episode.status === 'COMPLETED';

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="font-bold text-xl flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                                P
                            </div>
                            Podcatch
                        </Link>
                    </div>
                    <Link href="/">
                        <Button variant="outline" size="sm">
                            Create Your Own Second Brain
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 pb-32">
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
                            {!episode.youtubeId && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Listen Preview</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <EpisodePlayerButton
                                            episode={{
                                                id: episode.id,
                                                title: episode.title,
                                                audioUrl: episode.audioUrl,
                                                image: episode.feed.image ?? undefined,
                                                feedTitle: episode.feed.title ?? undefined
                                            }}
                                            className="w-full"
                                        />
                                    </CardContent>
                                </Card>
                            )}


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
                                        <p className="text-xs text-muted-foreground">Original Feed: {episode.feed.title}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* CTA */}
                            <Card className="bg-primary/5 border-primary/20">
                                <CardHeader>
                                    <CardTitle className="text-lg">Want insights like this?</CardTitle>
                                    <CardDescription>
                                        Podcatch turns your favorite podcasts into a searchable knowledge base.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link href="/">
                                        <Button className="w-full">Get Started for Free</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Right Column: Content & Insights */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* YouTube Video Player */}
                        {episode.youtubeId && (
                            <div className="aspect-video w-full rounded-xl overflow-hidden shadow-2xl border bg-black">
                                <iframe
                                    src={`https://www.youtube.com/embed/${episode.youtubeId}`}
                                    title={episode.title}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        )}

                        {/* Title & Description */}
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight mb-4">{episode.title}</h1>
                            {episode.description && (
                                <p className="text-muted-foreground text-lg leading-relaxed mb-4">{episode.description}</p>
                            )}
                            <ShareToolbar
                                title={`${episode.title} - AI Insights by Podcatch`}
                                url={`https://www.podcatch.app/share/${episode.id}`}
                            />
                        </div>

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


                                {/* Chapters & Transcript */}
                                <Tabs defaultValue="chapters" className="w-full">
                                    <TabsList className="w-full justify-start mb-4">
                                        <TabsTrigger value="chapters">Chapters</TabsTrigger>
                                        <TabsTrigger value="transcript">Transcript (Preview)</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="chapters">
                                        <Card>
                                            <CardHeader>
                                                <div className="flex items-center gap-2">
                                                    <PlayCircle className="h-5 w-5 text-primary" />
                                                    <CardTitle>Chapters</CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <ChapterList
                                                    chapters={episode.insight.chapters as { start: string; title: string; reason?: string }[]}
                                                    episode={{
                                                        id: episode.id,
                                                        title: episode.title,
                                                        audioUrl: episode.audioUrl,
                                                        image: episode.feed.image ?? undefined,
                                                        feedTitle: episode.feed.title ?? undefined
                                                    }}
                                                />
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="transcript">
                                        <Card>
                                            <CardHeader>
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-5 w-5 text-primary" />
                                                    <CardTitle>Transcript</CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-0 sm:p-6">
                                                {/* We might want to limit transcript length for public view to encourage sign up? For now, full access. */}
                                                <TranscriptViewer transcript={episode.insight.transcript} className="max-h-[800px] border rounded-md" />
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </>
                        )}

                        {/* Recommendations */}
                        <div className="pt-8">
                            <h3 className="text-xl font-bold mb-4">More from {episode.feed.title}</h3>
                            <RelatedEpisodesList feedId={episode.feedId} currentEpisodeId={episode.id} />
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky CTA for unauthenticated users */}
            <StickyCTA />
        </div>
    );
}

async function RelatedEpisodesList({ feedId, currentEpisodeId }: { feedId: string, currentEpisodeId: string }) {
    const episodes = await getRelatedEpisodes(feedId, currentEpisodeId);

    if (episodes.length === 0) return null;

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {episodes.map((ep: any) => (
                <Link key={ep.id} href={`/share/${ep.id}`} className="block group">
                    <Card className="h-full hover:border-primary transition-colors">
                        <CardHeader className="p-4">
                            <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                                {ep.title}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {format(ep.publishedAt, 'MMM d, yyyy')}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            ))}
        </div>
    );
}

async function StickyCTA() {
    const session = await auth();
    if (session?.user) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t p-4 z-50">
            <div className="container mx-auto flex items-center justify-between gap-4">
                <div className="hidden sm:block">
                    <p className="font-bold">Unlock the full power of Podcatch</p>
                    <p className="text-sm text-muted-foreground">Save episodes, chat with AI, and more.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link href="/auth/signin" className="w-full sm:w-auto">
                        <Button variant="secondary" className="w-full">Log in</Button>
                    </Link>
                    <Link href="/" className="w-full sm:w-auto">
                        <Button className="w-full">Get Started Free</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
