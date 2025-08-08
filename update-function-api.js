const https = require('https');

const projectRef = 'tvnpgbjypnezoasbhbwx';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2bnBnYmp5cG5lem9hc2JoYnd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM5MzQwMywiZXhwIjoyMDYzOTY5NDAzfQ.coNBjmUMYmljAjdav4XZK3HyU1TwsvBiS4TUnV9xOv4';

const sql = `
-- Fix get_wolfpack_feed_simple to return data from wolfpack_videos instead of wolfpack_posts
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
    wolfpack_comments_count integer,
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
        v.wolfpack_comments_count,
        0 as shares_count,
        v.views_count,
        v.is_featured,
        v.hashtags,
        u.username,
        u.first_name,
        u.last_name,
        u.avatar_url,
        u.wolf_emoji,
        false as verified,
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
    FROM wolfpack_videos v
    LEFT JOIN users u ON v.user_id = u.id
    WHERE v.is_active = true
    ORDER BY v.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_wolfpack_feed_simple TO authenticated;
GRANT EXECUTE ON FUNCTION get_wolfpack_feed_simple TO anon;
`;

// Prepare the request
const data = JSON.stringify({ query: sql });

const options = {
  hostname: `${projectRef}.supabase.co`,
  port: 443,
  path: '/rest/v1/rpc/query',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`
  }
};

console.log('Sending SQL query to update function...\n');

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✓ Function updated successfully!');
    } else {
      console.log(`Response status: ${res.statusCode}`);
      console.log('Response:', responseData);
      
      console.log('\n⚠️  The function needs to be updated manually.');
      console.log('Please go to the Supabase dashboard SQL editor and execute the SQL from fix-feed-function.sql');
      console.log('Dashboard URL: https://supabase.com/dashboard/project/tvnpgbjypnezoasbhbwx/sql/new');
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(data);
req.end();