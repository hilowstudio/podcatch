import { inngest } from '@/lib/inngest/client';
import { prisma } from '@/lib/prisma';
import { createClient } from '@deepgram/sdk';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { insightSchema } from '@/lib/ai/schemas';

export const processEpisode = inngest.createFunction(
    {
        id: 'process-episode-shared',
        name: 'Process Podcast Episode',
        retries: 2,
    },
    { event: 'episode/process.requested' },
    async ({ event, step }) => {
        const { episodeId } = event.data;

        // Step 1: Fetch episode with feed and user details
        const episode = await step.run('fetch-episode', async () => {
            console.log('🚀 Starting process-episode-shared (New Function ID)');
            try {
                // @ts-ignore - Accessing internal DMMF for debugging
                const feedModel = (prisma as any)._dmmf?.datamodel?.models.find((m: any) => m.name === 'Feed');
                if (feedModel) {
                    console.log('🔍 DEBUG: Prisma Client Feed Model Fields:', feedModel.fields.map((f: any) => f.name).join(', '));
                }
            } catch (e) {
                console.log('Could not inspect DMMF', e);
            }

            const ep = await prisma.episode.findUnique({
                where: { id: episodeId },
                include: {
                    feed: {
                        include: {
                            subscriptions: {
                                take: 50, // Check plenty of users
                                orderBy: [
                                    { user: { stripePriceId: 'asc' } }, // ASC puts non-nulls BEFORE nulls in Postgres
                                    { createdAt: 'asc' }
                                ],
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            geminiApiKey: true,
                                            deepgramApiKey: true,
                                            claudeApiKey: true,
                                            claudeProjectId: true,
                                            autoSyncToClaude: true,
                                            stripePriceId: true,
                                            stripeCurrentPeriodEnd: true,
                                            webhookUrl: true,
                                            readwiseApiKey: true,
                                        },
                                    },
                                }
                            }
                        },
                    },
                },
            });

            if (!ep) {
                throw new Error(`Episode ${episodeId} not found`);
            }

            // Find the first valid Pro user
            const DAY_IN_MS = 86_400_000;
            const now = Date.now();

            console.log(`Checking ${ep.feed.subscriptions.length} subscribers for Pro status...`);
            ep.feed.subscriptions.forEach(s => {
                const u = s.user;
                const end = u?.stripeCurrentPeriodEnd?.getTime() ?? 0;
                const active = end + DAY_IN_MS > now;
                console.log(`- User ${u?.id?.slice(0, 8)}: Price=${u?.stripePriceId ?? 'None'}, Ends=${u?.stripeCurrentPeriodEnd?.toISOString() ?? 'N/A'}, Active=${active}`);
            });

            const fundingUser = ep.feed.subscriptions.map(s => s.user).find(u => {
                return !!u?.stripePriceId &&
                    (u.stripeCurrentPeriodEnd?.getTime() ?? 0) + DAY_IN_MS > now;
            });

            // If no Pro user found, fallback to the first user (for logging/error context)
            const fallbackUser = ep.feed.subscriptions[0]?.user;

            if (!fundingUser) {
                console.log(`Skipping: No qualifying Pro user found among ${ep.feed.subscriptions.length} subscribers.`);
                // Return fallback user logic but marked as skipped
                return { ...ep, feed: { ...ep.feed, user: fallbackUser || null }, skipped: true };
            }

            console.log(`Funded by Pro User: ${fundingUser.id} (${fundingUser.stripePriceId})`);

            // Update status to PROCESSING
            await prisma.episode.update({
                where: { id: episodeId },
                data: { status: 'PROCESSING' },
            });

            // Return with 'user' patched into feed for backward compatibility
            return {
                ...ep,
                feed: {
                    ...ep.feed,
                    user: fundingUser
                }
            };
        });

        if ((episode as any).skipped) {
            return { skipped: true, reason: 'Upgrade to Pro to process episodes' };
        }

        console.log(`Processing episode: ${episode.title}`);

        // Step 2: Transcribe audio with Deep gram (use user's key or system key)
        const transcript = await step.run('transcribe-audio', async () => {
            try {
                // Use user's Deepgram API key if available, fallback to system key
                const deepgramApiKey = episode.feed.user?.deepgramApiKey || process.env.DEEPGRAM_API_KEY;

                if (!deepgramApiKey) {
                    throw new Error('No Deepgram API key available (user or system)');
                }

                const deepgram = createClient(deepgramApiKey);

                const { result } = await deepgram.listen.prerecorded.transcribeUrl(
                    {
                        url: episode.audioUrl,
                    },
                    {
                        model: 'nova-2',
                        smart_format: true,
                        punctuate: true,
                        paragraphs: true,
                    }
                );

                if (!result) {
                    throw new Error('No result returned from Deepgram');
                }

                const transcriptText = result.results?.channels?.[0]?.alternatives?.[0]?.transcript;

                if (!transcriptText) {
                    throw new Error('No transcript returned from Deepgram');
                }

                console.log('Transcription complete');
                return transcriptText;
            } catch (error) {
                console.error('Deepgram transcription error:', error);
                throw error;
            }
        });

        // Step 3: Analyze with Gemini 3 Pro (use user's key or system key)
        const insights = await step.run('analyze-with-ai', async () => {
            try {
                // Use user's Gemini API key if available, fallback to system key
                const geminiApiKey = episode.feed.user?.geminiApiKey || process.env.GEMINI_API_KEY;

                if (!geminiApiKey) {
                    throw new Error('No Gemini API key available (user or system)');
                }

                const google = createGoogleGenerativeAI({
                    apiKey: geminiApiKey,
                });

                const { object } = await generateObject({
                    model: google('gemini-3-pro-preview'),
                    schema: insightSchema,
                    prompt: `You are analyzing a podcast episode transcript. Extract the following information:

1. A concise summary (2-3 sentences)
2. Exactly 5 key takeaways or bullet points
3. A list of all URLs mentioned in the transcript

Transcript:
${transcript}

Please provide detailed, actionable insights that would be valuable to someone who wants to understand the episode without listening to it.`,
                });

                console.log('AI analysis complete');
                return object;
            } catch (error) {
                console.error('AI analysis error:', error);
                throw error;
            }
        });

        //Step 4: Save insights to database
        await step.run('save-insights', async () => {
            try {
                await prisma.insight.create({
                    data: {
                        episodeId: episode.id,
                        transcript,
                        summary: insights.summary,
                        keyTakeaways: insights.keyTakeaways || [],
                        links: insights.links || [],
                    },
                });

                // Update episode status to COMPLETED
                await prisma.episode.update({
                    where: { id: episode.id },
                    data: { status: 'COMPLETED' },
                });

                console.log('Insights saved successfully');
            } catch (error) {
                console.error('Error saving insights:', error);
                throw error;
            }
        });

        // Step 5: Sync to Claude Project (if user has it configured)
        if (episode.feed.user?.autoSyncToClaude && episode.feed.user?.claudeApiKey && episode.feed.user?.claudeProjectId) {
            await step.run('sync-to-claude', async () => {
                try {
                    const { syncEpisodeToClaude } = await import('@/lib/claude/sync');

                    const result = await syncEpisodeToClaude({
                        apiKey: episode.feed.user?.claudeApiKey!,
                        projectId: episode.feed.user?.claudeProjectId!,
                        episodeTitle: episode.title,
                        feedTitle: episode.feed.title || 'Podcast',
                        publishedAt: new Date(episode.publishedAt),
                        summary: insights.summary,
                        keyTakeaways: insights.keyTakeaways || [],
                        links: insights.links || [],
                        transcript,
                    });

                    if (result.success) {
                        console.log('✅ Episode automatically synced to Claude Project!');
                    } else {
                        console.error('Failed to sync to Claude:', result.error);
                        // Don't fail the whole job if Claude sync fails - it's optional
                    }
                } catch (error) {
                    console.error('Error in Claude sync step:', error);
                    // Don't fail the whole job - sync is optional
                }
            });
        }

        // Step 6: Dispatch Webhook (Phase 2 Integration)
        if (episode.feed.user?.webhookUrl) {
            await step.run('dispatch-webhook', async () => {
                const { dispatchWebhook } = await import('@/lib/webhooks');
                console.log('Dispatching webhook...');
                const result = await dispatchWebhook(episode.feed.user?.webhookUrl, {
                    event: 'episode.processed',
                    episode: {
                        id: episode.id,
                        title: episode.title,
                        url: episode.audioUrl,
                        publishedAt: episode.publishedAt,
                        feedTitle: episode.feed.title,
                    },
                    insights: {
                        summary: insights.summary,
                        keyTakeaways: insights.keyTakeaways,
                        links: insights.links,
                    },
                    transcript: transcript.substring(0, 5000) + '... (truncated for webhook)', // Optional truncation
                });

                if (result.success) {
                    console.log('✅ Webhook dispatched successfully!');
                } else {
                    console.error('Webhook dispatch failed:', result.error);
                }
            });
        }



        // Step 7: Save to Readwise Reader (Phase 2 Integration)
        if (episode.feed.user?.readwiseApiKey) {
            await step.run('upload-to-readwise', async () => {
                const { saveToReadwise } = await import('@/lib/readwise');
                console.log('Uploading to Readwise...');

                const result = await saveToReadwise(episode.feed.user?.readwiseApiKey!, {
                    url: episode.audioUrl, // Reader uses this as unique ID and source
                    title: episode.title,
                    summary: insights.summary, // Reader shows this in the list view
                    html: `
                        <h1>${episode.title}</h1>
                        <p><strong>Feed:</strong> ${episode.feed.title}</p>
                        <p><strong>Published:</strong> ${new Date(episode.publishedAt).toLocaleDateString()}</p>
                        <h2>Summary</h2>
                        ${insights.summary}
                        <h2>Key Takeaways</h2>
                        <ul>
                            ${(insights.keyTakeaways || []).map((t: string) => `<li>${t}</li>`).join('')}
                        </ul>
                        <h2>Transcript</h2>
                        <p>${transcript.replace(/\n\n/g, '</p><p>')}</p>
                    `,
                    published_date: new Date(episode.publishedAt).toISOString(),
                    image_url: episode.feed.image || undefined,
                    tags: ['podcatch', 'podcast', episode.feed.title || 'unknown'],
                });

                if (result.success) {
                    console.log('✅ Saved to Readwise Reader!');
                } else {
                    console.error('Failed to save to Readwise:', result.error);
                }
            });
        }

        return { success: true, episodeId: episode.id };
    }
);
