-- Create wolfpack_feed_api view for unified feed data access
-- This view provides all necessary fields for the feed components
-- Based on actual database schema fields

CREATE OR REPLACE VIEW wolfpack_feed_api AS
SELECT 
  -- Core content post fields
  cp.id,
  cp.user_id,
  cp.title,
  cp.description,
  cp.caption,
  COALESCE(cp.like_count, 0) as likes_count,
  COALESCE(cp.comment_count, 0) as comments_count,
  COALESCE(cp.share_count, 0) as shares_count,
  COALESCE(cp.view_count, 0) as views_count,
  cp.hashtags,
  cp.location_name as location_tag,
  cp.is_featured,
  cp.visibility,
  cp.created_at,
  cp.updated_at,
  
  -- User information
  u.username,
  u.display_name,
  u.avatar_url,
  u.profile_image_url,
  u.wolfpack_status,
  u.verified,
  
  -- Computed fields for compatibility
  cp.like_count,
  cp.comment_count,
  cp.share_count,
  cp.view_count,
  
  -- Default values for missing fields
  NULL as video_url,
  NULL as thumbnail_url,
  NULL as duration_seconds,
  NULL as music_name,
  true as allow_comments,
  true as is_active
  
FROM content_posts cp
LEFT JOIN users u ON cp.user_id = u.id
WHERE cp.deleted_at IS NULL
ORDER BY cp.created_at DESC;

-- Grant appropriate permissions
GRANT SELECT ON wolfpack_feed_api TO authenticated;
GRANT SELECT ON wolfpack_feed_api TO anon;