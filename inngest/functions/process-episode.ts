import { inngest } from '@/lib/inngest/client';
import { prisma } from '@/lib/prisma';
import { createClient } from '@deepgram/sdk';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { insightSchema } from '@/lib/ai/schemas';

export const processEpisode = inngest.createFunction(
    {
        id: 'process-episode',
        name: 'Process Podcast Episode',
        retries: 2,
    },
    { event: 'episode/process.requested' },
    async ({ event, step }) => {
        const { episodeId } = event.data;

        // Step 1: Fetch episode with feed and user details
        const episode = await step.run('fetch-episode', async () => {
            const ep = await prisma.episode.findUnique({
                where: { id: episodeId },
                include: {
                    feed: {
                        include: {
                            user: {
                                select: {
                                    geminiApiKey: true,
                                    deepgramApiKey: true,
                                    claudeApiKey: true,
                                    claudeProjectId: true,
                                    autoSyncToClaude: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!ep) {
                throw new Error(`Episode ${episodeId} not found`);
            }

            // Update status to PROCESSING
            await prisma.episode.update({
                where: { id: episodeId },
                data: { status: 'PROCESSING' },
            });

            return ep;
        });

        console.log(`Processing episode: ${episode.title}`);

        // Step 2: Transcribe audio with Deep gram (use user's key or system key)
        const transcript = await step.run('transcribe-audio', async () => {
            try {
                // Use user's Deepgram API key if available, fallback to system key
                const deepgramApiKey = episode.feed.user.deepgramApiKey || process.env.DEEPGRAM_API_KEY;

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
                const geminiApiKey = episode.feed.user.geminiApiKey || process.env.GEMINI_API_KEY;

                if (!geminiApiKey) {
                    throw new Error('No Gemini API key available (user or system)');
                }

                const { object } = await generateObject({
                    model: google('gemini-3-pro'),
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
        if (episode.feed.user.autoSyncToClaude && episode.feed.user.claudeApiKey && episode.feed.user.claudeProjectId) {
            await step.run('sync-to-claude', async () => {
                try {
                    const { syncEpisodeToClaude } = await import('@/lib/claude/sync');

                    const result = await syncEpisodeToClaude({
                        apiKey: episode.feed.user.claudeApiKey!,
                        projectId: episode.feed.user.claudeProjectId!,
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

        return { success: true, episodeId: episode.id };
    }
);
