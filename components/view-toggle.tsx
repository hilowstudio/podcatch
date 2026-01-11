'use client';

import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
    value: ViewMode;
    onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
    return (
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange('grid')}
                className={cn(
                    "h-8 w-8 p-0",
                    value === 'grid' && "bg-background shadow-sm"
                )}
                title="Grid view"
            >
                <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange('list')}
                className={cn(
                    "h-8 w-8 p-0",
                    value === 'list' && "bg-background shadow-sm"
                )}
                title="List view"
            >
                <List className="h-4 w-4" />
            </Button>
        </div>
    );
}
