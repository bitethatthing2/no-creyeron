# Wolfpack Chat Functionality Audit Plan
*Comprehensive testing strategy for chat system validation*

## 🎯 Audit Overview

**Objective**: Ensure robust, secure, and performant chat functionality across all scenarios
**Timeline**: Phased approach with immediate critical tests first
**Success Criteria**: All tests pass with documented fallback behaviors

---

## 📋 Phase 1: Backend Function Verification (CRITICAL)
*Verify all database functions exist and operate correctly*

### 1.1 RPC Function Existence Test
```sql
-- Run in Supabase SQL Editor
SELECT 
    proname as function_name,
    pronargs as parameter_count,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname LIKE '%chat%message%' 
   OR proname LIKE '%wolfpack%chat%'
ORDER BY proname;
```

**Expected Results:**
- ✅ `get_wolfpack_chat_messages` 
- ✅ `send_wolfpack_chat_message`
- ✅ `send_chat_message_simple` (optional)
- ✅ `send_chat_message` (optional)

### 1.2 Function Parameter Validation
```javascript
// Test each function with correct parameters
const functionTests = [
  {
    name: 'get_wolfpack_chat_messages',
    params: { p_session_id: 'general', p_limit: 10, p_offset: 0 },
    expectedType: 'array'
  },
  {
    name: 'send_wolfpack_chat_message',
    params: { p_session_id: 'general', p_content: 'Test message', p_message_type: 'text' },
    expectedType: 'object'
  }
];

// Run this test
async function testRPCFunctions() {
  const results = [];
  
  for (const test of functionTests) {
    try {
      const { data, error } = await supabase.rpc(test.name, test.params);
      results.push({
        function: test.name,
        success: !error,
        error: error?.message,
        dataType: Array.isArray(data) ? 'array' : typeof data
      });
    } catch (err) {
      results.push({
        function: test.name,
        success: false,
        error: err.message,
        dataType: null
      });
    }
  }
  
  console.table(results);
  return results;
}
```

### 1.3 Database Table Structure Validation
```sql
-- Verify wolfpack_chat_messages table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = wolfpack_chat_messages'
ORDER BY ordinal_position;
```

**Expected Columns:**
- `id` (uuid, not null)
- `session_id` (text, not null)
- `user_id` (uuid)
- `display_name` (text)
- `avatar_url` (text)
- `content` (text, not null)
- `message_type` (text)
- `image_url` (text)
- `created_at` (timestamp)
- `is_deleted` (boolean)
- `is_flagged` (boolean)

---

## 🔐 Phase 2: Authentication & Authorization Testing (CRITICAL)

### 2.1 Authentication State Tests
```javascript
async function testAuthStates() {
  const tests = [
    {
      name: 'Logged Out User',
      setup: () => supabase.auth.signOut(),
      test: () => supabase.rpc('send_wolfpack_chat_message', {
        p_session_id: 'general',
        p_content: 'Test message',
        p_message_type: 'text'
      }),
      expectedResult: 'error'
    },
    {
      name: 'Valid Logged In User',
      setup: () => supabase.auth.signInWithPassword({ email: 'test@example.com', password: 'password' }),
      test: () => supabase.rpc('send_wolfpack_chat_message', {
        p_session_id: 'general',
        p_content: 'Test message',
        p_message_type: 'text'
      }),
      expectedResult: 'success'
    },
    {
      name: 'Corrupted Auth Token',
      setup: () => {
        // Manually corrupt the auth token
        localStorage.setItem('supabase.auth.token', 'invalid-token');
      },
      test: () => supabase.rpc('get_wolfpack_chat_messages', {
        p_session_id: 'general',
        p_limit: 10
      }),
      expectedResult: 'error'
    }
  ];
  
  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    await test.setup();
    const { data, error } = await test.test();
    console.log(`Result: ${error ? 'ERROR' : 'SUCCESS'}`, error?.message || data);
  }
}
```

### 2.2 User Profile Integration Test
```javascript
async function testUserProfileIntegration() {
  // Test that user profile data is correctly retrieved for messages
  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .eq('auth_id', (await supabase.auth.getUser()).data.user.id)
    .single();
    
  console.log('User Profile:', profile);
  
  // Send a message and verify profile data appears
  await supabase.rpc('send_wolfpack_chat_message', {
    p_session_id: 'test',
    p_content: 'Profile test message',
    p_message_type: 'text'
  });
  
  const { data: messages } = await supabase.rpc('get_wolfpack_chat_messages', {
    p_session_id: 'test',
    p_limit: 1
  });
  
  console.log('Message with profile:', messages[0]);
}
```

