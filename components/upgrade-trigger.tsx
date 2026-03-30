'use client';

import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Tier = 'BASIC' | 'PRO';

interface UpgradeTriggerProps {
    isUnlocked: boolean;
    requiredTier: Tier;
    children: React.ReactNode;
    className?: string;
}

export function UpgradeTrigger({ isUnlocked, requiredTier, children, className }: UpgradeTriggerProps) {
    const router = useRouter();

    if (isUnlocked) {
        return <>{children}</>;
    }

    return (
        <div
            className={`relative group cursor-pointer ${className || ''}`}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/pricing?tier=${requiredTier}`);
            }}
        >
            <div className="flex items-center">
                <div className="opacity-50 pointer-events-none select-none grayscale transition-opacity group-hover:opacity-75">
                    {children}
                </div>
                <Badge
                    variant="secondary"
                    className="absolute right-2 top-1/2 -translate-y-1/2 shadow-sm border bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-all gap-1 pointer-events-none"
                >
                    <Crown className="w-3 h-3 text-primary fill-primary" />
                    <span className="font-bold text-[10px] tracking-wide">{requiredTier}</span>
                </Badge>
            </div>
        </div>
    );
}
