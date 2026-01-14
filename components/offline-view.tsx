'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, RefreshCw } from 'lucide-react';

export function OfflineView() {
    return (
        <div className="flex min-h-[80vh] items-center justify-center p-4">
            <Card className="max-w-md w-full text-center">
                <CardContent className="pt-10 pb-8 px-6 space-y-6">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <WifiOff className="h-8 w-8 text-muted-foreground" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight">You are offline</h1>
                        <p className="text-muted-foreground">
                            Check your internet connection and try again.
                            Some parts of the app may be unavailable.
                        </p>
                    </div>

                    <Button
                        onClick={() => window.location.reload()}
                        className="w-full gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
