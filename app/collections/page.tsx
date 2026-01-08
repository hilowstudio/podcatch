import { getUserCollections, createCollection } from '@/actions/collection-actions';
import { Card, CardFooter, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, FolderOpen, Layers } from 'lucide-react';
import { CreateCollectionDialog } from '@/components/create-collection-dialog';

export const metadata = {
    title: 'Collections - Podcatch',
    description: 'Organize your episodes into collections.',
};

export default async function CollectionsPage() {
    const collections = await getUserCollections();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
                    <p className="text-muted-foreground mt-1">Organize and synthesize your library.</p>
                </div>
                <CreateCollectionDialog />
            </div>

            {collections.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-lg bg-muted/50">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                        <FolderOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">No collections yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
                        Create a collection to group episodes together and unlock AI synthesis features.
                    </p>
                    <CreateCollectionDialog />
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {collections.map((collection) => (
                        <Link href={`/collections/${collection.id}`} key={collection.id} className="group">
                            <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/50">
                                <CardHeader>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Layers className="h-4 w-4 text-primary" />
                                        <div className="text-xs font-medium text-muted-foreground">
                                            {collection._count.episodes} Episodes
                                        </div>
                                    </div>
                                    <CardTitle className="group-hover:text-primary transition-colors">{collection.title}</CardTitle>
                                    <CardDescription className="line-clamp-2">
                                        {collection.description || 'No description'}
                                    </CardDescription>
                                </CardHeader>
                                <CardFooter className="pt-0">
                                    <div className="flex -space-x-2 overflow-hidden">
                                        {collection.episodes.slice(0, 3).map((ep) => (
                                            <div key={ep.id} className="inline-block h-6 w-6 rounded-full ring-2 ring-background overflow-hidden bg-muted">
                                                {/* Simple placeholder or image if available */}
                                                {ep.feed.image ? (
                                                    <img src={ep.feed.image} alt={ep.title} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-[8px] bg-primary/10">EP</div>
                                                )}
                                            </div>
                                        ))}
                                        {collection._count.episodes > 3 && (
                                            <div className="inline-flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-background bg-muted text-[8px] font-medium">
                                                +{collection._count.episodes - 3}
                                            </div>
                                        )}
                                    </div>
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
