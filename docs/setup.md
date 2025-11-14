# 🧭 Project Setup Guide

**Project:** AI-Powered Content Ideation & Publishing Platform\
**Tech Stack:** Next.js (App Router), Supabase, Supaase Auth, Stripe, gemini,
Shadcn UI, TailwindCSS, TypeScript

## 1. ⚙️ Environment Prerequisites

Ensure you have the following installed:

``` bash
node -v      # >= 18.x
pnpm -v      # Recommended package manager
git --version
```

## 2. 🧱 Create Next.js Project

``` bash
npx create-next-app@latest ai-content-tool --typescript --tailwind --eslint
cd ai-content-tool
```

When prompted: - TypeScript: Yes\
- ESLint: Yes\
- TailwindCSS: Yes\
- App Router: Yes\
- Import alias: @/\*

## 3. 🧩 Install Core Dependencies

### UI Frameworks & Animations

``` bash
pnpm install @radix-ui/react-icons lucide-react framer-motion class-variance-authority clsx tailwind-merge
```

### Shadcn/UI Setup

``` bash
pnpm dlx shadcn-ui@latest init
pnpm shadcn add button card input textarea tabs accordion dialog sheet toast calendar navigation-menu select radio-group
```

## 4. 🎨 Tailwind Configuration

Update `tailwind.config.ts` with extended theme and plugins.

## 5. 🔑 Setup Supabase Authentication

## 6. 🧠 Connect Supabase Database

``` bash
pnpm install @supabase/supabase-js
```

## 7. 💳 Add Stripe for Billing

``` bash
pnpm install stripe
```

## 8. 🤖 Connect gemini API

``` bash
pnpm install gemini
```

## 9. 🗓 Add Calendar and Drag-Drop Support

``` bash
pnpm install react-big-calendar date-fns react-beautiful-dnd
```

## 10. 🔧 Additional Utilities

``` bash
pnpm install axios zod react-hot-toast date-fns
```

## 11. 🧵 Directory Structure

Describes full folder layout for Next.js app with `/app`, `/components`,
`/lib`.

## 12. 🧪 Running the Project

``` bash
pnpm run dev
```

## 13. 🧰 Optional Enhancements

  Feature            Tool
  ------------------ --------------------------------
  Error monitoring   @sentry/nextjs
  Analytics          posthog-js or vercel/analytics
  Form handling      react-hook-form + zod
  State management   Context API or Zustand
