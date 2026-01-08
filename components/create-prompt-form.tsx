'use client';

import { useState } from 'react';
import { createCustomPrompt } from '@/actions/studio-actions';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function CreatePromptForm() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const prompt = formData.get('prompt') as string;

        try {
            const result = await createCustomPrompt(title, prompt);
            if (result.success) {
                toast.success('Prompt created');
                setOpen(false);
                router.refresh();
            } else {
                toast.error('Failed to create prompt');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Prompt
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Custom Prompt</DialogTitle>
                        <DialogDescription>
                            Define a prompt template. Use <code className="bg-muted px-1 rounded text-xs">{'{{transcript}}'}</code> as a placeholder for the episode content.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" placeholder="e.g. Extract Books" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="prompt">Prompt Template</Label>
                            <p className="text-xs text-muted-foreground">Example: "List all books mentioned in this transcript: {'{{transcript}}'}"</p>
                            <Textarea
                                id="prompt"
                                name="prompt"
                                placeholder="Enter your prompt..."
                                className="h-32 font-mono text-sm"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Prompt
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
