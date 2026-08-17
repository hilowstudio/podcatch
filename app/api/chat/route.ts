
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { MODELS } from '@/lib/ai/models';
import { getUserSubscriptionPlan } from '@/lib/subscription';
import { generateEmbedding } from '@/lib/ai/embedding';
import { languageName } from '@/lib/languages';

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
        const { messages: rawMessages, episodeId, entityName, collectionId } = body;

        // Chat is a paid capability. The UI hides it, but the route must enforce
        // it too — episode chat and library/entity/collection chat are gated
        // independently by plan.
        const plan = await getUserSubscriptionPlan();
        const allowed = episodeId ? plan.canChatAboutEpisode : plan.canChatWithLibrary;
        if (!allowed) {
            return new Response(
                JSON.stringify({ error: 'Chat is a Pro feature. Upgrade to chat with your episodes and library.' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Meter chat against the plan's monthly quota — it runs on the shared
        // system key, so it needs a per-user ceiling.
        const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
        const chatUsage = await prisma.usageLog.count({
            where: { userId: session.user.id, action: 'CHAT_MESSAGE', createdAt: { gte: monthStart } },
        });
        if (chatUsage >= plan.monthlyChatLimit) {
            return new Response(
                JSON.stringify({ error: `You've reached your monthly chat limit (${plan.monthlyChatLimit} messages). It resets at the start of next month.` }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
        }
        await prisma.usageLog.create({
            data: {
                userId: session.user.id,
                action: 'CHAT_MESSAGE',
                targetId: episodeId || collectionId || entityName || null,
            },
        });

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
        } else if (entityName) {
            // Entity-specific mode: fetch episodes mentioning this entity
            console.log(`[Chat API] Fetching context for entity: ${entityName}`);
            episodes = await prisma.episode.findMany({
                where: {
                    feed: {
                        subscriptions: {
                            some: { userId: session.user.id }
                        }
                    },
                    status: 'COMPLETED',
                    insight: { isNot: null },
                    entities: { some: { name: entityName } }
                },
                include: {
                    insight: true,
                    feed: true
                },
                orderBy: { publishedAt: 'desc' },
                take: 10
            });
        } else if (collectionId) {
            // Collection-specific mode: fetch episodes in this collection
            console.log(`[Chat API] Fetching context for collection: ${collectionId}`);
            const collection = await prisma.collection.findUnique({
                where: { id: collectionId, userId: session.user.id },
                include: {
                    episodes: {
                        where: { status: 'COMPLETED', insight: { isNot: null } },
                        include: { insight: true, feed: true },
                    },
                },
            });
            episodes = collection?.episodes || [];
        } else {
            // Library-wide mode: retrieve the episodes most RELEVANT to the
            // question via vector search — not just the newest ones. The user's
            // library can span hundreds of episodes; "5 most recent" silently
            // ignored everything older, so a question about an older episode got
            // no context. Fall back to recent episodes if embedding/vector search
            // is unavailable or finds nothing (e.g. no embeddings yet).
            console.log(`[Chat API] Retrieving library context via vector search`);
            const latestUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')?.content?.trim();

            let episodeIds: string[] = [];
            if (latestUserMessage) {
                try {
                    const queryVector = await generateEmbedding(latestUserMessage);
                    const vectorString = `[${queryVector.join(',')}]`;
                    // Rank the user's own episodes by their single closest chunk to
                    // the query. Scope FIRST (MATERIALIZED CTE) so the per-user
                    // filter can't be dropped by an ANN limit — same reasoning as
                    // searchLibrary in actions/search-actions.ts.
                    const rows = await prisma.$queryRawUnsafe<{ episodeId: string }[]>(
                        `WITH scoped AS MATERIALIZED (
                            SELECT e."episodeId", e."vector"
                            FROM "EpisodeEmbedding" e
                            JOIN "Episode" ep ON e."episodeId" = ep."id"
                            JOIN "Feed" f ON ep."feedId" = f."id"
                            JOIN "Subscription" s ON f."id" = s."feedId"
                            WHERE s."userId" = $2 AND ep."status" = 'COMPLETED'
                         )
                         SELECT "episodeId", MIN("vector" <=> $1::vector) AS distance
                         FROM scoped
                         GROUP BY "episodeId"
                         ORDER BY distance ASC
                         LIMIT 6;`,
                        vectorString,
                        session.user.id
                    );
                    episodeIds = rows.map(r => r.episodeId);
                } catch (err) {
                    console.error('[Chat API] Vector retrieval failed, falling back to recent episodes', err);
                }
            }

            if (episodeIds.length > 0) {
                const found = await prisma.episode.findMany({
                    where: {
                        id: { in: episodeIds },
                        feed: { subscriptions: { some: { userId: session.user.id } } },
                        status: 'COMPLETED',
                        insight: { isNot: null },
                    },
                    include: { insight: true, feed: true },
                });
                // Preserve the relevance order the vector search returned.
                const order = new Map(episodeIds.map((id, i) => [id, i]));
                episodes = found.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
            } else {
                // Fallback: recent episodes (no embeddings yet, or empty query).
                episodes = await prisma.episode.findMany({
                    where: {
                        feed: { subscriptions: { some: { userId: session.user.id } } },
                        status: 'COMPLETED',
                        insight: { isNot: null },
                    },
                    include: { insight: true, feed: true },
                    orderBy: { publishedAt: 'desc' },
                    take: 5,
                });
            }
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

        let systemPrompt: string;
        if (episodeId) {
            systemPrompt = `You are an intelligent podcast assistant. You have access to the transcript of a specific episode the user wants to discuss.

            Answer questions based on the following episode context:

            ${context}

            Be specific and cite relevant parts of the episode. If asked about something not in this episode, let the user know.

            Use citations for timestamps in this format: [MM:SS|id:${episodeId}].
            Example: "As mentioned around [02:30|id:${episodeId}], the speaker said...".`;
        } else if (entityName) {
            systemPrompt = `You are an intelligent podcast assistant. The user wants to discuss "${entityName}" across their podcast library.

            You have access to episodes that mention "${entityName}":

            ${context}

            Synthesize information about "${entityName}" across these episodes. Compare perspectives, highlight key insights, and cite specific episodes.

            Use citations for timestamps in this format: [MM:SS|id:EPISODE_ID].
            Example: "In the episode about growth [02:30|id:123-abc]...".`;
        } else if (collectionId) {
            systemPrompt = `You are an intelligent podcast assistant. The user wants to discuss a curated collection of episodes.

            You have access to the following episodes in this collection:

            ${context}

            Synthesize information across these episodes. Compare perspectives, highlight patterns, and cite specific episodes.

            Use citations for timestamps in this format: [MM:SS|id:EPISODE_ID].
            Example: "As discussed in the episode [02:30|id:123-abc]...".`;
        } else {
            systemPrompt = `You are an intelligent podcast assistant. You have access to the user's recent processed episodes.

            Answer questions based on the following context:

            ${context}

            If the answer is not in the context, say so. Cite the episode title when answering.

            Use citations for timestamps in this format: [MM:SS|id:EPISODE_ID].
            Example: "As mentioned in the intro [02:30|id:123-abc]...".
            If the Episode ID is not clear, fallback to [MM:SS].`;
        }

        // Localize responses to the user's preferred language (source material and
        // the system prompt stay English; Gemini answers in the target language).
        const userPref = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { preferredLanguage: true },
        });
        const targetLang = languageName(userPref?.preferredLanguage);
        if (targetLang) {
            systemPrompt += `\n\nAlways respond in ${targetLang}, regardless of the language of the source material. Keep timestamp citations exactly as instructed.`;
        }

        console.log('[Chat API] Sending request to Gemini');
        console.log('[Chat API] Messages count:', messages.length);

        const result = streamText({
            model: google(MODELS.chat),
            messages,
            system: systemPrompt,
            maxOutputTokens: 4096, // bound per-call cost (runs on the shared system key)
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

