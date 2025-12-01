# 🚀 ContentAI Setup Guide

## Prerequisites

- Node.js 18.x or higher
- pnpm (recommended) or npm
- A Clerk account
- A Gemini API key
- A Supabase account
- A Stripe account (optional for Phase 1)

## 1. Environment Setup

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### Get Required API Keys:

#### Clerk Authentication:
1. Go to [clerk.com](https://clerk.com)
2. Create a new application
3. Go to API Keys in the dashboard
4. Copy your `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`

#### Supabase Database:
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Copy your `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

#### Google Gemini AI:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy your `GEMINI_API_KEY`

### Configure your `.env.local`:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
CLERK_SECRET_KEY=your_secret_key_here

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Stripe (Optional Phase 1)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_public_stripe_key_here

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 2. Clerk Setup

1. In your Clerk dashboard, configure your application settings:
   - **Application Name**: ContentAI
   - **Application URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000`, `http://localhost:3000/sign-in`, `http://localhost:3000/sign-up`

2. Configure **Email & Phone** authentication:
   - Enable **Email code** authentication method
   - Set up email templates in **Settings → Email templates**

3. Configure **Social Login** providers (optional):
   - Go to **Settings → OAuth & Social**
   - Add Google, GitHub, or other OAuth providers
   - Set redirect URLs to your application domain

4. Configure webhooks (IMPORTANT):
   - Go to **Webhooks** in Clerk dashboard
   - Add endpoint: `http://localhost:3000/api/auth`
   - Subscribe to events: `user.created`, `user.updated`, `user.deleted`
   - This syncs users from Clerk to Supabase automatically

## 3. Supabase Setup

1. In your Supabase dashboard, go to the SQL Editor
2. Run the `schema.sql` file to create all tables and policies
3. Verify tables were created: `users`, `profiles`, `idea_kernels`, `canvas_sessions`, `canvas_blocks`, `scheduled_posts`

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

1. Navigate to `/sign-up`
2. Create an account with email verification
3. Verify the user was created in both Clerk and Supabase
4. Try accessing protected routes like `/dashboard`

## 7. Test Features

1. **Profile Setup**: Go to `/dashboard/profile` and create your content profile
2. **Idea Generation**: Go to `/dashboard` and generate content ideas
3. **Canvas**: Go to `/dashboard/canvas` and create/edit content blocks
4. **Scheduling**: Go to `/dashboard/schedule` and schedule posts

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx             # Root layout with ClerkProvider
│   ├── page.tsx              # Landing page
│   ├── dashboard/            # Protected dashboard routes
│   ├── sign-in/              # Clerk sign-in page
│   ├── sign-up/              # Clerk sign-up page
│   └── api/                  # API routes with Clerk authentication
├── components/               # Reusable UI components
├── lib/                      # Utilities and service clients
│   ├── geminiClient.ts       # Google Gemini AI integration
│   ├── supabaseClient.ts     # Supabase browser client
│   ├── supabaseServerClient.ts # Supabase server client
│   ├── supabaseService.ts    # Database service layer
│   └── utils.ts              # General utilities
└── middleware.ts             # Clerk route protection
```

---

## Available Scripts

```bash
pnpm dev       # Start development server
pnpm build     # Build for production
pnpm start     # Start production server
pnpm lint      # Run ESLint
```

---

## Troubleshooting

### Authentication Issues
- **Clerk webhook not working**: Ensure webhook endpoint is `http://localhost:3000/api/auth` and the correct events are subscribed
- **RLS policies failing**: Verify the webhook created users in Supabase users table
- **"User not synced" error**: Check that Clerk webhooks are firing and creating Supabase users

### Database Issues
- **Foreign key errors**: Ensure users exist in Supabase before creating profiles/ideas
- **RLS policy errors**: Check that the Clerk webhook is working properly
- **Connection issues**: Verify all Supabase environment variables are set correctly

### AI Integration
- **Gemini API errors**: Check API key is valid and has proper permissions
- **Empty responses**: Verify the API key has quota remaining

### Other Issues
- **"Module not found"**: Run `pnpm install` to ensure all dependencies are installed
- **Build errors**: Check TypeScript compilation with `pnpm build`

---

## Support

For issues or questions:
- Check the project README for basic information
- Review `docs/architecture.md` for technical details
- Check `docs/prd.md` for product requirements
- See `docs/ui-ux.md` for design specifications

---

## Next Steps

✅ **Completed Setup:**
1. Environment configuration
2. Clerk authentication and webhooks
3. Supabase database with schema migration
4. Authentication system integration
5. Core feature implementation (Profile, Ideas, Canvas, Schedule)

**Ready for Production Use:**
- All critical authentication issues have been resolved
- Database RLS policies work correctly with Clerk
- Full feature set is functional
- Error handling and user feedback implemented

**Remaining Optional Tasks:**
- Add unit tests
- Implement Stripe billing
- Add background job processing
- Deploy to production hosting

**Ready to ship! 🚀**
