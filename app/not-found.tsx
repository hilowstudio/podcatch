import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
            <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Page not found</h1>
            <p className="text-muted-foreground mb-6 max-w-md">
                The page you're looking for doesn't exist or has been moved.
            </p>
            <Link href="/">
                <Button>Go Home</Button>
            </Link>
        </div>
    );
}
