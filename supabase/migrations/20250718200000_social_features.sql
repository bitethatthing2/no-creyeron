-- Social Features Schema for Wolfpack
-- Following Supabase best practices for RLS and performance

-- Create likes table
CREATE TABLE IF NOT EXISTS wolfpack_post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, video_id) -- Prevent duplicate likes
);

-- Create content_comments table
CREATE TABLE IF NOT EXISTS content_comments(
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES content_comments(id) ON DELETE CASCADE, -- For nested content_comments
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE -- Soft delete for moderation
);

-- Create follows table for friend relationships
CREATE TABLE IF NOT EXISTS social_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id) -- Can't follow yourself
);

-- Create comment reactions table for emoji support
CREATE TABLE IF NOT EXISTS wolfpack_comment_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES content_comments(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (char_length(emoji) <= 4), -- Support for emoji
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, comment_id, emoji)
);

-- Create indexes for performance
CREATE INDEX idx_wolfpack_post_likes_video_id ON wolfpack_post_likes(video_id);
CREATE INDEX idx_wolfpack_post_likes_user_id ON wolfpack_post_likes(user_id);
CREATE INDEX idx_content_comments_video_id ON content_comments(video_id);
CREATE INDEX idx_content_comments_parent_comment_id ON content_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_social_follows_follower_id ON social_follows(follower_id);
CREATE INDEX idx_social_follows_following_id ON social_follows(following_id);
CREATE INDEX idx_wolfpack_comment_reactions_comment_id ON wolfpack_comment_reactions(comment_id);

-- Enable Row Level Security
ALTER TABLE wolfpack_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_commentsENABLE ROW LEVEL SECURITY;
ALTER TABLE social_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolfpack_comment_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for likes
CREATE POLICY "Users can view all likes" ON wolfpack_post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" ON wolfpack_post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON wolfpack_post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for content_comments
CREATE POLICY "Users can view all non-deleted content_comments" ON content_comments
  FOR SELECT USING (NOT is_deleted);

CREATE POLICY "Users can create content_comments" ON content_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id AND NOT is_deleted);

CREATE POLICY "Users can update their own content_comments" ON content_comments
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can soft delete their own content_comments" ON content_comments
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (is_deleted = true);

-- RLS Policies for follows
CREATE POLICY "Users can view all follows" ON social_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own follows" ON social_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON social_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for comment reactions
CREATE POLICY "Users can view all reactions" ON wolfpack_comment_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own reactions" ON wolfpack_comment_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON wolfpack_comment_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Create functions for aggregated counts (more efficient than counting in app)
CREATE OR REPLACE FUNCTION get_video_stats(video_uuid UUID)
RETURNS TABLE (
  likes_count BIGINT,
  content_comments_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM wolfpack_post_likes WHERE video_id = video_uuid) as likes_count,
    (SELECT COUNT(*) FROM content_commentsWHERE video_id = video_uuid AND NOT is_deleted) as content_comments_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to check if user liked a video
CREATE OR REPLACE FUNCTION user_liked_video(user_uuid UUID, video_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM wolfpack_post_likes 
    WHERE user_id = user_uuid AND video_id = video_uuid
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to get follower/following counts
CREATE OR REPLACE FUNCTION get_user_social_stats(user_uuid UUID)
RETURNS TABLE (
  followers_count BIGINT,
  following_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM social_follows WHERE following_id = user_uuid) as followers_count,
    (SELECT COUNT(*) FROM social_follows WHERE follower_id = user_uuid) as following_count;
END;
$$ LANGUAGE plpgsql STABLE;

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