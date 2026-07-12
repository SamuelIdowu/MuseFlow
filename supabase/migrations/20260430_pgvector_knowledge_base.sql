-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Table for tracking ingested documents/URLs
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    source_url TEXT,
    file_path TEXT,
    mime_type TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for document chunks and embeddings
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768), -- text-embedding-004 uses 768 dimensions
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_documents
CREATE POLICY "Users can manage their own knowledge documents"
    ON public.knowledge_documents
    FOR ALL
    USING (auth.uid() = user_id);

-- RLS Policies for knowledge_chunks
CREATE POLICY "Users can manage their own knowledge chunks"
    ON public.knowledge_chunks
    FOR ALL
    USING (auth.uid() = user_id);

-- Create HNSW index for efficient semantic search
-- We use 768 dimensions for Gemini's text-embedding-004
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx ON public.knowledge_chunks 
USING hnsw (embedding vector_cosine_ops);

-- Function for semantic search over knowledge base
CREATE OR REPLACE FUNCTION match_knowledge_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  metadata JSONB,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.document_id,
    kc.content,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_chunks kc
  WHERE kc.user_id = p_user_id
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add embedding column to canvas_blocks for canvas-aware RAG
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'canvas_blocks' AND COLUMN_NAME = 'embedding') THEN
        ALTER TABLE public.canvas_blocks ADD COLUMN embedding vector(768);
        
        -- Create index for canvas blocks too
        CREATE INDEX IF NOT EXISTS canvas_blocks_embedding_idx ON public.canvas_blocks 
        USING hnsw (embedding vector_cosine_ops);
    END IF;
END $$;

-- Function for semantic search over canvas blocks
CREATE OR REPLACE FUNCTION match_canvas_blocks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  canvas_id UUID,
  content TEXT,
  type TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cb.id,
    cb.canvas_id,
    cb.content,
    cb.type,
    1 - (cb.embedding <=> query_embedding) AS similarity
  FROM public.canvas_blocks cb
  WHERE cb.user_id = p_user_id
    AND 1 - (cb.embedding <=> query_embedding) > match_threshold
  ORDER BY cb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
