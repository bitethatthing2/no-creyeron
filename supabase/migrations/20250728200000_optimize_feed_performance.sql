-- Feed Performance Optimization Migration
-- Adds indexes and optimizes queries for high-performance wolf pack feed

-- ===================================
-- 1. Core Feed Performance Indexes
-- ===================================

-- Primary feed query optimization (is_active + created_at)
CREATE INDEX IF NOT EXISTS idx_wolfpack_videos_feed_performance 
ON wolfpack_videos (is_active, created_at DESC) 
WHERE is_active = true;

-- User video queries optimization
CREATE INDEX IF NOT EXISTS idx_wolfpack_videos_user_timeline 
ON wolfpack_videos (user_id, is_active, created_at DESC) 
WHERE is_active = true;

-- Video stats queries optimization
CREATE INDEX IF NOT EXISTS idx_wolfpack_videos_stats 
ON wolfpack_videos (id, like_count, wolfpack_comments_count, view_count);

-- ===================================
-- 2. User Profile Performance Indexes
-- ===================================

-- Auth ID lookups (critical for RLS)
CREATE INDEX IF NOT EXISTS idx_users_auth_id_active 
ON users (auth_id) 
WHERE auth_id IS NOT NULL;

-- Username searches and user discovery
CREATE INDEX IF NOT EXISTS idx_users_username_active 
ON users (username, wolfpack_status) 
WHERE wolfpack_status = 'active';

-- Display name searches
CREATE INDEX IF NOT EXISTS idx_users_display_name 
ON users (display_name) 
WHERE display_name IS NOT NULL;

-- ===================================
-- 3. Engagement Performance Indexes
-- ===================================

-- Video likes for feed display
CREATE INDEX IF NOT EXISTS idx_wolfpack_post_likes_video_user 
ON wolfpack_post_likes (video_id, user_id);

-- User likes lookup (for checking if user liked a video)
CREATE INDEX IF NOT EXISTS idx_wolfpack_post_likes_user_video 
ON wolfpack_post_likes (user_id, video_id);

-- Video wolfpack_comments for feed display
CREATE INDEX IF NOT EXISTS idx_wolfpack_comments_video_active 
ON wolfpack_comments(video_id, is_deleted, created_at DESC) 
WHERE is_deleted = false;

-- User wolfpack_comments lookup
CREATE INDEX IF NOT EXISTS idx_wolfpack_comments_user_active 
ON wolfpack_comments(user_id, is_deleted, created_at DESC) 
WHERE is_deleted = false;

-- ===================================
-- 4. Realtime Performance Indexes
-- ===================================

-- For realtime subscriptions and live updates
CREATE INDEX IF NOT EXISTS idx_wolfpack_videos_realtime 
ON wolfpack_videos (created_at DESC, updated_at DESC) 
WHERE is_active = true;

-- Activity notifications for realtime updates
CREATE INDEX IF NOT EXISTS idx_wolfpack_notifications_recipient 
ON wolfpack_activity_notifications (recipient_id, created_at DESC, is_read);

-- ===================================
-- 5. Feed View Function (Optimized)
-- ===================================

