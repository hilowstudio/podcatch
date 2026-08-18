-- Cache of topic seeds for "Expand your brain" discovery. Derived from the
-- knowledge graph when it's populated, else LLM-extracted from the user's
-- episode insights; refreshed weekly so we don't recompute per view.

ALTER TABLE "User" ADD COLUMN "discoveryTopics" JSONB;
ALTER TABLE "User" ADD COLUMN "discoveryTopicsAt" TIMESTAMP(3);
