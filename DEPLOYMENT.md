# Deployment Guide for Vercel

This guide outlines the steps to deploy the ContentAI application to Vercel.

## Prerequisites

- A [Vercel](https://vercel.com) account
- A [GitHub](https://github.com), [GitLab](https://gitlab.com), or [Bitbucket](https://bitbucket.org) account
- The project pushed to a repository on one of the above providers

## Environment Variables

You will need to configure the following environment variables in your Vercel project settings. These should match the values in your `.env.local` file, but with production-appropriate values (e.g., production database URL).

| Variable Name | Description |
| :--- | :--- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Your Clerk Publishable Key |
| `CLERK_SECRET_KEY` | Your Clerk Secret Key |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key |
| `GEMINI_API_KEY` | Your Google Gemini API Key |
| `NEXT_PUBLIC_APP_URL` | The URL of your deployed application (e.g., `https://your-project.vercel.app`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | (Optional) Stripe Publishable Key |
| `STRIPE_SECRET_KEY` | (Optional) Stripe Secret Key |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Signing Secret (starts with `whsec_`) |
| `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO` | Stripe Price ID for the Pro plan (Live Mode) |
| `NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS` | Stripe Price ID for the Business plan (Live Mode) |

## Stripe Production Setup

If you are using Stripe, follow these additional steps to switch from **Test Mode** to **Live Mode**:

1.  **Activate Account**: Complete your business profile in the Stripe Dashboard to activate your account.
2.  **Switch to Live Mode**: Toggle the "Test Mode" switch to **Live** in the top-right corner of the Stripe Dashboard.
3.  **Get Live API Keys**:
    - Go to **Developers > API keys**.
    - Reveal your **Live Secret Key** (`sk_live_...`) and **Live Publishable Key** (`pk_live_...`).
    - Update these in your Vercel Environment Variables (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PUBLISHABLE_KEY`).
4.  **Recreate Products & Prices**:
    - **Important**: Products and Prices from Test Mode are **NOT** automatically copied to Live Mode.
    - Go to **Product Catalog** and recreate your "Pro" and "Business" plans manually.
    - Copy the **new Price IDs** (e.g., `price_...`) for the Live versions.
    - Update `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO` and `NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS` env vars with these new IDs.
5.  **Configure Live Webhook**:
    - Go to **Developers > Webhooks**.
    - Add a new endpoint.
    - **Endpoint URL**: `https://your-production-domain.com/api/webhooks/stripe`
    - **Events to listen for**:
         - `checkout.session.completed`
        - `invoice.payment_succeeded`
        - `customer.subscription.updated`
        - `customer.subscription.deleted`
    - Click **Add endpoint**.
    - Reveal the **Signing secret** (`whsec_...`) in the top-right of the webhook page.
    - Add this to your Vercel Environment Variables as `STRIPE_WEBHOOK_SECRET`.

## Deployment Steps

1.  **Log in to Vercel**: Go to [vercel.com](https://vercel.com) and log in.
2.  **Add New Project**: Click on the "Add New..." button and select "Project".
3.  **Import Repository**: Select the Git repository containing your project.
4.  **Configure Project**:
    - **Framework Preset**: Vercel should automatically detect "Next.js".
    - **Root Directory**: Leave as `./` unless you moved the app.
    - **Build Command**: `next build` (default)
    - **Output Directory**: `.next` (default)
    - **Install Command**: `pnpm install` (or `npm install` / `yarn install` depending on your lockfile)
5.  **Environment Variables**: Expand the "Environment Variables" section and add all the variables listed above.
6.  **Deploy**: Click "Deploy".

## Post-Deployment

1.  **Clerk Configuration**:
    - Update your Clerk application settings to allow the new Vercel domain.
    - Add the Vercel domain to "Allowed Origins" if necessary.
    - Update the "Redirect URLs" in Clerk to point to your Vercel domain (e.g., `https://your-project.vercel.app/sign-in`, `https://your-project.vercel.app/sign-up`).
2.  **Supabase Configuration**:
    - Ensure your Supabase project is accepting requests from your Vercel domain (if you have any specific restrictions).
    - Update the "Site URL" in Supabase Auth settings to your Vercel domain.

## Troubleshooting

- **Timeouts**: The AI generation routes are configured with `maxDuration = 60` seconds. If you experience timeouts, ensure you are on a Vercel plan that supports this duration (Hobby plan limits serverless functions to 10s by default, but newer Next.js versions on Vercel may handle this differently or require Pro).
- **Build Errors**: Check the build logs in Vercel for any TypeScript or linting errors.
