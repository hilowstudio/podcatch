
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

    const { messages } = await req.json();

    // Fetch recent episodes with transcripts for context (Limit 5 for speed/relevance in this Demo)
    // In production, we would use a Vector Store or specialized generic retrieval.
    const recentEpisodes = await prisma.episode.findMany({
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

    const context = recentEpisodes.map(ep => `
    [EpisodeID: ${ep.id}]
    [Episode: ${ep.title}]
    [Podcast: ${ep.feed.title}]
    [Date: ${ep.publishedAt.toISOString()}]
    [Summary: ${ep.insight?.summary}]
    [Transcript Excerpt: ${ep.insight?.transcript?.slice(0, 50000)}...] 
    `).join('\n\n');

    const result = await streamText({
        model: google('gemini-1.5-pro'),
        messages,
        system: `You are an intelligent podcast assistant. You have access to the user's recent processed episodes.
        
        Answer questions based on the following context:
        
        ${context}
        
        If the answer is not in the context, say so. Cite the episode title when answering.
        
        Use citations for timestamps in this format: [MM:SS|id:EPISODE_ID]. 
        Example: "As mentioned in the intro [02:30|id:123-abc]...".
        If the Episode ID is not clear, fallback to [MM:SS].`,
    });

    return result.toTextStreamResponse();
}
