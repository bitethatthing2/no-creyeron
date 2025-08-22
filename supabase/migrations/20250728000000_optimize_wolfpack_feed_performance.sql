-- ===================================================================
-- Wolfpack Feed Query Optimization Migration
-- ===================================================================
-- This migration improves the performance of wolfpack feed queries by:
-- 1. Adding optimized indexes for common query patterns
-- 2. Creating a materialized view for faster feed loading
-- 3. Adding composite indexes for join operations
-- 4. Implementing a function for efficient feed fetching
-- ===================================================================

-- Drop existing suboptimal indexes if they exist
DROP INDEX IF EXISTS idx_content_posts_user_id;
DROP INDEX IF EXISTS idx_content_posts_created_at;
DROP INDEX IF EXISTS idx_content_posts_active;

-- ===================================================================
-- OPTIMIZED INDEXES FOR content_posts
-- ===================================================================

-- Composite index for the main feed query (is_active + created_at)
CREATE INDEX IF NOT EXISTS idx_content_posts_feed_main 
ON content_posts(is_active, created_at DESC) 
WHERE is_active = true;

-- Index for user-specific feed queries
CREATE INDEX IF NOT EXISTS idx_content_posts_user_feed 
ON content_posts(user_id, is_active, created_at DESC) 
WHERE is_active = true;

-- Index for video lookups by ID
CREATE INDEX IF NOT EXISTS idx_content_posts_id 
ON content_posts(id) 
WHERE is_active = true;

-- Full-text search index for caption/description/title searches
CREATE INDEX IF NOT EXISTS idx_content_posts_search 
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
DROP INDEX IF EXISTS idx_wolfpack_post_likes_video;
DROP INDEX IF EXISTS idx_wolfpack_post_likes_user;

CREATE INDEX IF NOT EXISTS idx_wolfpack_post_likes_video_user 
ON wolfpack_post_likes(video_id, user_id);

CREATE INDEX IF NOT EXISTS idx_wolfpack_post_likes_user_video 
ON wolfpack_post_likes(user_id, video_id);

-- Optimize follows table for feed queries
DROP INDEX IF EXISTS idx_social_follows_follower_id;
DROP INDEX IF EXISTS idx_social_follows_following_id;
DROP INDEX IF EXISTS idx_social_follows_follower;
DROP INDEX IF EXISTS idx_social_follows_following;

CREATE INDEX IF NOT EXISTS idx_social_follows_follower_following 
ON social_follows(follower_id, following_id);

CREATE INDEX IF NOT EXISTS idx_social_follows_following_follower 
ON social_follows(following_id, follower_id);

-- Optimize content_comments for count queries
DROP INDEX IF EXISTS idx_content_comments_video_id;
DROP INDEX IF EXISTS idx_content_comments_video;

CREATE INDEX IF NOT EXISTS idx_content_comments_video_active 
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
  u.wolf_emoji
FROM content_posts v
LEFT JOIN users u ON v.user_id = u.id
WHERE v.is_active = true
ORDER BY v.created_at DESC;

-- Create indexes on the materialized view
CREATE INDEX idx_feed_cache_created_at ON wolfpack_feed_cache(created_at DESC);
CREATE INDEX idx_feed_cache_user_id ON wolfpack_feed_cache(user_id);

-- ===================================================================
-- CREATE HELPER FUNCTIONS FOR OPTIMIZED QUERIES
-- ===================================================================

-- Function to efficiently check if a user has liked a video
CREATE OR REPLACE FUNCTION user_has_liked_video(p_user_id UUID, p_video_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM wolfpack_post_likes 
    WHERE user_id = p_user_id AND video_id = p_video_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if a user follows another user
CREATE OR REPLACE FUNCTION user_follows(p_follower_id UUID, p_following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM social_follows 
    WHERE follower_id = p_follower_id AND following_id = p_following_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ===================================================================
-- CREATE FUNCTION TO REFRESH MATERIALIZED VIEW
-- ===================================================================

CREATE OR REPLACE FUNCTION refresh_wolfpack_feed_cache()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY wolfpack_feed_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- OPTIMIZE EXISTING FUNCTIONS FOR BATCH OPERATIONS
-- ===================================================================

-- Function to get user likes for multiple content_posts
CREATE OR REPLACE FUNCTION get_user_wolfpack_post_likes(p_user_id UUID, p_video_ids UUID[])
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT video_id FROM wolfpack_post_likes 
    WHERE user_id = p_user_id AND video_id = ANY(p_video_ids)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get user following relationships
CREATE OR REPLACE FUNCTION get_user_following(p_user_id UUID, p_user_ids UUID[])
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT following_id FROM social_follows 
    WHERE follower_id = p_user_id AND following_id = ANY(p_user_ids)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ===================================================================
-- CREATE OPTIMIZED FEED QUERY FUNCTION
-- ===================================================================

CREATE OR REPLACE FUNCTION get_wolfpack_feed_optimized(
  p_user_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_following_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  caption TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  view_count INTEGER,
  like_count INTEGER,
  content_comments_count INTEGER,
  shares_count INTEGER,
  music_name TEXT,
  hashtags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  username TEXT,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  profile_image_url TEXT,
  wolf_emoji TEXT,
  user_liked BOOLEAN,
  user_following BOOLEAN
) AS $$
DECLARE
  v_following_ids UUID[];
BEGIN
  -- If following only, get the list of followed users
  IF p_following_only AND p_user_id IS NOT NULL THEN
    SELECT ARRAY_AGG(following_id) INTO v_following_ids
    FROM social_follows
    WHERE follower_id = p_user_id;
    
    -- If not following anyone, return empty result
    IF v_following_ids IS NULL OR array_length(v_following_ids, 1) IS NULL THEN
      RETURN;
    END IF;
  END IF;

  RETURN QUERY
  WITH video_data AS (
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
      u.username,
      u.display_name,
      u.first_name,
      u.last_name,
      u.avatar_url,
      u.profile_image_url,
      u.wolf_emoji
    FROM content_posts v
    INNER JOIN users u ON v.user_id = u.id
    WHERE v.is_active = true
      AND (NOT p_following_only OR v.user_id = ANY(v_following_ids))
    ORDER BY v.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT 
    vd.*,
    CASE 
      WHEN p_user_id IS NOT NULL THEN 
        EXISTS(SELECT 1 FROM wolfpack_post_likes wl WHERE wl.video_id = vd.id AND wl.user_id = p_user_id)
      ELSE FALSE
    END AS user_liked,
    CASE 
      WHEN p_user_id IS NOT NULL THEN 
        EXISTS(SELECT 1 FROM social_follows wf WHERE wf.follower_id = p_user_id AND wf.following_id = vd.user_id)
      ELSE FALSE
    END AS user_following
  FROM video_data vd;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===================================================================
-- ADD COMMENT TO DESCRIBE FUNCTION USAGE
-- ===================================================================

COMMENT ON FUNCTION get_wolfpack_feed_optimized IS 'Optimized function to fetch wolfpack feed with user interaction data. Use this instead of complex joins in application code.';

-- ===================================================================
-- CREATE INDEX FOR HASHTAG SEARCHES
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_content_posts_hashtags 
ON content_posts USING gin(hashtags)
WHERE is_active = true;

-- ===================================================================
-- ANALYZE TABLES TO UPDATE STATISTICS
-- ===================================================================

ANALYZE content_posts;
ANALYZE wolfpack_post_likes;
ANALYZE social_follows;
ANALYZE content_comments;
ANALYZE users;