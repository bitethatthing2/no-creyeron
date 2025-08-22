-- ===================================================================
-- Wolfpack Feed Query Optimization Migration
-- ===================================================================
-- This migration improves the performance of wolfpack feed queries by:
-- 1. Adding optimized indexes for common query patterns
-- 2. Creating a materialized view for faster feed loading
-- 3. Fixing RLS policies to use proper auth.uid() mapping
-- 4. Adding composite indexes for join operations
-- ===================================================================

-- Drop existing suboptimal indexes if they exist
DROP INDEX IF EXISTS idx_content_posts_user_id;
DROP INDEX IF EXISTS idx_content_posts_created_at;
DROP INDEX IF EXISTS idx_content_posts_active;

-- ===================================================================
-- OPTIMIZED INDEXES FOR content_posts
-- ===================================================================

-- Composite index for the main feed query (is_active + created_at)
CREATE INDEX idx_content_posts_feed_main 
ON content_posts(is_active, created_at DESC) 
WHERE is_active = true;

-- Index for user-specific feed queries
CREATE INDEX idx_content_posts_user_feed 
ON content_posts(user_id, is_active, created_at DESC) 
WHERE is_active = true;

-- Index for video lookups by ID
CREATE INDEX idx_content_posts_id 
ON content_posts(id) 
WHERE is_active = true;

-- Full-text search index for caption/description/title searches
CREATE INDEX idx_content_posts_search 
ON content_posts USING gin(
  to_tsvector('english', 
    COALESCE(caption, '') || ' ' || 
    COALESCE(description, '') || ' ' || 
    COALESCE(title, '')
  )
);

-- ===================================================================
-- OPTIMIZED INDEXES FOR RELATED TABLES
-- ===================================================================

-- Composite index for likes lookups (both directions)
DROP INDEX IF EXISTS idx_wolfpack_post_likes_video_id;
DROP INDEX IF EXISTS idx_wolfpack_post_likes_user_id;
CREATE INDEX idx_wolfpack_post_likes_video_user 
ON wolfpack_post_likes(video_id, user_id);
CREATE INDEX idx_wolfpack_post_likes_user_video 
ON wolfpack_post_likes(user_id, video_id);

-- Optimize follows table for feed queries
DROP INDEX IF EXISTS idx_social_follows_follower_id;
DROP INDEX IF EXISTS idx_social_follows_following_id;
CREATE INDEX idx_social_follows_follower_following 
ON social_follows(follower_id, following_id);
CREATE INDEX idx_social_follows_following_follower 
ON social_follows(following_id, follower_id);

-- Optimize content_comments for count queries
DROP INDEX IF EXISTS idx_content_comments_video_id;
CREATE INDEX idx_content_comments_video_active 
ON content_comments(video_id, is_deleted) 
WHERE is_deleted = false;

-- ===================================================================
-- CREATE MATERIALIZED VIEW FOR FEED PERFORMANCE
-- ===================================================================

-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS wolfpack_feed_cache;

-- Create materialized view for the main feed
CREATE MATERIALIZED VIEW wolfpack_feed_cache AS
SELECT 
  v.id,
  v.user_id,
  v.title,
  v.description,
  v.caption,
  v.video_url,
  v.thumbnail_url,
  v.duration,
  v.view_count,
  v.like_count,
  v.content_comments_count,
  v.shares_count,
  v.music_name,
  v.hashtags,
  v.created_at,
  v.is_active,
  -- User data
  u.id as user_id_check,
  u.username,
  u.display_name,
  u.first_name,
  u.last_name,
  u.avatar_url,
  u.profile_image_url,
  u.wolf_emoji,
  -- Computed counts (for verification)
  (SELECT COUNT(*) FROM wolfpack_post_likes wl WHERE wl.video_id = v.id) as actual_like_count,
  (SELECT COUNT(*) FROM content_commentswc WHERE wc.video_id = v.id AND NOT wc.is_deleted) as actual_comment_count
FROM content_posts v
LEFT JOIN users u ON v.user_id = u.id
WHERE v.is_active = true
ORDER BY v.created_at DESC;

-- Create indexes on the materialized view
CREATE INDEX idx_feed_cache_created_at ON wolfpack_feed_cache(created_at DESC);
CREATE INDEX idx_feed_cache_user_id ON wolfpack_feed_cache(user_id);

