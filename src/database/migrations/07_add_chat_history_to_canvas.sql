-- Add chat_history to canvas_sessions
ALTER TABLE canvas_sessions ADD COLUMN IF NOT EXISTS chat_history JSONB DEFAULT '[]'::jsonb;
