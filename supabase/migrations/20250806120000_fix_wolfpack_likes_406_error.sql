-- Fix 406 Not Acceptable errors on wolfpack_post_likes
-- This ensures wolfpack_post_likes is a proper table, not a view

-- First, drop any views that might be conflicting
DROP VIEW IF EXISTS wolfpack_post_likes CASCADE;
DROP MATERIALIZED VIEW IF EXISTS wolfpack_post_likes CASCADE;
DROP VIEW IF EXISTS wolfpack_video_likes CASCADE;
DROP MATERIALIZED VIEW IF EXISTS wolfpack_video_likes CASCADE;
DROP VIEW IF EXISTS wolfpack_post_likes CASCADE;
DROP MATERIALIZED VIEW IF EXISTS wolfpack_post_likes CASCADE;

-- Ensure we have a proper table
DO $$ BEGIN
  -- Check if wolfpack_post_likes exists as a table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'wolfpack_post_likes'
  ) THEN
    -- Create the table if it doesn't exist
    CREATE TABLE wolfpack_post_likes (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      video_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      UNIQUE(user_id, video_id)
    );
  END IF;
END $$;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "Users can like posts" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "Users can remove own likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "wolfpack_post_likes_select_consolidated" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "wolfpack_post_likes_insert_consolidated" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "wolfpack_post_likes_delete_consolidated" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "anyone_can_view_likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "consolidated_view_likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "wolfpack_members_view_likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "wolfpack_post_likes_select_policy" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "users_can_unlike" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "authenticated_users_can_like" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "Users can update own likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "Users can view all likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "Users can create their own likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "Users can like content_posts" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "Users can unlike content_posts" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "wolfpack_post_likes_insert_policy" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "wolfpack_post_likes_delete_policy" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "wolfpack_post_likes_select" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "wolfpack_post_likes_insert" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "wolfpack_post_likes_delete" ON wolfpack_post_likes;

-- Enable RLS
ALTER TABLE wolfpack_post_likes ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies
CREATE POLICY "wolfpack_post_likes_select_final" ON wolfpack_post_likes
  FOR SELECT USING (true);

CREATE POLICY "wolfpack_post_likes_insert_final" ON wolfpack_post_likes
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "wolfpack_post_likes_delete_final" ON wolfpack_post_likes
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_wolfpack_post_likes_video_id ON wolfpack_post_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_wolfpack_post_likes_user_id ON wolfpack_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_wolfpack_post_likes_video_user ON wolfpack_post_likes(video_id, user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON TABLE wolfpack_post_likes TO anon;
GRANT SELECT, INSERT, DELETE ON TABLE wolfpack_post_likes TO authenticated;
GRANT ALL ON TABLE wolfpack_post_likes TO service_role;

-- Verify the table exists and is accessible
DO $$ 
DECLARE
  table_type text;
BEGIN
  SELECT t.table_type INTO table_type
  FROM information_schema.tables t
  WHERE t.table_schema = 'public' AND t.table_name = 'wolfpack_post_likes';
  
  IF table_type IS NULL THEN
    RAISE EXCEPTION 'wolfpack_post_likes table does not exist!';
  ELSIF table_type != 'BASE TABLE' THEN
    RAISE EXCEPTION 'wolfpack_post_likes is not a base table! It is: %', table_type;
  END IF;
  
  RAISE NOTICE 'wolfpack_post_likes table verified as BASE TABLE';
END $$;