import { notFound } from 'next/navigation';
import { getCollection } from '@/actions/collection-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Sparkles, PlayCircle, Trash2, Calendar, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DeleteCollectionButton } from '@/components/delete-collection-button';
import { SynthesizeButton } from '@/components/synthesize-button';

interface PageProps {
    params: { id: string };
}

export default async function CollectionDetailPage({ params }: PageProps) {
    const { id } = await params;
    const collection = await getCollection(id);

    if (!collection) {
        return notFound();
    }

    const synthesis = collection.insights[0];

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/collections"
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 text-sm"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Collections
                </Link>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{collection.title}</h1>
                        <p className="text-muted-foreground mt-2 max-w-2xl text-lg">{collection.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={`/chat?collection=${collection.id}&title=${encodeURIComponent(collection.title)}`}>
                            <Button variant="outline" className="gap-2">
                                <MessageSquare className="h-4 w-4" /> Chat
                            </Button>
                        </Link>
                        <DeleteCollectionButton collectionId={collection.id} />
                        <SynthesizeButton collectionId={collection.id} disabled={collection.episodes.length < 2} />
                    </div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left: Episodes List */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        Episodes <Badge variant="secondary">{collection.episodes.length}</Badge>
                    </h3>

                    {collection.episodes.length === 0 ? (
                        <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground text-sm">
                            No episodes in this collection yet.
                            <br />
                            Go to an episode page to add it here.
                        </div>
                    ) : (
                        collection.episodes.map(episode => (
                            <Card key={episode.id} className="group hover:border-primary/50 transition-colors">
                                <CardContent className="p-4">
                                    <div className="flex gap-3">
                                        <div className="h-16 w-16 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                                            {episode.feed.image && (
                                                <img src={episode.feed.image} alt="" className="h-full w-full object-cover" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <Link href={`/episodes/${episode.id}`} className="font-medium hover:underline line-clamp-2 leading-tight">
                                                {episode.title}
                                            </Link>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                <span>{episode.feed.title}</span>
                                                <span>•</span>
                                                <Calendar className="h-3 w-3" />
                                                <span>{formatDistanceToNow(episode.publishedAt, { addSuffix: true })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Right: Synthesis Result */}
                <div className="lg:col-span-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                        <Sparkles className="h-4 w-4 text-primary" /> AI Synthesis
                    </h3>

                    {synthesis ? (
                        <Card className="border-accent/30 bg-accent/5">
                            <CardHeader>
                                <CardTitle>Synthesized Insights</CardTitle>
                                <CardDescription>
                                    Generated {formatDistanceToNow(synthesis.createdAt, { addSuffix: true })}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="prose dark:prose-invert max-w-none">
                                <div className="whitespace-pre-wrap">{synthesis.synthesis}</div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-muted/30">
                            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                    <Sparkles className="h-6 w-6 text-primary" />
                                </div>
                                <h4 className="font-medium text-lg">Ready to Synthesize</h4>
                                <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                                    Our AI agent will read all episodes in this collection and generate a comprehensive report comparing their viewpoints.
                                </p>
                                <SynthesizeButton collectionId={collection.id} disabled={collection.episodes.length < 2} />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
