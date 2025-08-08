const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tvnpgbjypnezoasbhbwx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2bnBnYmp5cG5lem9hc2JoYnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzOTM0MDMsImV4cCI6MjA2Mzk2OTQwM30.5u3YkO5BvdJ3eabOzNhEuKDF2IvugTFE_EAvB-V7Y9c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFeedColumns() {
  console.log('\n=== Testing Feed Column Structure ===\n');

  try {
    // Test get_wolfpack_feed_simple to see what columns it returns
    console.log('Testing get_wolfpack_feed_simple columns:');
    const { data: simpleFeed, error: simpleFeedError } = await supabase
      .rpc('get_wolfpack_feed_simple', {
        limit_count: 1,
        offset_count: 0
      });

    if (simpleFeedError) {
      console.error('Error:', simpleFeedError);
    } else if (simpleFeed?.length > 0) {
      console.log('Columns returned by get_wolfpack_feed_simple:');
      console.log(Object.keys(simpleFeed[0]));
      console.log('\nFull first item:');
      console.log(JSON.stringify(simpleFeed[0], null, 2));
    }

    // Test wolfpack_videos table columns
    console.log('\n\nTesting wolfpack_videos table columns:');
    const { data: wolfpack_videos, error: wolfpack_videosError } = await supabase
      .from('wolfpack_videos')
      .select('*')
      .limit(1);

    if (wolfpack_videosError) {
      console.error('Error:', wolfpack_videosError);
    } else if (wolfpack_videos?.length > 0) {
      console.log('Columns in wolfpack_videos table:');
      console.log(Object.keys(wolfpack_videos[0]));
      console.log('\nFull first item:');
      console.log(JSON.stringify(wolfpack_videos[0], null, 2));
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testFeedColumns().then(() => {
  console.log('\n=== Test Complete ===\n');
  process.exit(0);
});