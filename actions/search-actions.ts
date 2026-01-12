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
    const match = text.match(/\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/);
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
        const results = await prisma.$queryRawUnsafe<any[]>(
            `SELECT 
                e."id",
                e."content",
                e."episodeId",
                ep."title" as "episodeTitle",
                ep."publishedAt",
                f."title" as "feedTitle",
                1 - (e."vector" <=> $1::vector) as "similarity"
             FROM "EpisodeEmbedding" e
             JOIN "Episode" ep ON e."episodeId" = ep."id"
             JOIN "Feed" f ON ep."feedId" = f."id"
             JOIN "Subscription" s ON f."id" = s."feedId"
             WHERE s."userId" = $2
             ORDER BY e."vector" <=> $1::vector ASC
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