---

## 🎯 Phase 3: Session Management & Routing Testing (CRITICAL)

### 3.1 Session ID Mapping Test
```javascript
async function testSessionMapping() {
  const locationToSessionMap = {
    '50d17782-3f4a-43a1-b6b6-608171ca3c7c': 'salem',
    'ec1e8869-454a-49d2-93e5-ed05f49bb932': 'portland',
    'default': 'general'
  };
  
  // Test each location mapping
  for (const [locationId, expectedSession] of Object.entries(locationToSessionMap)) {
    console.log(`Testing location ${locationId} -> ${expectedSession}`);
    
    // Send message to each session
    const { error } = await supabase.rpc('send_wolfpack_chat_message', {
      p_session_id: expectedSession,
      p_content: `Test message for ${expectedSession}`,
      p_message_type: 'text'
    });
    
    console.log(`Session ${expectedSession}:`, error ? 'FAILED' : 'SUCCESS');
  }
}
```

### 3.2 Cross-Session Isolation Test
```javascript
async function testSessionIsolation() {
  const sessions = ['general', 'salem', 'portland', 'events', 'music'];
  
  // Send unique message to each session
  for (const session of sessions) {
    await supabase.rpc('send_wolfpack_chat_message', {
      p_session_id: session,
      p_content: `Unique message for ${session} - ${Date.now()}`,
      p_message_type: 'text'
    });
  }
  
  // Verify messages only appear in their intended sessions
  for (const session of sessions) {
    const { data: messages } = await supabase.rpc('get_wolfpack_chat_messages', {
      p_session_id: session,
      p_limit: 5
    });
    
    console.log(`Session ${session} has ${messages.length} messages`);
    
    // Check no cross-contamination
    const otherSessionMessages = messages.filter(msg => 
      !msg.message.includes(`for ${session}`)
    );
    
    if (otherSessionMessages.length > 0) {
      console.error(`❌ Session isolation breach in ${session}`);
    } else {
      console.log(`✅ Session ${session} properly isolated`);
    }
  }
}
```

---

## 💬 Phase 4: Message Send/Receive Functionality Testing (CRITICAL)

### 4.1 Message Types & Content Validation
```javascript
async function testMessageTypes() {
  const messageTests = [
    { content: 'Simple text message', type: 'text', shouldSucceed: true },
    { content: '', type: 'text', shouldSucceed: false }, // Empty message
    { content: 'A'.repeat(1000), type: 'text', shouldSucceed: false }, // Too long
    { content: 'Message with emoji 🎉🐺', type: 'text', shouldSucceed: true },
    { content: 'Message with\nnewlines\nhere', type: 'text', shouldSucceed: true },
    { content: '<script>alert("xss")</script>', type: 'text', shouldSucceed: true }, // Should be sanitized
    { content: 'Image message', type: 'image', shouldSucceed: true }
  ];
  
  for (const test of messageTests) {
    const { data, error } = await supabase.rpc('send_wolfpack_chat_message', {
      p_session_id: 'test',
      p_content: test.content,
      p_message_type: test.type
    });
    
    const success = !error;
    const result = success === test.shouldSucceed ? '✅ PASS' : '❌ FAIL';
    
    console.log(`${result} "${test.content.slice(0, 20)}..." - Expected: ${test.shouldSucceed}, Got: ${success}`);
  }
}
```

### 4.2 Message Ordering & Timestamp Test
```javascript
async function testMessageOrdering() {
  const testMessages = [
    'First message',
    'Second message', 
    'Third message'
  ];
  
  // Send messages with small delays
  for (const msg of testMessages) {
    await supabase.rpc('send_wolfpack_chat_message', {
      p_session_id: 'ordering-test',
      p_content: msg,
      p_message_type: 'text'
    });
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Retrieve and check order
  const { data: messages } = await supabase.rpc('get_wolfpack_chat_messages', {
    p_session_id: 'ordering-test',
    p_limit: 10
  });
  
  console.log('Message order:');
  messages.forEach((msg, index) => {
    console.log(`${index + 1}. ${msg.message} (${new Date(msg.created_at).toISOString()})`);
  });
  
  // Verify chronological order
  for (let i = 1; i < messages.length; i++) {
    const prevTime = new Date(messages[i-1].created_at);
    const currTime = new Date(messages[i].created_at);
    
    if (prevTime > currTime) {
      console.error('❌ Message ordering is incorrect');
      return false;
    }
  }
  
  console.log('✅ Message ordering is correct');
  return true;
}
```

