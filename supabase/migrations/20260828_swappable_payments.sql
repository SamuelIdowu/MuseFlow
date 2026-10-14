-- ==============================================================================
-- Migration: Vendor-Agnostic Swappable Payment Gateway Architecture
-- ==============================================================================

-- 1. Add vendor-agnostic subscription fields to public.users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(32) DEFAULT 'free' NOT NULL,
ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(32),
ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_id VARCHAR(255);

-- Ensure current_period_end is timestamp with time zone (or text compatible)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'current_period_end'
  ) THEN
    ALTER TABLE public.users ADD COLUMN current_period_end TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 2. Webhook Idempotency Table (prevents duplicate execution on webhook retries)
CREATE TABLE IF NOT EXISTS public.billing_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(255) NOT NULL UNIQUE,
    provider VARCHAR(64) NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS for billing_webhook_events
ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY IF NOT EXISTS "Service role has full access to billing_webhook_events"
ON public.billing_webhook_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Index for speedy idempotency lookups
CREATE INDEX IF NOT EXISTS idx_billing_webhook_events_event_id ON public.billing_webhook_events (event_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_id ON public.users (subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_customer_id ON public.users (customer_id);
