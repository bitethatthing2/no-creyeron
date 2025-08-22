-- Fix get_wolfpack_feed_simple to return data from content_posts instead of content_posts
DROP FUNCTION IF EXISTS get_wolfpack_feed_simple(integer, integer);

CREATE OR REPLACE FUNCTION get_wolfpack_feed_simple(
    limit_count integer DEFAULT 20,
    offset_count integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    caption text,
    video_url text,
    thumbnail_url text,
    visibility text,
    created_at timestamptz,
    updated_at timestamptz,
    likes_count integer,
    content_comments_count integer,
    shares_count integer,
    views_count integer,
    is_featured boolean,
    hashtags text[],
    username text,
    first_name text,
    last_name text,
    avatar_url text,
    wolf_emoji text,
    verified boolean,
    profile_image_url text,
    display_name text,
    duration integer,
    duration_seconds integer,
    title text,
    description text,
    like_count integer,
    comment_count integer,
    view_count integer,
    music_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.user_id,
        v.caption,
        v.video_url,
        v.thumbnail_url,
        v.visibility,
        v.created_at,
        v.updated_at,
        v.likes_count,
        v.content_comments_count,
        0 as shares_count, -- shares_count doesn't exist in content_posts
        v.views_count,
        v.is_featured,
        v.hashtags,
        u.username,
        u.first_name,
        u.last_name,
        u.avatar_url,
        u.wolf_emoji,
        false as verified, -- verified doesn't exist in users table
        u.profile_image_url,
        u.display_name,
        v.duration,
        v.duration_seconds,
        v.title,
        v.description,
        v.like_count,
        v.comment_count,
        v.view_count,
        v.music_name
    FROM content_posts v
    LEFT JOIN users u ON v.user_id = u.id
    WHERE v.is_active = true
    ORDER BY v.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION get_wolfpack_feed_simple TO authenticated;
GRANT EXECUTE ON FUNCTION get_wolfpack_feed_simple TO anon;

-- Add comment
COMMENT ON FUNCTION get_wolfpack_feed_simple IS 'Get wolfpack feed items from content_posts table without authentication';