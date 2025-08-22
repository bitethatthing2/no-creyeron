-- ===================================================================
-- Add Cursor-Based Pagination Support for Wolfpack Feed
-- ===================================================================
-- This migration adds support for cursor-based pagination which is more
-- efficient than offset-based pagination for large datasets
-- ===================================================================

-- Create a function for cursor-based pagination
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
      -- Include row number for finding next cursor
      ROW_NUMBER() OVER (ORDER BY v.created_at DESC, v.id DESC) as rn
    FROM content_posts v
    INNER JOIN users u ON v.user_id = u.id
    WHERE v.is_active = true
      AND (NOT p_following_only OR v.user_id = ANY(v_following_ids))
      -- Apply cursor filter if provided
      AND (
        p_cursor IS NULL 
        OR v.created_at < p_cursor 
        OR (v.created_at = p_cursor AND v.id < p_cursor_id)
      )
    ORDER BY v.created_at DESC, v.id DESC
    LIMIT p_limit + 1 -- Fetch one extra to determine if there's a next page
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

-- Add composite index for cursor-based pagination
CREATE INDEX IF NOT EXISTS idx_content_posts_cursor_pagination 
ON content_posts(created_at DESC, id DESC) 
WHERE is_active = true;

-- Create a function to encode/decode cursor for client use
CREATE OR REPLACE FUNCTION encode_feed_cursor(
  p_timestamp TIMESTAMP WITH TIME ZONE,
  p_id UUID
)
RETURNS TEXT AS $$
BEGIN
  -- Simple encoding: timestamp|id
  RETURN encode((p_timestamp::TEXT || '|' || p_id::TEXT)::bytea, 'base64');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION decode_feed_cursor(p_cursor TEXT)
RETURNS TABLE (
  cursor_timestamp TIMESTAMP WITH TIME ZONE,
  cursor_id UUID
) AS $$
DECLARE
  v_decoded TEXT;
  v_parts TEXT[];
BEGIN
  -- Decode base64
  v_decoded := convert_from(decode(p_cursor, 'base64'), 'UTF8');
  v_parts := string_to_array(v_decoded, '|');
  
  IF array_length(v_parts, 1) != 2 THEN
    RAISE EXCEPTION 'Invalid cursor format';
  END IF;
  
  RETURN QUERY
  SELECT 
    v_parts[1]::TIMESTAMP WITH TIME ZONE,
    v_parts[2]::UUID;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment to describe cursor pagination usage
COMMENT ON FUNCTION get_wolfpack_feed_cursor IS '
Cursor-based pagination for wolfpack feed. More efficient than offset-based pagination for large datasets.

Usage:
- First page: Call without p_cursor and p_cursor_id
- Next pages: Use next_cursor and next_cursor_id from previous result
- Returns next_cursor and next_cursor_id as NULL when no more pages

Example:
SELECT * FROM get_wolfpack_feed_cursor(
  p_user_id := ''user-uuid'',
  p_limit := 20,
  p_cursor := NULL,
  p_cursor_id := NULL,
  p_following_only := false
);
';