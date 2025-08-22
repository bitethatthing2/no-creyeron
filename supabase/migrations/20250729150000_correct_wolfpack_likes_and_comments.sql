-- Correct implementation for wolfpack likes and content_comments
-- This maintains the proper foreign key relationships to public.users

-- Drop the incorrectly created tables from previous migrations
DROP TABLE IF EXISTS wolfpack_post_likes CASCADE;
DROP TABLE IF EXISTS content_comments CASCADE;

-- Create wolfpack_post_likes table with correct foreign keys to public.users
CREATE TABLE wolfpack_post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, video_id)
);

-- Create content_comments table with correct foreign keys to public.users
CREATE TABLE content_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES content_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX idx_wolfpack_post_likes_video_id ON wolfpack_post_likes(video_id);
CREATE INDEX idx_wolfpack_post_likes_user_id ON wolfpack_post_likes(user_id);
CREATE INDEX idx_content_comments_video_id ON content_comments(video_id);
CREATE INDEX idx_content_comments_user_id ON content_comments(user_id);
CREATE INDEX idx_content_comments_parent_comment_id ON content_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE wolfpack_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;

-- Correct RLS Policies that map auth.uid() to public.users.id

-- Likes policies
CREATE POLICY "Users can view all likes" ON wolfpack_post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" ON wolfpack_post_likes
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own likes" ON wolfpack_post_likes
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- content_comments policies
CREATE POLICY "Users can view all non-deleted content_comments" ON content_comments
  FOR SELECT USING (NOT is_deleted);

CREATE POLICY "Users can create content_comments" ON content_comments
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    ) AND NOT is_deleted
  );

CREATE POLICY "Users can update their own content_comments" ON content_comments
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  ) WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can soft delete their own content_comments" ON content_comments
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  ) WITH CHECK (is_deleted = true);

-- Update trigger for content_comments updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_comments_updated_at
  BEFORE UPDATE ON content_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON TABLE wolfpack_post_likes TO anon;
GRANT SELECT, INSERT, DELETE ON TABLE wolfpack_post_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE wolfpack_post_likes TO service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE content_comments TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE content_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE content_comments TO service_role;