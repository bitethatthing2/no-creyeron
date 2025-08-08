// Authentication Debug Tool
// Run this in browser console to get comprehensive auth state information

console.log('🔐 AUTHENTICATION DEBUG TOOLS LOADED');

// =============================================================================
// PHASE 3: COMPREHENSIVE AUTHENTICATION DEBUG
// =============================================================================

window.debugAuthState = async function() {
  console.group('🔐 AUTHENTICATION STATE DEBUG');
  
  const authState = {
    timestamp: new Date().toISOString(),
    supabaseClient: null,
    authUser: null,
    session: null,
    userProfile: null,
    cookies: null,
    localStorage: null,
    errors: []
  };
  
  try {
    // 1. Check if Supabase client exists
    console.log('1️⃣ Checking Supabase client...');
    if (typeof supabase !== 'undefined') {
      authState.supabaseClient = 'Available';
      console.log('✅ Supabase client is available');
    } else {
      authState.supabaseClient = 'Missing';
      authState.errors.push('Supabase client not found in global scope');
      console.error('❌ Supabase client not found');
    }
    
    // 2. Check authentication user
    console.log('2️⃣ Checking authenticated user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      authState.errors.push(`Auth user error: ${userError.message}`);
      console.error('❌ Auth user error:', userError);
    } else if (user) {
      authState.authUser = {
        id: user.id,
        email: user.email,
        emailConfirmed: user.email_confirmed_at ? true : false,
        lastSignIn: user.last_sign_in_at,
        createdAt: user.created_at,
        appMetadata: user.app_metadata,
        userMetadata: user.user_metadata
      };
      console.log('✅ Authenticated user found:', authState.authUser);
    } else {
      authState.authUser = null;
      console.log('⚠️ No authenticated user');
    }
    
    // 3. Check session
    console.log('3️⃣ Checking session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      authState.errors.push(`Session error: ${sessionError.message}`);
      console.error('❌ Session error:', sessionError);
    } else if (session) {
      authState.session = {
        accessToken: session.access_token ? 'Present' : 'Missing',
        refreshToken: session.refresh_token ? 'Present' : 'Missing',
        expiresAt: session.expires_at,
        expiresIn: session.expires_in,
        tokenType: session.token_type,
        user: session.user ? 'Present' : 'Missing'
      };
      console.log('✅ Valid session found:', authState.session);
      
      // Check token expiry
      if (session.expires_at) {
        const expiryTime = new Date(session.expires_at * 1000);
        const now = new Date();
        const timeUntilExpiry = expiryTime.getTime() - now.getTime();
        
        if (timeUntilExpiry < 0) {
          authState.errors.push('Session token is expired');
          console.error('❌ Session token is expired');
        } else {
          console.log(`✅ Session expires in ${Math.round(timeUntilExpiry / 1000 / 60)} minutes`);
        }
      }
    } else {
      authState.session = null;
      console.log('⚠️ No active session');
    }
    
    // 4. Check user profile in database
    if (authState.authUser) {
      console.log('4️⃣ Checking user profile in database...');
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authState.authUser.id)
        .single();
      
      if (profileError) {
        authState.errors.push(`Profile error: ${profileError.message}`);
        console.error('❌ Profile error:', profileError);
      } else if (profile) {
        authState.userProfile = {
          id: profile.id,
          email: profile.email,
          displayName: profile.display_name,
          firstName: profile.first_name,
          lastName: profile.last_name,
          role: profile.role,
          locationId: profile.location_id,
          wolfpackStatus: profile.wolfpack_status,
          isWolfpackMember: profile.is_wolfpack_member,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at
        };
        console.log('✅ User profile found:', authState.userProfile);
      } else {
        authState.userProfile = null;
        authState.errors.push('User profile not found in database');
        console.error('❌ User profile not found in database');
      }
    }
    
    // 5. Check relevant cookies
    console.log('5️⃣ Checking authentication cookies...');
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name && (name.includes('supabase') || name.includes('auth') || name.includes('sb-'))) {
        acc[name] = value ? 'Present' : 'Empty';
      }
      return acc;
    }, {});
    
    authState.cookies = cookies;
    console.log('🍪 Auth-related cookies:', cookies);
    
    // 6. Check localStorage
    console.log('6️⃣ Checking localStorage...');
    const localStorageKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
        localStorageKeys.push(key);
      }
    }
    
    authState.localStorage = localStorageKeys.length > 0 ? localStorageKeys : 'No auth keys found';
    console.log('💾 Auth-related localStorage keys:', authState.localStorage);
    
  } catch (error) {
    authState.errors.push(`Debug error: ${error.message}`);
    console.error('💥 Debug error:', error);
  }
  
  // Summary
  console.log('\n📊 AUTHENTICATION STATE SUMMARY:');
  console.table({
    'Supabase Client': authState.supabaseClient,
    'Auth User': authState.authUser ? 'Present' : 'Missing',
    'Session': authState.session ? 'Active' : 'Missing',
    'User Profile': authState.userProfile ? 'Found' : 'Missing',
    'Errors': authState.errors.length
  });
  
  if (authState.errors.length > 0) {
    console.log('❌ Errors found:');
    authState.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
  
  console.groupEnd();
  return authState;
};

// =============================================================================
// AUTH WORKFLOW TESTING
// =============================================================================

