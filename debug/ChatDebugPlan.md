# Chat System Debug Plan
*Systematic approach to resolve chat issues*

## 🎯 Identified Issues

### Issue 1: Corrupted Auth Cookies (BLOCKING)
```
Failed to parse cookie string: SyntaxError: Unexpected token 'b', "base64-eyJ"... is not valid JSON
```
**Impact**: Prevents authentication, blocks all RPC calls
**Priority**: CRITICAL - Must fix first

### Issue 2: RPC Function 404 (BLOCKING)
```
tvnpgbjypnezoasbhbwx.supabase.co/rest/v1/rpc/send_wolfpack_chat_message:1 
Failed to load resource: the server responded with a status of 404
```
**Impact**: Cannot send messages
**Priority**: CRITICAL - Core functionality broken

### Issue 3: Session Management Working
```
✅ Using session ID: salem for location: 50d17782-3f4a-43a1-b6b6-608171ca3c7c
✅ Connected to typing indicators channel
```
**Status**: Working correctly

---

## 🛠️ Phase 1: Emergency Cookie Cleanup (DO THIS FIRST)

### Step 1.1: Immediate Browser Cleanup
```javascript
// RUN THIS IN BROWSER CONSOLE RIGHT NOW
(function emergencyCleanup() {
  console.log('🚨 EMERGENCY CLEANUP STARTING...');
  
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
  
  console.log('✅ CLEANUP COMPLETE - REFRESH PAGE NOW');
  alert('✅ Cleanup complete! Page will refresh in 3 seconds.');
  setTimeout(() => location.reload(), 3000);
})();
```

### Step 1.2: Verify Cookie Cleanup
After refresh, check console for:
- ❌ No more "Failed to parse cookie string" errors
- ✅ Clean auth initialization

---

## 🔍 Phase 2: RPC Function Audit

### Step 2.1: Backend Function Verification
```sql
-- Run in Supabase SQL Editor
SELECT 
  p.proname as function_name,
  p.pronargs as param_count,
  pg_get_function_result(p.oid) as return_type,
  pg_get_function_arguments(p.oid) as parameters
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname LIKE '%chat%message%'
ORDER BY p.proname;
```

**Expected Functions:**
- ✅ `send_wolfpack_chat_message(p_message_typetext, p_content text, p_message_type text)`
- ✅ `get_wolfpack_chat_messages(p_message_typetext, p_limit integer, p_offset integer)`

### Step 2.2: Function Testing
```javascript
// Test in browser console AFTER cookie cleanup
async function testRPCFunctions() {
  console.log('🧪 Testing RPC Functions...');
  
  // Test 1: Check if functions exist
  const testCases = [
    {
      name: 'send_wolfpack_chat_message',
      params: { p_session_id: 'test', p_content: 'Test message', p_message_type: 'text' }
    },
    {
      name: 'get_wolfpack_chat_messages', 
      params: { p_session_id: 'test', p_limit: 5, p_offset: 0 }
    }
  ];
  
  for (const test of testCases) {
    try {
      console.log(`Testing ${test.name}...`);
      const { data, error } = await supabase.rpc(test.name, test.params);
      
      if (error) {
        console.error(`❌ ${test.name}:`, error);
      } else {
        console.log(`✅ ${test.name}:`, data);
      }
    } catch (err) {
      console.error(`💥 ${test.name} EXCEPTION:`, err);
    }
  }
}

// Run the test
testRPCFunctions();
```

---

## 🔐 Phase 3: Authentication Debug

### Step 3.1: Add Auth State Logging
```javascript
// Add to your app - comprehensive auth debugging
function debugAuthState() {
  console.log('🔐 AUTH DEBUG START');
  
  // Check auth state
  supabase.auth.getUser().then(({ data: { user }, error }) => {
    console.log('Auth User:', user?.id || 'None', error?.message || 'No error');
  });
  
  // Check session
  supabase.auth.getSession().then(({ data: { session }, error }) => {
    console.log('Auth Session:', session?.access_token ? 'Valid' : 'None', error?.message || 'No error');
  });
  
  // Listen to auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔄 Auth State Change:', event, session?.user?.id || 'No user');
  });
  
  console.log('🔐 AUTH DEBUG END');
}

// Run on page load
debugAuthState();
```

### Step 3.2: User Profile Verification
```javascript
async function debugUserProfile() {
  console.log('👤 USER PROFILE DEBUG START');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('❌ No authenticated user');
      return;
    }
    
    console.log('✅ Auth User ID:', user.id);
    
    // Check user profile in database
    const { data: profile, error } = await supabase
      .from('users')
      .select('id, email, display_name, wolfpack_status, location_id')
      .eq('auth_id', user.id)
      .single();
    
    if (error) {
      console.error('❌ Profile Error:', error);
    } else {
      console.log('✅ User Profile:', profile);
    }
    
  } catch (err) {
    console.error('💥 Profile Debug Exception:', err);
  }
  
  console.log('👤 USER PROFILE DEBUG END');
}
```

---

## 💬 Phase 4: Chat Flow Debugging

