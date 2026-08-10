// Central registry of the Gemini models this app uses.
//
// Keyed by ROLE, not by model name, so swapping a model is a one-line change and
// call sites never go stale. Google retires model IDs on its own schedule, and a
// retired ID fails at call time even though ListModels still advertises it — run
// `npx tsx scripts/check-models.ts` to verify every entry here is still live.

export const MODELS = {
    /** Transcript -> structured insights. Quality matters more than latency. */
    insights: 'gemini-3.1-pro-preview',
    /** Interactive chat over transcripts; streams to the client. */
    chat: 'gemini-3.1-pro-preview',
    /** Cross-episode synthesis: collections and custom studio prompts. */
    synthesis: 'gemini-3.1-pro-preview',
    /** Embeddings. Coupled to EMBEDDING_DIMENSIONS below — change them together. */
    embedding: 'gemini-embedding-2',
} as const;

// The gemini-embedding-* models return 3072 dimensions by default, but
// EpisodeEmbedding.vector is vector(768). Every embed call must pin this value or
// both inserts and similarity queries fail. Changing it requires a matching column
// migration plus a full re-embed of the existing rows.
export const EMBEDDING_DIMENSIONS = 768;
