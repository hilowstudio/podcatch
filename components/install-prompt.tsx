'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed as PWA
        const standalone = window.matchMedia('(display-mode: standalone)').matches;
        setIsStandalone(standalone);

        // Check if iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(iOS);

        // Listen for the beforeinstallprompt event (Chrome/Android)
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show immediately when browser signals install eligibility (no timer)
            const dismissed = localStorage.getItem('installPromptDismissed');
            if (!dismissed) {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        // On iOS, only show if user has visited at least 3 times (meaningful engagement)
        if (iOS && !standalone) {
            const dismissed = localStorage.getItem('installPromptDismissed');
            const visits = parseInt(localStorage.getItem('installPromptVisits') || '0', 10) + 1;
            localStorage.setItem('installPromptVisits', String(visits));
            if (!dismissed && visits >= 3) {
                setShowPrompt(true);
            }
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowPrompt(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('installPromptDismissed', 'true');
    };

    if (isStandalone || !showPrompt) {
        return null;
    }

    return (
        <div className="fixed bottom-24 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm animate-in slide-in-from-bottom-4 duration-300">
            <Card className="border shadow-lg bg-background/95 backdrop-blur-sm">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Download className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm">Install Podcatch</h3>
                            {isIOS ? (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Tap <Share className="inline h-3 w-3" /> then "Add to Home Screen" for the best experience.
                                </p>
                            ) : (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Add to your home screen for quick access and offline support.
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-muted-foreground hover:text-foreground p-1"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    {!isIOS && deferredPrompt && (
                        <div className="mt-3 flex gap-2">
                            <Button size="sm" variant="outline" onClick={handleDismiss} className="flex-1">
                                Not Now
                            </Button>
                            <Button size="sm" onClick={handleInstall} className="flex-1">
                                Install
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
