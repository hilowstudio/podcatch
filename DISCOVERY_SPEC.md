# Expand Your Brain — Outward Discovery (spec)

Build spec for the discovery feature that *replaces* the removed inward "For You"
rail (F3). This is deliberately a **future build**, not a bolt-on — captured here
so it can be picked up cleanly.

---

## Positioning — read this first

This feature exists to serve the **second-brain / processing wedge**, not to make
us a listening app. Every design decision follows from that:

- **Discovery here = surfacing *new* shows/episodes worth *adding to the brain*** — things the user has never encountered, that match what they clearly care about.
- **Not** "play next in your library." That was F3; it recommended already-consumed episodes on a flawed signal (processing happens around listening, and we can't know what a user heard in another app), and it quietly asserted a listening-layer position we haven't earned.
- **Frame everything as "worth adding to your brain,"** never "play this." The primary action is **Add to library** (subscribe / queue for processing), not a play button. We assume the user listens wherever they already listen.
- **Reach the whole podcast universe** via an external index — not just the shows someone on Podcatch happens to have processed (that corpus is thin early on).

### Explicitly out of scope
- No play-next, no queue, no "continue listening."
- No recommending the user's own already-processed / subscribed episodes.
- No inferring what was "listened to."

---

## The taste signal (we already have the raw material)

Derive a per-user **taste profile** from data we already store:

1. **Knowledge graph** — `Entity` rows (PERSON / BOOK / CONCEPT / ORGANIZATION / TECHNOLOGY) per episode, aggregated per user in [`actions/graph-actions.ts`](actions/graph-actions.ts). The user's most frequent / most-connected entities are their explicit topics of interest.
2. **Embeddings** — `EpisodeEmbedding` vectors for their processed episodes; the centroid is their latent taste vector (same math the removed F3 cron used, and the same `MATERIALIZED`-CTE user scoping as [`actions/search-actions.ts`](actions/search-actions.ts)).
3. **Strong-interest signals** — `Snip` (highlights) and `Collection` membership weight certain episodes/topics higher.

Cache this profile (top N entities + centroid) so we don't recompute it per view.

---

## Candidate sources

**Primary — external podcast index (the whole universe):**
- **iTunes Search API** — already integrated ([`actions/itunes.ts`](actions/itunes.ts), [`lib/itunes.ts`](lib/itunes.ts), the `PodcastDiscovery` component + `/search` Discover tab). No auth. Coarse (term/genre search), but zero new dependency and already wired.
- **Podcast Index API** (podcastindex.org) — free developer key, full catalog, richer search + category endpoints. Auth is a per-request signed header (API key + secret + sha1 of key+secret+timestamp). Better coverage/relevance than iTunes; add if iTunes proves too coarse.

**Secondary (optional, later) — our processed corpus:** episodes other users have processed but this user hasn't. "People-like-you" discovery, reusing pgvector. Feeds/episodes are public podcast content (unlike the per-user knowledge graph), so this is safe. Thin early; valuable as the base grows.

---

## Ranking

Two-stage, so we get both breadth and relevance:

1. **Retrieve** — query the external index with the user's top topics/entities (from the graph) → candidate *shows*/episodes.
2. **Re-rank** — embed each candidate's title+description, cosine against the user's taste centroid; drop feeds they already subscribe to or have processed; apply **diversity** (cap per show, mix across their top topics so it isn't all one theme).
3. **Explain** — attach a reason per card: *"Because your brain goes deep on {entity/topic}."* The "why" is a feature, not decoration — it reinforces that this came from *their* brain.

---

## Surface & UX

- Lives on the **`/search` Discover tab** (alongside the existing manual iTunes search), or its own "Expand your brain" section — **not** the home dashboard's old play-next slot.
- **Card:** show art, title, the "why" line, and a primary **Add to library** action (subscribe, optionally auto-process the latest episode). A secondary "Preview" may link out to where they listen.
- **Copy** stays brain-centric ("add to your brain", "worth exploring"), never "play"/"listen next".
- Optional feedback: dismiss / not-interested, to sharpen future rounds.

---

## Data model

- **Taste profile cache** — either a small table (`userId`, `topEntities Json`, `centroid`, `updatedAt`) or computed-and-cached in memory/Redis. Avoids recomputing the graph aggregation + centroid per view.
- **Suggestion cache** (recommended) — `DiscoverySuggestion(userId, externalId/feedId, source, score, reason, createdAt)` refreshed on a cadence, so the Discover tab is instant and we respect external-API rate limits. On "Add to library," resolve the external id → create/subscribe `Feed` and fire the existing `feed/check.requested` / `episode/process.requested` events.
- No "played"/"listened" columns anywhere.

---

## Freshness / jobs

- Refresh suggestions **weekly or on-demand**, cached per user for a few days (external API rate limits + cost control). A light Inngest cron mirrors the other weekly jobs, or compute lazily on first Discover-tab view with a TTL cache.

---

## Code touchpoints (when built)

| Purpose | Where |
|---|---|
| Build taste profile (graph + embeddings) | new `actions/discovery-actions.ts`, reusing `graph-actions` aggregation + pgvector |
| External catalog client | extend [`actions/itunes.ts`](actions/itunes.ts) / [`lib/itunes.ts`](lib/itunes.ts), or new `lib/podcast-index.ts` |
| Re-rank by taste centroid | pgvector, same pattern as `search-actions.ts` |
| Discover surface | component in the `/search` Discover tab |
| "Add to library" | reuse `addFeed` / `subscribeToYoutubeChannel` + the `feed/check.requested` event |
| Any raw feed/URL fetch | route through [`lib/ssrf.ts`](lib/ssrf.ts) `safeFetch` |

---

## Cost & gating

- **Cost:** external index is free/cheap; embedding candidate descriptions is a small Gemini embedding spend (cache it). No TTS, no heavy compute.
- **Gating:** align with the knowledge graph — **Basic + Pro** (`canUseKnowledgeGraph`), since discovery is powered by the graph. (Could open to all tiers if used as a growth lever; default Basic+.)

---

## Suggested phasing

- **Phase 1 (MVP):** top 3–5 topics/entities from the graph → query the podcast index → exclude existing subscriptions → present as "Expand your brain" cards with **Add to library**. No vector re-rank yet. Ships the core value fast.
- **Phase 2:** taste-centroid re-ranking, diversity, per-card "why", suggestion cache + weekly refresh.
- **Phase 3:** processed-corpus "people-like-you" signal as the base grows; dismiss/added feedback loop to improve ranking.

---

## The one-line test for any future change here

*Does this help the user find something new worth adding to their brain — without pretending we're the app they listen in?* If not, it doesn't belong in this feature.