window.testAuthWorkflow = async function() {
  console.group('🧪 AUTHENTICATION WORKFLOW TEST');
  
  const workflow = {
    steps: [],
    success: true,
    errors: []
  };
  
  try {
    // Step 1: Get current user
    console.log('Step 1: Getting current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    workflow.steps.push({
      step: 'getUser',
      success: !userError && !!user,
      error: userError?.message,
      data: user ? { id: user.id, email: user.email } : null
    });
    
    if (userError || !user) {
      workflow.success = false;
      workflow.errors.push('Failed to get authenticated user');
      console.error('❌ Step 1 failed:', userError);
      console.groupEnd();
      return workflow;
    }
    
    console.log('✅ Step 1 passed:', user.email);
    
    // Step 2: Get user profile from database
    console.log('Step 2: Getting user profile from database...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, display_name, auth_id, role, wolfpack_status')
      .eq('auth_id', user.id)
      .single();
    
    workflow.steps.push({
      step: 'getUserProfile',
      success: !profileError && !!profile,
      error: profileError?.message,
      data: profile
    });
    
    if (profileError || !profile) {
      workflow.success = false;
      workflow.errors.push('Failed to get user profile from database');
      console.error('❌ Step 2 failed:', profileError);
    } else {
      console.log('✅ Step 2 passed:', profile.display_name || profile.email);
    }
    
    // Step 3: Test basic table access
    console.log('Step 3: Testing basic table access...');
    const { data: testAccess, error: accessError } = await supabase
      .from('wolfpack_chat_sessions')
      .select('id, display_name')
      .limit(1);
    
    workflow.steps.push({
      step: 'testTableAccess',
      success: !accessError,
      error: accessError?.message,
      data: testAccess
    });
    
    if (accessError) {
      workflow.success = false;
      workflow.errors.push('Failed basic table access test');
      console.error('❌ Step 3 failed:', accessError);
    } else {
      console.log('✅ Step 3 passed - table access working');
    }
    
    // Step 4: Test chat message permissions
    if (profile) {
      console.log('Step 4: Testing chat message table access...');
      const { data: chatAccess, error: chatError } = await supabase
        .from(wolfpack_chat_messages')
        .select('id, content, display_name')
        .limit(1);
      
      workflow.steps.push({
        step: 'testChatAccess',
        success: !chatError,
        error: chatError?.message,
        data: chatAccess
      });
      
      if (chatError) {
        workflow.errors.push('Failed chat table access test');
        console.error('❌ Step 4 failed:', chatError);
      } else {
        console.log('✅ Step 4 passed - chat table access working');
      }
    }
    
  } catch (error) {
    workflow.success = false;
    workflow.errors.push(`Workflow error: ${error.message}`);
    console.error('💥 Workflow error:', error);
  }
  
  console.log('\n📊 WORKFLOW SUMMARY:');
  console.table(workflow.steps);
  
  if (workflow.success) {
    console.log('✅ All authentication steps passed!');
  } else {
    console.log('❌ Authentication workflow has issues:');
    workflow.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
  
  console.groupEnd();
  return workflow;
};

// =============================================================================
// AUTH STATE MONITORING
// =============================================================================

window.startAuthMonitoring = function() {
  console.log('👁️ Starting authentication state monitoring...');
  
  let authStateHistory = [];
  
  // Monitor auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      const timestamp = new Date().toISOString();
      const stateChange = {
        timestamp,
        event,
        hasSession: !!session,
        userId: session?.user?.id || null,
        email: session?.user?.email || null
      };
      
      authStateHistory.push(stateChange);
      
      console.log(`🔄 Auth state change [${timestamp}]:`, stateChange);
      
      // Store in window for inspection
      window.authStateHistory = authStateHistory;
    }
  );
  
  console.log('✅ Auth monitoring started. View history with: window.authStateHistory');
  
  // Return unsubscribe function
  return () => {
    subscription?.unsubscribe();
    console.log('🛑 Auth monitoring stopped');
  };
};

// =============================================================================
// QUICK AUTH COMMANDS
// =============================================================================

window.quickAuthCheck = async function() {
  console.log('⚡ Quick Auth Check...');
  
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;
  
  if (isAuthenticated) {
    console.log(`✅ Authenticated as: ${user.email} (ID: ${user.id})`);
    
    // Quick profile check
    const { data: profile } = await supabase
      .from('users')
      .select('display_name, role, wolfpack_status')
      .eq('auth_id', user.id)
      .single();
    
    if (profile) {
      console.log(`👤 Profile: ${profile.display_name || 'No display name'} (${profile.role || 'No role'})`);
    } else {
      console.log('⚠️ No profile found in database');
    }
  } else {
    console.log('❌ Not authenticated');
  }
  
  return isAuthenticated;
};

// =============================================================================
// AUTO-LOAD INSTRUCTIONS
// =============================================================================

console.log(`
🔐 AUTHENTICATION DEBUG TOOLS READY

Quick Commands:
- quickAuthCheck()         // Fast auth status check
- debugAuthState()         // Full authentication analysis  
- testAuthWorkflow()       // Test complete auth workflow
- startAuthMonitoring()    // Monitor auth state changes

Recommended sequence:
1. quickAuthCheck()
2. debugAuthState() 
3. testAuthWorkflow()
`);