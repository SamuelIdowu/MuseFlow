-- Supabase Database Schema for AI Content Ideation Platform

-- Table: users
-- Description: Stores basic user information from Clerk Auth
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  clerk_id TEXT UNIQUE NOT NULL, -- Clerk user id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: profiles
-- Description: Stores user profile information for content personalization
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_name TEXT NOT NULL DEFAULT 'Default Profile',
  niche TEXT,
  tone_config JSONB, -- Stores sliders/preferences as JSON {professionalism: 70, creativity: 60, ...}
  samples JSONB, -- Stores array of sample content posts
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: idea_kernels
-- Description: Stores generated content ideas from input text/links
CREATE TABLE IF NOT EXISTS idea_kernels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  input_type TEXT CHECK (input_type IN ('text', 'link')) DEFAULT 'text',
  input_data TEXT NOT NULL, -- The raw input text or URL
  kernels JSONB NOT NULL, -- Array of generated idea strings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: canvas_sessions
-- Description: Stores canvas session information
CREATE TABLE IF NOT EXISTS canvas_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: canvas_blocks
-- Description: Stores individual content blocks within canvas sessions
CREATE TABLE IF NOT EXISTS canvas_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  canvas_id UUID NOT NULL REFERENCES canvas_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('hook', 'problem', 'solution', 'call-to-action', 'paragraph', 'heading', 'quote', 'list')) DEFAULT 'paragraph',
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  meta JSONB, -- Stores expand history, edits, and other metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: scheduled_posts
-- Description: Stores scheduled content posts
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_blocks JSONB NOT NULL, -- Serialized canvas blocks
  channel TEXT CHECK (channel IN ('linkedin', 'x', 'blog', 'twitter', 'facebook', 'instagram')) DEFAULT 'linkedin',
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'sent', 'cancelled')) DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_kernels ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can only access their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = _id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = _id);

CREATE POLICY "Users can view own profiles" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profiles" ON profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own idea_kernels" ON idea_kernels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own idea_kernels" ON idea_kernels FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own canvas_sessions" ON canvas_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own canvas_sessions" ON canvas_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own canvas_sessions" ON canvas_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own canvas_blocks" ON canvas_blocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own canvas_blocks" ON canvas_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own canvas_blocks" ON canvas_blocks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own scheduled_posts" ON scheduled_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scheduled_posts" ON scheduled_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scheduled_posts" ON scheduled_posts FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_idea_kernels_user_id ON idea_kernels(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_sessions_user_id ON canvas_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_blocks_canvas_id ON canvas_blocks(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_blocks_user_id ON canvas_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_time ON scheduled_posts(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create unique index to ensure only one active profile per user
CREATE UNIQUE INDEX idx_profiles_user_active ON profiles (user_id) WHERE is_active = true;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canvas_sessions_updated_at BEFORE UPDATE ON canvas_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canvas_blocks_updated_at BEFORE UPDATE ON canvas_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_posts_updated_at BEFORE UPDATE ON scheduled_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();