### Step 4.1: Message Send Debug Wrapper
```javascript
// Enhanced message sending with detailed logging
async function debugSendMessage(content, sessionId = 'general') {
  console.group('📤 MESSAGE SEND DEBUG');
  console.log('Input:', { content, sessionId });
  
  try {
    // Step 1: Check auth
    console.log('Step 1: Checking auth...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Auth failed:', authError);
      return { success: false, error: 'Authentication failed' };
    }
    
    console.log('✅ Auth OK:', user.id);
    
    // Step 2: Check user profile
    console.log('Step 2: Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('auth_id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile failed:', profileError);
      return { success: false, error: 'Profile lookup failed' };
    }
    
    console.log('✅ Profile OK:', profile);
    
    // Step 3: Send via RPC
    console.log('Step 3: Sending via RPC...');
    const { data, error } = await supabase.rpc('send_wolfpack_chat_message', {
      p_session_id: sessionId,
      p_content: content,
      p_message_type: 'text'
    });
    
    if (error) {
      console.error('❌ RPC failed:', error);
      
      // Step 4: Try fallback - direct insert
      console.log('Step 4: Trying direct insert fallback...');
      const { data: insertData, error: insertError } = await supabase
        .from(wolfpack_chat_messages')
        .insert({
          session_id: sessionId,
          user_id: profile.id,
          display_name: profile.display_name || 'Anonymous',
          content: content,
          message_type: 'text',
          is_deleted: false,
          is_flagged: false
        });
      
      if (insertError) {
        console.error('❌ Direct insert failed:', insertError);
        return { success: false, error: 'All methods failed' };
      }
      
      console.log('✅ Direct insert success:', insertData);
      return { success: true, method: 'direct_insert' };
    }
    
    console.log('✅ RPC success:', data);
    return { success: true, method: 'rpc' };
    
  } catch (err) {
    console.error('💥 Send Exception:', err);
    return { success: false, error: err.message };
  } finally {
    console.groupEnd();
  }
}

// Make available globally
window.debugSendMessage = debugSendMessage;
```

### Step 4.2: Message Receive Debug
```javascript
async function debugGetMessages(sessionId = 'general') {
  console.group('📥 MESSAGE GET DEBUG');
  console.log('Input:', { sessionId });
  
  try {
    // Method 1: RPC
    console.log('Method 1: RPC get_wolfpack_chat_messages...');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_wolfpack_chat_messages', {
        p_session_id: sessionId,
        p_limit: 10,
        p_offset: 0
      });
    
    if (rpcError) {
      console.error('❌ RPC failed:', rpcError);
      
      // Method 2: Direct query
      console.log('Method 2: Direct table query...');
      const { data: directData, error: directError } = await supabase
        .from(wolfpack_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (directError) {
        console.error('❌ Direct query failed:', directError);
        return { success: false, messages: [] };
      }
      
      console.log('✅ Direct query success:', directData.length, 'messages');
      return { success: true, messages: directData, method: 'direct' };
    }
    
    console.log('✅ RPC success:', rpcData?.length || 0, 'messages');
    return { success: true, messages: rpcData, method: 'rpc' };
    
  } catch (err) {
    console.error('💥 Get Exception:', err);
    return { success: false, messages: [] };
  } finally {
    console.groupEnd();
  }
}

// Make available globally
window.debugGetMessages = debugGetMessages;
```

---

## 🌐 Phase 5: Network Request Debugging

### Step 5.1: API Request Interceptor
```javascript
// Intercept all Supabase requests to see what's happening
function setupNetworkDebugging() {
  console.log('🌐 NETWORK DEBUG SETUP');
  
  // Override fetch to log all requests
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    if (url.includes('supabase') || url.includes('rpc')) {
      console.group('🌐 SUPABASE REQUEST');
      console.log('URL:', url);
      console.log('Method:', options?.method || 'GET');
      console.log('Headers:', options?.headers);
      console.log('Body:', options?.body);
      
      const response = await originalFetch(...args);
      
      console.log('Status:', response.status);
      console.log('OK:', response.ok);
      
      if (!response.ok) {
        console.error('❌ Request failed');
        const text = await response.clone().text();
        console.log('Response:', text);
      }
      
      console.groupEnd();
      return response;
    }
    
    return originalFetch(...args);
  };
}

// Setup immediately
setupNetworkDebugging();
```

---

## 🎯 Quick Action Plan

### IMMEDIATE (Do Right Now)
1. **Run emergency cookie cleanup** (Step 1.1)
2. **Refresh page** and check for clean startup
3. **Test RPC functions** (Step 2.2)

### NEXT (If RPC still fails)
4. **Verify functions exist in database** (Step 2.1)
5. **Add debug logging** to chat components
6. **Test direct table access** as fallback

### SYSTEMATIC (If still issues)
7. **Full auth state debugging**
8. **Network request monitoring**
9. **Component-by-component isolation**

---

## 📋 Success Criteria

- ✅ No cookie parse errors in console
- ✅ RPC functions return data (not 404)
- ✅ Messages can be sent and received
- ✅ Real-time updates work
- ✅ Clean error handling

**Start with the emergency cookie cleanup - that's likely causing the 404 errors by preventing proper authentication!**