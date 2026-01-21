-- Add Paystack fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS paystack_subscription_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS paystack_email_token TEXT,
ADD COLUMN IF NOT EXISTS paystack_plan_code TEXT;
