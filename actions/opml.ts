'use server';

import { XMLParser } from 'fast-xml-parser';
import { addFeed } from '@/actions/feed-actions';
import { auth } from '@/auth';

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
});

export async function importOpmlAction(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    const file = formData.get('file') as File;
    if (!file) {
        return { success: false, error: 'No file provided' };
    }

    try {
        const text = await file.text();
        const result = parser.parse(text);

        // OPML structure usually: opml -> body -> outline (can be nested)
        // We need to recursively find all outlines with xmlUrl attributes
        const feeds: string[] = [];

        function extractFeeds(node: any) {
            if (Array.isArray(node)) {
                node.forEach(extractFeeds);
            } else if (typeof node === 'object' && node !== null) {
                const url = node.xmlUrl || node.url || node.feedUrl || node.feedURL;
                if (url) {
                    feeds.push(url);
                }
                // Check children
                if (node.outline) {
                    extractFeeds(node.outline);
                }
            }
        }

        if (result.opml && result.opml.body) {
            extractFeeds(result.opml.body.outline);
        }

        if (feeds.length === 0) {
            return { success: false, error: 'No podcast feeds found in OPML file.' };
        }

        // Process feeds in parallel (limit concurrency in production, but okay for MVP)
        // We'll limit to 50 to avoid timeouts
        const feedsToProcess = feeds.slice(0, 50);

        let successCount = 0;
        let failCount = 0;

        // Run sequentially or in small batches to be safe with DB/rate limits
        for (const url of feedsToProcess) {
            const formData = new FormData();
            formData.append('url', url);
            const res = await addFeed(formData);
            if (res.success) successCount++;
            else failCount++;
        }

        return {
            success: true,
            count: successCount,
            total: feedsToProcess.length,
            message: `Successfully imported ${successCount} feeds.${failCount > 0 ? ` (${failCount} failed)` : ''}`
        };

    } catch (error) {
        console.error('OPML Import Error:', error);
        return { success: false, error: 'Failed to process OPML file.' };
    }
}
