import { LibrarySearch } from '@/components/library-search';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Search Library - Podcatch',
    description: 'Ask your library anything.',
};

export default function SearchPage() {
    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Deep Discovery</h1>
                <p className="text-muted-foreground">
                    Ask questions across your entire podcast library. Powered by Semantic Search.
                </p>
            </div>

            <LibrarySearch />
        </div>
    );
}