-- ===================================================================
-- FIX RLS POLICIES TO USE PROPER AUTH MAPPING
-- ===================================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert their own wolfpack content_posts" ON content_posts;
DROP POLICY IF EXISTS "Users can update their own wolfpack content_posts" ON content_posts;
DROP POLICY IF EXISTS "Users can delete their own wolfpack content_posts" ON content_posts;
DROP POLICY IF EXISTS "content_posts_insert_policy" ON content_posts;
DROP POLICY IF EXISTS "content_posts_update_policy" ON content_posts;
DROP POLICY IF EXISTS "content_posts_select_policy" ON content_posts;

-- Create function to get user ID from auth.uid() with caching
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Cache the user ID in a session variable for performance
  IF current_setting('app.current_user_id', true) IS NOT NULL THEN
    RETURN current_setting('app.current_user_id')::UUID;
  END IF;
  
  SELECT id INTO user_id
  FROM users
  WHERE auth_id = auth.uid()
  LIMIT 1;
  
  IF user_id IS NOT NULL THEN
    PERFORM set_config('app.current_user_id', user_id::text, false);
  END IF;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create optimized RLS policies
CREATE POLICY "content_posts_select_all" ON content_posts
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "content_posts_insert_own" ON content_posts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "content_posts_update_own" ON content_posts
  FOR UPDATE TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "content_posts_delete_own" ON content_posts
  FOR DELETE TO authenticated
  USING (user_id = get_current_user_id());

-- ===================================================================
-- CREATE FUNCTION TO REFRESH MATERIALIZED VIEW
-- ===================================================================

CREATE OR REPLACE FUNCTION refresh_wolfpack_feed_cache()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY wolfpack_feed_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to refresh the materialized view every 5 minutes
-- Note: This requires pg_cron extension which may need to be enabled
-- SELECT cron.schedule('refresh-wolfpack-feed', '*/5 * * * *', 'SELECT refresh_wolfpack_feed_cache();');

-- ===================================================================
-- OPTIMIZE EXISTING FUNCTIONS
-- ===================================================================

-- Create an optimized function for fetching feed with user interactions
CREATE OR REPLACE FUNCTION get_wolfpack_feed(
  p_user_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  caption TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration INT,
  view_count INT,
  like_count INT,
  content_comments_count INT,
  shares_count INT,
  music_name TEXT,
  hashtags TEXT[],
  created_at TIMESTAMPTZ,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  user_liked BOOLEAN,
  user_following BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH user_likes AS (
    SELECT video_id 
    FROM wolfpack_post_likes 
    WHERE user_id = p_user_id
  ),
  user_follows AS (
    SELECT following_id 
    FROM social_follows 
    WHERE follower_id = p_user_id
  )
  SELECT 
    fc.id,
    fc.user_id,
    fc.title,
    fc.description,
    fc.caption,
    fc.video_url,
    fc.thumbnail_url,
    fc.duration,
    fc.view_count,
    fc.like_count,
    fc.content_comments_count,
    fc.shares_count,
    fc.music_name,
    fc.hashtags,
    fc.created_at,
    COALESCE(fc.display_name, fc.username, fc.first_name || ' ' || fc.last_name) as username,
    fc.display_name,
    COALESCE(fc.profile_image_url, fc.avatar_url) as avatar_url,
    EXISTS(SELECT 1 FROM user_likes ul WHERE ul.video_id = fc.id) as user_liked,
    EXISTS(SELECT 1 FROM user_follows uf WHERE uf.following_id = fc.user_id) as user_following
  FROM wolfpack_feed_cache fc
  ORDER BY fc.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ===================================================================

ANALYZE content_posts;
ANALYZE wolfpack_post_likes;
ANALYZE content_comments;
ANALYZE social_follows;
ANALYZE users;

-- ===================================================================
-- ADD content_comments FOR DOCUMENTATION
-- ===================================================================

COMMENT ON INDEX idx_content_posts_feed_main IS 'Primary index for main feed queries filtering by is_active and ordering by created_at';
COMMENT ON INDEX idx_content_posts_user_feed IS 'Index for user-specific feed queries';
COMMENT ON INDEX idx_content_posts_search IS 'Full-text search index for caption, description, and title';
COMMENT ON MATERIALIZED VIEW wolfpack_feed_cache IS 'Cached feed data for performance optimization. Refresh every 5 minutes.';
COMMENT ON FUNCTION get_wolfpack_feed IS 'Optimized function to fetch wolfpack feed with user interactions';