#!/usr/bin/env node

/**
 * Script to debug and fix Wolfpack feed loading issues
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkWolfpackTables() {
  console.log('🔍 Checking Wolfpack database tables...\n');

  // Check if wolfpack_videos table exists
  console.log('🔍 Testing direct table access...');
  
  // Try direct access to wolfpack_videos
  const { data: testwolfpack_videos, error: testError } = await supabase
    .from('wolfpack_videos')
    .select('id')
    .limit(1);

  if (testError) {
    console.error('❌ Error accessing wolfpack_videos:', testError.message);
    console.log('   Code:', testError.code);
    console.log('   Details:', testError.details);
    
    if (testError.code === '42P01') {
      console.log('⚠️  wolfpack_videos table does not exist!');
    }
  } else {
    console.log('✅ wolfpack_videos table is accessible');
    console.log(`   Found ${testwolfpack_videos?.length || 0} test records`);
  }

  // Try to query wolfpack_videos
  console.log('\n🔍 Testing wolfpack_videos query...');
  const { data: wolfpack_videos, error: wolfpack_videosError } = await supabase
    .from('wolfpack_videos')
    .select('*')
    .limit(5);

  if (wolfpack_videosError) {
    console.error('❌ Error querying wolfpack_videos:', wolfpack_videosError.message);
    console.log('   Code:', wolfpack_videosError.code);
    console.log('   Details:', wolfpack_videosError.details);
  } else {
    console.log(`✅ Successfully queried wolfpack_videos table. Found ${wolfpack_videos?.length || 0} wolfpack_videos.`);
  }

  // Check RLS policies
  console.log('\n🔒 Checking RLS policies...');
  const { data: policies, error: policiesError } = await supabase
    .rpc('get_policies', { table_name: 'wolfpack_videos' });

  if (policiesError) {
    // Try alternative approach
    const { data: altPolicies, error: altError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'wolfpack_videos');

    if (altError) {
      console.log('⚠️  Could not fetch RLS policies (this is normal for non-admin connections)');
    } else if (altPolicies) {
      console.log('📋 Found policies:', altPolicies.length);
    }
  } else if (policies) {
    console.log('📋 RLS policies found:', policies.length);
  }

  // Check if we need wolfpack_posts instead
  console.log('\n🔍 Checking for wolfpack_posts table (alternative)...');
  const { data: posts, error: postsError } = await supabase
    .from('wolfpack_posts')
    .select('*')
    .limit(1);

  if (!postsError) {
    console.log('✅ wolfpack_posts table exists and is accessible');
  } else if (postsError.code === '42P01') {
    console.log('ℹ️  wolfpack_posts table does not exist');
  }

  // Test with authentication
  console.log('\n🔐 Testing with authentication...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.log('⚠️  No authenticated user - some queries may fail due to RLS policies');
  } else {
    console.log('✅ Authenticated as:', user.email);
  }

  console.log('\n✨ Diagnostic complete!');
}

// Run the check
checkWolfpackTables().catch(console.error);