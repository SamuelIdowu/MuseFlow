-- Add default_content_type column to profiles table
ALTER TABLE profiles 
ADD COLUMN default_content_type VARCHAR(255) NULL;

-- Comment on column
COMMENT ON COLUMN profiles.default_content_type IS 'The default content type ID (e.g., social_post, article_blog) to pre-select for this profile';
