# Podcatch Codebase Verification & Audit Plan

## Objective
To rigorously audit the "Podcatch" codebase against modern best practices (2025/2026 standards) and mitigate risks associated with "AI-assisted/vibe coding," specifically targeting Next.js 16, React 19, Tailwind 4, and Auth.js v5 patterns.

## 1. "Bleeding Edge" Verification (Syntax & Patterns)
**Goal:** Ensure code uses authentic Next.js 16 / React 19 patterns, not hallucinated hybrids.

### 1.1 React 19 & Next.js 16
- [ ] **Data Fetching:** Scan for outdated `useEffect` fetching. Verify usage of `use` hook and Server Components for data.
- [ ] **Form Actions:** Verify usage of `useActionState` (React 19) instead of `useFormState` (deprecated) or `useState` for form handling.
- [ ] **Turbopack Compatibility:** Confirm no remaining webpack-specific hacks (already largely addressed by Serwist Configurator mode).
- [ ] **Cache API:** Verify usage of `unstable_cache` (or stable `connection` / `cache` APIs if released in Next 16) vs standard `fetch` caching.

### 1.2 Tailwind CSS v4
- [ ] **Configuration:** Check if `tailwind.config.ts/js` is minimal/absent in favor of CSS-first configuration.
- [ ] **Utility Usage:** Audit for verbose class strings that could be replaced by v4's dynamic utilities (e.g. `grid-cols-[150px_1fr]` vs ad-hoc styling).

### 1.3 Auth.js v5
- [ ] **API Usage:** Scan for hallucinated `getServerSession` calls. Verify proper use of `auth()` helper.
- [ ] **Route Handlers:** Verify `export { GET, POST } from "@/auth"` pattern vs manual handler implementation.
- [ ] **Edge Compatibility:** Check if auth callbacks are using Node.js specific APIs inconsistent with Edge Runtime if applicable.

## 2. Abstraction & Glue Code Resilience
**Goal:** Identify fragile dependencies and ensure workflow idempotency.

### 2.1 Dependency Audit
- [ ] **YTDL-Core:** Verify `@distube/ytdl-core` version and verify fallback strategies if YouTube blocks requests.
- [ ] **RSS Parser:** Check error handling for malformed feeds.

### 2.2 Inngest Workflow Integrity
- [ ] **Idempotency:** Audit `process-episode.ts` for step-re-execution safety.
- [ ] **Step Isolation:** Ensure expensive API calls (Deepgram, AI) are wrapped in `step.run()`.
- [ ] **Error Handling:** Verify `retries` configuration and Dead Letter Queue usage.

## 3. Database Integrity & Security
**Goal:** Prevent N+1 queries and ensure unauthorized data access is impossible.

### 3.1 N+1 Query Analysis
- [ ] **Loop Detection:** Scan for `await prisma...` inside `map` or `forEach` loops.
- [ ] **Relation Fetching:** Check for excessive separate queries vs `include` / `select` or specialized queries.

### 3.2 Security (RLS vs Prisma)
- [ ] **Auth Context:** Verify if Supabase RLS policies are being relied upon. (Note: Prisma bypasses RLS by default unless using a specific middleware/adapter setup).
- [ ] **Application-Level Security:** Inspect Server Actions to ensure `session.user.id` is strictly enforced in `where` clauses.

## 4. Client/Server Boundary & Data Leaks
**Goal:** Prevent sensitive data leakage to the client.

### 4.1 Secret Leakage
- [ ] **Prop Audit:** Inspect props passed from Server Pages to Client Components. Look for full `User` objects containing `stripeId` or internal emails.
- [ ] **DTO Enforcement:** Verify usage of Data Transfer Objects (DTOs) to strip sensitive fields.

### 4.2 Payload Size (Serialization)
- [ ] **Hydration Check:** Identify large JSON objects (transcripts, embeddings) passed to client components unnecessarily.

## 5. Accessibility & Semantics
**Goal:** Ensure UI is not just "div soup".

### 5.1 Semantic HTML
- [ ] **Structure:** Scan for `div` usage where `<main>`, `<section>`, `<article>`, `<button>` is appropriate.
- [ ] **Interactive Elements:** Verify `onClick` is not on generic `div`s without `role="button"` and key handlers.

### 5.2 Component Implementation
- [ ] **Radix Patterns:** Audit `Dialog`, `Dropdown` implementations for proper Trigger/Content linkage.
- [ ] **Nesting:** Check for interactive controls nested inside other interactive controls (e.g. `<Switch>` inside a Card that acts as a link).

## 6. Resource Management & AI Safeguards
**Goal:** Prevent cost runaways.

### 6.1 Rate Limiting & Quotas
- [ ] **Input Limits:** Verify character limits on AI prompts/transcripts.
- [ ] **User Quotas:** Check enforcement of "Pro" limits (e.g. 5 episodes/month).

### 6.2 Stream Handling
- [ ] **Error UI:** Verify `useChat` / `useCompletion` error states are handled in the UI.

## Execution Strategy
1.  **Research:** Fetch latest Next.js 16 / React 19 / Tailwind 4 migration guides.
2.  **Scan:** Use `grep_search` and manual review to identify violations.
3.  **Report:** Produce a detailed `AUDIT_REPORT.md`.
4.  **Refactor:** Systematically address high-priority items.
