#!/usr/bin/env node

/**
 * Test script to verify wolfpack feed query performance optimizations
 */

const { createClient } = require('@supabase/supabase-js');
const { performance } = require('perf_hooks');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function measureQueryPerformance(queryName, queryFunction) {
  console.log(`\n🔍 Testing ${queryName}...`);
  
  const start = performance.now();
  
  try {
    const result = await queryFunction();
    const end = performance.now();
    const duration = Math.round(end - start);
    
    console.log(`✅ ${queryName}: ${duration}ms`);
    console.log(`   📊 Results: ${result?.data?.length || 0} items`);
    
    return {
      name: queryName,
      duration,
      success: true,
      itemCount: result?.data?.length || 0,
      error: result?.error
    };
  } catch (error) {
    const end = performance.now();
    const duration = Math.round(end - start);
    
    console.log(`❌ ${queryName}: ${duration}ms (ERROR)`);
    console.log(`   🚨 Error: ${error.message}`);
    
    return {
      name: queryName,
      duration,
      success: false,
      error: error.message
    };
  }
}

async function testFeedQueries() {
  console.log('🚀 Starting Wolfpack Feed Performance Tests');
  console.log('=' * 50);

  const results = [];

  // Test 1: Basic feed query with optimized function
  results.push(await measureQueryPerformance(
    'Optimized Feed Query (RPC)',
    () => supabase.rpc('get_wolfpack_feed_optimized', {
      p_user_id: null,
      p_limit: 20,
      p_offset: 0,
      p_following_only: false
    })
  ));

  // Test 2: Cursor-based pagination
  results.push(await measureQueryPerformance(
    'Cursor-based Pagination',
    () => supabase.rpc('get_wolfpack_feed_cursor', {
      p_user_id: null,
      p_limit: 20,
      p_cursor: null,
      p_cursor_id: null,
      p_following_only: false
    })
  ));

  // Test 3: Check if indexes exist
  results.push(await measureQueryPerformance(
    'Index Check Query',
    () => supabase
      .from('pg_indexes')
      .select('indexname')
      .eq('tablename', 'content_posts')
      .like('indexname', 'idx_content_posts_%')
  ));

  // Test 4: Materialized view existence
  results.push(await measureQueryPerformance(
    'Materialized View Check',
    () => supabase
      .from('pg_matviews')
      .select('matviewname')
      .eq('matviewname', 'wolfpack_feed_cache')
  ));

  // Test 5: Helper functions
  results.push(await measureQueryPerformance(
    'User Likes Batch Query',
    async () => {
      // First get some video IDs
      const { data: content_posts } = await supabase
        .from('content_posts')
        .select('id')
        .eq('is_active', true)
        .limit(5);
      
      if (!content_posts || content_posts.length === 0) {
        return { data: [], error: null };
      }
      
      const videoIds = content_posts.map(v => v.id);
      return supabase.rpc('get_user_wolfpack_post_likes', {
        p_user_id: null, // No user for test
        p_video_ids: videoIds
      });
    }
  ));

  // Summary
  console.log('\n📊 Performance Test Summary');
  console.log('=' * 50);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful tests: ${successful.length}`);
  console.log(`❌ Failed tests: ${failed.length}`);
  
  if (successful.length > 0) {
    const avgTime = Math.round(
      successful.reduce((sum, r) => sum + r.duration, 0) / successful.length
    );
    console.log(`⏱️  Average query time: ${avgTime}ms`);
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    failed.forEach(result => {
      console.log(`   - ${result.name}: ${result.error}`);
    });
  }

  // Performance recommendations
  console.log('\n💡 Performance Recommendations:');
  successful.forEach(result => {
    if (result.duration > 1000) {
      console.log(`⚠️  ${result.name} took ${result.duration}ms - consider further optimization`);
    } else if (result.duration < 100) {
      console.log(`🚀 ${result.name} is performing excellently (${result.duration}ms)`);
    } else {
      console.log(`✅ ${result.name} is performing well (${result.duration}ms)`);
    }
  });

  return results;
}

async function testIndexEffectiveness() {
  console.log('\n🔍 Testing Index Effectiveness');
  console.log('=' * 30);

  // Test query plans (if we have access)
  try {
    const { data, error } = await supabase
      .rpc('explain_feed_query', {
        query_text: `
          SELECT v.id, v.created_at, u.display_name 
          FROM content_posts v 
          JOIN users u ON v.user_id = u.id 
          WHERE v.is_active = true 
          ORDER BY v.created_at DESC 
          LIMIT 20
        `
      });

    if (error) {
      console.log('⚠️  Could not analyze query plans (expected if explain function not available)');
    } else {
      console.log('📈 Query plan analysis available');
      console.log(data);
    }
  } catch (error) {
    console.log('⚠️  Query plan analysis not available');
  }
}

// Main execution
async function main() {
  try {
    await testFeedQueries();
    await testIndexEffectiveness();
    
    console.log('\n🎉 Performance testing completed!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  testFeedQueries,
  testIndexEffectiveness,
  measureQueryPerformance
};