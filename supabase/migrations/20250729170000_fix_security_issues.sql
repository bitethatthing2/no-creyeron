-- Fix security issues identified in the audit report

-- 1. Fix function search paths for security
ALTER FUNCTION IF EXISTS get_wolfpack_feed_public() SET search_path = public, pg_catalog;
ALTER FUNCTION IF EXISTS get_wolfpack_feed_integrated() SET search_path = public, pg_catalog;
ALTER FUNCTION IF EXISTS normalize_location() SET search_path = public, pg_catalog;
ALTER FUNCTION IF EXISTS get_wolfpack_feed() SET search_path = public, pg_catalog;
ALTER FUNCTION IF EXISTS migrate_user_to_auth() SET search_path = public, pg_catalog;
ALTER FUNCTION IF EXISTS link_user_to_auth() SET search_path = public, pg_catalog;

-- 2. Handle archived tables - either add RLS policies or drop if not needed
-- Adding basic RLS policies for archived tables (can be dropped if tables are unused)

-- Check if archived tables exist and add policies
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'food_drink_categories_archived') THEN
        -- Enable RLS if not already enabled
        ALTER TABLE food_drink_categories_archived ENABLE ROW LEVEL SECURITY;
        
        -- Add basic policy for archived categories
        DROP POLICY IF EXISTS "Allow read access to archived categories" ON food_drink_categories_archived;
        CREATE POLICY "Allow read access to archived categories" ON food_drink_categories_archived
          FOR SELECT USING (true);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'food_drink_items_archived') THEN
        -- Enable RLS if not already enabled  
        ALTER TABLE food_drink_items_archived ENABLE ROW LEVEL SECURITY;
        
        -- Add basic policy for archived items
        DROP POLICY IF EXISTS "Allow read access to archived items" ON food_drink_items_archived;
        CREATE POLICY "Allow read access to archived items" ON food_drink_items_archived
          FOR SELECT USING (true);
    END IF;
END
$$;

-- 3. Update menu_view to use SECURITY INVOKER instead of SECURITY DEFINER (safer)
-- Note: This will need to be recreated if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.views WHERE table_name = 'menu_view') THEN
        -- Store the view definition to recreate it
        -- This is a placeholder - the actual view definition would need to be retrieved
        RAISE NOTICE 'menu_view exists - consider recreating with SECURITY INVOKER';
    END IF;
END
$$;

-- 4. Create missing database functions that the feed strategies are looking for
-- These will make Strategy 1 and Strategy 2 work properly

-- Create get_wolfpack_feed_cached function
CREATE OR REPLACE FUNCTION get_wolfpack_feed_cached(limit_count INT DEFAULT 20, offset_count INT DEFAULT 0)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    caption TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    likes_count BIGINT,
    wolfpack_comments_count BIGINT,
    shares_count INT,
    created_at TIMESTAMP WITH TIME ZONE,
    music_name TEXT,
    hashtags TEXT[],
    view_count INT
) 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wv.id,
        wv.user_id,
        COALESCE(u.display_name, u.username, 'Anonymous') as username,
        COALESCE(u.avatar_url, u.profile_image_url) as avatar_url,
        COALESCE(wv.description, wv.title, '') as caption,
        wv.video_url,
        wv.thumbnail_url,
        COALESCE(COUNT(wpl.id), 0)::BIGINT as likes_count,
        COALESCE(COUNT(wc.id), 0)::BIGINT as wolfpack_comments_count,
        0 as shares_count,
        wv.created_at,
        'Original Sound' as music_name,
        ARRAY[]::TEXT[] as hashtags,
        COALESCE(wv.view_count, 0) as view_count
    FROM wolfpack_videos wv
    LEFT JOIN users u ON wv.user_id = u.id
    LEFT JOIN wolfpack_post_likes wpl ON wv.id = wpl.video_id
    LEFT JOIN wolfpack_comments wc ON wv.id = wc.video_id AND NOT wc.is_deleted
    WHERE wv.is_active = true
    GROUP BY wv.id, wv.user_id, u.display_name, u.username, u.avatar_url, u.profile_image_url, 
             wv.description, wv.title, wv.video_url, wv.thumbnail_url, wv.created_at, wv.view_count
    ORDER BY wv.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- Create get_wolfpack_feed_lite function  
CREATE OR REPLACE FUNCTION get_wolfpack_feed_lite()
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER  
SET search_path = public, pg_catalog
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', wv.id,
            'user_id', wv.user_id,
            'username', COALESCE(u.display_name, u.username, 'Anonymous'),
            'avatar_url', COALESCE(u.avatar_url, u.profile_image_url),
            'content', COALESCE(wv.description, wv.title, ''),
            'media_url', wv.video_url,
            'thumbnail_url', wv.thumbnail_url,
            'likes_count', COALESCE(wv.like_count, 0),
            'wolfpack_comments_count', COALESCE(
                (SELECT COUNT(*) FROM wolfpack_comments wc 
                 WHERE wc.video_id = wv.id AND NOT wc.is_deleted), 0
            ),
            'shares_count', 0,
            'created_at', wv.created_at,
            'hashtags', ARRAY[]::TEXT[],
            'views_count', COALESCE(wv.view_count, 0)
        )
    ) INTO result
    FROM wolfpack_videos wv
    LEFT JOIN users u ON wv.user_id = u.id  
    WHERE wv.is_active = true
    ORDER BY wv.created_at DESC
    LIMIT 20;
    
    RETURN COALESCE(result, '[]'::JSON);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_wolfpack_feed_cached(INT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_wolfpack_feed_lite() TO anon, authenticated;