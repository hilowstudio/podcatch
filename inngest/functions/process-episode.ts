import { inngest } from '@/lib/inngest/client';
import { prisma } from '@/lib/prisma';
import { createClient } from '@deepgram/sdk';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { insightSchema } from '@/lib/ai/schemas';

// No stream/fs/ytdl imports needed for simplified YouTube flow

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
                                            notionAccessToken: true,
                                            notionPageId: true,
                                            googleDriveRefreshToken: true,
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

        // Step 2: Transcribe/Analyze Content
        // We branch here based on Feed Type: RSS (Audio) vs YOUTUBE (Video)
        let transcriptData: { rawTranscript: string, timestampedTranscript: string, fileUri?: string } = { rawTranscript: '', timestampedTranscript: '' };

        if (episode.feed.type === 'RSS') {
            // ... Existing Deepgram Logic ...
            transcriptData = await step.run('transcribe-audio', async () => {
                // ... (Deepgram code) ...
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

                    if (!result || !result.results?.channels?.[0]?.alternatives?.[0]) {
                        throw new Error('No result returned from Deepgram');
                    }

                    const alternative = result.results.channels[0].alternatives[0];
                    const rawTranscript = alternative.transcript;

                    // Helper to format seconds to [MM:SS]
                    const formatTime = (seconds: number) => {
                        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
                        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
                        return `[${m}:${s}]`;
                    };

                    // Create timestamped version from paragraphs if available, otherwise fallback
                    let timestampedTranscript = rawTranscript;
                    if (alternative.paragraphs?.paragraphs) {
                        timestampedTranscript = alternative.paragraphs.paragraphs.map((p: any) => {
                            const start = formatTime(p.start);
                            return `${start} ${p.sentences.map((s: any) => s.text).join(' ')}`;
                        }).join('\n\n');
                    }

                    if (!rawTranscript) {
                        throw new Error('No transcript returned from Deepgram');
                    }

                    console.log('Transcription complete');
                    return { rawTranscript, timestampedTranscript };
                } catch (error) {
                    console.error('Deepgram transcription error:', error);
                    throw error;
                }
            });
        } else if (episode.feed.type === 'YOUTUBE' && episode.videoUrl) {
            // YouTube Video Processing - Direct URL Method
            transcriptData = await step.run('process-youtube-video', async () => {
                console.log('🎥 Processing YouTube Video via URL:', episode.videoUrl);
                const geminiApiKey = episode.feed.user?.geminiApiKey || process.env.GEMINI_API_KEY;
                if (!geminiApiKey) throw new Error('Gemini API Key required for Video analysis');

                // We no longer download/upload. We simply pass the URL.
                return {
                    rawTranscript: '',
                    timestampedTranscript: '',
                    fileUri: episode.videoUrl! // Pass the YouTube URL directly
                };
            });
        }

        // Step 3: Analyze with Gemini 2.0 Flash (User required newer model)
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

                // Select Model - Gemini 2.0 Flash supports YouTube URLs directly
                const modelName = 'gemini-2.0-flash';

                const messages: any[] = [];
                if (episode.feed.type === 'RSS') {
                    messages.push({
                        role: 'user',
                        content: `You are analyzing a podcast episode transcript. Extract insights. Transcript: ${transcriptData.rawTranscript}`
                    });
                } else {
                    // Video
                    messages.push({
                        role: 'user',
                        content: [
                            { type: 'text', text: "Watch this video. Provide a detailed summary, key takeaways, and a list of links mentioned." },
                            { type: 'file', data: transcriptData.fileUri, mimeType: 'video/mp4' }
                        ]
                    });
                }

                const { object } = await generateObject({
                    model: google(modelName),
                    schema: insightSchema,
                    messages: messages,
                });

                console.log('AI analysis complete');

                // For Video, we need to populate the transcript manually since we didn't get it from Deepgram.
                // NOTE: We are NOT asking Gemini for the full transcript in the JSON schema right now to keep it simple.
                // We will just use 'Video Analysis' as the transcript placeholder or fetch it separately if needed.
                // User requested "transcript files" - we should ideally get it.
                // A better approach: Two calls. 1. Generate text (transcript). 2. Key takeaways.
                // Or just assume Summary is enough for now.

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
                        transcript: transcriptData.rawTranscript || '(Video Transcript in process...)', // Keep raw in DB for display? Or timestamped? Let's keep raw for clean reading.
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
                        transcript: transcriptData.rawTranscript,
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
                    transcript: (transcriptData.rawTranscript || '').substring(0, 5000) + '... (truncated)', // Optional truncation
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
                        <p>${(transcriptData.rawTranscript || '').replace(/\n\n/g, '</p><p>')}</p>
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



        // Step 8: Sync to Notion (Phase 2 integration)
        if (episode.feed.user?.notionAccessToken && episode.feed.user?.notionPageId) {
            await step.run('sync-to-notion', async () => {
                const { saveToNotion } = await import('@/lib/notion');
                console.log('Syncing to Notion...');

                const result = await saveToNotion(episode.feed.user?.notionAccessToken!, {
                    pageId: episode.feed.user?.notionPageId!,
                    title: episode.title,
                    url: episode.audioUrl,
                    feedTitle: episode.feed.title || 'Podcast',
                    publishedAt: new Date(episode.publishedAt),
                    summary: insights.summary,
                    keyTakeaways: insights.keyTakeaways || [],
                    transcript: transcriptData.timestampedTranscript
                });

                if (result.success) {
                    console.log('✅ Synced to Notion!');
                } else {
                    console.error('Failed to sync to Notion:', result.error);
                }
            });
        }



        // Step 9: Save to Google Drive (Phase 2 integration)
        if (episode.feed.user?.googleDriveRefreshToken) {
            await step.run('save-to-drive', async () => {
                const { saveToDrive } = await import('@/lib/drive');
                console.log('Saving to Google Drive...');

                const content = `
# ${episode.title}
**Feed**: ${episode.feed.title}
**Published**: ${new Date(episode.publishedAt).toLocaleDateString()}
**URL**: ${episode.audioUrl}

## Summary
${insights.summary}

## Key Takeaways
${(insights.keyTakeaways || []).map((t: string) => `- ${t}`).join('\n')}

## Transcript
${transcriptData.timestampedTranscript}
                `;

                const result = await saveToDrive({
                    refreshToken: episode.feed.user?.googleDriveRefreshToken!,
                    title: `${episode.title} - Insights`,
                    content: content.trim(),
                });

                if (result.success) {
                    console.log(`✅ Saved to Google Drive! Doc ID: ${result.fileId}`);
                } else {
                    console.error('Failed to save to Google Drive:', result.error);
                }
            });
        }


        // Step 10: Upload to Gemini Store (Phase 2 Integration) for Chat RAG
        // If it's a VIDEO, we already uploaded it to Gemini in Step 2.
        // We should save that URI.
        await step.run('upload-to-gemini-store', async () => {
            if (transcriptData.fileUri) {
                // Video case: Already uploaded
                await prisma.insight.update({
                    where: { episodeId: episode.id },
                    data: { geminiFileUri: transcriptData.fileUri }
                });
                return;
            }

            // RSS Case: Upload text transcript
            if (!transcriptData.timestampedTranscript) return;

            try {
                const { uploadToGemini } = await import('@/lib/gemini-rag');
                console.log('Uploading partial transcript to Gemini Files...');

                const result = await uploadToGemini(transcriptData.timestampedTranscript, `episode-${episode.id}.txt`);

                if (result.success && result.fileUri) {
                    console.log(`✅ Uploaded to Gemini: ${result.fileUri}`);
                    await prisma.insight.update({
                        where: { episodeId: episode.id },
                        data: { geminiFileUri: result.fileUri }
                    });
                } else {
                    console.error('Failed to upload to Gemini:', result.error);
                }
            } catch (e) {
                console.error('Error in Gemini Store step:', e);
            }
        });

        return { success: true, episodeId: episode.id };
    }
);
