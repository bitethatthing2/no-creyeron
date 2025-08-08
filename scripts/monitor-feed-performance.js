#!/usr/bin/env node

/**
 * Monitor Wolfpack Feed Performance
 * Complements your existing backend fixes with monitoring
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkOptimizationStatus() {
  console.log('🔍 Checking Wolfpack Feed Optimization Status\n');
  
  try {
    // Check your optimization status using the function we created
    const { data: status, error } = await supabase
      .rpc('check_wolfpack_optimization_status');
    
    if (error) {
      console.error('❌ Error checking status:', error.message);
      return;
    }
    
    console.log('📊 Optimization Status:');
    status.forEach(item => {
      const statusIcon = item.status === 'GOOD' ? '✅' : '⚠️';
      console.log(`${statusIcon} ${item.optimization_name}: ${item.status}`);
      console.log(`   ${item.details}\n`);
    });
    
  } catch (error) {
    console.error('💥 Failed to check optimization status:', error.message);
  }
}

async function checkPerformanceMetrics() {
  console.log('📈 Performance Metrics\n');
  
  try {
    const { data: metrics, error } = await supabase
      .from('wolfpack_performance_metrics')
      .select('*');
    
    if (error) {
      console.error('❌ Error fetching metrics:', error.message);
      return;
    }
    
    metrics.forEach(metric => {
      console.log(`📊 ${metric.metric_name}: ${metric.current_value}`);
      console.log(`   ${metric.description}\n`);
    });
    
  } catch (error) {
    console.error('💥 Failed to fetch performance metrics:', error.message);
  }
}

async function testFeedPerformance() {
  console.log('🚀 Testing Feed Performance\n');
  
  const tests = [
    {
      name: 'Standard Feed Query',
      query: () => supabase
        .from('wolfpack_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
    },
    {
      name: 'Optimized Feed Function',
      query: () => supabase.rpc('get_wolfpack_feed_optimized', {
        p_user_auth_id: null,
        p_limit: 20,
        p_offset: 0
      })
    },
    {
      name: 'Location-Based Access Test',
      query: () => supabase.rpc('user_can_access_location', {
        p_user_auth_id: null,
        p_location_tag: 'florida_state'
      })
    }
  ];
  
  for (const test of tests) {
    const start = Date.now();
    
    try {
      const { data, error } = await test.query();
      const duration = Date.now() - start;
      
      if (error) {
        console.log(`❌ ${test.name}: ${error.message} (${duration}ms)`);
      } else {
        const resultCount = Array.isArray(data) ? data.length : 1;
        console.log(`✅ ${test.name}: ${duration}ms (${resultCount} results)`);
      }
    } catch (error) {
      const duration = Date.now() - start;
      console.log(`💥 ${test.name}: ${error.message} (${duration}ms)`);
    }
  }
}

async function refreshMaterializedView() {
  console.log('\n🔄 Refreshing Materialized View Cache\n');
  
  try {
    const { error } = await supabase.rpc('refresh_wolfpack_feed_cache');
    
    if (error) {
      console.error('❌ Error refreshing cache:', error.message);
    } else {
      console.log('✅ Cache refreshed successfully');
    }
  } catch (error) {
    console.error('💥 Failed to refresh cache:', error.message);
  }
}

async function generateReport() {
  console.log('📋 Wolfpack Feed Performance Report');
  console.log('=====================================\n');
  
  await checkOptimizationStatus();
  await checkPerformanceMetrics();
  await testFeedPerformance();
  await refreshMaterializedView();
  
  console.log('\n💡 Recommendations:');
  console.log('- Run this script periodically to monitor performance');
  console.log('- Refresh materialized view every 5-10 minutes in production');
  console.log('- Monitor query times - should be < 200ms with optimizations');
  console.log('- Check RLS policies are working correctly for location access');
}

// CLI handling
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'status':
      checkOptimizationStatus();
      break;
    case 'metrics':
      checkPerformanceMetrics();
      break;
    case 'test':
      testFeedPerformance();
      break;
    case 'refresh':
      refreshMaterializedView();
      break;
    case 'report':
    default:
      generateReport();
      break;
  }
}

module.exports = {
  checkOptimizationStatus,
  checkPerformanceMetrics,
  testFeedPerformance,
  refreshMaterializedView
};