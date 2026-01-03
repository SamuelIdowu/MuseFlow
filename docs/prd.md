# Product Requirements Document (PRD): Phase 1

---

## 1. Purpose & Scope

**Purpose:** Define requirements and architecture for the MVP of an AI-powered content ideation and publishing platform (Phase 1).

**Scope (Phase 1 Features):**

1. Profile Wizard (Manual + Paste)
2. Text-to-Ideas Engine
3. Smart Canvas (Merged Templates + Blocks)
4. Channel Selector & Export Radios with Live Preview
5. Best-Time Generator
6. Basic Scheduling & Calendar Sync
7. Download/Copy-Paste Export

**Out of Scope:** Multi-admin roles, external integrations beyond gemini for AI functions, social network APIs (to be prioritized post-Phase 1).

---

## 2. Objectives & Success Metrics

| Objective                      | Metric                                   | Target |
| ------------------------------ | ---------------------------------------- | ------ |
| Validate user onboarding flow  | % profiles completed                     | ≥ 50 % |
| Drive ideation usage           | # of idea-sets generated/week/user       | ≥ 3    |
| Canvas adoption                | % of users exporting via Smart Canvas    | ≥ 25 % |
| Multi-format export engagement | % of users exporting ≥ 2 formats         | ≥ 20 % |
| Scheduling uptake              | % of users scheduling ≥ 1 post           | ≥ 10 % |
| Best-time adherence            | % of scheduled posts using AI time value | ≥ 10 % |

---

## 3. User Personas & Roles

* **Creator (Primary):** Individual content creator who wants fast ideation, structure, and easy export.
* **Guest (Unauthenticated):** Limited preview of features (e.g. 1 idea generation, no scheduling).

**Roles:**

* **User:** Registered via supabase; can access all Phase 1 features per plan.

---

## 4. User Stories

### 4.1 Profile Wizard

* **As a User**, I want to enter my niche/persona and paste sample posts so that future AI outputs match my voice.
* **As a User**, I want the system to store my profile for reuse across sessions.

### 4.2 Text-to-Ideas Engine

* **As a User**, I want to paste text or a link and receive 5–10 idea kernels (hooks, angles, prompts).

### 4.3 Smart Canvas

* **As a User**, I want a drag-drop canvas pre-populated with template blocks (Hook, Problem, Solution, CTA) that I can rearrange and AI-expand at block-level.
* **As a User**, I want to regenerate or tweak individual blocks without rewriting the entire draft.

### 4.4 Channel Selector & Export

* **As a User**, I want to select which platforms I target (X, LinkedIn, YouTube) via radio buttons and preview the formatted output in each.

### 4.5 Best-Time Generator

* **As a User**, I want AI-suggested optimal post times based on calendar context and generic engagement patterns.

### 4.6 Scheduling & Calendar Sync

* **As a User**, I want to schedule an export and see it appear on a drag-drop calendar view at the chosen (or AI-suggested) time.

### 4.7 Download/Copy-Paste Export

* **As a User**, I want one-click copy or Markdown/CSV download of my formatted content for manual publishing.

---

## 5. Functional Requirements

### 5.1 Authentication & Authorization

* **supabase** for signup/login (OAuth, email magic links).
* JWT-based session management.

### 5.2 Data Storage

* **Supabase** Postgres for:

  * Users & Profiles
  * IdeaKernels (seed inputs & generated kernels)
  * Canvas Blocks (type, content, order)
  * ScheduledPosts (content, time, channel, status)

### 5.3 AI Integration

* **gemini API:**

  * Endpoint for summarization & idea kernel extraction.
  * Endpoint for block-level expansion/regeneration.
  * Endpoint for best-time prediction (prototype via heuristics; refine in later phases).

### 5.4 Frontend (Next.js / React)

* **Profile Wizard UI:** multi-step form.
* **Editor Page:**

  * Smart Canvas grid (React DnD).
  * Channel Selector component.
  * Live preview pane.
  * Schedule modal with Best-Time suggestion.
* **Calendar View:**

  * Drag-drop scheduler (e.g. FullCalendar.js).

### 5.5 Backend (Node.js / Next.js API Routes)

* **API Endpoints:**

  * `POST /api/profile`: create/update profile.
  * `POST /api/ideas`: generate idea kernels.
  * `POST /api/canvas/expand`: expand/regenerate block.
  * `POST /api/export/preview`: format output for channel preview.
  * `POST /api/schedule`: create scheduled post.
  * `GET /api/schedule`: fetch calendar entries.

### 5.6 Billing (Stripe)

* **Stripe Integration:**

  * Charge on plan upgrade; control feature flags in-app based on subscription.

---

## 6. Technical Architecture

```
[ User (React/Next.js) ]
      |            
      v            
[ Next.js Frontend ] ———> supabase Auth
      |            
      v            
[ Next.js API ]
  |        |       \
  v        v        v
Supabase  gemini  Stripe
  (Postgres)       
      |
      v
[ Calendar Data ]
```

* **Hosting:** Vercel for frontend/API.
* **Database:** Supabase Postgres.
* **Auth:** supabase.
* **AI:** gemini API.
* **Billing:** Stripe.
* **Calendar UI:** FullCalendar.js or similar.

---

## 7. Data Model Overview

```sql
-- Users & Profiles
users(id PK, email, _id, created_at)
profiles(id PK, user_id FK, niche, tone_json, samples JSON, created_at)

-- Idea Kernels
idea_kernels(id PK, user_id FK, input_text, kernels JSON, created_at)

-- Canvas Blocks
canvas_blocks(id PK, user_id FK, canvas_id FK, type, content, order, meta JSON)

-- Scheduled Posts
scheduled_posts(id PK, user_id FK, content JSON, channel, scheduled_time, status)
```

---

## 8. Success Metrics & Monitoring

* **Product Analytics:** Track via Supabase event logging or integrate PostHog.
* **Error Monitoring:** Sentry for frontend/backend errors.
* **Uptime:** Vercel analytics; target 99.9%.

---

## 9. Milestones & Timeline

| Milestone                         | ETA       |
| --------------------------------- | --------- |
| Auth & Profile Wizard MVP         | Week 1–2  |
| Idea Engine & gemini Integration  | Week 3–4  |
| Smart Canvas UI + Block Expansion | Week 5–7  |
| Channel Selector & Export Preview | Week 8    |
| Scheduling UI & Calendar Sync     | Week 9–10 |
| Download/Export & Stripe Setup    | Week 11   |
| QA, Beta Test, Launch             | Week 12   |

---

**Next Steps:** Align engineering resources, set up repos, and begin sprint planning based on the milestones above.
