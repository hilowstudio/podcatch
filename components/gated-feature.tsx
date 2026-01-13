'use client';

import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

interface GatedFeatureProps {
    title: string;
    description: string;
    requiredTier: 'BASIC' | 'PRO';
}

export function GatedFeature({ title, description, requiredTier }: GatedFeatureProps) {
    return (
        <div className="flex items-center justify-center h-[60vh] p-4">
            <Card className="max-w-md w-full text-center border-2 border-dashed shadow-sm">
                <CardContent className="pt-10 pb-10 flex flex-col items-center space-y-6">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                        <Lock className="h-8 w-8 text-muted-foreground" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold">{title}</h2>
                        <p className="text-muted-foreground">{description}</p>
                    </div>

                    <div className="pt-4">
                        <Link href={`/pricing?tier=${requiredTier.toLowerCase()}`}>
                            <Button size="lg" className="w-full">
                                Upgrade to {requiredTier}
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
