-- Apply the corrected comments table structure
-- This will ensure the table exists with the correct name

-- Drop any incorrectly created tables
DROP TABLE IF EXISTS wolfpack_comments CASCADE;

-- Create wolfpack_comments table with correct structure
CREATE TABLE IF NOT EXISTS wolfpack_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES wolfpack_videos(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES wolfpack_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_wolfpack_comments_video_id') THEN
        CREATE INDEX idx_wolfpack_comments_video_id ON wolfpack_comments(video_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_wolfpack_comments_user_id') THEN
        CREATE INDEX idx_wolfpack_comments_user_id ON wolfpack_comments(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_wolfpack_comments_parent_comment_id') THEN
        CREATE INDEX idx_wolfpack_comments_parent_comment_id ON wolfpack_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE wolfpack_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wolfpack_comments' AND policyname = 'Anyone can view non-deleted wolfpack_comments') THEN
        CREATE POLICY "Anyone can view non-deleted wolfpack_comments" ON wolfpack_comments
          FOR SELECT USING (NOT is_deleted);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wolfpack_comments' AND policyname = 'Users can add wolfpack_comments') THEN
        CREATE POLICY "Users can add wolfpack_comments" ON wolfpack_comments
          FOR INSERT WITH CHECK (
            user_id IN (
              SELECT id FROM public.users WHERE auth_id = auth.uid()
            )
          );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wolfpack_comments' AND policyname = 'Users can edit own wolfpack_comments') THEN
        CREATE POLICY "Users can edit own wolfpack_comments" ON wolfpack_comments
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
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_wolfpack_comments_updated_at') THEN
        CREATE TRIGGER update_wolfpack_comments_updated_at
          BEFORE UPDATE ON wolfpack_comments
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON TABLE wolfpack_comments TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE wolfpack_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE wolfpack_comments TO service_role;