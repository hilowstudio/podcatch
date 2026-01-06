import { z } from 'zod';

// Schema for adding a new feed
export const addFeedSchema = z.object({
    url: z.string().url('Must be a valid URL').refine(
        (url) => {
            // Basic RSS feed URL validation
            return url.includes('feed') || url.includes('rss') || url.includes('xml') || url.endsWith('.xml');
        },
        {
            message: 'URL must be an RSS feed (should contain "feed", "rss", or end with ".xml")',
        }
    ),
});

export type AddFeedInput = z.infer<typeof addFeedSchema>;
