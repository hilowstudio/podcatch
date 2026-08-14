-- Knowledge graph is now per-user: entities belong to a single episode instead of
-- a globally name-unique table shared across all tenants. Existing global entities
-- and their many-to-many links are dropped; they re-derive when episodes are
-- (re)processed.

-- Drop the old implicit many-to-many join table.
DROP TABLE IF EXISTS "_EntityToEpisode";

-- Reset the Entity table to the per-episode shape.
TRUNCATE TABLE "Entity";
DROP INDEX IF EXISTS "Entity_name_key";
ALTER TABLE "Entity" ADD COLUMN "episodeId" TEXT NOT NULL;

CREATE UNIQUE INDEX "Entity_episodeId_name_key" ON "Entity"("episodeId", "name");
CREATE INDEX "Entity_episodeId_idx" ON "Entity"("episodeId");
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
