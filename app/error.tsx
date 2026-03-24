'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
            <AlertTriangle className="h-12 w-12 text-status-warning mb-4" />
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-6 max-w-md">
                An unexpected error occurred. Please try again.
            </p>
            <Button onClick={reset}>Try Again</Button>
        </div>
    );
}
