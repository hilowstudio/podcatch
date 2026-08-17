-- Multilingual: a per-user preferred language, and an on-demand translation
-- cache on Insight. Translation is per-viewer and cached per language (keyed by
-- IETF code) — never baked into the shared insight, since one episode's insight
-- is shared across every user who processed or viewed it.

ALTER TABLE "User" ADD COLUMN "preferredLanguage" TEXT;
ALTER TABLE "Insight" ADD COLUMN "translations" JSONB;
