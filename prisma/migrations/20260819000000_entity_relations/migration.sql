-- Typed entity relationships extracted from full transcripts (AUTHORED, FOUNDED,
-- HEALS, ...), so the knowledge graph can render meaningful edges instead of only
-- co-occurrence. source/target hold entity names.

CREATE TABLE IF NOT EXISTS "EntityRelation" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EntityRelation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EntityRelation_episodeId_idx" ON "EntityRelation"("episodeId");
ALTER TABLE "EntityRelation" ADD CONSTRAINT "EntityRelation_episodeId_fkey"
    FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
