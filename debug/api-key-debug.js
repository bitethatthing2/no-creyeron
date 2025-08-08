// API Key Debug Tool
// Run this in browser console to check Supabase configuration

console.log('🔍 API KEY DEBUG TOOL LOADED');

window.debugAPIKeys = function() {
  console.group('🔑 API KEY CONFIGURATION DEBUG');
  
  const config = {
    clientSide: {},
    serverSide: {},
    issues: [],
    recommendations: []
  };
  
  // Check client-side environment variables
  console.log('1️⃣ Checking client-side configuration...');
  
  // These should be available in the browser
  const clientVars = {
    'NEXT_PUBLIC_SUPABASE_URL': process?.env?.NEXT_PUBLIC_SUPABASE_URL || 'Not available in browser',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'Not available in browser'
  };
  
  config.clientSide = clientVars;
  
  // Check if Supabase client is properly configured
  console.log('2️⃣ Checking Supabase client configuration...');
  
  if (typeof supabase !== 'undefined') {
    try {
      const supabaseUrl = supabase.supabaseUrl;
      const supabaseKey = supabase.supabaseKey;
      
      config.clientSide.actualSupabaseUrl = supabaseUrl;
      config.clientSide.actualSupabaseKeyLength = supabaseKey ? supabaseKey.length : 0;
      config.clientSide.actualSupabaseKeyPrefix = supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'None';
      
      console.log('✅ Supabase client found');
      console.log('URL:', supabaseUrl);
      console.log('Key length:', supabaseKey?.length || 0);
      console.log('Key prefix:', supabaseKey?.substring(0, 20) + '...' || 'None');
      
      // Test basic connectivity
      console.log('3️⃣ Testing basic connectivity...');
      supabase.from('users').select('count').limit(1).then(({ data, error }) => {
        if (error) {
          console.error('❌ Connectivity test failed:', error);
          config.issues.push(`Connectivity test failed: ${error.message}`);
        } else {
          console.log('✅ Basic connectivity working');
        }
      }).catch(err => {
        console.error('💥 Connectivity test exception:', err);
        config.issues.push(`Connectivity exception: ${err.message}`);
      });
      
    } catch (err) {
      console.error('❌ Error accessing Supabase client:', err);
      config.issues.push(`Supabase client error: ${err.message}`);
    }
  } else {
    console.error('❌ Supabase client not found in global scope');
    config.issues.push('Supabase client not available globally');
  }
  
  // Check for common API key issues
  console.log('4️⃣ Checking for common issues...');
  
  if (config.clientSide.actualSupabaseKeyLength === 0) {
    config.issues.push('Supabase API key appears to be empty');
    config.recommendations.push('Check NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }
  
  if (config.clientSide.actualSupabaseKeyLength > 0 && config.clientSide.actualSupabaseKeyLength < 50) {
    config.issues.push('Supabase API key appears to be too short');
    config.recommendations.push('Verify the API key is complete and not truncated');
  }
  
  if (!config.clientSide.actualSupabaseUrl || config.clientSide.actualSupabaseUrl === 'undefined') {
    config.issues.push('Supabase URL is missing or undefined');
    config.recommendations.push('Check NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  
  // Test menu-specific endpoints
  console.log('5️⃣ Testing menu endpoints...');
  
  if (typeof supabase !== 'undefined') {
    // Test food categories
    supabase
      .from('food_drink_categories')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Menu categories test failed:', error);
          config.issues.push(`Menu categories access failed: ${error.message}`);
          
          if (error.message.includes('Invalid API key')) {
            config.recommendations.push('API key is invalid - check Supabase project settings');
          }
          if (error.message.includes('permission')) {
            config.recommendations.push('Check RLS policies for food_drink_categories table');
          }
        } else {
          console.log('✅ Menu categories accessible:', data?.length || 0, 'found');
        }
      })
      .catch(err => {
        console.error('💥 Menu categories exception:', err);
        config.issues.push(`Menu categories exception: ${err.message}`);
      });
  }
  
  // Summary
  console.log('\n📊 API KEY DEBUG SUMMARY:');
  console.table({
    'Supabase Client': typeof supabase !== 'undefined' ? 'Available' : 'Missing',
    'API Key Length': config.clientSide.actualSupabaseKeyLength || 0,
    'URL Configured': config.clientSide.actualSupabaseUrl ? 'Yes' : 'No',
    'Issues Found': config.issues.length
  });
  
  if (config.issues.length > 0) {
    console.log('\n❌ ISSUES FOUND:');
    config.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }
  
  if (config.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    config.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  console.groupEnd();
  
  // Store results for inspection
  window.apiKeyDebugResults = config;
  
  return config;
};

// Environment variable checker for server-side debugging
window.checkEnvironmentVars = function() {
  console.group('🌍 ENVIRONMENT VARIABLES CHECK');
  
  console.log('Note: Some variables are only available server-side');
  
  const expectedVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY', // Server-side only
  ];
  
  expectedVars.forEach(varName => {
    const value = process?.env?.[varName];
    if (value) {
      console.log(`✅ ${varName}: ${varName.includes('KEY') ? value.substring(0, 10) + '...' : value}`);
    } else {
      console.warn(`⚠️ ${varName}: Not available (might be server-side only)`);
    }
  });
  
  console.groupEnd();
};

// Quick API key fix suggestions
window.fixAPIKeyIssues = function() {
  console.group('🔧 API KEY FIX SUGGESTIONS');
  
  console.log(`
🔑 COMMON API KEY ISSUES & FIXES:

1. INVALID API KEY ERROR:
   - Check your .env.local file has correct keys
   - Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is the anon/public key
   - Make sure there are no extra spaces or quotes
   
2. MISSING ENVIRONMENT VARIABLES:
   - Ensure .env.local exists in project root
   - Add: NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   - Add: NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   - Add: SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
3. SERVER-SIDE ERRORS (like menu loading):
   - Server needs SUPABASE_SERVICE_ROLE_KEY for admin access
   - Service role key bypasses RLS for public menu access
   - Check Supabase project settings > API keys
   
4. QUICK TEST:
   - Go to Supabase project > Settings > API
   - Copy the anon/public key
   - Copy the service_role key (keep secret!)
   - Update your .env.local file
   - Restart your development server
   
5. ENVIRONMENT FILE EXAMPLE:
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  `);
  
  console.groupEnd();
};

// Auto-load instructions
console.log(`
🔍 API KEY DEBUG TOOLS READY

Commands:
- debugAPIKeys()        // Check current API key configuration
- checkEnvironmentVars() // Check environment variables  
- fixAPIKeyIssues()     // Show fix suggestions

The "Invalid API key" error suggests missing or incorrect Supabase configuration.
Start with: debugAPIKeys()
`);

// Auto-run if we detect the error
if (window.location.pathname.includes('/dj') || window.location.pathname.includes('/menu')) {
  console.log('🔍 DJ/Menu page detected - auto-running API key debug...');
  setTimeout(() => debugAPIKeys(), 1000);
}