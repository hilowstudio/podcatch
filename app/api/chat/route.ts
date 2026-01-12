
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 30;

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { messages, episodeId } = body;

    let episodes;

    if (episodeId) {
        // Episode-specific mode: only fetch the specified episode
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

    const result = await streamText({
        model: google('gemini-1.5-pro'),
        messages,
        system: systemPrompt,
    });

    return result.toTextStreamResponse();
}

