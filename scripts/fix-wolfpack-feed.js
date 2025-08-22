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

  // Check if content_posts table exists
  console.log('🔍 Testing direct table access...');
  
  // Try direct access to content_posts
  const { data: testcontent_posts, error: testError } = await supabase
    .from('content_posts')
    .select('id')
    .limit(1);

  if (testError) {
    console.error('❌ Error accessing content_posts:', testError.message);
    console.log('   Code:', testError.code);
    console.log('   Details:', testError.details);
    
    if (testError.code === '42P01') {
      console.log('⚠️  content_posts table does not exist!');
    }
  } else {
    console.log('✅ content_posts table is accessible');
    console.log(`   Found ${testcontent_posts?.length || 0} test records`);
  }

  // Try to query content_posts
  console.log('\n🔍 Testing content_posts query...');
  const { data: content_posts, error: content_postsError } = await supabase
    .from('content_posts')
    .select('*')
    .limit(5);

  if (content_postsError) {
    console.error('❌ Error querying content_posts:', content_postsError.message);
    console.log('   Code:', content_postsError.code);
    console.log('   Details:', content_postsError.details);
  } else {
    console.log(`✅ Successfully queried content_posts table. Found ${content_posts?.length || 0} content_posts.`);
  }

  // Check RLS policies
  console.log('\n🔒 Checking RLS policies...');
  const { data: policies, error: policiesError } = await supabase
    .rpc('get_policies', { table_name: 'content_posts' });

  if (policiesError) {
    // Try alternative approach
    const { data: altPolicies, error: altError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'content_posts');

    if (altError) {
      console.log('⚠️  Could not fetch RLS policies (this is normal for non-admin connections)');
    } else if (altPolicies) {
      console.log('📋 Found policies:', altPolicies.length);
    }
  } else if (policies) {
    console.log('📋 RLS policies found:', policies.length);
  }

  // Check if we need content_posts instead
  console.log('\n🔍 Checking for content_posts table (alternative)...');
  const { data: posts, error: postsError } = await supabase
    .from('content_posts')
    .select('*')
    .limit(1);

  if (!postsError) {
    console.log('✅ content_posts table exists and is accessible');
  } else if (postsError.code === '42P01') {
    console.log('ℹ️  content_posts table does not exist');
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