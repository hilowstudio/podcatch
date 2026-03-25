'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { addFeed } from '@/actions/feed-actions';
import { searchItunesAction } from '@/actions/itunes';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Loader2, Search, Rss, Info, Youtube, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface PodcastResult {
    title: string;
    author: string;
    image: string;
    feedUrl: string;
}

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Feed...
                </>
            ) : (
                'Add Feed'
            )}
        </Button>
    );
}

export function AddFeedDialog() {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<PodcastResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setIsSearching(true);
        try {
            const results = await searchItunesAction(searchTerm);
            setSearchResults(results);
        } catch (error) {
            toast.error('Failed to search iTunes');
        } finally {
            setIsSearching(false);
        }
    }

    async function handleAddFeed(url: string) {
        setIsAdding(true);
        const formData = new FormData();
        formData.append('url', url);

        try {
            const result = await addFeed(formData);
            if (result.success) {
                toast.success('Podcast added successfully!');
                setOpen(false);
            } else {
                toast.error(result.error || 'Failed to add podcast');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsAdding(false);
        }
    }

    // Direct form submit handler
    async function handleDirectSubmit(formData: FormData) {
        // We handle this via the server action wrapper to manage state here if needed, 
        // but using the existing pattern is fine.
        // We'll just let the form action run and handle the result via toast/close.
        // Actually, to close the dialog, we need to wrap the action or use a separate handler.

        // Let's use the same logic as the Search handler for consistency
        const url = formData.get('url') as string;
        await handleAddFeed(url);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                    <PlusCircle className="h-5 w-5" />
                    Add Feed
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto overflow-x-hidden">
                <DialogHeader>
                    <DialogTitle>Add Podcast</DialogTitle>
                    <DialogDescription>
                        Search for a podcast, enter an RSS feed URL directly, or import an OPML file.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="search" className="w-full min-w-0">
                    <TabsList className="flex w-full">
                        <TabsTrigger value="search">iTunes</TabsTrigger>
                        <TabsTrigger value="direct">RSS</TabsTrigger>
                        <TabsTrigger value="youtube">YouTube</TabsTrigger>
                        <TabsTrigger value="import">Import</TabsTrigger>
                    </TabsList>

                    <TabsContent value="search" className="space-y-4 pt-4">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                type="search"
                                inputMode="search"
                                placeholder="Search by name (e.g. Huberman)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                aria-label="Search for podcasts"
                            />
                            <Button type="submit" disabled={isSearching || !searchTerm}>
                                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </form>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto overflow-x-hidden pr-1">
                            {searchResults.map((podcast, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    disabled={isAdding}
                                    onClick={() => handleAddFeed(podcast.feedUrl)}
                                    className="flex items-center gap-3 p-2 rounded-lg border hover:bg-accent transition-colors w-full text-left cursor-pointer disabled:opacity-50 overflow-hidden"
                                >
                                    {podcast.image && (
                                        <img
                                            src={podcast.image}
                                            alt={podcast.title}
                                            className="w-12 h-12 rounded-md object-cover bg-muted flex-shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <h4 className="font-medium text-sm truncate">{podcast.title}</h4>
                                        <p className="text-xs text-muted-foreground truncate">{podcast.author}</p>
                                    </div>
                                    <PlusCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                </button>
                            ))}
                            {searchResults.length === 0 && !isSearching && searchTerm && (
                                <p className="text-center text-sm text-muted-foreground py-4">
                                    No results found.
                                </p>
                            )}
                            {!searchTerm && (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                    <Search className="h-8 w-8 mb-2 opacity-50" />
                                    <p className="text-sm">Search for your favorite podcasts</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="direct" className="space-y-4 pt-4">
                        <form action={handleDirectSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="url">RSS Feed URL</Label>
                                <Input
                                    id="url"
                                    name="url"
                                    type="url"
                                    inputMode="url"
                                    placeholder="https://example.com/feed.xml"
                                    required
                                    className="w-full"
                                    autoComplete="url"
                                    aria-describedby="url-hint"
                                />
                            </div>
                            <Button type="submit" disabled={isAdding} className="w-full">
                                {isAdding ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adding Feed...
                                    </>
                                ) : (
                                    'Add Feed'
                                )}
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="youtube" className="space-y-4 pt-4">
                        <form action={async (formData) => {
                            setIsAdding(true);
                            try {
                                const input = formData.get('input') as string;
                                const { subscribeToYoutubeChannel } = await import('@/actions/youtube');
                                const result = await subscribeToYoutubeChannel(input);
                                if (result.success) {
                                    toast.success(result.message || 'Subscribed to YouTube Channel!');
                                    setOpen(false);
                                } else {
                                    toast.error(result.error || 'Failed to subscribe');
                                }
                            } catch (err) {
                                toast.error('Failed to subscribe');
                            } finally {
                                setIsAdding(false);
                            }
                        }} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="input">Channel URL or Handle</Label>
                                <Input
                                    id="input"
                                    name="input"
                                    placeholder="@User or youtube.com/channel/..."
                                    required
                                    className="w-full"
                                />
                            </div>
                            <Button type="submit" disabled={isAdding} className="w-full gap-2">
                                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4 text-red-600" />}
                                {isAdding ? 'Subscribing...' : 'Subscribe to Channel'}
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="import" className="space-y-4 pt-4">
                        <form action={async (formData) => {
                            setIsAdding(true);
                            try {
                                const { importOpmlAction } = await import('@/actions/opml');
                                const result = await importOpmlAction(formData);
                                if (result.success) {
                                    toast.success(result.message);
                                    setOpen(false);
                                    // Optional: Refresh feed list
                                } else {
                                    toast.error(result.error || 'Failed to import OPML');
                                }
                            } catch (err) {
                                toast.error('Failed to import file');
                            } finally {
                                setIsAdding(false);
                            }
                        }} className="space-y-4">
                            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                                    <Label htmlFor="file" className="cursor-pointer text-sm font-medium">
                                        Click to upload .opml file
                                    </Label>
                                    <Input
                                        id="file"
                                        name="file"
                                        type="file"
                                        accept=".opml,.xml"
                                        required
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                toast.info(`Selected: ${e.target.files[0].name}`);
                                            }
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Supports exports from Apple Podcasts, Overcast, Pocket Casts, etc.
                                    </p>
                                </div>
                            </div>
                            <Button type="submit" disabled={isAdding} className="w-full">
                                {isAdding ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Importing Feeds...
                                    </>
                                ) : (
                                    'Import Library'
                                )}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