### 4.3 Fallback Method Testing
```javascript
async function testFallbackMethods() {
  const methods = [
    {
      name: 'send_wolfpack_chat_message',
      params: { p_session_id: 'test', p_content: 'Method 1 test', p_message_type: 'text' }
    },
    {
      name: 'send_chat_message_simple', 
      params: { p_session_id: 'test', p_content: 'Method 2 test' }
    },
    {
      name: 'send_chat_message',
      params: { p_message: 'Method 3 test', p_image_url: null }
    }
  ];
  
  for (const method of methods) {
    try {
      const { data, error } = await supabase.rpc(method.name, method.params);
      console.log(`✅ ${method.name}: ${error ? 'FAILED' : 'SUCCESS'}`);
      if (error) console.log(`   Error: ${error.message}`);
    } catch (err) {
      console.log(`❌ ${method.name}: EXCEPTION - ${err.message}`);
    }
  }
  
  // Test direct table insert as ultimate fallback
  try {
    const { data: user } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('users')
      .select('id, display_name, avatar_url')
      .eq('auth_id', user.user.id)
      .single();
    
    const { error } = await supabase
      .from(wolfpack_chat_messages')
      .insert({
        session_id: 'test',
        user_id: profile.id,
        display_name: profile.display_name || 'Test User',
        avatar_url: profile.avatar_url,
        content: 'Direct insert test',
        message_type: 'text',
        is_deleted: false,
        is_flagged: false
      });
    
    console.log(`✅ Direct Insert: ${error ? 'FAILED' : 'SUCCESS'}`);
  } catch (err) {
    console.log(`❌ Direct Insert: EXCEPTION - ${err.message}`);
  }
}
```

---

## ⚡ Phase 5: Real-time Features & WebSocket Testing

### 5.1 Real-time Message Updates Test
```javascript
async function testRealtimeUpdates() {
  let messageReceived = false;
  
  // Set up real-time listener
  const channel = supabase
    .channel('test-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: wolfpack_chat_messages',
        filter: 'session_id=eq.realtime-test'
      },
      (payload) => {
        console.log('✅ Real-time message received:', payload.new);
        messageReceived = true;
      }
    )
    .subscribe();
  
  // Wait for connection
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Send a test message
  await supabase.rpc('send_wolfpack_chat_message', {
    p_session_id: 'realtime-test',
    p_content: 'Real-time test message',
    p_message_type: 'text'
  });
  
  // Wait for real-time update
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log(`Real-time test result: ${messageReceived ? 'PASS' : 'FAIL'}`);
  
  // Cleanup
  supabase.removeChannel(channel);
  return messageReceived;
}
```

### 5.2 Connection Stability Test
```javascript
async function testConnectionStability() {
  let connectCount = 0;
  let disconnectCount = 0;
  
  const channel = supabase
    .channel('stability-test')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: wolfpack_chat_messages' 
    }, () => {})
    .subscribe((status) => {
      console.log('Connection status:', status);
      if (status === 'SUBSCRIBED') connectCount++;
      if (status === 'CLOSED') disconnectCount++;
    });
  
  // Test multiple reconnections
  for (let i = 0; i < 3; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    supabase.removeChannel(channel);
    await new Promise(resolve => setTimeout(resolve, 1000));
    channel.subscribe();
  }
  
  console.log(`Connection stability: ${connectCount} connects, ${disconnectCount} disconnects`);
  supabase.removeChannel(channel);
}
```

---

## 🛡️ Phase 6: Error Handling & Fallback Mechanisms

### 6.1 Network Failure Simulation
```javascript
async function testNetworkFailures() {
  // Simulate network failure by using invalid URL
  const failClient = createClient('https://invalid-url.supabase.co', 'invalid-key');
  
  try {
    const { data, error } = await failClient.rpc('send_wolfpack_chat_message', {
      p_session_id: 'test',
      p_content: 'This should fail',
      p_message_type: 'text'
    });
    
    console.log('Network failure test:', error ? 'FAILED as expected ✅' : 'UNEXPECTEDLY SUCCEEDED ❌');
  } catch (err) {
    console.log('Network failure test: FAILED as expected ✅');
  }
}
```

### 6.2 Rate Limiting Test
```javascript
async function testRateLimiting() {
  const messages = Array.from({ length: 20 }, (_, i) => `Spam message ${i + 1}`);
  
  let successCount = 0;
  let errorCount = 0;
  
  // Send messages rapidly
  const promises = messages.map(async (content) => {
    try {
      const { error } = await supabase.rpc('send_wolfpack_chat_message', {
        p_session_id: 'rate-limit-test',
        p_content: content,
        p_message_type: 'text'
      });
      
      if (error) errorCount++;
      else successCount++;
    } catch (err) {
      errorCount++;
    }
  });
  
  await Promise.all(promises);
  
  console.log(`Rate limiting test: ${successCount} successful, ${errorCount} blocked`);
  console.log(errorCount > 0 ? '✅ Rate limiting is working' : '⚠️ No rate limiting detected');
}
```

