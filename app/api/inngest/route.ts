import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { checkFeeds } from '@/inngest/functions/check-feeds';
import { processEpisode } from '@/inngest/functions/process-episode';

// Register all Inngest functions
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        checkFeeds,
        processEpisode,
    ],
});
