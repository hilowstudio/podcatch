'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface EpisodeChatButtonProps {
    episodeId: string;
    episodeTitle: string;
}

export function EpisodeChatButton({ episodeId, episodeTitle }: EpisodeChatButtonProps) {
    // Pass episode context via URL params
    const chatUrl = `/chat?episode=${episodeId}&title=${encodeURIComponent(episodeTitle)}`;

    return (
        <Link href={chatUrl}>
            <Button variant="outline" size="sm" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat about this Episode
            </Button>
        </Link>
    );
}