---

## 🎨 Phase 7: UI/UX & Performance Testing

### 7.1 Large Message History Test
```javascript
async function testLargeMessageHistory() {
  const startTime = performance.now();
  
  // Load a large number of messages
  const { data: messages, error } = await supabase.rpc('get_wolfpack_chat_messages', {
    p_session_id: 'general',
    p_limit: 100,
    p_offset: 0
  });
  
  const loadTime = performance.now() - startTime;
  
  console.log(`Loaded ${messages?.length || 0} messages in ${loadTime.toFixed(2)}ms`);
  console.log(loadTime < 2000 ? '✅ Performance acceptable' : '⚠️ Performance may be slow');
  
  return { messageCount: messages?.length || 0, loadTime };
}
```

### 7.2 Memory Leak Detection
```javascript
async function testMemoryLeaks() {
  const initialMemory = performance.memory?.usedJSHeapSize || 0;
  
  // Create and destroy multiple chat components
  for (let i = 0; i < 10; i++) {
    const channel = supabase.channel(`test-${i}`);
    channel.subscribe();
    await new Promise(resolve => setTimeout(resolve, 100));
    supabase.removeChannel(channel);
  }
  
  // Force garbage collection if available
  if (window.gc) window.gc();
  
  const finalMemory = performance.memory?.usedJSHeapSize || 0;
  const memoryIncrease = finalMemory - initialMemory;
  
  console.log(`Memory usage: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase`);
  console.log(memoryIncrease < 10 * 1024 * 1024 ? '✅ No significant memory leaks' : '⚠️ Possible memory leak');
}
```

---

## 🔒 Phase 8: Security & Data Integrity Testing (CRITICAL)

### 8.1 SQL Injection Prevention Test
```javascript
async function testSQLInjection() {
  const maliciousInputs = [
    "'; DROP TABLE wolfpack_chat_messages; --",
    "' OR '1'='1",
    "'; INSERT INTO wolfpack_chat_messages (content) VALUES ('hacked'); --",
    "<script>alert('xss')</script>",
    "../../etc/passwd"
  ];
  
  for (const input of maliciousInputs) {
    try {
      const { data, error } = await supabase.rpc('send_wolfpack_chat_message', {
        p_session_id: 'security-test',
        p_content: input,
        p_message_type: 'text'
      });
      
      // If this succeeds, the input should be sanitized
      if (!error) {
        const { data: messages } = await supabase.rpc('get_wolfpack_chat_messages', {
          p_session_id: 'security-test',
          p_limit: 1
        });
        
        const savedMessage = messages[0]?.message;
        const isSanitized = savedMessage !== input;
        
        console.log(`Input: "${input}"`);
        console.log(`Saved: "${savedMessage}"`);
        console.log(`Sanitized: ${isSanitized ? '✅ YES' : '❌ NO'}`);
      }
    } catch (err) {
      console.log(`Malicious input blocked: ✅ "${input}"`);
    }
  }
}
```

### 8.2 Access Control Test
```javascript
async function testAccessControl() {
  // Test accessing other users' messages
  const { data: allMessages } = await supabase
    .from(wolfpack_chat_messages')
    .select('*')
    .limit(5);
  
  console.log(`Direct table access returned ${allMessages?.length || 0} messages`);
  
  // Test RLS policies
  const { data: rpcMessages } = await supabase.rpc('get_wolfpack_chat_messages', {
    p_session_id: 'general',
    p_limit: 5
  });
  
  console.log(`RPC access returned ${rpcMessages?.length || 0} messages`);
  console.log('Access control test: Check if counts differ significantly');
}
```

---

## 🌐 Phase 9: Cross-browser & Device Compatibility

### 9.1 Browser Compatibility Checklist
- [ ] Chrome (latest)
- [ ] Firefox (latest) 
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### 9.2 Feature Support Test
```javascript
async function testBrowserFeatures() {
  const features = {
    localStorage: typeof localStorage !== 'undefined',
    websockets: typeof WebSocket !== 'undefined',
    fetch: typeof fetch !== 'undefined',
    es6: (() => { try { eval('const test = () => {}'); return true; } catch { return false; } })(),
    indexeddb: typeof indexedDB !== 'undefined'
  };
  
  console.log('Browser feature support:');
  Object.entries(features).forEach(([feature, supported]) => {
    console.log(`${feature}: ${supported ? '✅' : '❌'}`);
  });
  
  return features;
}
```

