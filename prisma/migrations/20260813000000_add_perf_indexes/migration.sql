-- Composite index for the billing/quota hot path: the funder groupBy filters
-- userId + action + createdAt on every episode process (UsageLog is append-only).
CREATE INDEX IF NOT EXISTS "UsageLog_userId_action_createdAt_idx" ON "UsageLog"("userId", "action", "createdAt");

-- Composite index for the feed page: filter by feedId, order by publishedAt.
CREATE INDEX IF NOT EXISTS "Episode_feedId_publishedAt_idx" ON "Episode"("feedId", "publishedAt");
