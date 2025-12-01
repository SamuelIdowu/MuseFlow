-- Fix canvas_blocks type check constraint
ALTER TABLE canvas_blocks DROP CONSTRAINT IF EXISTS canvas_blocks_type_check;

ALTER TABLE canvas_blocks 
ADD CONSTRAINT canvas_blocks_type_check 
CHECK (type IN ('hook', 'problem', 'solution', 'call-to-action', 'paragraph', 'heading', 'quote', 'list'));
