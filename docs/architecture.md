# Technical Architecture Overview

This document outlines the file structure, API endpoints, database schemas, worker setup, CI/CD, and environment management for the Phase 1 MVP of the AI-powered content ideation platform built with Next.js, Supabase, Supabase Auth, Stripe, and Vercel.

---

## 1. File Structure

```
/ (project root)
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # CI/CD pipeline for tests, lint, builds, and deploy
├── worker/                        # Background job handlers (e.g., scheduling tasks)
│   ├── index.ts                  # Entry for job processing
│   ├── jobs/
│   │   └── schedulePost.ts       # Example job: process scheduled posts
│   └── utils/
│       └── supabaseClient.ts     # Initialize Supabase client for worker
├── prisma/                        # (Optional) Prisma schema if used alongside Supabase for migrations
│   └── schema.prisma
├── src/
│   ├── pages/                     # Next.js Pages Router endpoints + pages
│   │   ├── api/
│   │   │   ├── auth/              #  webhook handlers
│   │   │   │   └──
│   │   │   ├── profile.ts         # POST/GET profile management
│   │   │   ├── ideas.ts           # POST generate idea kernels
│   │   │   ├── canvas/
│   │   │   │   ├── expand.ts      # POST block expansion/regeneration
│   │   │   │   └── save.ts        # POST save canvas state
│   │   │   ├── export/
│   │   │   │   ├── preview.ts     # POST preview formatted content
│   │   │   │   └── download.ts    # POST generate download (Markdown/CSV)
│   │   │   ├── schedule.ts        # POST create scheduled post
│   │   │   └── schedule/
│   │   │       └── index.ts       # GET scheduled posts for calendar
│   │   ├── _app.tsx               # App wrapper ( SupabaseProvider)
│   │   └── index.tsx              # Home / landing page
│   ├── components/                # Reusable React components
│   │   ├── SmartCanvas/
│   │   │   ├── Canvas.tsx         # Canvas container
│   │   │   ├── Block.tsx          # Individual block
│   │   │   └── Toolbar.tsx        # Canvas controls
│   │   ├── ChannelSelector.tsx    # Radio buttons for export channels
│   │   ├── BestTimeModal.tsx      # Modal to show AI-suggested times
│   │   ├── CalendarView.tsx       # FullCalendar integration
│   │   └── ...
│   ├── lib/                       # Library utilities
│   │   ├── geminiClient.ts        # Initialize gemini API client
│   │   ├── supabaseClient.ts      # Initialize Supabase client
│   │   └── stripeClient.ts        # Initialize Stripe client
│   ├── hooks/                     # Custom React hooks
│   ├── context/                   # React context providers
│   ├── styles/                    # Global CSS / Tailwind config
│   └── utils/                     # Shared helper functions
├── .env                           # Local environment variables
├── next.config.js                 # Next.js configuration
├── package.json
└── tsconfig.json
```

---

## 2. API Endpoints

| Route                  | Method | Description                                     | Auth Required |
| ---------------------- | ------ | ----------------------------------------------- | ------------- | --- | -------------- | --- | ------------------ | --- |
| `/api/auth/[...slug]`  | ALL    | Supabase webhooks & session handling            | No            |     | `/api/profile` | GET | Fetch user profile | Yes |
| `/api/profile`         | POST   | Create or update user profile                   | Yes           |
| `/api/ideas`           | POST   | Generate idea kernels from input text or link   | Yes           |
| `/api/canvas/expand`   | POST   | AI-expand or regenerate a specific canvas block | Yes           |
| `/api/canvas/save`     | POST   | Persist full canvas state                       | Yes           |
| `/api/export/preview`  | POST   | Get live formatted preview for selected channel | Yes           |
| `/api/export/download` | POST   | Generate downloadable content (Markdown or CSV) | Yes           |
| `/api/schedule`        | POST   | Create a scheduled post entry                   | Yes           |
| `/api/schedule`        | GET    | Retrieve scheduled posts for calendar           | Yes           |

_All endpoints under **`/api`** use Next.js API routes and validate via supabase JWT._

---

## 3. Database Schemas (Supabase)

### 3.1 `users`

| Column     | Type      | Constraints                     |
| ---------- | --------- | ------------------------------- |
| id         | uuid      | PK, default `gen_random_uuid()` |
| email      | text      | unique, not null                |
| \_id       | text      | unique, not null                |
| created_at | timestamp | default `now()`                 |

### 3.2 `profiles`

| Column      | Type      | Constraints           |
| ----------- | --------- | --------------------- |
| id          | uuid      | PK                    |
| user_id     | uuid      | FK → users.id         |
| niche       | text      |                       |
| tone_config | jsonb     | sliders, preferences  |
| samples     | jsonb     | array of sample posts |
| created_at  | timestamp | default `now()`       |

### 3.3 `idea_kernels`

| Column     | Type      | Constraints         |
| ---------- | --------- | ------------------- |
| id         | uuid      | PK                  |
| user_id    | uuid      | FK → users.id       |
| input_type | text      | e.g. `text`, `link` |
| input_data | text      | raw input           |
| kernels    | jsonb     | array of strings    |
| created_at | timestamp | default `now()`     |

### 3.4 `canvas_blocks`

| Column      | Type      | Constraints             |
| ----------- | --------- | ----------------------- |
| id          | uuid      | PK                      |
| canvas_id   | uuid      | FK → canvas_sessions.id |
| user_id     | uuid      | FK → users.id           |
| type        | text      | e.g. `hook`, `body`     |
| content     | text      |                         |
| order_index | integer   |                         |
| meta        | jsonb     | expand history, edits   |
| created_at  | timestamp | default `now()`         |

### 3.5 `canvas_sessions`

| Column     | Type      | Constraints     |
| ---------- | --------- | --------------- |
| id         | uuid      | PK              |
| user_id    | uuid      | FK → users.id   |
| name       | text      |                 |
| created_at | timestamp | default `now()` |

### 3.6 `scheduled_posts`

| Column         | Type      | Constraints          |
| -------------- | --------- | -------------------- |
| id             | uuid      | PK                   |
| user_id        | uuid      | FK → users.id        |
| content_blocks | jsonb     | serialized canvas    |
| channel        | text      | e.g. `linkedin`, `x` |
| scheduled_time | timestamp |                      |
| status         | text      | `scheduled`, `sent`  |
| created_at     | timestamp | default `now()`      |

---

## 4. Worker Configuration

- **Directory:** `/worker`
- **Role:** Process scheduled posts (future Phase 2–4 scheduling jobs).
- **Trigger:** Timer or Vercel Cron (e.g. every minute) invokes `worker/index.ts`.
- **Workflow:**

  1. Query Supabase for `scheduled_posts` with `status = 'scheduled'` and `scheduled_time <= now()`.
  2. For each entry, enqueue or send the post (future API call) and update status to `sent`.

---

## 5. CI/CD & Environment Management

### 5.1 GitHub Actions (ci-cd.yml)

```yaml
name: CI/CD Pipeline
on: [push]
jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: "7"
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 5.2 Environment Variables

Set in Vercel dashboard and `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_PUBLISHABLE_KEY=
_SECRET_KEY=
gemini_API_KEY=
STRIPE_SECRET_KEY=
```

---

## 6. Security & Compliance

- **Auth:** JWT via supabase; secure all `/api` routes withemail checks.
- **Data:** All sensitive keys in env; use Supabase row-level security (RLS) policies.
- **Monitoring:** Sentry for error tracking; Supabase logs for DB events.

---

This architecture provides a robust, scalable foundation for Phase 1 and lays the groundwork for Phases 2–4 enhancements.
