'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCustomPrompt } from '@/actions/studio-actions';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function DeletePromptButton({ promptId }: { promptId: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    async function onDelete() {
        if (!confirm('Are you sure?')) return;

        setIsLoading(true);
        try {
            const result = await deleteCustomPrompt(promptId);
            if (result.success) {
                toast.success('Prompt deleted');
                router.refresh();
            } else {
                toast.error('Failed to delete');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Button variant="ghost" size="icon" onClick={onDelete} disabled={isLoading} className="text-muted-foreground hover:text-destructive">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
    );
}
