
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new Response('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { messages: rawMessages, episodeId } = body;

        // Convert from new AI SDK format (parts[]) to standard format (content string)
        const messages = rawMessages.map((msg: any) => {
            // If message already has content string, use it
            if (typeof msg.content === 'string') {
                return { role: msg.role, content: msg.content };
            }
            // If message has parts array, extract text from parts
            if (msg.parts && Array.isArray(msg.parts)) {
                const textContent = msg.parts
                    .filter((p: any) => p.type === 'text')
                    .map((p: any) => p.text)
                    .join('');
                return { role: msg.role, content: textContent };
            }
            // Fallback
            return { role: msg.role, content: msg.text || '' };
        });

        let episodes;

        if (episodeId) {
            // Episode-specific mode: only fetch the specified episode
            console.log(`[Chat API] Fetching context for episode: ${episodeId}`);
            episodes = await prisma.episode.findMany({
                where: {
                    id: episodeId,
                    feed: {
                        subscriptions: {
                            some: { userId: session.user.id }
                        }
                    },
                    status: 'COMPLETED',
                    insight: {
                        isNot: null
                    }
                },
                include: {
                    insight: true,
                    feed: true
                },
                take: 1
            });
        } else {
            // Library-wide mode: fetch recent episodes
            console.log(`[Chat API] Fetching library context`);
            episodes = await prisma.episode.findMany({
                where: {
                    feed: {
                        subscriptions: {
                            some: { userId: session.user.id }
                        }
                    },
                    status: 'COMPLETED',
                    insight: {
                        isNot: null
                    }
                },
                include: {
                    insight: true,
                    feed: true
                },
                orderBy: {
                    publishedAt: 'desc'
                },
                take: 5
            });
        }

        console.log(`[Chat API] Found ${episodes.length} episodes for context`);

        const context = episodes.map(ep => `
        [EpisodeID: ${ep.id}]
        [Episode: ${ep.title}]
        [Podcast: ${ep.feed.title}]
        [Date: ${ep.publishedAt.toISOString()}]
        [Summary: ${ep.insight?.summary}]
        [Transcript: ${ep.insight?.transcript?.slice(0, episodeId ? 100000 : 50000)}...] 
        `).join('\n\n');

        const systemPrompt = episodeId
            ? `You are an intelligent podcast assistant. You have access to the transcript of a specific episode the user wants to discuss.
            
            Answer questions based on the following episode context:
            
            ${context}
            
            Be specific and cite relevant parts of the episode. If asked about something not in this episode, let the user know.
            
            Use citations for timestamps in this format: [MM:SS|id:${episodeId}]. 
            Example: "As mentioned around [02:30|id:${episodeId}], the speaker said...".`
            : `You are an intelligent podcast assistant. You have access to the user's recent processed episodes.
            
            Answer questions based on the following context:
            
            ${context}
            
            If the answer is not in the context, say so. Cite the episode title when answering.
            
            Use citations for timestamps in this format: [MM:SS|id:EPISODE_ID]. 
            Example: "As mentioned in the intro [02:30|id:123-abc]...".
            If the Episode ID is not clear, fallback to [MM:SS].`;

        console.log('[Chat API] Sending request to Gemini');
        console.log('[Chat API] Messages count:', messages.length);

        const result = streamText({
            model: google('gemini-3-pro-preview'),
            messages,
            system: systemPrompt,
        });

        console.log('[Chat API] Returning stream response');
        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error('[Chat API Error]:', error);
        return new Response(JSON.stringify({ error: 'Failed to process chat request' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

