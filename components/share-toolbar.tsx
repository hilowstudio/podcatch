'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link2, Check, Twitter, Linkedin, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface ShareToolbarProps {
    title: string;
    url: string;
}

export function ShareToolbar({ title, url }: ShareToolbarProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Link copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground mr-1">Share:</span>
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy Link'}
            </Button>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                asChild
            >
                <a
                    href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on Twitter"
                >
                    <Twitter className="h-4 w-4" />
                </a>
            </Button>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                asChild
            >
                <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on LinkedIn"
                >
                    <Linkedin className="h-4 w-4" />
                </a>
            </Button>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                asChild
            >
                <a
                    href={`mailto:?subject=${encodedTitle}&body=Check out this episode on Podcatch: ${encodedUrl}`}
                    aria-label="Share via email"
                >
                    <Mail className="h-4 w-4" />
                </a>
            </Button>
        </div>
    );
}
