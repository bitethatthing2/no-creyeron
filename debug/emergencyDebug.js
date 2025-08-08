// Emergency Chat Debug Tools
// Copy and paste this entire file into browser console

console.log('🚨 EMERGENCY CHAT DEBUG TOOLS LOADED');

// =============================================================================
// TOOL 1: Emergency Cookie Cleanup (RUN THIS FIRST)
// =============================================================================
window.emergencyCleanup = function() {
  console.log('🧹 EMERGENCY CLEANUP STARTING...');
  
  // Clear ALL cookies
  document.cookie.split(";").forEach(cookie => {
    const name = cookie.split("=")[0].trim();
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${location.hostname};`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${location.hostname};`;
  });
  
  // Clear ALL storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear IndexedDB
  if (window.indexedDB) {
    indexedDB.databases().then(dbs => {
      dbs.forEach(db => indexedDB.deleteDatabase(db.name));
    });
  }
  
  console.log('✅ CLEANUP COMPLETE');
  alert('✅ Cleanup complete! Page will refresh in 3 seconds.');
  setTimeout(() => location.reload(), 3000);
};

// =============================================================================
// TOOL 2: RPC Function Tester
// =============================================================================
window.testRPCFunctions = async function() {
  console.log('🧪 TESTING RPC FUNCTIONS...');
  
  const tests = [
    {
      name: 'send_wolfpack_chat_message',
      params: { p_session_id: 'test', p_content: 'Debug test message', p_message_type: 'text' }
    },
    {
      name: 'get_wolfpack_chat_messages', 
      params: { p_session_id: 'test', p_limit: 5, p_offset: 0 }
    }
  ];
  
  for (const test of tests) {
    console.group(`Testing ${test.name}`);
    try {
      const { data, error } = await supabase.rpc(test.name, test.params);
      
      if (error) {
        console.error('❌ FAILED:', error);
      } else {
        console.log('✅ SUCCESS:', data);
      }
    } catch (err) {
      console.error('💥 EXCEPTION:', err);
    }
    console.groupEnd();
  }
};

// =============================================================================
// TOOL 3: Auth State Debugger
// =============================================================================
window.debugAuth = async function() {
  console.group('🔐 AUTH STATE DEBUG');
  
  try {
    // Check user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User:', user?.id || 'None', userError?.message || 'No error');
    
    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session:', session?.access_token ? 'Valid token' : 'No token', sessionError?.message || 'No error');
    
    // Check profile if user exists
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, display_name, wolfpack_status')
        .eq('auth_id', user.id)
        .single();
      
      console.log('Profile:', profile || 'None', profileError?.message || 'No error');
    }
    
  } catch (err) {
    console.error('💥 Auth debug exception:', err);
  }
  
  console.groupEnd();
};

// =============================================================================
// TOOL 4: Message Send Debugger
// =============================================================================
window.debugSendMessage = async function(content = 'Debug test message', sessionId = 'general') {
  console.group('📤 MESSAGE SEND DEBUG');
  console.log('Input:', { content, sessionId });
  
  try {
    // Step 1: Auth check
    console.log('Step 1: Auth check...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed:', authError);
      console.groupEnd();
      return { success: false, error: 'Auth failed' };
    }
    console.log('✅ Auth OK:', user.id);
    
    // Step 2: Profile check
    console.log('Step 2: Profile check...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, display_name, avatar_url')
      .eq('auth_id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile failed:', profileError);
      console.groupEnd();
      return { success: false, error: 'Profile failed' };
    }
    console.log('✅ Profile OK:', profile);
    
    // Step 3: RPC attempt
    console.log('Step 3: RPC send...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('send_wolfpack_chat_message', {
      p_session_id: sessionId,
      p_content: content,
      p_message_type: 'text'
    });
    
    if (rpcError) {
      console.error('❌ RPC failed:', rpcError);
      
      // Step 4: Direct insert fallback
      console.log('Step 4: Direct insert fallback...');
      const { data: insertData, error: insertError } = await supabase
        .from(wolfpack_chat_messages')
        .insert({
          session_id: sessionId,
          user_id: profile.id,
          display_name: profile.display_name || 'Debug User',
          avatar_url: profile.avatar_url,
          content: content,
          message_type: 'text',
          is_deleted: false,
          is_flagged: false
        });
      
      if (insertError) {
        console.error('❌ Direct insert failed:', insertError);
        console.groupEnd();
        return { success: false, error: 'All methods failed' };
      }
      
      console.log('✅ Direct insert success');
      console.groupEnd();
      return { success: true, method: 'direct_insert' };
    }
    
    console.log('✅ RPC success:', rpcData);
    console.groupEnd();
    return { success: true, method: 'rpc', data: rpcData };
    
  } catch (err) {
    console.error('💥 Exception:', err);
    console.groupEnd();
    return { success: false, error: err.message };
  }
};

