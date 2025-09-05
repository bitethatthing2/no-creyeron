#!/usr/bin/env node

// MENU_ITEMS Edge Function Deployment Verification Script
const EDGE_FUNCTION_URL = 'https://tvnpgbjypnezoasbhbwx.supabase.co/functions/v1/MENU_ITEMS';

/**
 * @typedef {Object} HealthCheck
 * @property {string} endpoint
 * @property {'success' | 'error'} status
 * @property {number} responseTime
 * @property {number} [dataCount]
 * @property {string} [error]
 */

/**
 * Check a specific endpoint
 * @param {string} endpoint 
 * @returns {Promise<HealthCheck>}
 */
async function checkEndpoint(endpoint) {
  const start = Date.now();
  try {
    const response = await fetch(`${EDGE_FUNCTION_URL}${endpoint}`);
    const data = await response.json();
    const responseTime = Date.now() - start;
    
    return {
      endpoint,
      status: data.success ? 'success' : 'error',
      responseTime,
      dataCount: data.data?.length || data.total_count || data.total || 0,
      error: data.error
    };
  } catch (error) {
    return {
      endpoint,
      status: 'error',
      responseTime: Date.now() - start,
      error: error.message
    };
  }
}

/**
 * Run comprehensive health checks
 */
async function runHealthChecks() {
  console.log('🔍 Running MENU_ITEMS Edge Function Health Checks...\n');
  
  const endpoints = [
    '/health',
    '/items?limit=5',
    '/types',
    '/categories',
    '/featured',
    '/search?q=test',
    '/grouped?group_by=type',
    '/grouped?group_by=category'
  ];
  
  /** @type {HealthCheck[]} */
  const results = [];
  
  console.log('📊 Testing Endpoints:\n');
  
  for (const endpoint of endpoints) {
    process.stdout.write(`   Testing ${endpoint}... `);
    
    const result = await checkEndpoint(endpoint);
    results.push(result);
    
    if (result.status === 'success') {
      console.log(`✅ ${result.responseTime}ms ${result.dataCount ? `(${result.dataCount} items)` : ''}`);
    } else {
      console.log(`❌ ${result.responseTime}ms - ${result.error}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Summary
  const successCount = results.filter(r => r.status === 'success').length;
  const avgResponseTime = Math.round(
    results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
  );
  const maxResponseTime = Math.max(...results.map(r => r.responseTime));
  
  console.log('\n📈 Performance Summary:');
  console.log(`   Total Endpoints: ${results.length}`);
  console.log(`   Successful: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)`);
  console.log(`   Average Response Time: ${avgResponseTime}ms`);
  console.log(`   Max Response Time: ${maxResponseTime}ms`);
  
  // Performance benchmarks
  console.log('\n⏱️  Performance Benchmarks:');
  const benchmarks = {
    '/health': 50,
    '/items': 200,
    '/types': 100,
    '/categories': 100,
    '/featured': 150,
    '/search': 250,
    '/grouped': 300
  };
  
  let benchmarksPassed = 0;
  results.forEach(result => {
    const benchmark = benchmarks[result.endpoint.split('?')[0]];
    if (benchmark) {
      const passed = result.responseTime <= benchmark;
      benchmarksPassed += passed ? 1 : 0;
      const icon = passed ? '✅' : '⚠️';
      console.log(`   ${icon} ${result.endpoint.split('?')[0]}: ${result.responseTime}ms (target: <${benchmark}ms)`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  
  // Overall status
  if (successCount === results.length) {
    console.log('\n✨ DEPLOYMENT SUCCESSFUL!');
    console.log('🚀 All endpoints are healthy and ready for production.');
    
    if (benchmarksPassed === Object.keys(benchmarks).length) {
      console.log('⚡ All performance benchmarks met!');
    } else {
      console.log(`⚠️  ${Object.keys(benchmarks).length - benchmarksPassed} endpoints exceed performance targets.`);
    }
  } else {
    console.log('\n❌ DEPLOYMENT ISSUES DETECTED');
    console.log('🔧 Some endpoints are failing. Please check the deployment.');
    
    // Show failed endpoints
    const failed = results.filter(r => r.status === 'error');
    console.log('\n💥 Failed Endpoints:');
    failed.forEach(result => {
      console.log(`   • ${result.endpoint}: ${result.error}`);
    });
  }
  
  // Next steps
  console.log('\n📋 Next Steps:');
  if (successCount === results.length) {
    console.log('   1. ✅ Edge function is deployed and working');
    console.log('   2. ✅ Frontend will automatically detect and use edge function');
    console.log('   3. ✅ Monitor Supabase dashboard for usage metrics');
    console.log('   4. ✅ Check application logs for "Using MENU_ITEMS Edge Function"');
  } else {
    console.log('   1. 🔍 Check Supabase Edge Functions dashboard');
    console.log('   2. 📝 Review function logs for errors');
    console.log('   3. 🔧 Verify environment variables are set');
    console.log('   4. 🔄 Re-run deployment if needed');
  }
  
  return {
    totalEndpoints: results.length,
    successCount,
    failureCount: results.length - successCount,
    avgResponseTime,
    maxResponseTime,
    allHealthy: successCount === results.length,
    results
  };
}

/**
 * Test data quality and completeness
 */
async function testDataQuality() {
  console.log('\n🔬 Testing Data Quality...\n');
  
  try {
    // Test menu items data structure
    const itemsResponse = await fetch(`${EDGE_FUNCTION_URL}/items?limit=1`);
    const itemsData = await itemsResponse.json();
    
    if (itemsData.success && itemsData.data.length > 0) {
      const sampleItem = itemsData.data[0];
      const requiredFields = ['id', 'name', 'price', 'is_active', 'is_available'];
      const missingFields = requiredFields.filter(field => !(field in sampleItem));
      
      if (missingFields.length === 0) {
        console.log('✅ Data structure validation passed');
        console.log(`   Sample item: ${sampleItem.name} - $${sampleItem.price}`);
      } else {
        console.log('❌ Data structure validation failed');
        console.log(`   Missing fields: ${missingFields.join(', ')}`);
      }
    } else {
      console.log('⚠️  No menu items found or data structure issue');
    }
    
    // Test URL processing
    const featuredResponse = await fetch(`${EDGE_FUNCTION_URL}/featured`);
    const featuredData = await featuredResponse.json();
    
    if (featuredData.success && featuredData.data.length > 0) {
      const itemWithMedia = featuredData.data.find(item => item.image_url || item.video_url);
      if (itemWithMedia) {
        const hasFullUrls = (itemWithMedia.image_url?.startsWith('https://') || false) &&
                           (itemWithMedia.video_url?.startsWith('https://') || true);
        
        if (hasFullUrls) {
          console.log('✅ Media URL processing working correctly');
        } else {
          console.log('⚠️  Media URLs may not be fully processed');
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Data quality test failed:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 MENU_ITEMS Edge Function Deployment Verification');
  console.log('=' .repeat(60));
  
  const results = await runHealthChecks();
  await testDataQuality();
  
  console.log('\n📊 Final Report:');
  console.log(`   Deployment Status: ${results.allHealthy ? '✅ SUCCESS' : '❌ ISSUES DETECTED'}`);
  console.log(`   Endpoints Working: ${results.successCount}/${results.totalEndpoints}`);
  console.log(`   Average Response Time: ${results.avgResponseTime}ms`);
  
  // Return appropriate exit code
  process.exit(results.allHealthy ? 0 : 1);
}

// Handle unhandled promises
process.on('unhandledRejection', (error) => {
  console.error('\n💥 Unhandled error:', error);
  process.exit(1);
});

// Run the verification
main().catch(error => {
  console.error('\n💥 Verification failed:', error);
  process.exit(1);
});