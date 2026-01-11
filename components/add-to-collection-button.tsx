'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, FolderPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getUserCollections, addEpisodeToCollection, createCollection } from '@/actions/collection-actions';

export function AddToCollectionButton({ episodeId }: { episodeId: string }) {
    const [open, setOpen] = useState(false);
    const [collections, setCollections] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [creating, setCreating] = useState(false);

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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCollectionName.trim()) {
            toast.error('Collection name is required');
            return;
        }

        setCreating(true);
        try {
            const result = await createCollection(newCollectionName.trim());
            if (result.success && result.collection) {
                toast.success('Collection created');
                // Auto-add episode to the new collection
                await addEpisodeToCollection(result.collection.id, episodeId);
                toast.success(`Added to ${newCollectionName}`);
                setNewCollectionName('');
                setShowCreateForm(false);
                setOpen(false);
            } else {
                toast.error('Failed to create collection');
            }
        } catch (error) {
            toast.error('Failed to create collection');
        } finally {
            setCreating(false);
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={(val) => {
            setOpen(val);
            if (val) {
                loadCollections();
                setShowCreateForm(false);
                setNewCollectionName('');
            }
        }}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <FolderPlus className="mr-2 h-4 w-4" /> Add to Collection
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>My Collections</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {loading ? (
                    <div className="p-2 text-xs text-center text-muted-foreground">Loading...</div>
                ) : (
                    <>
                        {collections.length === 0 && !showCreateForm && (
                            <div className="p-2 text-xs text-muted-foreground text-center">
                                No collections yet
                            </div>
                        )}
                        {collections.map(col => (
                            <DropdownMenuItem key={col.id} onClick={() => handleAdd(col.id, col.title)}>
                                <FolderPlus className="mr-2 h-4 w-4 text-muted-foreground" />
                                {col.title}
                            </DropdownMenuItem>
                        ))}
                    </>
                )}

                <DropdownMenuSeparator />

                {showCreateForm ? (
                    <form onSubmit={handleCreate} className="p-2 space-y-2">
                        <Input
                            placeholder="Collection name"
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            autoFocus
                            disabled={creating}
                        />
                        <div className="flex gap-2">
                            <Button type="submit" size="sm" className="flex-1" disabled={creating}>
                                {creating ? (
                                    <>
                                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create & Add'
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowCreateForm(false)}
                                disabled={creating}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                ) : (
                    <DropdownMenuItem
                        onSelect={(e) => {
                            e.preventDefault();
                            setShowCreateForm(true);
                        }}
                        className="text-primary"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Collection
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

