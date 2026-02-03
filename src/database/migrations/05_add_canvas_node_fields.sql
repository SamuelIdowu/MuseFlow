-- Add position fields to canvas_blocks
ALTER TABLE canvas_blocks ADD COLUMN IF NOT EXISTS position_x FLOAT DEFAULT 0;
ALTER TABLE canvas_blocks ADD COLUMN IF NOT EXISTS position_y FLOAT DEFAULT 0;

-- Create canvas_edges table
CREATE TABLE IF NOT EXISTS canvas_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canvas_id UUID NOT NULL REFERENCES canvas_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_block_id UUID NOT NULL REFERENCES canvas_blocks(id) ON DELETE CASCADE,
    target_block_id UUID NOT NULL REFERENCES canvas_blocks(id) ON DELETE CASCADE,
    label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canvas_edges_canvas_id ON canvas_edges(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_edges_user_id ON canvas_edges(user_id);

ALTER TABLE canvas_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own canvas edges" ON canvas_edges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own canvas edges" ON canvas_edges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own canvas edges" ON canvas_edges
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own canvas edges" ON canvas_edges
    FOR DELETE USING (auth.uid() = user_id);
