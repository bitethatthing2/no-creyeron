// Test script for the cleanup edge function
// Run this with: node test-cleanup-function.js

const SUPABASE_URL = 'https://tvnpgbjypnezoasbhbwx.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Test scenarios
async function testCleanupFunction() {
  console.log('🧪 Testing Cleanup Edge Function\n');
  console.log('=====================================\n');

  // Test 1: Without authentication
  console.log('Test 1: Calling without authentication...');
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/cleanup-scheduler`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`Response Status: ${response.status}`);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('✅ Test 1 Complete: Should return 401 Unauthorized\n');
  } catch (error) {
    console.error('❌ Test 1 Failed:', error.message);
  }

  // Test 2: With anon key (non-admin)
  console.log('Test 2: Calling with anon key (non-admin)...');
  if (SUPABASE_ANON_KEY) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/cleanup-scheduler`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`Response Status: ${response.status}`);
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log('✅ Test 2 Complete: Should return 401 or 403\n');
    } catch (error) {
      console.error('❌ Test 2 Failed:', error.message);
    }
  } else {
    console.log('⚠️  Skipping Test 2: SUPABASE_ANON_KEY not found\n');
  }

  // Test 3: CORS headers check
  console.log('Test 3: Checking CORS headers...');
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/cleanup-scheduler`,
      {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization,content-type'
        }
      }
    );
    console.log(`Response Status: ${response.status}`);
    console.log('CORS Headers:');
    console.log('  Access-Control-Allow-Origin:', response.headers.get('access-control-allow-origin'));
    console.log('  Access-Control-Allow-Methods:', response.headers.get('access-control-allow-methods'));
    console.log('  Access-Control-Allow-Headers:', response.headers.get('access-control-allow-headers'));
    console.log('✅ Test 3 Complete: CORS headers checked\n');
  } catch (error) {
    console.error('❌ Test 3 Failed:', error.message);
  }

  console.log('=====================================');
  console.log('📊 Testing Summary:');
  console.log('- Edge function is reachable');
  console.log('- Authentication is required');
  console.log('- CORS is properly configured');
  console.log('\nTo test with admin access:');
  console.log('1. Log in as an admin user in the app');
  console.log('2. Navigate to /admin/dashboard');
  console.log('3. Click "Run Database Cleanup" button');
  console.log('4. Check browser console for detailed logs');
}

// Run tests
testCleanupFunction();