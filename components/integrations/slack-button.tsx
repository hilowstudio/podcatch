'use client';

import { Button } from '@/components/ui/button';
import { Share2, Loader2, Check } from 'lucide-react';
import { shareToSlack } from '@/actions/slack-actions';
import { useState } from 'react';
import { toast } from 'sonner';

interface SlackButtonProps {
    message: string;
    hasWebhook: boolean;
}

export function SlackButton({ message, hasWebhook }: SlackButtonProps) {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleShare = async () => {
        if (!hasWebhook) {
            toast.error("Please configure your Slack Webhook in settings first.");
            return;
        }

        setLoading(true);
        try {
            await shareToSlack(message);
            setSent(true);
            toast.success("Shared to Slack!");
            setTimeout(() => setSent(false), 3000);
        } catch (error) {
            toast.error("Failed to share to Slack");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={loading || !hasWebhook}
        >
            {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : sent ? (
                <Check className="mr-2 h-4 w-4 text-green-500" />
            ) : (
                <Share2 className="mr-2 h-4 w-4" />
            )}
            {sent ? 'Sent!' : 'Slack'}
        </Button>
    );
}
