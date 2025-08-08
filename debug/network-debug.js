// Network Request Debug Tool
// Run this in browser console to monitor all Supabase API calls

console.log('🌐 NETWORK DEBUG TOOLS LOADED');

// =============================================================================
// PHASE 5: NETWORK REQUEST MONITORING
// =============================================================================

let originalFetch = null;
let networkLogs = [];
let isMonitoring = false;

window.startNetworkMonitoring = function() {
  if (isMonitoring) {
    console.log('⚠️ Network monitoring already active');
    return;
  }
  
  console.log('🌐 Starting network request monitoring...');
  
  // Store original fetch
  originalFetch = window.fetch;
  networkLogs = [];
  isMonitoring = true;
  
  // Override fetch function
  window.fetch = async function(...args) {
    const [url, options = {}] = args;
    const startTime = Date.now();
    
    // Create request log entry
    const requestLog = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      url: url,
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body || null,
      isSupabase: false,
      response: null,
      error: null,
      duration: 0,
      status: null
    };
    
    // Check if this is a Supabase request
    if (typeof url === 'string' && (url.includes('supabase') || url.includes('/rest/v1/'))) {
      requestLog.isSupabase = true;
      
      console.group('🌐 Supabase Request');
      console.log('📤 Request:', {
        url: url,
        method: requestLog.method,
        timestamp: requestLog.timestamp
      });
      
      if (options.headers) {
        console.log('📋 Headers:', options.headers);
      }
      
      if (options.body) {
        console.log('📦 Body:', options.body);
      }
    }
    
    try {
      // Make the actual request
      const response = await originalFetch(...args);
      const duration = Date.now() - startTime;
      
      // Clone response for logging (response can only be read once)
      const responseClone = response.clone();
      let responseText = '';
      let responseJson = null;
      
      try {
        responseText = await responseClone.text();
        responseJson = JSON.parse(responseText);
      } catch (e) {
        // Response might not be JSON
      }
      
      // Update log entry
      requestLog.duration = duration;
      requestLog.status = response.status;
      requestLog.response = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseJson || responseText.substring(0, 500) // Limit body size
      };
      
      if (requestLog.isSupabase) {
        console.log('📥 Response:', {
          status: response.status,
          ok: response.ok,
          duration: `${duration}ms`
        });
        
        if (!response.ok) {
          console.error('❌ Request failed:', {
            status: response.status,
            statusText: response.statusText,
            body: responseJson || responseText
          });
        }
        
        console.groupEnd();
      }
      
      networkLogs.push(requestLog);
      
      // Store logs in window for inspection
      window.networkLogs = networkLogs;
      
      return response;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      requestLog.duration = duration;
      requestLog.error = error.message;
      
      if (requestLog.isSupabase) {
        console.error('💥 Request exception:', error);
        console.groupEnd();
      }
      
      networkLogs.push(requestLog);
      window.networkLogs = networkLogs;
      
      throw error;
    }
  };
  
  console.log('✅ Network monitoring started. Logs available at: window.networkLogs');
};

window.stopNetworkMonitoring = function() {
  if (!isMonitoring) {
    console.log('⚠️ Network monitoring not active');
    return networkLogs;
  }
  
  console.log('🛑 Stopping network monitoring...');
  
  // Restore original fetch
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }
  
  isMonitoring = false;
  
  console.log(`📊 Monitoring stopped. Captured ${networkLogs.length} requests.`);
  return networkLogs;
};

// =============================================================================
// NETWORK LOG ANALYSIS
// =============================================================================

window.analyzeNetworkLogs = function() {
  console.group('📊 NETWORK LOG ANALYSIS');
  
  if (networkLogs.length === 0) {
    console.log('No network requests logged. Start monitoring first.');
    console.groupEnd();
    return;
  }
  
  const supabaseRequests = networkLogs.filter(log => log.isSupabase);
  const failedRequests = networkLogs.filter(log => log.error || (log.status && log.status >= 400));
  const slowRequests = networkLogs.filter(log => log.duration > 1000);
  
  console.log(`📈 Total requests: ${networkLogs.length}`);
  console.log(`🎯 Supabase requests: ${supabaseRequests.length}`);
  console.log(`❌ Failed requests: ${failedRequests.length}`);
  console.log(`🐌 Slow requests (>1s): ${slowRequests.length}`);
  
  if (supabaseRequests.length > 0) {
    console.log('\n🎯 Supabase Request Breakdown:');
    const methodCounts = supabaseRequests.reduce((acc, req) => {
      acc[req.method] = (acc[req.method] || 0) + 1;
      return acc;
    }, {});
    console.table(methodCounts);
    
    const avgDuration = supabaseRequests.reduce((sum, req) => sum + req.duration, 0) / supabaseRequests.length;
    console.log(`⏱️ Average Supabase request duration: ${avgDuration.toFixed(2)}ms`);
  }
  
  if (failedRequests.length > 0) {
    console.log('\n❌ Failed Requests:');
    failedRequests.forEach(req => {
      console.log(`  ${req.method} ${req.url} - ${req.status || req.error}`);
    });
  }
  
  if (slowRequests.length > 0) {
    console.log('\n🐌 Slow Requests:');
    slowRequests.forEach(req => {
      console.log(`  ${req.method} ${req.url} - ${req.duration}ms`);
    });
  }
  
  // RPC function analysis
  const rpcRequests = supabaseRequests.filter(req => req.url.includes('/rpc/'));
  if (rpcRequests.length > 0) {
    console.log('\n🔧 RPC Function Calls:');
    const rpcBreakdown = rpcRequests.reduce((acc, req) => {
      const funcName = req.url.split('/rpc/')[1]?.split('?')[0] || 'unknown';
      acc[funcName] = (acc[funcName] || 0) + 1;
      return acc;
    }, {});
    console.table(rpcBreakdown);
  }
  
  console.groupEnd();
  return {
    total: networkLogs.length,
    supabase: supabaseRequests.length,
    failed: failedRequests.length,
    slow: slowRequests.length,
    logs: networkLogs
  };
};

