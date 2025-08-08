// RPC Function Audit Tool
// Run this in browser console to check what RPC functions actually exist

console.log('🔍 STARTING RPC FUNCTION AUDIT...');

// =============================================================================
// PHASE 2: RPC FUNCTION EXISTENCE CHECK
// =============================================================================

window.auditRPCFunctions = async function() {
  console.group('🔍 RPC FUNCTION AUDIT');
  
  const functionsToTest = [
    'send_wolfpack_chat_message',
    'get_wolfpack_chat_messages', 
    'join_wolfpack_chat',
    'leave_wolfpack_chat',
    'flag_message',
    'delete_message'
  ];
  
  const results = {};
  
  for (const funcName of functionsToTest) {
    console.group(`Testing: ${funcName}`);
    
    try {
      // Test with minimal parameters to see if function exists
      const { data, error } = await supabase.rpc(funcName, {});
      
      if (error) {
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          results[funcName] = {
            exists: false,
            error: 'Function does not exist',
            details: error.message
          };
          console.error('❌ Function does not exist:', error.message);
        } else if (error.message.includes('missing') || error.message.includes('parameter')) {
          results[funcName] = {
            exists: true,
            error: 'Parameter error (function exists)',
            details: error.message
          };
          console.log('✅ Function exists but has parameter requirements:', error.message);
        } else {
          results[funcName] = {
            exists: true,
            error: 'Other error (function exists)',
            details: error.message
          };
          console.log('⚠️ Function exists but returned error:', error.message);
        }
      } else {
        results[funcName] = {
          exists: true,
          error: null,
          details: 'Function executed successfully',
          data: data
        };
        console.log('✅ Function exists and executed:', data);
      }
    } catch (err) {
      results[funcName] = {
        exists: false,
        error: 'Network/auth error',
        details: err.message
      };
      console.error('💥 Network/auth error:', err);
    }
    
    console.groupEnd();
  }
  
  // Summary
  console.log('\n📊 RPC AUDIT SUMMARY:');
  console.table(results);
  
  const existingFunctions = Object.keys(results).filter(f => results[f].exists);
  const missingFunctions = Object.keys(results).filter(f => !results[f].exists);
  
  console.log(`✅ Existing functions (${existingFunctions.length}):`, existingFunctions);
  console.log(`❌ Missing functions (${missingFunctions.length}):`, missingFunctions);
  
  console.groupEnd();
  return results;
};

// =============================================================================
// SPECIFIC CHAT FUNCTION PARAMETER TESTING
// =============================================================================

window.testChatFunctionParameters = async function() {
  console.group('🧪 CHAT FUNCTION PARAMETER TESTING');
  
  // Test send_wolfpack_chat_message with different parameter combinations
  const sendMessageTests = [
    {
      name: 'Migration style (p_ prefix)',
      params: { p_session_id: 'test', p_content: 'Test message', p_message_type: 'text' }
    },
    {
      name: 'Simple style (no prefix)',
      params: { session_id: 'test', content: 'Test message', message_type: 'text' }
    },
    {
      name: 'Database style (user_id)',
      params: { session_id: 'test', user_id: 'test-user', content: 'Test message' }
    },
    {
      name: 'Full parameters',
      params: { 
        session_id: 'test', 
        user_id: 'test-user', 
        display_name: 'Test User',
        content: 'Test message',
        message_type: 'text'
      }
    }
  ];
  
  for (const test of sendMessageTests) {
    console.group(`Testing send_wolfpack_chat_message: ${test.name}`);
    
    try {
      const { data, error } = await supabase.rpc('send_wolfpack_chat_message', test.params);
      
      if (error) {
        console.log('Error details:', error);
        if (error.message.includes('parameter')) {
          console.log('🔍 Parameter issue - this tells us about expected signature');
        }
      } else {
        console.log('✅ Success with params:', test.params);
        console.log('Response:', data);
      }
    } catch (err) {
      console.error('Exception:', err.message);
    }
    
    console.groupEnd();
  }
  
  console.groupEnd();
};

// =============================================================================
// DATABASE SCHEMA VERIFICATION
// =============================================================================

