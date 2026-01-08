'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, FolderPlus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getUserCollections, addEpisodeToCollection } from '@/actions/collection-actions';
// import { useQuery } from '@tanstack/react-query';

// Simpler approach without big query lib overhead for now:
// We'll fetch collections on open if needed, or better, pass them if server component.
// But for interactivity, let's fetch on mount or trigger.

export function AddToCollectionButton({ episodeId }: { episodeId: string }) {
    const [open, setOpen] = useState(false);
    const [collections, setCollections] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const loadCollections = async () => {
        setLoading(true);
        try {
            const data = await getUserCollections();
            setCollections(data);
        } catch (e) {
            toast.error('Failed to load collections');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (collectionId: string, title: string) => {
        toast.promise(addEpisodeToCollection(collectionId, episodeId), {
            loading: `Adding to ${title}...`,
            success: 'Added to collection',
            error: 'Failed to add'
        });
        setOpen(false);
    };

    return (
        <DropdownMenu open={open} onOpenChange={(val) => {
            setOpen(val);
            if (val) loadCollections();
        }}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <FolderPlus className="mr-2 h-4 w-4" /> Add to Collection
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Collections</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {loading ? (
                    <div className="p-2 text-xs text-center text-muted-foreground">Loading...</div>
                ) : collections.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                        No collections found.
                        <div className="mt-1">Create one in the dashboard.</div>
                    </div>
                ) : (
                    collections.map(col => (
                        <DropdownMenuItem key={col.id} onClick={() => handleAdd(col.id, col.title)}>
                            <FolderPlus className="mr-2 h-4 w-4 text-muted-foreground" />
                            {col.title}
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