// =============================================================================
// SPECIFIC CHAT REQUEST MONITORING
// =============================================================================

window.monitorChatRequests = function(duration = 60000) {
  console.log(`💬 Monitoring chat-specific requests for ${duration/1000} seconds...`);
  
  const chatLogs = [];
  
  // Filter existing logs for chat-related requests
  const existingChatLogs = networkLogs.filter(log => 
    log.url.includes('wolfpack_chat') || 
    log.url.includes('send_wolfpack_chat_message') ||
    log.url.includes('get_wolfpack_chat_messages')
  );
  
  if (existingChatLogs.length > 0) {
    console.log(`📋 Found ${existingChatLogs.length} existing chat requests:`);
    existingChatLogs.forEach(log => {
      console.log(`  ${log.method} ${log.url} - ${log.status || log.error} (${log.duration}ms)`);
    });
  }
  
  // Start monitoring if not already active
  if (!isMonitoring) {
    startNetworkMonitoring();
  }
  
  const startLogCount = networkLogs.length;
  
  // Auto-analyze after duration
  setTimeout(() => {
    const newLogs = networkLogs.slice(startLogCount);
    const newChatLogs = newLogs.filter(log => 
      log.url.includes('wolfpack_chat') || 
      log.url.includes('send_wolfpack_chat_message') ||
      log.url.includes('get_wolfpack_chat_messages')
    );
    
    console.log(`💬 Chat monitoring completed. Found ${newChatLogs.length} new chat requests:`);
    
    if (newChatLogs.length > 0) {
      console.table(newChatLogs.map(log => ({
        method: log.method,
        url: log.url.split('/').pop(),
        status: log.status || log.error,
        duration: `${log.duration}ms`,
        success: log.status < 400
      })));
    } else {
      console.log('No chat requests detected during monitoring period.');
    }
    
    window.chatRequestLogs = [...existingChatLogs, ...newChatLogs];
    
  }, duration);
  
  console.log('✅ Chat monitoring active. Use the chat to generate requests...');
};

// =============================================================================
// REQUEST REPLAYING
// =============================================================================

window.replayRequest = async function(requestId) {
  const request = networkLogs.find(log => log.id === requestId);
  
  if (!request) {
    console.error('❌ Request not found with ID:', requestId);
    return;
  }
  
  console.log('🔄 Replaying request:', request.url);
  
  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
    
    const responseText = await response.text();
    
    console.log('✅ Replay response:', {
      status: response.status,
      ok: response.ok,
      body: responseText
    });
    
    return { response, body: responseText };
    
  } catch (error) {
    console.error('❌ Replay failed:', error);
    return { error };
  }
};

// =============================================================================
// QUICK NETWORK DIAGNOSTICS
// =============================================================================

window.quickNetworkDiagnostic = async function() {
  console.group('⚡ QUICK NETWORK DIAGNOSTIC');
  
  const tests = [
    {
      name: 'Supabase Connectivity',
      test: () => fetch(`${supabase.supabaseUrl}/rest/v1/`, {
        headers: { 'apikey': supabase.supabaseKey }
      })
    },
    {
      name: 'Authentication Endpoint',
      test: () => supabase.auth.getUser()
    },
    {
      name: 'Basic Table Access',
      test: () => supabase.from('users').select('id').limit(1)
    },
    {
      name: 'Chat Table Access',
      test: () => supabase.from(wolfpack_chat_messages').select('id').limit(1)
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`Testing: ${test.name}...`);
    const start = Date.now();
    
    try {
      const result = await test.test();
      const duration = Date.now() - start;
      
      results.push({
        name: test.name,
        success: true,
        duration: `${duration}ms`,
        status: result.status || 'OK'
      });
      
      console.log(`✅ ${test.name}: OK (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - start;
      
      results.push({
        name: test.name,
        success: false,
        duration: `${duration}ms`,
        error: error.message
      });
      
      console.error(`❌ ${test.name}: ${error.message}`);
    }
  }
  
  console.log('\n📊 DIAGNOSTIC RESULTS:');
  console.table(results);
  
  const allPassed = results.every(r => r.success);
  console.log(allPassed ? '✅ All network tests passed!' : '❌ Some network tests failed');
  
  console.groupEnd();
  return results;
};

// =============================================================================
// AUTO-LOAD INSTRUCTIONS
// =============================================================================

console.log(`
🌐 NETWORK DEBUG TOOLS READY

Monitoring Commands:
- startNetworkMonitoring()      // Start capturing all requests
- stopNetworkMonitoring()       // Stop and return captured logs
- monitorChatRequests()          // Focus on chat-specific requests

Analysis Commands:
- analyzeNetworkLogs()           // Analyze captured request logs
- quickNetworkDiagnostic()       // Test basic connectivity

Advanced:
- replayRequest(id)              // Replay a specific request
- window.networkLogs             // View all captured logs
- window.chatRequestLogs         // View chat-specific logs

Quick Start:
1. startNetworkMonitoring()
2. Use the chat normally
3. analyzeNetworkLogs()
`);

// Auto-start if in debug mode
if (localStorage.getItem('network-debug') === 'true') {
  console.log('🚀 Network debug mode detected - auto-starting monitoring...');
  startNetworkMonitoring();
}