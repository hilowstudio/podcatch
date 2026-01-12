import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getEpisodeWithInsight } from '@/actions/episode-actions';
import { ClaudeSyncButton } from '@/components/claude-sync-button';
import { MarkdownCopyButton } from '@/components/markdown-copy-button';
import { ProcessEpisodeButton } from '@/components/process-episode-button';
import { AddToCollectionButton } from '@/components/add-to-collection-button';
import { EpisodePlayerButton } from '@/components/episode-player-button';
import { EpisodeStatusPoller } from '@/components/episode-status-poller';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, ArrowLeft, Calendar, ExternalLink, Lightbulb, MessageSquare, FileText, Loader2, Sparkles, Share2, Scissors } from 'lucide-react';
import { TranscriptViewer } from '@/components/transcript-viewer';
import { ChapterList } from '@/components/chapter-list';
import { ClipEditor } from '@/components/clip-editor';
import { CustomPromptRunner } from '@/components/custom-prompt-runner';
import { AutoSeek } from '@/components/auto-seek';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow, format } from 'date-fns';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type PageProps = {
    params: { episodeId: string };
};

export default async function EpisodePage({ params }: PageProps) {
    const { episodeId } = await params;

    const [episode, session] = await Promise.all([
        getEpisodeWithInsight(episodeId),
        auth()
    ]);

    if (!episode) {
        notFound();
    }

    // Check if user has Claude configured
    let isClaudeConfigured = false;
    if (session?.user?.id) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { claudeApiKey: true, claudeProjectId: true }
        });
        isClaudeConfigured = !!(user?.claudeApiKey && user?.claudeProjectId);
    }

    const isProcessing = episode.status === 'PROCESSING';
    const isDiscovered = episode.status === 'DISCOVERED';
    const isFailed = episode.status === 'FAILED';
    const hasInsights = episode.insight && episode.status === 'COMPLETED';

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            {/* Auto-seek from URL timestamp param */}
            {episode.audioUrl && (
                <AutoSeek
                    episode={{
                        id: episode.id,
                        title: episode.title,
                        audioUrl: episode.audioUrl,
                        image: episode.feed.image ?? undefined,
                        feedTitle: episode.feed.title ?? undefined
                    }}
                />
            )}
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

                            {/* Audio Player (Only for RSS) */}
                            {!episode.youtubeId && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Listen</CardTitle>
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
                                        <p className="text-xs text-muted-foreground mt-2 text-center">
                                            Use the player bar at the bottom to control playback
                                        </p>
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
                        {/* YouTube Video Player - Top of Main Content */}
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
                                <p className="text-muted-foreground text-lg leading-relaxed">{episode.description}</p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-4 pt-4">
                                {isDiscovered && (
                                    <ProcessEpisodeButton episodeId={episode.id} status={episode.status} />
                                )}
                                <AddToCollectionButton episodeId={episode.id} />
                                <ClaudeSyncButton episodeId={episode.id} isConfigured={isClaudeConfigured} />
                                {hasInsights && (
                                    <MarkdownCopyButton
                                        markdown={`# ${episode.title}
                                        
**Summary**
${episode.insight?.summary}

**Key Takeaways**
${(episode.insight?.keyTakeaways as string[]).map(t => `- ${t}`).join('\n')}

**Links**
${(episode.insight?.links as string[]).map(l => `- ${l}`).join('\n')}

**Transcript**
${episode.insight?.transcript}
                                        `}
                                        title={episode.title}
                                    />
                                )}
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

                        {/* Discovered (Ready) State - Optional Hint */}
                        {isDiscovered && !isProcessing && (
                            <Card className="border-blue-500/50 bg-blue-500/5">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <PlayCircle className="h-5 w-5 text-blue-600" />
                                        <CardTitle>Ready to Process</CardTitle>
                                    </div>
                                    <CardDescription>
                                        This episode has been discovered. Click "Process Episode" above to generate a transcript and AI insights.
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
                                        or API failures.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        )}

                        {/* AI Insights (Summary, Key Takeaways, etc.) */}
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

                                {/* Creator Studio */}
                                {(episode.insight.socialContent as any) && (
                                    <Card className="border-purple-500/20 bg-purple-500/5">
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="h-5 w-5 text-purple-600" />
                                                <CardTitle>Creator Studio</CardTitle>
                                            </div>
                                            <CardDescription>AI-generated assets ready for social sharing</CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid gap-4">
                                            {(episode.insight.socialContent as any).tweet && (
                                                <div className="rounded-lg border bg-background p-4">
                                                    <h4 className="flex items-center gap-2 font-semibold mb-2 text-sm text-sky-500">
                                                        <Share2 className="h-4 w-4" /> Viral Tweet
                                                    </h4>
                                                    <p className="whitespace-pre-wrap text-sm">{(episode.insight.socialContent as any).tweet}</p>
                                                </div>
                                            )}
                                            {(episode.insight.socialContent as any).linkedin && (
                                                <div className="rounded-lg border bg-background p-4">
                                                    <h4 className="flex items-center gap-2 font-semibold mb-2 text-sm text-blue-700">
                                                        <Share2 className="h-4 w-4" /> LinkedIn Post
                                                    </h4>
                                                    <p className="whitespace-pre-wrap text-sm">{(episode.insight.socialContent as any).linkedin}</p>
                                                </div>
                                            )}
                                            {(episode.insight.socialContent as any).blogTitle && (
                                                <div className="rounded-lg border bg-background p-4">
                                                    <h4 className="flex items-center gap-2 font-semibold mb-2 text-sm text-orange-600">
                                                        <FileText className="h-4 w-4" /> Blog Title Idea
                                                    </h4>
                                                    <p className="font-medium">{(episode.insight.socialContent as any).blogTitle}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}


                                {/* Mentions: Knowledge Graph */}
                                {episode.entities && episode.entities.length > 0 && (
                                    <Card className="border-indigo-500/20 bg-indigo-500/5">
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <div className="h-5 w-5 bg-indigo-600 rounded-full flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-white">#</span>
                                                </div>
                                                <CardTitle>Mentions</CardTitle>
                                            </div>
                                            <CardDescription>People, books, and concepts discussed in this episode</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {/* People */}
                                                {episode.entities.filter(e => e.type === 'PERSON').length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                                                            People
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {episode.entities.filter(e => e.type === 'PERSON').map(person => (
                                                                <Link href={`/search?q=${encodeURIComponent(person.name)}`} key={person.id}>
                                                                    <Badge variant="outline" className="hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer pl-1 gap-1.5 py-1">
                                                                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                                                            {/* Placeholder Avatar */}
                                                                            <span className="text-[10px] font-bold">{person.name[0]}</span>
                                                                        </div>
                                                                        {person.name}
                                                                    </Badge>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Books */}
                                                {episode.entities.filter(e => e.type === 'BOOK').length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                                                            Books
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {episode.entities.filter(e => e.type === 'BOOK').map(book => (
                                                                <Link href={`/search?q=${encodeURIComponent(book.name)}`} key={book.id}>
                                                                    <Badge variant="secondary" className="hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer gap-1 py-1">
                                                                        📚 {book.name}
                                                                    </Badge>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Concepts */}
                                                {episode.entities.filter(e => e.type === 'CONCEPT').length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                                                            Concepts
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {episode.entities.filter(e => e.type === 'CONCEPT').map(concept => (
                                                                <Link href={`/search?q=${encodeURIComponent(concept.name)}`} key={concept.id}>
                                                                    <Badge variant="outline" className="hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer border-dashed">
                                                                        💡 {concept.name}
                                                                    </Badge>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Chapters */}
                                {/* Tabs Interface */}
                                <Tabs defaultValue="transcript" className="w-full">
                                    <TabsList className="w-full justify-start mb-4">
                                        <TabsTrigger value="transcript">Transcript</TabsTrigger>
                                        <TabsTrigger value="chapters">Chapters</TabsTrigger>
                                        <TabsTrigger value="studio">Studio <Badge variant="secondary" className="ml-2 text-[10px]">New</Badge></TabsTrigger>
                                    </TabsList>

                                    {/* Transcript Tab */}
                                    <TabsContent value="transcript">
                                        <Card>
                                            <CardHeader>
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-5 w-5 text-primary" />
                                                    <CardTitle>Full Transcript</CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-0 sm:p-6">
                                                <TranscriptViewer transcript={episode.insight.transcript} className="max-h-[800px] border rounded-md" />
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* Chapters Tab */}
                                    <TabsContent value="chapters">
                                        <Card>
                                            <CardHeader>
                                                <div className="flex items-center gap-2">
                                                    <PlayCircle className="h-5 w-5 text-primary" />
                                                    <CardTitle>Chapters</CardTitle>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Click a chapter to jump to that section
                                                </p>
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

                                    {/* Studio Tab */}
                                    <TabsContent value="studio" className="space-y-6">
                                        <div className="grid gap-6">
                                            {episode.audioUrl && (
                                                <section>
                                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                                        <Scissors className="h-4 w-4" /> Clip Editor
                                                    </h3>
                                                    <ClipEditor episodeId={episode.id} audioUrl={episode.audioUrl} />
                                                </section>
                                            )}

                                            <section>
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                                        <Sparkles className="h-4 w-4" /> Custom Prompts
                                                    </h3>
                                                    <Link href="/settings/prompts">
                                                        <Badge variant="outline" className="hover:bg-muted cursor-pointer">Manage Prompts</Badge>
                                                    </Link>
                                                </div>
                                                <CustomPromptRunner episodeId={episode.id} />
                                            </section>
                                        </div>
                                    </TabsContent>
                                </Tabs>


                            </>
                        )}
                    </div>
                </div>
            </main>
            <EpisodeStatusPoller episodeId={episode.id} initialStatus={episode.status} />
        </div>
    );
}
