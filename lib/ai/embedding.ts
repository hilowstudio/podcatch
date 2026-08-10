import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { embed, embedMany } from 'ai';
import { MODELS, EMBEDDING_DIMENSIONS } from './models';

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const embeddingModel = google.textEmbeddingModel(MODELS.embedding);

// Google's batch embeddings API allows at most 100 requests per batch
const BATCH_SIZE = 100;

// Pin the output size — see EMBEDDING_DIMENSIONS in ./models for why this is required.
const providerOptions = { google: { outputDimensionality: EMBEDDING_DIMENSIONS } };

export async function generateEmbedding(text: string): Promise<number[]> {
    const { embedding } = await embed({
        model: embeddingModel,
        value: text,
        providerOptions,
    });
    return embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    // If within limit, just call directly
    if (texts.length <= BATCH_SIZE) {
        const { embeddings } = await embedMany({
            model: embeddingModel,
            values: texts,
            providerOptions,
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
            providerOptions,
        });
        allEmbeddings.push(...embeddings);
    }

    return allEmbeddings;
}

