-- Apply the corrected comments table structure
-- This will ensure the table exists with the correct name

-- Drop any incorrectly created tables
DROP TABLE IF EXISTS content_comments CASCADE;

-- Create content_comments table with correct structure
CREATE TABLE IF NOT EXISTS content_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES content_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_content_comments_video_id') THEN
        CREATE INDEX idx_content_comments_video_id ON content_comments(video_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_content_comments_user_id') THEN
        CREATE INDEX idx_content_comments_user_id ON content_comments(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_content_comments_parent_comment_id') THEN
        CREATE INDEX idx_content_comments_parent_comment_id ON content_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_comments' AND policyname = 'Anyone can view non-deleted content_comments') THEN
        CREATE POLICY "Anyone can view non-deleted content_comments" ON content_comments
          FOR SELECT USING (NOT is_deleted);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_comments' AND policyname = 'Users can add content_comments') THEN
        CREATE POLICY "Users can add content_comments" ON content_comments
          FOR INSERT WITH CHECK (
            user_id IN (
              SELECT id FROM public.users WHERE auth_id = auth.uid()
            )
          );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_comments' AND policyname = 'Users can edit own content_comments') THEN
        CREATE POLICY "Users can edit own content_comments" ON content_comments
          FOR UPDATE USING (
            user_id IN (
              SELECT id FROM public.users WHERE auth_id = auth.uid()
            )
          ) WITH CHECK (
            user_id IN (
              SELECT id FROM public.users WHERE auth_id = auth.uid()
            )
          );
    END IF;
END $$;

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_content_comments_updated_at') THEN
        CREATE TRIGGER update_content_comments_updated_at
          BEFORE UPDATE ON content_comments
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON TABLE content_comments TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE content_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE content_comments TO service_role;