-- Create an optimized view function for feed queries
CREATE OR REPLACE FUNCTION get_optimized_feed(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  like_count INTEGER,
  wolfpack_comments_count INTEGER,
  view_count INTEGER,
  created_at TIMESTAMPTZ,
  duration INTEGER,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  wolf_emoji TEXT,
  user_liked BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.user_id,
    v.title,
    v.description,
    v.video_url,
    v.thumbnail_url,
    v.like_count,
    v.wolfpack_comments_count,
    v.view_count,
    v.created_at,
    v.duration,
    u.username,
    u.display_name,
    u.avatar_url,
    u.wolf_emoji,
    CASE 
      WHEN p_user_id IS NOT NULL THEN 
        EXISTS(
          SELECT 1 FROM wolfpack_post_likes l 
          WHERE l.video_id = v.id AND l.user_id = p_user_id
        )
      ELSE false
    END as user_liked
  FROM wolfpack_videos v
  INNER JOIN users u ON v.user_id = u.id
  WHERE v.is_active = true
  ORDER BY v.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_optimized_feed(INTEGER, INTEGER, UUID) TO authenticated;

-- ===================================
-- 6. Video Stats Update Function (Optimized)
-- ===================================

-- Efficient stats update function
CREATE OR REPLACE FUNCTION update_video_stats(p_video_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update like count and comment count in one query
  UPDATE wolfpack_videos 
  SET 
    like_count = (
      SELECT COUNT(*) FROM wolfpack_post_likes 
      WHERE video_id = p_video_id
    ),
    wolfpack_comments_count = (
      SELECT COUNT(*) FROM wolfpack_comments
      WHERE video_id = p_video_id AND is_deleted = false
    ),
    updated_at = NOW()
  WHERE id = p_video_id;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION update_video_stats(UUID) TO authenticated;

-- ===================================
-- 7. User Engagement Summary View
-- ===================================

-- Materialized view for user engagement stats (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_engagement_stats AS
SELECT 
  u.id as user_id,
  u.username,
  u.display_name,
  COUNT(DISTINCT v.id) as video_count,
  COALESCE(SUM(v.like_count), 0) as total_likes,
  COALESCE(SUM(v.wolfpack_comments_count), 0) as total_wolfpack_comments,
  COALESCE(SUM(v.view_count), 0) as total_views,
  MAX(v.created_at) as last_video_at
FROM users u
LEFT JOIN wolfpack_videos v ON u.id = v.user_id AND v.is_active = true
WHERE u.wolfpack_status = 'active'
GROUP BY u.id, u.username, u.display_name;

-- Index for the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_engagement_stats_user_id 
ON user_engagement_stats (user_id);

-- Create index for top users queries
CREATE INDEX IF NOT EXISTS idx_user_engagement_stats_total_likes 
ON user_engagement_stats (total_likes DESC);

-- ===================================
-- 8. Automatic Stats Update Triggers
-- ===================================

-- Function to automatically update video stats on like/unlike
CREATE OR REPLACE FUNCTION trigger_update_video_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stats for the affected video
  IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
    PERFORM update_video_stats(COALESCE(NEW.video_id, OLD.video_id));
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for like count updates
DROP TRIGGER IF EXISTS update_video_like_stats ON wolfpack_post_likes;
CREATE TRIGGER update_video_like_stats
  AFTER INSERT OR DELETE ON wolfpack_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_video_stats();

-- Trigger for comment count updates
DROP TRIGGER IF EXISTS update_video_comment_stats ON wolfpack_comments;
CREATE TRIGGER update_video_comment_stats
  AFTER INSERT OR UPDATE OR DELETE ON wolfpack_comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_video_stats();

-- ===================================
-- 9. Performance Monitoring
-- ===================================

-- Function to analyze feed query performance
CREATE OR REPLACE FUNCTION analyze_feed_performance()
RETURNS TABLE(
  total_wolfpack_videos INTEGER,
  active_wolfpack_videos INTEGER,
  avg_likes_per_video NUMERIC,
  avg_wolfpack_comments_per_video NUMERIC,
  most_recent_video TIMESTAMPTZ,
  index_usage TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_wolfpack_videos,
    COUNT(*) FILTER (WHERE is_active = true)::INTEGER as active_wolfpack_videos,
    AVG(like_count) as avg_likes_per_video,
    AVG(wolfpack_comments_count) as avg_wolfpack_comments_per_video,
    MAX(created_at) as most_recent_video,
    'Check pg_stat_user_indexes for detailed index usage' as index_usage
  FROM wolfpack_videos;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION analyze_feed_performance() TO authenticated;

-- ===================================
-- 10. Cleanup and Maintenance
-- ===================================

-- Function to refresh materialized views (call periodically)
CREATE OR REPLACE FUNCTION refresh_feed_materialized_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW user_engagement_stats;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION refresh_feed_materialized_views() TO authenticated;

-- wolfpack_comments for documentation
COMMENT ON FUNCTION get_optimized_feed(INTEGER, INTEGER, UUID) IS 'Optimized feed query function with user like status';
COMMENT ON FUNCTION update_video_stats(UUID) IS 'Efficiently updates video like and comment counts';
COMMENT ON FUNCTION analyze_feed_performance() IS 'Provides feed performance analytics';
COMMENT ON FUNCTION refresh_feed_materialized_views() IS 'Refreshes materialized views for feed performance';

-- Final optimization: Update table statistics
ANALYZE wolfpack_videos;
ANALYZE users;
ANALYZE wolfpack_post_likes;
ANALYZE wolfpack_comments;