-- Create missing RPC functions for wolfpack social features

-- Drop existing function if it exists with different signature
DROP FUNCTION IF EXISTS public.get_user_social_stats(UUID);

-- Function to get user social statistics
CREATE OR REPLACE FUNCTION public.get_user_social_stats(user_uuid UUID)
RETURNS TABLE (
  followers_count INTEGER,
  following_count INTEGER,
  content_posts_count INTEGER,
  total_likes INTEGER,
  total_views INTEGER,
  engagement_rate NUMERIC
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM social_follows 
      WHERE following_id = user_uuid
    ), 0) as followers_count,
    
    COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM social_follows 
      WHERE follower_id = user_uuid
    ), 0) as following_count,
    
    COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM content_posts 
      WHERE user_id = user_uuid AND is_active = true
    ), 0) as content_posts_count,
    
    COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM wolfpack_post_likes wl
      INNER JOIN content_posts wv ON wl.video_id = wv.id
      WHERE wv.user_id = user_uuid
    ), 0) as total_likes,
    
    COALESCE((
      SELECT SUM(view_count)::INTEGER 
      FROM content_posts 
      WHERE user_id = user_uuid AND is_active = true
    ), 0) as total_views,
    
    CASE 
      WHEN (SELECT COUNT(*) FROM content_posts WHERE user_id = user_uuid AND is_active = true) > 0
      THEN (
        COALESCE((
          SELECT COUNT(*)::NUMERIC 
          FROM wolfpack_post_likes wl
          INNER JOIN content_posts wv ON wl.video_id = wv.id
          WHERE wv.user_id = user_uuid
        ), 0) / 
        NULLIF((
          SELECT SUM(view_count)::NUMERIC 
          FROM content_posts 
          WHERE user_id = user_uuid AND is_active = true
        ), 0) * 100
      )
      ELSE 0::NUMERIC
    END as engagement_rate;
END;
$$;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_video_stats(UUID);

-- Function to get video statistics
CREATE OR REPLACE FUNCTION public.get_video_stats(video_uuid UUID)
RETURNS TABLE (
  likes_count INTEGER,
  content_comments_count INTEGER,
  shares_count INTEGER,
  views_count INTEGER,
  watch_time_seconds INTEGER
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM wolfpack_post_likes 
      WHERE video_id = video_uuid
    ), 0) as likes_count,
    
    COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM content_comments
      WHERE video_id = video_uuid AND is_deleted = false
    ), 0) as content_comments_count,
    
    COALESCE((
      SELECT shares_count::INTEGER
      FROM content_posts
      WHERE id = video_uuid
    ), 0) as shares_count,
    
    COALESCE((
      SELECT view_count::INTEGER
      FROM content_posts
      WHERE id = video_uuid
    ), 0) as views_count,
    
    COALESCE((
      SELECT duration::INTEGER
      FROM content_posts
      WHERE id = video_uuid
    ), 0) as watch_time_seconds;
END;
$$;

-- Function to check if user liked a video
CREATE OR REPLACE FUNCTION public.user_liked_video(user_uuid UUID, video_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM wolfpack_post_likes 
    WHERE user_id = user_uuid AND video_id = video_uuid
  );
END;
$$;

-- Function to test API health
CREATE OR REPLACE FUNCTION public.test_api_health()
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN json_build_object(
    'status', 'ok',
    'timestamp', NOW(),
    'message', 'API is functioning correctly'
  );
END;
$$;

