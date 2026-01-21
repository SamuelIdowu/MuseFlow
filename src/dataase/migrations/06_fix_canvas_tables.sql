-- Fix 1: Add updated_at to canvas_blocks
ALTER TABLE canvas_blocks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Fix 2: Fix canvas_edges foreign key to reference public.users
ALTER TABLE canvas_edges DROP CONSTRAINT IF EXISTS canvas_edges_user_id_fkey;

ALTER TABLE canvas_edges 
    ADD CONSTRAINT canvas_edges_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.users(id) 
    ON DELETE CASCADE;
