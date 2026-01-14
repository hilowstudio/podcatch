import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Offline - Podcatch',
    description: 'You are currently offline.',
};

export default function OfflinePage() {
    return (
        <div className="flex items-center justify-center min-h-[80vh] p-4">
            <Card className="max-w-md w-full text-center">
                <CardContent className="pt-10 pb-10 flex flex-col items-center space-y-6">
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                        <WifiOff className="h-10 w-10 text-muted-foreground" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold">You're Offline</h1>
                        <p className="text-muted-foreground">
                            It looks like you've lost your internet connection.
                            Some features may not be available until you're back online.
                        </p>
                    </div>

                    <div className="pt-4 space-y-3 w-full">
                        <Button
                            onClick={() => window.location.reload()}
                            variant="default"
                            className="w-full"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                        <Link href="/" className="block">
                            <Button variant="outline" className="w-full">
                                Go to Home
                            </Button>
                        </Link>
                    </div>

                    <p className="text-xs text-muted-foreground pt-4">
                        Your work is saved locally and will sync when you're back online.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
