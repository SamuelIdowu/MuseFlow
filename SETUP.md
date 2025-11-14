# 🚀 ContentAI Setup Guide

## Prerequisites

- Node.js 18.x or higher
- pnpm (recommended) or npm
- A Supabase account
- An Gemini API key
- A Stripe account (optional for Phase 1)

## 1. Environment Setup

1. Copy `.env.local` and fill in your actual credentials:

```bash
cp .env.local .env.local.example
```

### Get Supabase Credentials:

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Project Settings → API
4. Copy your `URL` and `anon public` key

### Get Gemini API Key:

1. Go to
2. Navigate to API Keys
3. Create a new secret key

### Configure your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
Gemini_API_KEY=sk-your_Gemini_key_here
```

## 2. Database Setup

1. In your Supabase project dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Run the query

This will create:

- All necessary tables (users, profiles, idea_kernels, canvas_sessions, canvas_blocks, scheduled_posts)
- Row Level Security (RLS) policies
- Indexes for performance
- Automatic user creation trigger

## 3. Supabase Auth Configuration

1. In Supabase Dashboard, go to **Authentication → Providers**
2. Enable **Email** authentication
3. **Configure Email Settings** (IMPORTANT for signup emails):
   - Go to **Authentication → Email Templates**
   - Verify that email confirmation is enabled
   - Go to **Authentication → Settings**
   - Under "Email Auth", ensure:
     - ✅ "Enable email confirmations" is checked (for production)
     - ⚠️ For development/testing, you can disable this to auto-confirm users
   - **Site URL**: Set to `http://localhost:3000` (development) or your production URL
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback` (and production URL)
4. Enable **Google** OAuth (optional):
   - Add Google OAuth client ID and secret
   - Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`
5. Enable **GitHub** OAuth (optional):
   - Add GitHub OAuth app credentials
   - Set redirect URL

### Email Configuration Notes:

- **Development**: If emails aren't being sent, check Supabase logs in the dashboard
- **Production**: Configure SMTP settings in **Project Settings → Auth → SMTP Settings** for custom email delivery
- **Testing**: In development, Supabase may auto-confirm users if email confirmation is disabled

## 4. Install Dependencies

```bash
pnpm install
```

## 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 6. Test Authentication

1. Navigate to `/login`
2. Try logging in with:
   - OAuth (Google/GitHub) if configured
   - Email/Password (you'll need to sign up first at `/signup`)

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Auth routes (login, signup)
│   ├── (dashboard)/     # Protected dashboard routes
│   ├── auth/callback/   # OAuth callback handler
│   └── api/             # API routes
├── components/
│   ├── auth/            # Auth components (OAuth buttons, forms)
│   ├── layouts/         # Layout components
│   └── ui/              # Shadcn UI components
├── lib/
│   ├── supabase/        # Supabase client utilities
│   ├── Gemini.ts        # Gemini API client
│   └── utils.ts         # Utility functions
└── types/               # TypeScript type definitions
```

## Available Scripts

```bash
pnpm dev       # Start development server
pnpm build     # Build for production
pnpm start     # Start production server
pnpm lint      # Run ESLint
```

## Next Steps

### Immediate TODOs:

1. ✅ Environment configuration
2. ✅ Database setup
3. ✅ Authentication flow
4. 🔲 Profile wizard implementation
5. 🔲 Dashboard UI
6. 🔲 Idea generation feature
7. 🔲 Smart Canvas editor

### Phase 1 Features (from PRD):

- [ ] Profile Wizard (Manual + Paste)
- [ ] Text-to-Ideas Engine
- [ ] Smart Canvas (Merged Templates + Blocks)
- [ ] Channel Selector & Export with Live Preview
- [ ] Best-Time Generator
- [ ] Basic Scheduling & Calendar Sync
- [ ] Download/Copy-Paste Export

## Troubleshooting

### Supabase Connection Issues

- Verify your `.env.local` variables are correct
- Check Supabase project is not paused
- Ensure RLS policies are enabled

### OAuth Not Working

- Verify redirect URLs in OAuth provider settings
- Check Supabase Auth provider configuration
- Ensure callback route exists at `/auth/callback`

### Gemini Errors

- Verify API key is valid and has credits
- Check model name is correct (default: gpt-4-turbo-preview)
- Monitor API usage in Gemini dashboard

## Support

For issues or questions:

- Check `docs/architecture.md` for technical details
- Review `docs/prd.md` for product requirements
- See `docs/ui-ux.md` for design specifications
