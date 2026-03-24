import { LibrarySearch } from '@/components/library-search';
import { PodcastDiscovery } from '@/components/podcast-discovery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Search & Discover - Podcatch',
    description: 'Search your library or discover new podcasts.',
};

export default function SearchPage() {
    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Search & Discover</h1>
                <p className="text-muted-foreground">
                    Search your library or find new podcasts to subscribe to.
                </p>
            </div>

            <Tabs defaultValue="library">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="library">Library Search</TabsTrigger>
                    <TabsTrigger value="discover">Discover Podcasts</TabsTrigger>
                </TabsList>

                <TabsContent value="library">
                    <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
                        <LibrarySearch />
                    </Suspense>
                </TabsContent>

                <TabsContent value="discover">
                    <PodcastDiscovery />
                </TabsContent>
            </Tabs>
        </div>
    );
}
