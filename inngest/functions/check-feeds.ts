import { inngest } from '@/lib/inngest/client';
import { prisma } from '@/lib/prisma';
import Parser from 'rss-parser';

const rssParser = new Parser();

export const checkFeeds = inngest.createFunction(
    {
        id: 'check-feeds',
        name: 'Check RSS Feeds for New Episodes',
    },
    [
        { cron: '0 * * * *' }, // Run hourly
        { event: 'feed/check.requested' }, // OR run when requested
    ],
    async ({ step, event }) => {
        const feedId = event.name === 'feed/check.requested' ? event.data.feedId : undefined;

        // Step 1: Fetch feeds (specific feed if requested, or all feeds)
        const feeds = await step.run('fetch-feeds', async () => {
            return prisma.feed.findMany({
                where: feedId ? { id: feedId } : undefined,
                select: {
                    id: true,
                    url: true,
                    title: true,
                    lastCheckedAt: true,
                },
            });
        });

        console.log(`Checking ${feeds.length} feeds for new episodes`);

        // Step 2: Process each feed
        for (const feed of feeds) {
            await step.run(`process-feed-${feed.id}`, async () => {
                try {
                    // Parse the RSS feed
                    const rssFeed = await rssParser.parseURL(feed.url);

                    // Update feed metadata if not set
                    if (!feed.title && rssFeed.title) {
                        await prisma.feed.update({
                            where: { id: feed.id },
                            data: {
                                title: rssFeed.title,
                                image: rssFeed.image?.url || rssFeed.itunes?.image || null,
                            },
                        });
                    }

                    // Process each item in the feed
                    for (const item of rssFeed.items) {
                        // Skip if no audio URL
                        const audioUrl = item.enclosure?.url;
                        if (!audioUrl) continue;

                        // Use guid for deduplication
                        const guid = item.guid || item.link || audioUrl;

                        // Check if episode already exists
                        const existingEpisode = await prisma.episode.findUnique({
                            where: { guid },
                        });

                        if (existingEpisode) {
                            // Episode already exists, skip
                            continue;
                        }

                        // Create new episode
                        const episode = await prisma.episode.create({
                            data: {
                                guid,
                                title: item.title || 'Untitled Episode',
                                description: item.contentSnippet || item.content || null,
                                audioUrl,
                                publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                                status: 'DISCOVERED',
                                feedId: feed.id,
                            },
                        });

                        console.log(`New episode discovered: ${episode.title} (${episode.id})`);

                        // Note: Episode remains in DISCOVERED status until user manually triggers processing
                    }

                    // Update lastCheckedAt timestamp
                    await prisma.feed.update({
                        where: { id: feed.id },
                        data: { lastCheckedAt: new Date() },
                    });

                    console.log(`Finished checking feed: ${feed.title || feed.url}`);
                } catch (error) {
                    console.error(`Error processing feed ${feed.id}:`, error);
                    // Continue with other feeds even if one fails
                }
            });
        }

        return { feedsChecked: feeds.length };
    }
);
