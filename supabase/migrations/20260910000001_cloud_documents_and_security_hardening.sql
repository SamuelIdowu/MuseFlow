-- ==============================================================================
-- Migration: Cloud Documents & Security Hardening
-- Adds documents table, fixes RLS leaks, adds atomic reorder RPC
-- ==============================================================================

-- Helper functions for Clerk-Supabase mapping
CREATE OR REPLACE FUNCTION requesting_clerk_id() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION requesting_user_id() RETURNS UUID AS $$
  SELECT id FROM public.users WHERE clerk_id = requesting_clerk_id() LIMIT 1;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Create documents table for TipTap cloud persistence
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  subtitle TEXT DEFAULT '',
  excerpt TEXT DEFAULT '',
  content_json JSONB DEFAULT '{}'::jsonb,
  content_html TEXT DEFAULT '',
  word_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS for documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own documents" ON public.documents;
CREATE POLICY "Users can manage own documents"
ON public.documents
FOR ALL
USING (requesting_user_id() = user_id)
WITH CHECK (requesting_user_id() = user_id);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON public.documents(updated_at DESC);

-- Trigger for documents updated_at
DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Fix saved_campaigns RLS security issue
ALTER TABLE public.saved_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own saved_campaigns" ON public.saved_campaigns;
CREATE POLICY "Users can manage own saved_campaigns"
ON public.saved_campaigns
FOR ALL
USING (requesting_user_id() = user_id)
WITH CHECK (requesting_user_id() = user_id);

-- 3. Fix users table RLS policy leak
DROP POLICY IF EXISTS "Authenticated users can read users" ON public.users;
CREATE POLICY "Users can read own profile"
ON public.users
FOR SELECT
TO authenticated
USING (id = requesting_user_id());

-- 4. Atomic Canvas Block Reorder RPC Function
CREATE OR REPLACE FUNCTION reorder_canvas_blocks(
  p_canvas_id UUID,
  p_user_id UUID,
  p_blocks JSONB
)
RETURNS VOID AS $$
DECLARE
  elem JSONB;
BEGIN
  -- Phase 1: Set temporary negative order indexes
  FOR elem IN SELECT * FROM jsonb_array_elements(p_blocks)
  LOOP
    UPDATE public.canvas_blocks
    SET order_index = -1 * ((elem->>'order')::INT + 1)
    WHERE id = (elem->>'id')::UUID
      AND canvas_id = p_canvas_id
      AND user_id = p_user_id;
  END LOOP;

  -- Phase 2: Set final positive order indexes
  FOR elem IN SELECT * FROM jsonb_array_elements(p_blocks)
  LOOP
    UPDATE public.canvas_blocks
    SET order_index = (elem->>'order')::INT
    WHERE id = (elem->>'id')::UUID
      AND canvas_id = p_canvas_id
      AND user_id = p_user_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
