# Podcatch Tech Stack

## 1. Frontend Core
- **Framework**: [Next.js 16.1.1](https://nextjs.org/) (App Router)
- **Bundler**: Turbopack (Native Next.js 16)
- **Language**: TypeScript 5.x
- **UI Library**: React 19 (RC)
- **State Management**: React Server Components (RSC) + Server Actions
- **Styling**: 
  - [Tailwind CSS v4](https://tailwindcss.com/) (PostCSS)
  - `clsx` + `tailwind-merge` (Class utility)
  - `tw-animate-css` (Animation utilities)
- **Component Primitives**: [Radix UI](https://www.radix-ui.com/) (Accessible unstyled components)
  - Dialog, Dropdown, Tabs, Switch, Slider, Popover, etc.
- **Icons**: [Lucide React](https://lucide.dev/)

## 2. Backend & Database
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **ORM**: [Prisma 7.2](https://www.prisma.io/)
  - `@prisma/adapter-pg` (Serverless-ready driver)
- **API Architecture**: Next.js Server Actions + Route Handlers
- **Background Jobs**: [Inngest](https://www.inngest.com/)
  - Durable workflow engine for processing podcasts and AI tasks.

## 3. PWA & Mobile (PWA 2.0)
- **Engine**: [Serwist](https://serwist.pages.dev/) 9.5 (Configurator Mode)
- **Features**:
  - Offline Support (Service Worker)
  - Installability (Manifest, Asset Links)
  - Push Notifications (Web Push)
  - Background Sync
- **Bundler Integration**: CLI-based post-build step (Bundler-agnostic)

## 4. Artificial Intelligence
- **Orchestration**: [Vercel AI SDK](https://sdk.vercel.ai/) 3.x
- **Models & Providers**:
  - **Google Gemini**: `@ai-sdk/google`, `@google/generative-ai`
  - **Anthropic Claude**: `@ai-sdk/anthropic`, `@anthropic-ai/sdk`
  - **OpenAI**: `openai` client (fallback/legacy?)
  - **Deepgram**: `@deepgram/sdk` (Professional Audio Transcription)

## 5. Media & Content
- **Audio Visualization**: [wavesurfer.js](https://wavesurfer-js.org/)
- **Podcast Processing**:
  - `rss-parser` (Feed ingestion)
  - `itunes-search` (Discovery)
- **Video Processing**:
  - `@distube/ytdl-core` (YouTube Metadata/Audio)
  - `youtube-transcript` (Caption extraction)
  - `srt-parser-2` (Subtitle parsing)

## 6. Authentication & Security
- **Auth Provider**: [Auth.js v5](https://authjs.dev/) (NextAuth Beta)
  - `@auth/prisma-adapter` for database persistence
- **Validation**: `zod` + `react-hook-form`

## 7. Third-Party Integrations
- **Payments**: [Stripe](https://stripe.com/)
- **Email**: [Resend](https://resend.com/)
- **Productivity**: `@notionhq/client` (Notion Integration)
- **Google Integration**: `googleapis` (YouTube/Drive API access)

## 8. Development & Quality
- **Linting**: ESLint 9
- **Formatting**: Prettier (implied)
- **Deployment**: Vercel