---

## ⚡ Phase 10: Load Testing & Scalability Assessment

### 10.1 Concurrent User Simulation
```javascript
async function testConcurrentUsers() {
  const userCount = 10;
  const messagesPerUser = 5;
  
  const users = Array.from({ length: userCount }, (_, i) => ({
    id: `test-user-${i}`,
    sessionId: 'load-test'
  }));
  
  const startTime = performance.now();
  
  // Simulate concurrent messaging
  const promises = users.map(async (user, userIndex) => {
    for (let i = 0; i < messagesPerUser; i++) {
      await supabase.rpc('send_wolfpack_chat_message', {
        p_session_id: user.sessionId,
        p_content: `Message ${i + 1} from ${user.id}`,
        p_message_type: 'text'
      });
      
      // Small random delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    }
  });
  
  await Promise.all(promises);
  
  const totalTime = performance.now() - startTime;
  const totalMessages = userCount * messagesPerUser;
  
  console.log(`Load test: ${totalMessages} messages from ${userCount} users in ${totalTime.toFixed(2)}ms`);
  console.log(`Average: ${(totalTime / totalMessages).toFixed(2)}ms per message`);
}
```

---

## 📊 Audit Execution Script

### Complete Audit Runner
```javascript
async function runCompleteAudit() {
  console.log('🚀 Starting Wolfpack Chat Audit...\n');
  
  const results = {};
  
  try {
    // Phase 1: Backend Functions
    console.log('📋 Phase 1: Backend Function Verification');
    results.rpcFunctions = await testRPCFunctions();
    
    // Phase 2: Authentication  
    console.log('\n🔐 Phase 2: Authentication Testing');
    await testAuthStates();
    await testUserProfileIntegration();
    
    // Phase 3: Session Management
    console.log('\n🎯 Phase 3: Session Management Testing');
    await testSessionMapping();
    await testSessionIsolation();
    
    // Phase 4: Message Functionality
    console.log('\n💬 Phase 4: Message Functionality Testing');
    await testMessageTypes();
    results.messageOrdering = await testMessageOrdering();
    await testFallbackMethods();
    
    // Phase 5: Real-time Features
    console.log('\n⚡ Phase 5: Real-time Testing');
    results.realtimeWorking = await testRealtimeUpdates();
    await testConnectionStability();
    
    // Phase 6: Error Handling
    console.log('\n🛡️ Phase 6: Error Handling Testing');
    await testNetworkFailures();
    await testRateLimiting();
    
    // Phase 7: Performance
    console.log('\n🎨 Phase 7: Performance Testing');
    results.performance = await testLargeMessageHistory();
    await testMemoryLeaks();
    
    // Phase 8: Security
    console.log('\n🔒 Phase 8: Security Testing');
    await testSQLInjection();
    await testAccessControl();
    
    // Phase 9: Compatibility
    console.log('\n🌐 Phase 9: Browser Compatibility');
    results.browserFeatures = await testBrowserFeatures();
    
    // Phase 10: Load Testing
    console.log('\n⚡ Phase 10: Load Testing');
    await testConcurrentUsers();
    
    console.log('\n✅ Audit Complete!');
    console.log('📊 Results Summary:', results);
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
  }
}

// Export for manual execution
window.runChatAudit = runCompleteAudit;
```

---

## 🎯 Success Criteria

### Critical Requirements (Must Pass)
- ✅ All RPC functions exist and work
- ✅ Authentication properly blocks unauthorized access
- ✅ Session isolation prevents cross-contamination
- ✅ Messages send and receive correctly
- ✅ Basic security measures prevent injection

### Performance Targets
- ✅ Message load time < 2 seconds for 100 messages
- ✅ Real-time updates arrive within 3 seconds
- ✅ No memory leaks during normal usage
- ✅ Handle 10+ concurrent users

### User Experience Goals
- ✅ Works in all major browsers
- ✅ Graceful error handling with user feedback
- ✅ Fallback methods ensure reliability
- ✅ Responsive UI on mobile devices

---

## 📋 Execution Instructions

1. **Run in Browser Console**: Copy the audit functions into your browser console
2. **Execute**: Call `runChatAudit()` to run all tests
3. **Monitor**: Watch console output for test results
4. **Document**: Record any failures for investigation
5. **Fix**: Address critical issues before proceeding
6. **Re-test**: Run failed tests again after fixes

This comprehensive audit ensures your chat system is production-ready! 🚀