// =============================================================================
// TOOL 5: Message Get Debugger
// =============================================================================
window.debugGetMessages = async function(sessionId = 'general') {
  console.group('📥 MESSAGE GET DEBUG');
  
  try {
    // Method 1: RPC
    console.log('Method 1: RPC...');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_wolfpack_chat_messages', {
        p_session_id: sessionId,
        p_limit: 10,
        p_offset: 0
      });
    
    if (rpcError) {
      console.error('❌ RPC failed:', rpcError);
      
      // Method 2: Direct query
      console.log('Method 2: Direct query...');
      const { data: directData, error: directError } = await supabase
        .from(wolfpack_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (directError) {
        console.error('❌ Direct query failed:', directError);
        console.groupEnd();
        return { success: false, messages: [] };
      }
      
      console.log('✅ Direct query success:', directData.length, 'messages');
      console.groupEnd();
      return { success: true, messages: directData, method: 'direct' };
    }
    
    console.log('✅ RPC success:', rpcData?.length || 0, 'messages');
    console.groupEnd();
    return { success: true, messages: rpcData, method: 'rpc' };
    
  } catch (err) {
    console.error('💥 Exception:', err);
    console.groupEnd();
    return { success: false, messages: [] };
  }
};

// =============================================================================
// TOOL 6: Full Chat Test
// =============================================================================
window.fullChatTest = async function() {
  console.log('🎯 RUNNING FULL CHAT TEST...');
  
  // Test 1: Auth
  console.log('\n1. Testing auth...');
  await debugAuth();
  
  // Test 2: RPC Functions
  console.log('\n2. Testing RPC functions...');
  await testRPCFunctions();
  
  // Test 3: Send message
  console.log('\n3. Testing message send...');
  const sendResult = await debugSendMessage('Full test message', 'general');
  console.log('Send result:', sendResult);
  
  // Test 4: Get messages
  console.log('\n4. Testing message get...');
  const getResult = await debugGetMessages('general');
  console.log('Get result:', getResult);
  
  console.log('🎯 FULL CHAT TEST COMPLETE');
};

// =============================================================================
// INSTRUCTIONS
// =============================================================================
console.log(`
🚨 EMERGENCY DEBUG TOOLS READY

STEP 1 (DO THIS FIRST):
emergencyCleanup()    // Clears corrupted cookies

STEP 2 (After page refreshes):
debugAuth()           // Check auth state
testRPCFunctions()    // Test if backend functions work

STEP 3 (If RPC works):
debugSendMessage()    // Test sending messages
debugGetMessages()    // Test getting messages

STEP 4 (Full test):
fullChatTest()        // Runs all tests

MOST IMPORTANT: Run emergencyCleanup() first!
`);

// Auto-run cleanup if cookies are corrupted
if (localStorage.getItem && localStorage.getItem('sb-supabase-auth-token')?.includes('base64-')) {
  console.log('🚨 DETECTED CORRUPTED COOKIES - Auto-running cleanup...');
  setTimeout(() => emergencyCleanup(), 2000);
}