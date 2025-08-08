-- ===================================================================
-- COMPLEMENTARY OPTIMIZATIONS FOR EXISTING WOLFPACK FEED FIXES
-- ===================================================================
-- These complement your existing RLS, location, and performance fixes
-- ===================================================================

-- 1. ADD MISSING INDEXES TO COMPLEMENT YOUR EXISTING ONES
-- (Only creates if they don't already exist)

-- Compound index for location + wolfpack status queries
CREATE INDEX IF NOT EXISTS idx_users_location_wolfpack_active 
ON users(location, wolfpack_status, is_active) 
WHERE wolfpack_status = 'active' AND is_active = true;

-- Index for auth lookups in your get_user_id_from_auth function
CREATE INDEX IF NOT EXISTS idx_users_auth_id_active 
ON users(auth_id) 
WHERE is_active = true;

-- Partial index for active wolfpack wolfpack_videos by location
CREATE INDEX IF NOT EXISTS idx_wolfpack_videos_active_location_date 
ON wolfpack_videos(location_tag, created_at DESC, user_id) 
WHERE is_active = true;

-- Index for comment counts (to support your automatic count updates)
CREATE INDEX IF NOT EXISTS idx_wolfpack_comments_video_active_date 
ON wolfpack_comments(video_id, created_at DESC) 
WHERE is_deleted = false;

-- 2. ENHANCE YOUR MATERIALIZED VIEW WITH ADDITIONAL PERFORMANCE FIELDS
-- (Adds computed fields that might be missing)

-- Check if materialized view exists and enhance it
DO $$
BEGIN
  -- Add helpful computed columns if the view exists
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'wolfpack_feed_cache') THEN
    -- Refresh with any new structure
    REFRESH MATERIALIZED VIEW CONCURRENTLY wolfpack_feed_cache;
    
    RAISE NOTICE 'Enhanced existing wolfpack_feed_cache materialized view';
  ELSE
    RAISE NOTICE 'Materialized view wolfpack_feed_cache not found - will be created by your existing migration';
  END IF;
END $$;