-- Grant permissions to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_social_stats(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_video_stats(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_liked_video(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.test_api_health() TO anon, authenticated;

-- Add table content_comments for PostgREST exposure
COMMENT ON TABLE public.social_follows IS 'User following relationships for the wolfpack social network';
COMMENT ON TABLE public.wolfpack_post_likes IS 'Video likes in the wolfpack social network';
COMMENT ON TABLE public.content_commentsIS 'content_comments on wolfpack content_posts';
COMMENT ON TABLE public.content_posts IS 'Video content_posts in the wolfpack social network';

-- Ensure social_follows table has proper structure
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_follows') THEN
    CREATE TABLE public.social_follows (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(follower_id, following_id),
      CHECK (follower_id != following_id)
    );
    
    -- Create indexes
    CREATE INDEX idx_social_follows_follower ON public.social_follows(follower_id);
    CREATE INDEX idx_social_follows_following ON public.social_follows(following_id);
    
    -- Enable RLS
    ALTER TABLE public.social_follows ENABLE ROW LEVEL SECURITY;
    
    -- Add RLS policies
    CREATE POLICY "Users can view all follows" ON public.social_follows
      FOR SELECT USING (true);
      
    CREATE POLICY "Users can follow others" ON public.social_follows
      FOR INSERT WITH CHECK (auth.uid() = follower_id);
      
    CREATE POLICY "Users can unfollow" ON public.social_follows
      FOR DELETE USING (auth.uid() = follower_id);
  END IF;
END
$$;

-- Ensure wolfpack_post_likes table has proper structure
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wolfpack_post_likes') THEN
    CREATE TABLE public.wolfpack_post_likes (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      video_id UUID NOT NULL REFERENCES public.content_posts(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, video_id)
    );
    
    -- Create indexes
    CREATE INDEX idx_wolfpack_post_likes_user ON public.wolfpack_post_likes(user_id);
    CREATE INDEX idx_wolfpack_post_likes_video ON public.wolfpack_post_likes(video_id);
    
    -- Enable RLS
    ALTER TABLE public.wolfpack_post_likes ENABLE ROW LEVEL SECURITY;
    
    -- Add RLS policies
    CREATE POLICY "Users can view all likes" ON public.wolfpack_post_likes
      FOR SELECT USING (true);
      
    CREATE POLICY "Users can like content_posts" ON public.wolfpack_post_likes
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can unlike content_posts" ON public.wolfpack_post_likes
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Ensure content_commentstable has proper structure
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_comments') THEN
    CREATE TABLE public.content_comments(
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      video_id UUID NOT NULL REFERENCES public.content_posts(id) ON DELETE CASCADE,
      parent_comment_id UUID REFERENCES public.content_comments(id) ON DELETE CASCADE,
      content TEXT NOT NULL CHECK (length(trim(content)) > 0),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      is_deleted BOOLEAN DEFAULT false
    );
    
    -- Create indexes
    CREATE INDEX idx_content_comments_user ON public.content_comments(user_id);
    CREATE INDEX idx_content_comments_video ON public.content_comments(video_id);
    CREATE INDEX idx_content_comments_parent ON public.content_comments(parent_comment_id);
    CREATE INDEX idx_content_comments_created ON public.content_comments(created_at);
    
    -- Enable RLS
    ALTER TABLE public.content_commentsENABLE ROW LEVEL SECURITY;
    
    -- Add RLS policies
    CREATE POLICY "Users can view all content_comments" ON public.content_comments
      FOR SELECT USING (NOT is_deleted);
      
    CREATE POLICY "Users can create content_comments" ON public.content_comments
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can update own content_comments" ON public.content_comments
      FOR UPDATE USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete own content_comments" ON public.content_comments
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Create comment reactions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wolfpack_comment_reactions') THEN
    CREATE TABLE public.wolfpack_comment_reactions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      comment_id UUID NOT NULL REFERENCES public.content_comments(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      emoji TEXT NOT NULL CHECK (length(emoji) <= 10),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(comment_id, user_id, emoji)
    );
    
    -- Create indexes
    CREATE INDEX idx_wolfpack_comment_reactions_comment ON public.wolfpack_comment_reactions(comment_id);
    CREATE INDEX idx_wolfpack_comment_reactions_user ON public.wolfpack_comment_reactions(user_id);
    
    -- Enable RLS
    ALTER TABLE public.wolfpack_comment_reactions ENABLE ROW LEVEL SECURITY;
    
    -- Add RLS policies
    CREATE POLICY "Users can view all reactions" ON public.wolfpack_comment_reactions
      FOR SELECT USING (true);
      
    CREATE POLICY "Users can add reactions" ON public.wolfpack_comment_reactions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can remove own reactions" ON public.wolfpack_comment_reactions
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;