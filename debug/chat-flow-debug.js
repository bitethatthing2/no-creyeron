// Chat Flow Debug Tool
// Run this in browser console to test complete chat message flow

console.log('💬 CHAT FLOW DEBUG TOOLS LOADED');

// =============================================================================
// PHASE 4: COMPREHENSIVE CHAT FLOW DEBUGGING
// =============================================================================

window.debugChatFlow = async function(sessionId = 'general', testMessage = 'Debug test message') {
  console.group('💬 CHAT FLOW DEBUG');
  console.log(`Testing with session: ${sessionId}, message: "${testMessage}"`);
  
  const flowState = {
    timestamp: new Date().toISOString(),
    sessionId: sessionId,
    testMessage: testMessage,
    steps: [],
    success: false,
    errors: [],
    data: {}
  };
  
  try {
    // Step 1: Authentication Check
    console.log('1️⃣ Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    const authStep = {
      step: 'authentication',
      success: !authError && !!user,
      error: authError?.message,
      data: user ? { id: user.id, email: user.email } : null
    };
    flowState.steps.push(authStep);
    
    if (authError || !user) {
      flowState.errors.push('Authentication failed');
      console.error('❌ Authentication failed:', authError);
      console.groupEnd();
      return flowState;
    }
    console.log('✅ User authenticated:', user.email);
    
    // Step 2: User Profile Lookup
    console.log('2️⃣ Looking up user profile...');
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, display_name, first_name, last_name, avatar_url, profile_image_url, auth_id')
      .eq('auth_id', user.id)
      .single();
    
    const profileStep = {
      step: 'userProfile',
      success: !profileError && !!userProfile,
      error: profileError?.message,
      data: userProfile
    };
    flowState.steps.push(profileStep);
    
    if (profileError || !userProfile) {
      flowState.errors.push('User profile lookup failed');
      console.error('❌ Profile lookup failed:', profileError);
      console.groupEnd();
      return flowState;
    }
    
    const displayName = userProfile.display_name || 
                       `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 
                       'Test User';
    const avatarUrl = userProfile.profile_image_url || userProfile.avatar_url;
    
    console.log('✅ User profile found:', { displayName, avatarUrl });
    flowState.data.userProfile = { displayName, avatarUrl, internalId: userProfile.id };
    
    // Step 3: Session Validation
    console.log('3️⃣ Validating chat session...');
    const { data: sessionData, error: sessionError } = await supabase
      .from('wolfpack_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    const sessionStep = {
      step: 'sessionValidation',
      success: !sessionError && !!sessionData,
      error: sessionError?.message,
      data: sessionData
    };
    flowState.steps.push(sessionStep);
    
    if (sessionError) {
      console.log('⚠️ Session validation failed (might be using string session ID):', sessionError.message);
      // Continue anyway as some sessions might be dynamic
    } else {
      console.log('✅ Session found:', sessionData.display_name);
    }
    
    // Step 4: Message Insert Test
    console.log('4️⃣ Testing message insert...');
    const messageData = {
      session_id: sessionId,
      user_id: userProfile.id,  // Use internal user ID
      display_name: displayName,
      avatar_url: avatarUrl,
      content: testMessage,
      message_type: 'text',
      image_url: null,
      is_flagged: false,
      is_deleted: false
    };
    
    console.log('Message data to insert:', messageData);
    
    const { data: insertResult, error: insertError } = await supabase
      .from(wolfpack_chat_messages')
      .insert(messageData)
      .select()
      .single();
    
    const insertStep = {
      step: 'messageInsert',
      success: !insertError && !!insertResult,
      error: insertError?.message,
      data: insertResult
    };
    flowState.steps.push(insertStep);
    
    if (insertError) {
      flowState.errors.push('Message insert failed');
      console.error('❌ Message insert failed:', insertError);
      
      // Try to get more details about the error
      console.log('🔍 Analyzing insert error...');
      if (insertError.message.includes('policy')) {
        console.log('Policy issue - checking RLS policies...');
      }
      if (insertError.message.includes('foreign key')) {
        console.log('Foreign key issue - checking user_id reference...');
      }
      if (insertError.message.includes('not null')) {
        console.log('Required field missing - checking required columns...');
      }
    } else {
      console.log('✅ Message inserted successfully:', insertResult);
      flowState.data.insertedMessage = insertResult;
    }
    
    // Step 5: Message Retrieval Test
    console.log('5️⃣ Testing message retrieval...');
    const { data: messages, error: retrieveError } = await supabase
      .from(wolfpack_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(5);
    
    const retrieveStep = {
      step: 'messageRetrieval',
      success: !retrieveError,
      error: retrieveError?.message,
      data: messages ? { count: messages.length, messages: messages } : null
    };
    flowState.steps.push(retrieveStep);
    
    if (retrieveError) {
      flowState.errors.push('Message retrieval failed');
      console.error('❌ Message retrieval failed:', retrieveError);
    } else {
      console.log(`✅ Retrieved ${messages.length} messages`);
      if (messages.length > 0) {
        console.log('Latest message:', messages[0]);
      }
    }
    
    // Step 6: Cleanup Test Message (if inserted)
    if (insertResult && insertResult.id) {
      console.log('6️⃣ Cleaning up test message...');
      const { error: deleteError } = await supabase
        .from(wolfpack_chat_messages')
        .update({ is_deleted: true })
        .eq('id', insertResult.id);
      
      const cleanupStep = {
        step: 'cleanup',
        success: !deleteError,
        error: deleteError?.message,
        data: null
      };
      flowState.steps.push(cleanupStep);
      
      if (deleteError) {
        console.log('⚠️ Cleanup failed (test message may remain):', deleteError.message);
      } else {
        console.log('✅ Test message cleaned up');
      }
    }
    
    // Overall success assessment
    const criticalSteps = ['authentication', 'userProfile', 'messageInsert', 'messageRetrieval'];
    const criticalStepsPassed = flowState.steps
      .filter(step => criticalSteps.includes(step.step))
      .every(step => step.success);
    
    flowState.success = criticalStepsPassed;
    
  } catch (error) {
    flowState.errors.push(`Flow error: ${error.message}`);
    console.error('💥 Flow error:', error);
  }
  
  // Summary
  console.log('\n📊 CHAT FLOW SUMMARY:');
  console.table(flowState.steps);
  
  if (flowState.success) {
    console.log('✅ Chat flow working correctly!');
  } else {
    console.log('❌ Chat flow has issues:');
    flowState.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
  
  console.groupEnd();
  return flowState;
};

// =============================================================================
// DETAILED MESSAGE SEND SIMULATION
// =============================================================================

window.simulateMessageSend = async function(content = 'Test message', sessionId = 'general') {
  console.group('📤 MESSAGE SEND SIMULATION');
  console.log(`Simulating send: "${content}" to session: ${sessionId}`);
  
  const simulation = {
    input: { content, sessionId },
    steps: [],
    timing: {},
    result: null
  };
  
  const startTime = Date.now();
  
  try {
    // Step 1: Input validation
    console.log('Step 1: Input validation...');
    const stepStart = Date.now();
    
    const sanitizedContent = content.trim().slice(0, 500).replace(/[<>]/g, '');
    const isValid = sanitizedContent.length > 0;
    
    simulation.steps.push({
      step: 'inputValidation',
      success: isValid,
      data: { original: content, sanitized: sanitizedContent, valid: isValid },
      timing: Date.now() - stepStart
    });
    
    if (!isValid) {
      console.error('❌ Input validation failed');
      console.groupEnd();
      return simulation;
    }
    console.log('✅ Input valid:', sanitizedContent);
    
    // Step 2: Authentication
    console.log('Step 2: Authentication...');
    const authStart = Date.now();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    simulation.steps.push({
      step: 'authentication',
      success: !authError && !!user,
      error: authError?.message,
      data: user ? { id: user.id } : null,
      timing: Date.now() - authStart
    });
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      console.groupEnd();
      return simulation;
    }
    console.log('✅ Authenticated');
    
    // Step 3: User profile fetch
    console.log('Step 3: User profile fetch...');
    const profileStart = Date.now();
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, display_name, first_name, last_name, avatar_url, profile_image_url')
      .eq('auth_id', user.id)
      .single();
    
    simulation.steps.push({
      step: 'profileFetch',
      success: !profileError && !!profile,
      error: profileError?.message,
      data: profile,
      timing: Date.now() - profileStart
    });
    
    if (profileError || !profile) {
      console.error('❌ Profile fetch failed:', profileError);
      console.groupEnd();
      return simulation;
    }
    console.log('✅ Profile fetched');
    
    // Step 4: Message composition
    console.log('Step 4: Message composition...');
    const composeStart = Date.now();
    
    const displayName = profile.display_name || 
                       `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 
                       'Anonymous';
    const avatarUrl = profile.profile_image_url || profile.avatar_url;
    
    const messagePayload = {
      session_id: sessionId,
      user_id: profile.id,
      display_name: displayName,
      avatar_url: avatarUrl,
      content: sanitizedContent,
      message_type: 'text',
      image_url: null,
      is_flagged: false,
      is_deleted: false
    };
    
    simulation.steps.push({
      step: 'messageComposition',
      success: true,
      data: messagePayload,
      timing: Date.now() - composeStart
    });
    
    console.log('✅ Message composed:', messagePayload);
    
    // Step 5: Database insert
    console.log('Step 5: Database insert...');
    const insertStart = Date.now();
    const { data: insertResult, error: insertError } = await supabase
      .from(wolfpack_chat_messages')
      .insert(messagePayload)
      .select()
      .single();
    
    simulation.steps.push({
      step: 'databaseInsert',
      success: !insertError && !!insertResult,
      error: insertError?.message,
      data: insertResult,
      timing: Date.now() - insertStart
    });
    
    if (insertError) {
      console.error('❌ Database insert failed:', insertError);
    } else {
      console.log('✅ Message inserted:', insertResult.id);
      simulation.result = insertResult;
    }
    
  } catch (error) {
    console.error('💥 Simulation error:', error);
    simulation.steps.push({
      step: 'error',
      success: false,
      error: error.message,
      timing: 0
    });
  }
  
  simulation.timing.total = Date.now() - startTime;
  
  console.log('\n📊 SIMULATION RESULTS:');
  console.table(simulation.steps);
  console.log(`⏱️ Total time: ${simulation.timing.total}ms`);
  
  console.groupEnd();
  return simulation;
};

// =============================================================================
// MESSAGE RETRIEVAL TESTING
// =============================================================================

window.testMessageRetrieval = async function(sessionId = 'general', limit = 10) {
  console.group('📥 MESSAGE RETRIEVAL TEST');
  console.log(`Testing retrieval from session: ${sessionId}, limit: ${limit}`);
  
  const tests = [
    {
      name: 'Direct table query',
      query: () => supabase
        .from(wolfpack_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit)
    },
    {
      name: 'With user join',
      query: () => supabase
        .from(wolfpack_chat_messages')
        .select(`
          *,
          users:user_id (
            display_name,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('session_id', sessionId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit)
    },
    {
      name: 'RPC function (if exists)',
      query: () => supabase.rpc('get_wolfpack_chat_messages', {
        p_session_id: sessionId,
        p_limit: limit,
        p_offset: 0
      })
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    const start = Date.now();
    
    try {
      const { data, error } = await test.query();
      const timing = Date.now() - start;
      
      const result = {
        name: test.name,
        success: !error,
        error: error?.message,
        messageCount: Array.isArray(data) ? data.length : 0,
        timing: timing,
        sampleData: Array.isArray(data) && data.length > 0 ? data[0] : null
      };
      
      results.push(result);
      
      if (error) {
        console.error(`❌ ${test.name} failed:`, error.message);
      } else {
        console.log(`✅ ${test.name} succeeded: ${result.messageCount} messages in ${timing}ms`);
      }
    } catch (err) {
      results.push({
        name: test.name,
        success: false,
        error: err.message,
        messageCount: 0,
        timing: Date.now() - start
      });
      console.error(`💥 ${test.name} exception:`, err.message);
    }
  }
  
  console.log('\n📊 RETRIEVAL TEST RESULTS:');
  console.table(results);
  
  const workingMethods = results.filter(r => r.success);
  if (workingMethods.length > 0) {
    const fastest = workingMethods.reduce((prev, current) => 
      prev.timing < current.timing ? prev : current
    );
    console.log(`🏆 Fastest working method: ${fastest.name} (${fastest.timing}ms)`);
  }
  
  console.groupEnd();
  return results;
};

// =============================================================================
// REALTIME SUBSCRIPTION TESTING
// =============================================================================

window.testRealtimeSubscription = function(sessionId = 'general', duration = 30000) {
  console.log(`🔴 Testing realtime subscription for session: ${sessionId}`);
  console.log(`Will monitor for ${duration/1000} seconds...`);
  
  const events = [];
  let subscription = null;
  
  try {
    subscription = supabase
      .channel(`test_chat_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: wolfpack_chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const event = {
            timestamp: new Date().toISOString(),
            eventType: payload.eventType,
            table: payload.table,
            schema: payload.schema,
            data: payload.new || payload.old
          };
          
          events.push(event);
          console.log('📡 Realtime event received:', event);
        }
      )
      .subscribe((status) => {
        console.log(`📡 Subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime subscription active');
        }
      });
    
    // Auto-cleanup after duration
    setTimeout(() => {
      subscription?.unsubscribe();
      console.log(`🔴 Realtime test completed. Received ${events.length} events.`);
      
      if (events.length > 0) {
        console.table(events);
      }
      
      window.realtimeTestEvents = events;
    }, duration);
    
    console.log('✅ Realtime subscription started. Send messages to test...');
    
  } catch (error) {
    console.error('💥 Realtime subscription error:', error);
  }
  
  // Return unsubscribe function for manual cleanup
  return () => {
    subscription?.unsubscribe();
    console.log('🛑 Realtime subscription manually stopped');
    return events;
  };
};

// =============================================================================
// AUTO-LOAD INSTRUCTIONS
// =============================================================================

console.log(`
💬 CHAT FLOW DEBUG TOOLS READY

Main Commands:
- debugChatFlow()              // Complete chat flow test
- simulateMessageSend()        // Detailed message send simulation
- testMessageRetrieval()       // Test different retrieval methods
- testRealtimeSubscription()   // Test realtime message updates

Quick Tests:
- debugChatFlow('general', 'Hello test')     // Test with specific message
- simulateMessageSend('Quick test')          // Simulate sending
- testRealtimeSubscription('general', 10000) // 10 second realtime test

Recommended: Start with debugChatFlow()
`);