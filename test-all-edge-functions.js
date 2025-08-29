#!/usr/bin/env node

// Comprehensive Edge Function Test Runner
// Usage: node test-all-edge-functions.js [function-name]
// Example: node test-all-edge-functions.js FEED_PROCESSOR

const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://tvnpgbjypnezoasbhbwx.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Test configurations
const EDGE_FUNCTIONS = {
  'cleanup-scheduler': {
    requiresAuth: true,
    adminOnly: true,
    endpoints: [
      { method: 'POST', path: '', body: {} }
    ]
  },
  'FEED_PROCESSOR': {
    requiresAuth: true,
    adminOnly: false,
    endpoints: [
      { 
        method: 'POST', 
        path: '/get-feed', 
        body: { limit: 5, offset: 0, type: 'for-you' }
      },
      {
        method: 'POST',
        path: '/calculate-trending',
        body: {},
        adminOnly: true
      }
    ]
  },
  'CONTENT_UPLOADER': {
    requiresAuth: true,
    adminOnly: false,
    endpoints: [
      { method: 'POST', path: '/upload', isMultipart: true },
      { method: 'POST', path: '/upload-avatar', isMultipart: true },
      { method: 'DELETE', path: '/delete', body: { path: 'test/path' } }
    ]
  },
  'MESSAGE_HANDLER': {
    requiresAuth: true,
    adminOnly: false,
    endpoints: [
      { 
        method: 'POST', 
        path: '/get-conversations', 
        body: { limit: 10, offset: 0 }
      },
      {
        method: 'POST',
        path: '/create-dm',
        body: { other_user_id: 'test-user-id' }
      }
    ]
  },
  'PUSH_NOTIFICATIONS': {
    requiresAuth: true,
    adminOnly: false,
    endpoints: [
      {
        method: 'POST',
        path: '/store-token',
        body: {
          token: `test_token_${Date.now()}`,
          platform: 'web',
          device_info: { userAgent: 'test-agent', timestamp: Date.now() }
        }
      },
      {
        method: 'POST',
        path: '/get-notifications',
        body: { limit: 10, offset: 0, unread_only: false }
      }
    ]
  },
  'MENU_ITEMS': {
    requiresAuth: false,
    adminOnly: false,
    endpoints: [
      { method: 'GET', path: '/food?limit=10&offset=0' },
      { method: 'GET', path: '/items' }
    ]
  }
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

// Utility functions
function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Test individual endpoint
async function testEndpoint(functionName, endpoint, authToken = null) {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}${endpoint.path || ''}`;
  const startTime = Date.now();

  const headers = {
    'Content-Type': 'application/json'
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const options = {
    method: endpoint.method,
    headers: headers
  };

  if (endpoint.body && !endpoint.isMultipart) {
    options.body = JSON.stringify(endpoint.body);
  }

  try {
    const response = await makeRequest(url, options);
    const duration = Date.now() - startTime;

    return {
      success: response.status < 400,
      status: response.status,
      statusText: response.statusText,
      duration,
      data: response.data,
      endpoint: `${endpoint.method} ${endpoint.path || '/'}`
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      status: 0,
      statusText: 'Network Error',
      duration,
      error: error.message,
      endpoint: `${endpoint.method} ${endpoint.path || '/'}`
    };
  }
}

// Test CORS
async function testCORS(functionName) {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  
  const options = {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:3000',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,content-type'
    }
  };

  try {
    const response = await makeRequest(url, options);
    
    return {
      success: response.status === 200 || response.status === 204,
      allowOrigin: response.headers['access-control-allow-origin'],
      allowMethods: response.headers['access-control-allow-methods'],
      allowHeaders: response.headers['access-control-allow-headers']
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Test authentication scenarios
async function testAuthScenarios(functionName, config) {
  const results = [];

  // Test 1: No authentication (should fail if auth required)
  log(`  Testing without authentication...`, 'cyan');
  const noAuthResult = await testEndpoint(functionName, config.endpoints[0]);
  
  if (config.requiresAuth) {
    results.push({
      test: 'No Auth (should fail)',
      success: noAuthResult.status === 401,
      expected: 401,
      actual: noAuthResult.status,
      message: noAuthResult.success ? 'Should have failed auth check' : 'Correctly rejected'
    });
  } else {
    results.push({
      test: 'No Auth (should work)',
      success: noAuthResult.success,
      expected: '2xx',
      actual: noAuthResult.status,
      message: noAuthResult.success ? 'Public endpoint working' : noAuthResult.statusText
    });
  }

  // Test 2: With anon key (should fail for user endpoints)
  if (ANON_KEY && config.requiresAuth) {
    log(`  Testing with anon key...`, 'cyan');
    const anonResult = await testEndpoint(functionName, config.endpoints[0], ANON_KEY);
    
    results.push({
      test: 'Anon Key (should fail)',
      success: anonResult.status === 401 || anonResult.status === 403,
      expected: '401 or 403',
      actual: anonResult.status,
      message: anonResult.success ? 'Should have failed with anon key' : 'Correctly rejected anon key'
    });
  }

  return results;
}

// Test individual function
async function testFunction(functionName) {
  log(`\n${colors.bright}${colors.blue}Testing ${functionName}${colors.reset}`, 'blue');
  log('='.repeat(50), 'blue');

  const config = EDGE_FUNCTIONS[functionName];
  if (!config) {
    log(`❌ Unknown function: ${functionName}`, 'red');
    return;
  }

  const results = {
    functionName,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    tests: []
  };

  // Test CORS
  log(`\n📡 Testing CORS...`, 'magenta');
  const corsResult = await testCORS(functionName);
  
  results.totalTests++;
  if (corsResult.success) {
    results.passedTests++;
    log(`  ✅ CORS headers present`, 'green');
    log(`     Allow-Origin: ${corsResult.allowOrigin}`, 'white');
    log(`     Allow-Methods: ${corsResult.allowMethods}`, 'white');
  } else {
    results.failedTests++;
    log(`  ❌ CORS test failed: ${corsResult.error || 'No proper headers'}`, 'red');
  }

  results.tests.push({
    name: 'CORS Configuration',
    success: corsResult.success,
    details: corsResult
  });

  // Test authentication scenarios
  log(`\n🔐 Testing Authentication...`, 'magenta');
  const authResults = await testAuthScenarios(functionName, config);
  
  authResults.forEach(authResult => {
    results.totalTests++;
    if (authResult.success) {
      results.passedTests++;
      log(`  ✅ ${authResult.test}: ${authResult.message}`, 'green');
    } else {
      results.failedTests++;
      log(`  ❌ ${authResult.test}: Expected ${authResult.expected}, got ${authResult.actual}`, 'red');
    }
    
    results.tests.push({
      name: authResult.test,
      success: authResult.success,
      details: authResult
    });
  });

  // Test endpoints (basic connectivity)
  log(`\n🔗 Testing Endpoints...`, 'magenta');
  
  for (const endpoint of config.endpoints) {
    const testName = `${endpoint.method} ${endpoint.path || '/'}`;
    log(`  Testing ${testName}...`, 'cyan');
    
    const endpointResult = await testEndpoint(functionName, endpoint);
    
    results.totalTests++;
    
    // For auth-required endpoints without proper auth, expect 401/403
    const expectedFailure = config.requiresAuth && (endpointResult.status === 401 || endpointResult.status === 403);
    const actualSuccess = endpointResult.success || expectedFailure;
    
    if (actualSuccess) {
      results.passedTests++;
      log(`    ✅ ${endpointResult.status} ${endpointResult.statusText} (${endpointResult.duration}ms)`, 'green');
    } else {
      results.failedTests++;
      log(`    ❌ ${endpointResult.status} ${endpointResult.statusText} (${endpointResult.duration}ms)`, 'red');
      if (endpointResult.error) {
        log(`       Error: ${endpointResult.error}`, 'red');
      }
    }

    results.tests.push({
      name: testName,
      success: actualSuccess,
      details: endpointResult
    });
  }

  // Function summary
  const successRate = ((results.passedTests / results.totalTests) * 100).toFixed(1);
  log(`\n📊 ${functionName} Summary:`, 'bright');
  log(`   Total Tests: ${results.totalTests}`, 'white');
  log(`   Passed: ${results.passedTests}`, 'green');
  log(`   Failed: ${results.failedTests}`, results.failedTests > 0 ? 'red' : 'white');
  log(`   Success Rate: ${successRate}%`, successRate >= 75 ? 'green' : 'yellow');

  return results;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const targetFunction = args[0];

  log(`${colors.bright}${colors.cyan}🧪 Edge Function Test Runner${colors.reset}`, 'cyan');
  log('=' .repeat(60), 'cyan');
  log(`Base URL: ${SUPABASE_URL}`, 'white');
  log(`Anon Key: ${ANON_KEY ? 'Present' : 'Missing'}`, ANON_KEY ? 'green' : 'yellow');
  log(`Target: ${targetFunction || 'All functions'}`, 'white');

  const functionsToTest = targetFunction ? [targetFunction] : Object.keys(EDGE_FUNCTIONS);
  const allResults = [];

  for (const functionName of functionsToTest) {
    if (!EDGE_FUNCTIONS[functionName]) {
      log(`❌ Unknown function: ${functionName}`, 'red');
      continue;
    }

    const result = await testFunction(functionName);
    if (result) {
      allResults.push(result);
    }
  }

  // Overall summary
  if (allResults.length > 1) {
    log(`\n${colors.bright}${colors.magenta}🎯 Overall Test Summary${colors.reset}`, 'magenta');
    log('=' .repeat(60), 'magenta');

    const totalTests = allResults.reduce((sum, r) => sum + r.totalTests, 0);
    const totalPassed = allResults.reduce((sum, r) => sum + r.passedTests, 0);
    const totalFailed = allResults.reduce((sum, r) => sum + r.failedTests, 0);
    const overallRate = ((totalPassed / totalTests) * 100).toFixed(1);

    allResults.forEach(result => {
      const rate = ((result.passedTests / result.totalTests) * 100).toFixed(1);
      const status = rate >= 75 ? '✅' : rate >= 50 ? '⚠️' : '❌';
      log(`${status} ${result.functionName}: ${result.passedTests}/${result.totalTests} (${rate}%)`, 
          rate >= 75 ? 'green' : rate >= 50 ? 'yellow' : 'red');
    });

    log(`\nTotal: ${totalPassed}/${totalTests} (${overallRate}%)`, 
        overallRate >= 75 ? 'green' : 'yellow');
  }

  log(`\n${colors.bright}Testing completed!${colors.reset}`, 'green');
  log('For detailed integration testing, use the admin dashboard UI component.', 'white');
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled Rejection at: ${promise}, reason: ${reason}`, 'red');
  process.exit(1);
});

// Run the tests
main().catch(error => {
  log(`❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});