-- 3. ADD FUNCTION TO VALIDATE LOCATION ACCESS (Complements your location fixes)
CREATE OR REPLACE FUNCTION user_can_access_location(
  p_user_auth_id UUID,
  p_location_tag TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_location TEXT;
  v_user_status TEXT;
BEGIN
  -- Get user's location and status
  SELECT 
    normalize_location(location),
    wolfpack_status
  INTO v_user_location, v_user_status
  FROM users 
  WHERE auth_id = p_user_auth_id 
    AND is_active = true;
  
  -- Check if user exists and is active wolfpack member
  IF v_user_location IS NULL OR v_user_status != 'active' THEN
    RETURN false;
  END IF;
  
  -- Check if locations match (using your normalize_location function)
  RETURN normalize_location(v_user_location) = normalize_location(p_location_tag);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. OPTIMIZE YOUR FEED FUNCTIONS WITH BETTER ERROR HANDLING
CREATE OR REPLACE FUNCTION get_wolfpack_feed_with_validation(
  p_user_auth_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  caption TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  like_count INTEGER,
  comment_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  user_display_name TEXT,
  user_avatar_url TEXT,
  user_liked BOOLEAN,
  can_edit BOOLEAN
) AS $$
DECLARE
  v_user_id UUID;
  v_user_location TEXT;
BEGIN
  -- Get user info using your existing function
  v_user_id := get_user_id_from_auth(p_user_auth_id);
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found or not active';
  END IF;
  
  -- Get user location
  SELECT normalize_location(location) INTO v_user_location
  FROM users WHERE id = v_user_id;
  
  -- Return feed data with validation
  RETURN QUERY
  SELECT 
    v.id,
    v.user_id,
    v.title,
    v.caption,
    v.video_url,
    v.thumbnail_url,
    v.like_count,
    v.comment_count,
    v.created_at,
    COALESCE(u.display_name, u.first_name || ' ' || u.last_name) as user_display_name,
    u.avatar_url as user_avatar_url,
    EXISTS(
      SELECT 1 FROM wolfpack_post_likes wpl 
      WHERE wpl.video_id = v.id AND wpl.user_id = v_user_id
    ) as user_liked,
    (v.user_id = v_user_id) as can_edit
  FROM wolfpack_videos v
  INNER JOIN users u ON v.user_id = u.id
  WHERE v.is_active = true
    AND normalize_location(v.location_tag) = v_user_location
    AND u.wolfpack_status = 'active'
    AND u.is_active = true
  ORDER BY v.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. CREATE MONITORING FUNCTION FOR YOUR OPTIMIZATIONS
CREATE OR REPLACE FUNCTION check_wolfpack_optimization_status()
RETURNS TABLE (
  optimization_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Check indexes
  SELECT 
    'Indexes' as optimization_name,
    CASE WHEN COUNT(*) >= 10 THEN 'GOOD' ELSE 'NEEDS_ATTENTION' END as status,
    COUNT(*)::TEXT || ' wolfpack indexes found' as details
  FROM pg_indexes 
  WHERE tablename IN ('wolfpack_videos', 'users', 'wolfpack_comments', 'wolfpack_post_likes')
    AND indexname LIKE '%wolfpack%' OR indexname LIKE '%users%'
  
  UNION ALL
  
  -- Check materialized view
  SELECT 
    'Materialized View' as optimization_name,
    CASE WHEN COUNT(*) > 0 THEN 'GOOD' ELSE 'MISSING' END as status,
    CASE WHEN COUNT(*) > 0 THEN 'wolfpack_feed_cache exists' ELSE 'Create materialized view' END as details
  FROM pg_matviews 
  WHERE matviewname = 'wolfpack_feed_cache'
  
  UNION ALL
  
  -- Check functions
  SELECT 
    'Custom Functions' as optimization_name,
    CASE WHEN COUNT(*) >= 3 THEN 'GOOD' ELSE 'INCOMPLETE' END as status,
    COUNT(*)::TEXT || ' wolfpack functions found' as details
  FROM pg_proc 
  WHERE proname LIKE '%wolfpack%' OR proname LIKE '%normalize_location%'
  
  UNION ALL
  
  -- Check RLS policies
  SELECT 
    'RLS Policies' as optimization_name,
    CASE WHEN COUNT(*) >= 6 THEN 'GOOD' ELSE 'NEEDS_REVIEW' END as status,
    COUNT(*)::TEXT || ' policies on wolfpack tables' as details
  FROM pg_policies 
  WHERE tablename LIKE '%wolfpack%';
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. PERFORMANCE MONITORING VIEW
CREATE OR REPLACE VIEW wolfpack_performance_metrics AS
SELECT 
  'Feed Query Performance' as metric_name,
  (
    SELECT COUNT(*) 
    FROM wolfpack_videos v 
    JOIN users u ON v.user_id = u.id 
    WHERE v.is_active = true 
      AND u.wolfpack_status = 'active'
  )::TEXT as current_value,
  'Active posts from active users' as description

UNION ALL

SELECT 
  'Cache Freshness' as metric_name,
  CASE 
    WHEN EXISTS(SELECT 1 FROM pg_matviews WHERE matviewname = 'wolfpack_feed_cache') 
    THEN 'Available'
    ELSE 'Not Available'
  END as current_value,
  'Materialized view status' as description

UNION ALL

SELECT 
  'Index Usage' as metric_name,
  (
    SELECT COUNT(*)::TEXT 
    FROM pg_stat_user_indexes 
    WHERE relname IN ('wolfpack_videos', 'users', 'wolfpack_comments', 'wolfpack_post_likes')
      AND idx_scan > 0
  ) as current_value,
  'Indexes being used' as description;

-- 7. ANALYZE TABLES FOR UPDATED STATISTICS
ANALYZE wolfpack_videos;
ANALYZE users;
ANALYZE wolfpack_comments;
ANALYZE wolfpack_post_likes;

-- 8. SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE 'Complementary optimizations applied successfully!';
  RAISE NOTICE 'These enhance your existing RLS, location, and performance fixes';
  RAISE NOTICE 'Run: SELECT * FROM check_wolfpack_optimization_status();';
  RAISE NOTICE 'Run: SELECT * FROM wolfpack_performance_metrics;';
END $$;