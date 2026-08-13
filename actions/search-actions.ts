'use server';

import { auth } from '@/auth';
import { generateEmbedding } from '@/lib/ai/embedding';
import { prisma } from '@/lib/prisma';

export interface SearchResult {
    id: string;
    content: string;
    similarity: number;
    episodeId: string;
    episodeTitle: string;
    publishedAt: Date;
    feedTitle?: string;
    timestamp?: number; // Seconds into the episode
}

// Extract timestamp from text like "[12:34]" or "[1:23:45]"
function extractTimestamp(text: string): number | undefined {
    const match = text.match(/\[(\d{1,3}):(\d{2})(?::(\d{2}))?\]/);
    if (!match) return undefined;

    if (match[3]) {
        // HH:MM:SS format
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const seconds = parseInt(match[3], 10);
        return hours * 3600 + minutes * 60 + seconds;
    } else {
        // MM:SS format
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        return minutes * 60 + seconds;
    }
}

export async function searchLibrary(query: string): Promise<SearchResult[]> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    try {
        // 1. Generate embedding for query
        const queryVector = await generateEmbedding(query);
        const vectorString = `[${queryVector.join(',')}]`;

        // 2. Perform Cosine Similarity Search
        // Note: Using <=> operator for cosine distance (smaller is better), so we order by it ASC.
        // We calculate similarity as 1 - distance.
        // Scope to the user's own embeddings FIRST (MATERIALIZED CTE), then order by
        // distance. Ordering over the global ivfflat index and applying the user
        // filter afterwards (as the flat joined query did) lets the ANN LIMIT drop the
        // user's relevant chunks before they're ever considered — silently
        // under-returning. An exact sort over one user's library is correct and fast.
        const results = await prisma.$queryRawUnsafe<any[]>(
            `WITH scoped AS MATERIALIZED (
                SELECT e."id", e."content", e."episodeId", e."vector",
                       ep."title" AS "episodeTitle", ep."publishedAt", f."title" AS "feedTitle"
                FROM "EpisodeEmbedding" e
                JOIN "Episode" ep ON e."episodeId" = ep."id"
                JOIN "Feed" f ON ep."feedId" = f."id"
                JOIN "Subscription" s ON f."id" = s."feedId"
                WHERE s."userId" = $2
             )
             SELECT "id", "content", "episodeId", "episodeTitle", "publishedAt", "feedTitle",
                    1 - ("vector" <=> $1::vector) AS "similarity"
             FROM scoped
             ORDER BY "vector" <=> $1::vector ASC
             LIMIT 10;`,
            vectorString,
            session.user.id
        );

        // 3. Map results with timestamp extraction
        return results.map((r: any) => ({
            id: r.id,
            content: r.content,
            similarity: r.similarity,
            episodeId: r.episodeId,
            episodeTitle: r.episodeTitle,
            publishedAt: new Date(r.publishedAt),
            feedTitle: r.feedTitle,
            timestamp: extractTimestamp(r.content)
        }));

    } catch (error) {
        console.error('Search failed:', error);
        return [];
    }
}

