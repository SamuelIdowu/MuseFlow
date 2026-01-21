-- Migration to replace Paystack columns with Flutterwave columns

-- 1. Rename existing columns if possible, or drop and add. 
-- Since we are moving providers, we likely want to just add new ones and ignore old ones, or drop old ones.
-- The plan says "Remove Paystack columns, Add Flutterwave columns".

ALTER TABLE public.users
DROP COLUMN IF EXISTS paystack_customer_code,
DROP COLUMN IF EXISTS paystack_subscription_code,
DROP COLUMN IF EXISTS paystack_plan_code,
DROP COLUMN IF EXISTS paystack_email_token;

ALTER TABLE public.users
ADD COLUMN flutterwave_customer_id text UNIQUE,
ADD COLUMN flutterwave_transaction_ref text UNIQUE,
ADD COLUMN flutterwave_plan_id text;

-- Add comment
COMMENT ON COLUMN public.users.flutterwave_customer_id IS 'Flutterwave Customer ID (e.g. 1234567)';
COMMENT ON COLUMN public.users.flutterwave_transaction_ref IS 'Reference for the active subscription transaction';
COMMENT ON COLUMN public.users.flutterwave_plan_id IS 'ID of the current Flutterwave Plan';
