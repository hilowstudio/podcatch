'use client';

import { useState } from 'react';
import { synthesizeCollection } from '@/actions/collection-actions';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function SynthesizeButton({ collectionId, disabled }: { collectionId: string, disabled: boolean }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    async function handleSynthesize() {
        setIsLoading(true);
        try {
            const result = await synthesizeCollection(collectionId);
            if (result.success) {
                toast.success('Synthesis complete!');
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to synthesize');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Button
            onClick={handleSynthesize}
            disabled={disabled || isLoading}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0"
        >
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Sparkles className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Synthesizing...' : 'Synthesize Collection'}
        </Button>
    );
}
