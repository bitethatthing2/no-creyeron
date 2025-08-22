-- ===================================================================
-- WOLFPACK FEED OPTIMIZATIONS - DIRECT APPLICATION
-- ===================================================================
-- Run this directly in Supabase Dashboard SQL Editor
-- ===================================================================

-- 1. DROP EXISTING SUBOPTIMAL INDEXES
DROP INDEX IF EXISTS idx_content_posts_user_id;
DROP INDEX IF EXISTS idx_content_posts_created_at;
DROP INDEX IF EXISTS idx_content_posts_active;
DROP INDEX IF EXISTS idx_wolfpack_post_likes_video_id;
DROP INDEX IF EXISTS idx_wolfpack_post_likes_user_id;
DROP INDEX IF EXISTS idx_social_follows_follower_id;
DROP INDEX IF EXISTS idx_social_follows_following_id;
DROP INDEX IF EXISTS idx_content_comments_video_id;

-- 2. CREATE OPTIMIZED INDEXES
CREATE INDEX IF NOT EXISTS idx_content_posts_feed_main 
ON content_posts(is_active, created_at DESC) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_content_posts_user_feed 
ON content_posts(user_id, is_active, created_at DESC) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_content_posts_search 
ON content_posts USING gin(
  to_tsvector('english', 
    COALESCE(caption, '') || ' ' || 
    COALESCE(description, '') || ' ' || 
    COALESCE(title, '')
  )
) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_wolfpack_post_likes_video_user 
ON wolfpack_post_likes(video_id, user_id);

CREATE INDEX IF NOT EXISTS idx_wolfpack_post_likes_user_video 
ON wolfpack_post_likes(user_id, video_id);

CREATE INDEX IF NOT EXISTS idx_social_follows_follower_following 
ON social_follows(follower_id, following_id);

CREATE INDEX IF NOT EXISTS idx_content_comments_video_active 
ON content_comments(video_id, is_deleted) 
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_content_posts_hashtags 
ON content_posts USING gin(hashtags)
WHERE is_active = true;

-- 3. CREATE OPTIMIZED FEED FUNCTION
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

-- 4. CREATE CURSOR PAGINATION FUNCTION
CREATE OR REPLACE FUNCTION get_wolfpack_feed_cursor(
  p_user_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_cursor TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_cursor_id UUID DEFAULT NULL,
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
  user_following BOOLEAN,
  next_cursor TIMESTAMP WITH TIME ZONE,
  next_cursor_id UUID
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
      u.wolf_emoji,
      ROW_NUMBER() OVER (ORDER BY v.created_at DESC, v.id DESC) as rn
    FROM content_posts v
    INNER JOIN users u ON v.user_id = u.id
    WHERE v.is_active = true
      AND (NOT p_following_only OR v.user_id = ANY(v_following_ids))
      AND (
        p_cursor IS NULL 
        OR v.created_at < p_cursor 
        OR (v.created_at = p_cursor AND v.id < p_cursor_id)
      )
    ORDER BY v.created_at DESC, v.id DESC
    LIMIT p_limit + 1
  ),
  paginated_data AS (
    SELECT * FROM video_data WHERE rn <= p_limit
  ),
  next_page_info AS (
    SELECT 
      vd.created_at as next_created_at,
      vd.id as next_id
    FROM video_data vd
    WHERE vd.rn = p_limit + 1
    LIMIT 1
  )
  SELECT 
    pd.id,
    pd.user_id,
    pd.title,
    pd.description,
    pd.caption,
    pd.video_url,
    pd.thumbnail_url,
    pd.duration,
    pd.view_count,
    pd.like_count,
    pd.content_comments_count,
    pd.shares_count,
    pd.music_name,
    pd.hashtags,
    pd.created_at,
    pd.username,
    pd.display_name,
    pd.first_name,
    pd.last_name,
    pd.avatar_url,
    pd.profile_image_url,
    pd.wolf_emoji,
    CASE 
      WHEN p_user_id IS NOT NULL THEN 
        EXISTS(SELECT 1 FROM wolfpack_post_likes wl WHERE wl.video_id = pd.id AND wl.user_id = p_user_id)
      ELSE FALSE
    END AS user_liked,
    CASE 
      WHEN p_user_id IS NOT NULL THEN 
        EXISTS(SELECT 1 FROM social_follows wf WHERE wf.follower_id = p_user_id AND wf.following_id = pd.user_id)
      ELSE FALSE
    END AS user_following,
    npi.next_created_at as next_cursor,
    npi.next_id as next_cursor_id
  FROM paginated_data pd
  CROSS JOIN LATERAL (SELECT * FROM next_page_info) npi;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION get_user_wolfpack_post_likes(p_user_id UUID, p_video_ids UUID[])
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT video_id FROM wolfpack_post_likes 
    WHERE user_id = p_user_id AND video_id = ANY(p_video_ids)
  );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_user_following(p_user_id UUID, p_user_ids UUID[])
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT following_id FROM social_follows 
    WHERE follower_id = p_user_id AND following_id = ANY(p_user_ids)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. ANALYZE TABLES FOR UPDATED STATISTICS
ANALYZE content_posts;
ANALYZE wolfpack_post_likes;
ANALYZE social_follows;
ANALYZE content_comments;
ANALYZE users;

-- 7. SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE 'Wolfpack feed optimizations applied successfully!';
  RAISE NOTICE 'Performance improvements:';
  RAISE NOTICE '- Optimized indexes for faster queries';
  RAISE NOTICE '- New RPC functions: get_wolfpack_feed_optimized() and get_wolfpack_feed_cursor()';
  RAISE NOTICE '- Eliminated N+1 query patterns';
  RAISE NOTICE '- Added cursor-based pagination support';
END $$;