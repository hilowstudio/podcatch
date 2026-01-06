'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { addFeed } from '@/actions/feed-actions';
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
import { PlusCircle, Loader2 } from 'lucide-react';

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
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(formData: FormData) {
        setError(null);
        setSuccess(false);

        const result = await addFeed(formData);

        if (result.success) {
            setSuccess(true);
            setError(null);
            // Close dialog after short delay
            setTimeout(() => {
                setOpen(false);
                setSuccess(false);
            }, 1500);
        } else {
            setError(result.error || 'An error occurred');
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                    <PlusCircle className="h-5 w-5" />
                    Add Feed
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Podcast Feed</DialogTitle>
                    <DialogDescription>
                        Enter the RSS feed URL of the podcast you want to add. We'll automatically discover episodes and start
                        processing them.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="url">RSS Feed URL</Label>
                        <Input
                            id="url"
                            name="url"
                            type="url"
                            placeholder="https://example.com/feed.xml"
                            required
                            className="w-full"
                        />
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            Feed added successfully! Discoverin episodes...
                        </div>
                    )}

                    <SubmitButton />
                </form>
            </DialogContent>
        </Dialog>
    );
}
