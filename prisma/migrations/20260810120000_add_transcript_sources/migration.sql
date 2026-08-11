-- Candidate publisher transcripts for an episode: [{ url, type, kind }].
--
-- An RSS item commonly advertises 3-5 <podcast:transcript> tags in different
-- formats. Which one is actually usable can only be determined by fetching it
-- (a URL may 404, and the JSON transcript spec permits segment-level timing as
-- readily as word-level), so the processor needs the whole ranked list rather
-- than a single pre-chosen URL.
ALTER TABLE "Episode" ADD COLUMN IF NOT EXISTS "transcriptSources" JSONB;
