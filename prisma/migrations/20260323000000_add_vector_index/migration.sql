-- Add ivfflat index for efficient cosine similarity search on episode embeddings
-- Using lists=10 for compatibility with smaller database instances
CREATE INDEX IF NOT EXISTS idx_episode_embedding_vector
ON "EpisodeEmbedding"
USING ivfflat ("vector" vector_cosine_ops)
WITH (lists = 10);
