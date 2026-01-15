'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CollapsibleDescriptionProps {
    text: string;
    maxLines?: number;
    className?: string;
}

export function CollapsibleDescription({
    text,
    maxLines = 3,
    className
}: CollapsibleDescriptionProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Simple heuristic: if text is longer than ~200 chars, it's probably long enough to collapse
    const shouldCollapse = text.length > 200;

    if (!shouldCollapse) {
        return (
            <p className={cn("text-muted-foreground text-lg leading-relaxed", className)}>
                {text}
            </p>
        );
    }

    return (
        <div className={className}>
            <p
                className={cn(
                    "text-muted-foreground text-lg leading-relaxed transition-all duration-200",
                    !isExpanded && "line-clamp-3"
                )}
            >
                {text}
            </p>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-muted-foreground hover:text-foreground p-0 h-auto"
            >
                {isExpanded ? (
                    <>
                        Show less <ChevronUp className="h-4 w-4 ml-1" />
                    </>
                ) : (
                    <>
                        Read more <ChevronDown className="h-4 w-4 ml-1" />
                    </>
                )}
            </Button>
        </div>
    );
}
