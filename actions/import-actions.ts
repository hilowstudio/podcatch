'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { inngest } from '@/lib/inngest/client';

interface MP3ImportItem {
    url: string;
    title?: string;
}

/**
 * Imports a batch of MP3 URLs as episodes under a virtual feed
 * and triggers processing for each.
 */
export async function importMP3Batch(
    feedTitle: string,
    items: MP3ImportItem[]
): Promise<{ success: boolean; imported: number; skipped: number; errors: string[] }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, imported: 0, skipped: 0, errors: ['Unauthorized'] };
    }

    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    try {
        // Find or create the virtual feed
        let feed = await prisma.feed.findFirst({
            where: {
                title: feedTitle,
                type: 'RSS', // Treat as RSS since we're using audio URLs
            },
        });

        if (!feed) {
            feed = await prisma.feed.create({
                data: {
                    title: feedTitle,
                    url: `virtual://${feedTitle.toLowerCase().replace(/\s+/g, '-')}`,
                    type: 'RSS',
                },
            });
            console.log(`Created virtual feed: ${feed.id}`);
        }

        // Ensure user is subscribed to this feed
        const existingSub = await prisma.subscription.findUnique({
            where: {
                userId_feedId: {
                    userId: session.user.id,
                    feedId: feed.id,
                },
            },
        });

        if (!existingSub) {
            await prisma.subscription.create({
                data: {
                    userId: session.user.id,
                    feedId: feed.id,
                },
            });
        }

        // Process each MP3 URL
        for (const item of items) {
            try {
                // Extract title from URL if not provided
                let title = item.title;
                if (!title) {
                    // Try to extract from URL (e.g., "John+4.mp3" -> "John 4")
                    const urlParts = item.url.split('/');
                    const filename = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
                    title = decodeURIComponent(filename)
                        .replace(/\.mp3$/i, '')
                        .replace(/\+/g, ' ')
                        .replace(/_/g, ' ');
                }

                // Check if episode already exists
                const existingEpisode = await prisma.episode.findFirst({
                    where: {
                        feedId: feed.id,
                        audioUrl: item.url,
                    },
                });

                if (existingEpisode) {
                    skipped++;
                    continue;
                }

                // Create the episode
                const episode = await prisma.episode.create({
                    data: {
                        feedId: feed.id,
                        title: title || 'Untitled',
                        audioUrl: item.url,
                        guid: `import:${item.url}`, // Use URL as unique identifier
                        publishedAt: new Date(),
                        status: 'DISCOVERED',
                    },
                });

                // Trigger processing
                await inngest.send({
                    name: 'episode/process.requested',
                    data: { episodeId: episode.id },
                });

                imported++;
                console.log(`Imported: ${title} (${episode.id})`);

            } catch (itemError: any) {
                errors.push(`Failed to import ${item.url}: ${itemError.message}`);
            }
        }

        return { success: true, imported, skipped, errors };

    } catch (error: any) {
        return { success: false, imported, skipped, errors: [error.message] };
    }
}
