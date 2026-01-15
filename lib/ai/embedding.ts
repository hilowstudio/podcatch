import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { embed, embedMany } from 'ai';

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const embeddingModel = google.textEmbeddingModel('text-embedding-004');

// Google's batch embeddings API allows at most 100 requests per batch
const BATCH_SIZE = 100;

export async function generateEmbedding(text: string): Promise<number[]> {
    const { embedding } = await embed({
        model: embeddingModel,
        value: text,
    });
    return embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    // If within limit, just call directly
    if (texts.length <= BATCH_SIZE) {
        const { embeddings } = await embedMany({
            model: embeddingModel,
            values: texts,
        });
        return embeddings;
    }

    // Split into chunks of BATCH_SIZE and process sequentially
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const chunk = texts.slice(i, i + BATCH_SIZE);
        const { embeddings } = await embedMany({
            model: embeddingModel,
            values: chunk,
        });
        allEmbeddings.push(...embeddings);
    }

    return allEmbeddings;
}