window.verifyDatabaseSchema = async function() {
  console.group('🗃️ DATABASE SCHEMA VERIFICATION');
  
  try {
    // Check if wolfpack_chat_messages table exists and get its structure
    console.log('Checking wolfpack_chat_messages table...');
    const { data: messages, error: messagesError } = await supabase
      .from(wolfpack_chat_messages')
      .select('*')
      .limit(1);
    
    if (messagesError) {
      console.error('❌ wolfpack_chat_messages table issue:', messagesError);
    } else {
      console.log('✅ wolfpack_chat_messages table accessible');
      if (messages && messages.length > 0) {
        console.log('Sample record structure:', Object.keys(messages[0]));
      } else {
        console.log('Table is empty, will test with insert');
      }
    }
    
    // Check wolfpack_chat_sessions
    console.log('Checking wolfpack_chat_sessions table...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('wolfpack_chat_sessions')
      .select('*')
      .limit(1);
    
    if (sessionsError) {
      console.error('❌ wolfpack_chat_sessions table issue:', sessionsError);
    } else {
      console.log('✅ wolfpack_chat_sessions table accessible');
      if (sessions && sessions.length > 0) {
        console.log('Sample session structure:', Object.keys(sessions[0]));
      }
    }
    
    // Check if default sessions exist
    console.log('Checking for default chat sessions...');
    const { data: defaultSessions, error: defaultError } = await supabase
      .from('wolfpack_chat_sessions')
      .select('id, display_name')
      .in('id', ['general', 'salem', 'portland']);
    
    if (defaultError) {
      console.error('❌ Error checking default sessions:', defaultError);
    } else {
      console.log('✅ Default sessions found:', defaultSessions);
    }
    
  } catch (err) {
    console.error('💥 Schema verification error:', err);
  }
  
  console.groupEnd();
};

// =============================================================================
// TABLE PERMISSIONS CHECK
// =============================================================================

window.checkTablePermissions = async function() {
  console.group('🔐 TABLE PERMISSIONS CHECK');
  
  const tables = [wolfpack_chat_messages', 'wolfpack_chat_sessions'];
  const operations = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
  
  for (const table of tables) {
    console.group(`Testing ${table}`);
    
    // Test SELECT
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      console.log(error ? `❌ SELECT: ${error.message}` : '✅ SELECT: OK');
    } catch (err) {
      console.log(`❌ SELECT: ${err.message}`);
    }
    
    // Test INSERT (will likely fail but tells us about RLS)
    try {
      const { data, error } = await supabase.from(table).insert({}).select();
      console.log(error ? `❌ INSERT: ${error.message}` : '✅ INSERT: OK');
    } catch (err) {
      console.log(`❌ INSERT: ${err.message}`);
    }
    
    console.groupEnd();
  }
  
  console.groupEnd();
};

// =============================================================================
// FULL AUDIT RUNNER
// =============================================================================

window.runFullRPCAudit = async function() {
  console.log('🚀 RUNNING FULL RPC AUDIT...\n');
  
  console.log('1️⃣ Checking RPC function existence...');
  const rpcResults = await auditRPCFunctions();
  
  console.log('\n2️⃣ Testing function parameters...');
  await testChatFunctionParameters();
  
  console.log('\n3️⃣ Verifying database schema...');
  await verifyDatabaseSchema();
  
  console.log('\n4️⃣ Checking table permissions...');
  await checkTablePermissions();
  
  console.log('\n🎯 AUDIT COMPLETE!');
  console.log('Check the console output above for detailed results.');
  
  return {
    rpcFunctions: rpcResults,
    recommendation: Object.values(rpcResults).some(r => r.exists) 
      ? 'Some RPC functions exist - check parameter signatures'
      : 'No RPC functions found - use direct table operations'
  };
};

// Auto-run instructions
console.log(`
🔍 RPC AUDIT TOOLS LOADED

Quick Commands:
- runFullRPCAudit()           // Run complete audit
- auditRPCFunctions()         // Check which RPC functions exist  
- testChatFunctionParameters() // Test parameter signatures
- verifyDatabaseSchema()      // Check table structure
- checkTablePermissions()     // Test RLS policies

RECOMMENDED: Run runFullRPCAudit() first!
`);

// Auto-start if in debug mode
if (localStorage.getItem('debug-mode') === 'true') {
  console.log('🚀 Debug mode detected - auto-running audit...');
  setTimeout(() => runFullRPCAudit(), 1000);
}