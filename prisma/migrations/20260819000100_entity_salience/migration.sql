-- Per-episode salience (0-1) from full-transcript extraction, for graph node sizing.
ALTER TABLE "Entity" ADD COLUMN IF NOT EXISTS "salience" DOUBLE PRECISION;
