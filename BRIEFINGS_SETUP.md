# Audio Briefings — R2 & TTS Setup

This is the one-time infrastructure setup to make **Wave 2 / F5 (weekly audio briefings)** actually generate audio. The feature code is already deployed but **dormant**: the `generate-briefing` cron early-returns until the env vars below are set, so nothing breaks in the meantime.

**What's already working without any setup:** the `/briefings` page, the Pro upsell, the enable toggle, and the private-feed URL plumbing. Users just won't receive audio until this is done.

---

## Overview of the pipeline

```
weekly cron (Sunday, per-timezone, Pro + opt-in)
  → gather the week's episode summaries + saved highlights
  → Gemini drafts a spoken script (in the user's language)
  → Gemini 2.5 Flash TTS narrates it  ← needs TTS model access
  → lamejs encodes PCM → MP3 (pure JS, no ffmpeg)
  → upload MP3 to Cloudflare R2        ← needs R2
  → Briefing row; served in-app + via /api/briefings/rss?token=…
```

Two things to provision: **Cloudflare R2** (storage) and **Gemini TTS access**.

---

## Part 1 — Cloudflare R2

**Why R2 (not Supabase Storage / Vercel Blob):** podcast audio is egress-heavy (podcast apps re-download MP3s over RSS). R2 charges **$0 for egress** while the others meter bandwidth — at 100k users that's ~$312/mo on R2 vs ~$1,100–1,200 elsewhere, and the cost is forecastable from user count alone.

### 1.1 Create the bucket
1. Cloudflare dashboard → **R2** → **Create bucket**.
2. Name it `podcatch-audio` (or your choice — must match `R2_BUCKET`).
3. Location: Automatic is fine.

### 1.2 Attach a custom domain  ⚠️ do this before real users exist
Podcast clients **cache the enclosure URL**. If you change the audio host later, already-published feeds break. So pick the final URL now.
1. Bucket → **Settings** → **Public access** → **Custom Domains** → **Connect Domain**.
2. Use a subdomain you control, e.g. `audio.podcatch.app`.
3. Cloudflare adds the DNS + provisions TLS. Once it shows **Active**, the value of `R2_PUBLIC_BASE_URL` is `https://audio.podcatch.app`.
   - (Do **not** use the `*.r2.dev` dev URL for production — it's rate-limited and not meant for serving.)

### 1.3 Create an API token
1. R2 → **Manage R2 API Tokens** → **Create API token**.
2. Permissions: **Object Read & Write**, scoped to the `podcatch-audio` bucket.
3. Copy the **Access Key ID** and **Secret Access Key** (shown once).
4. Your **Account ID** is on the R2 overview page.

### 1.4 Env vars
Set these in **Vercel → Project → Settings → Environment Variables** (Production + Preview) and in your local `.env`:

```bash
R2_ACCOUNT_ID=<cloudflare account id>
R2_ACCESS_KEY_ID=<access key id>
R2_SECRET_ACCESS_KEY=<secret access key>
R2_BUCKET=podcatch-audio
R2_PUBLIC_BASE_URL=https://audio.podcatch.app
```

The client lives in [`lib/r2.ts`](lib/r2.ts); `isR2Configured()` checks all five are present.

---

## Part 2 — Gemini TTS

The briefing narrator uses **`gemini-2.5-flash-preview-tts`** — a *different* model from the `gemini-3.1-pro` used for insights/chat. It reuses your existing `GEMINI_API_KEY`; you just need to confirm that key can call the TTS model.

### 2.1 Confirm model access
Quick check from the repo root (uses your local `GEMINI_API_KEY`):

```bash
node -e "const {GoogleGenAI}=require('@google/genai'); (async()=>{const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY}); const r=await ai.models.generateContent({model:'gemini-2.5-flash-preview-tts', contents:[{parts:[{text:'Hello from Podcatch.'}]}], config:{responseModalities:['AUDIO'], speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Kore'}}}}}); console.log('audio bytes:', r.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data?.length ? 'OK' : 'NONE');})().catch(e=>console.error(e.message))"
```

- Prints `audio bytes: OK` → you're set.
- Errors about model not found / not accessible → the model name or your key's access has changed. Model name is a one-line change in [`lib/tts.ts`](lib/tts.ts) (`TTS_MODEL`). Check the current Gemini TTS model id at https://ai.google.dev/gemini-api/docs/speech-generation.

### 2.2 Voice (optional)
Default voice is `Kore` (warm, neutral). Other prebuilt voices (e.g. `Puck`, `Charon`, `Aoede`) can be swapped in `DEFAULT_VOICE` in [`lib/tts.ts`](lib/tts.ts).

---

## Part 3 — Verify end to end

1. Ensure all env vars are set in Vercel and redeploy (env changes need a redeploy).
2. As a **Pro** user, go to **/briefings** and toggle the weekly briefing **on**. This mints your private feed token and shows the RSS URL.
3. To test without waiting for Sunday, trigger the cron manually from the **Inngest dashboard** → `generate-briefing` → **Invoke** (or temporarily widen the day/hour gate in [`inngest/functions/generate-briefing.ts`](inngest/functions/generate-briefing.ts) — remember to revert).
4. A `Briefing` row should appear; the `/briefings` page lists it with a play button.
5. Paste the RSS URL (`/api/briefings/rss?token=…`) into a podcast app or a feed validator to confirm the enclosure plays.

---

## Cost & operational notes

- **TTS:** ~$0.04–0.06 per briefing (~4k characters). Billed per run; the feature is **opt-in and Pro-only**, and each run writes a `UsageLog` row (`action: 'BRIEFING'`) for metering.
- **Storage:** ~4 MB per briefing on R2 at $0.015/GB-mo, **$0 egress**.
- **Idempotency:** the cron skips any user who already has a briefing in the last 6 days, so retries never double-charge TTS.
- **Feed token:** read-only and revocable — users can reset it from `/briefings` (invalidates the old URL).
- **Retention:** briefings are kept indefinitely today. If you want to cap storage, add a cleanup step that deletes `Briefing` rows + R2 objects older than N weeks.

---

## Files involved

| Purpose | File |
|---|---|
| R2 client | [`lib/r2.ts`](lib/r2.ts) |
| Gemini TTS + MP3 encode | [`lib/tts.ts`](lib/tts.ts) |
| Generation cron | [`inngest/functions/generate-briefing.ts`](inngest/functions/generate-briefing.ts) |
| Token / settings / list actions | [`actions/briefing-actions.ts`](actions/briefing-actions.ts) |
| Private RSS feed | [`app/api/briefings/rss/route.ts`](app/api/briefings/rss/route.ts) |
| In-app page + player | [`app/briefings/page.tsx`](app/briefings/page.tsx), [`components/briefings-view.tsx`](components/briefings-view.tsx) |
