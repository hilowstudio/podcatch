-- Non-destructive entity filtering: hide low-value entities from the graph
-- (e.g. incidental first-name-only references to private individuals) without
-- deleting the row. IF NOT EXISTS so it reconciles if pre-created out of band.

ALTER TABLE "Entity" ADD COLUMN IF NOT EXISTS "excluded" BOOLEAN NOT NULL DEFAULT false;
