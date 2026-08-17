-- Highlights: snips gain an optional user title and a public-sharing flag so a
-- single highlight can be exposed at /snip/[id]. The transcript quote is stored
-- in the existing Snip.content column (populated at capture from word timestamps).

ALTER TABLE "Snip" ADD COLUMN "title" TEXT;
ALTER TABLE "Snip" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
