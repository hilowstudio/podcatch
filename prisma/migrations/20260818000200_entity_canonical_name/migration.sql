-- Canonicalization: a grouping key that merges variants of the same entity
-- ("Jesus" / "Jesus Christ" / "Christ") without losing the raw extracted name.
-- The knowledge graph aggregates by COALESCE(canonicalName, name). Populated by a
-- clustering pass; null means "not yet canonicalized" and falls back to name.
-- IF NOT EXISTS so it reconciles cleanly if the column was pre-created out of band.

ALTER TABLE "Entity" ADD COLUMN IF NOT EXISTS "canonicalName" TEXT;
