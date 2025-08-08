const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tvnpgbjypnezoasbhbwx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2bnBnYmp5cG5lem9hc2JoYnd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM5MzQwMywiZXhwIjoyMDYzOTY5NDAzfQ.coNBjmUMYmljAjdav4XZK3HyU1TwsvBiS4TUnV9xOv4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeFix() {
  console.log('Executing SQL to fix get_wolfpack_feed_simple function...\n');

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
        0 as shares_count, -- shares_count doesn't exist in wolfpack_videos
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
    FROM wolfpack_videos v
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
COMMENT ON FUNCTION get_wolfpack_feed_simple IS 'Get wolfpack feed items from wolfpack_videos table without authentication';
  `;

  try {
    // Execute SQL using the service role key
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => {
      // If exec_sql doesn't exist, we need to use REST API
      return { data: null, error: 'exec_sql function not available' };
    });

    if (error && error === 'exec_sql function not available') {
      console.log('Direct SQL execution not available, creating exec_sql function first...');
      
      // Try direct REST API call
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_wolfpack_feed_simple?limit_count=1&offset_count=0`, {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        }
      });

      const currentData = await response.json();
      console.log('Current function returns:', currentData.length > 0 ? Object.keys(currentData[0]) : 'No data');
      
      console.log('\nThe function needs to be updated through the Supabase dashboard SQL editor.');
      console.log('Please execute the SQL in fix-feed-function.sql file.');
      return;
    }

    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }

    console.log('✓ Function updated successfully!');

    // Test the updated function
    console.log('\nTesting updated function...');
    const { data: testData, error: testError } = await supabase.rpc('get_wolfpack_feed_simple', {
      limit_count: 1,
      offset_count: 0
    });

    if (testError) {
      console.error('Error testing function:', testError);
    } else {
      console.log('Function now returns:', testData.length > 0 ? Object.keys(testData[0]) : 'No data');
      if (testData.length > 0 && testData[0].caption && testData[0].video_url) {
        console.log('✓ Function is returning correct data structure!');
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

executeFix().then(() => {
  console.log('\nDone!');
  process.exit(0);
});