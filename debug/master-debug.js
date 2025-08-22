// Master Debug Tool - Combines all debugging phases
// Load this script to get access to all debugging tools

console.log('🎯 MASTER DEBUG TOOL LOADING...');

// =============================================================================
// LOAD ALL DEBUG MODULES
// =============================================================================

// Function to load script dynamically
async function loadDebugScript(path, name) {
  try {
    const response = await fetch(path);
    const scriptContent = await response.text();
    eval(scriptContent);
    console.log(`✅ Loaded: ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to load ${name}:`, error.message);
    return false;
  }
}

// Load all debug modules
window.loadAllDebugTools = async function() {
  console.group('📦 LOADING DEBUG MODULES');
  
  const modules = [
    { path: '/debug/emergencyDebug.js', name: 'Emergency Cookie Cleanup' },
    { path: '/debug/rpc-audit.js', name: 'RPC Function Audit' },
    { path: '/debug/auth-debug.js', name: 'Authentication Debug' },
    { path: '/debug/chat-flow-debug.js', name: 'Chat Flow Debug' },
    { path: '/debug/network-debug.js', name: 'Network Debug' }
  ];
  
  const results = [];
  
  for (const module of modules) {
    const success = await loadDebugScript(module.path, module.name);
    results.push({ ...module, loaded: success });
  }
  
  console.log('\n📊 MODULE LOAD RESULTS:');
  console.table(results);
  
  const loadedCount = results.filter(r => r.loaded).length;
  console.log(`✅ ${loadedCount}/${modules.length} modules loaded successfully`);
  
  console.groupEnd();
  return results;
};

// =============================================================================
// MASTER DEBUG ORCHESTRATOR
// =============================================================================

window.runFullDiagnostic = async function() {
  console.log('🚀 STARTING FULL WOLFPACK CHAT DIAGNOSTIC...\n');
  
  const diagnosticResults = {
    timestamp: new Date().toISOString(),
    phases: [],
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      criticalIssues: [],
      recommendations: []
    }
  };
  
  // Phase 1: Emergency Cookie Cleanup
  console.log('1️⃣ PHASE 1: Cookie & Auth Cleanup');
  console.log('═'.repeat(50));
  
  try {
    if (typeof emergencyCleanup === 'function') {
      // Check if cookies are corrupted first
      const authToken = localStorage.getItem('sb-supabase-auth-token');
      if (authToken && authToken.includes('base64-')) {
        console.log('🚨 Corrupted cookies detected - running cleanup...');
        // Note: emergencyCleanup() will reload the page, so we can't continue
        diagnosticResults.summary.criticalIssues.push('Corrupted auth cookies detected - cleanup required');
      } else {
        console.log('✅ Auth cookies appear clean');
      }
    }
  } catch (error) {
    console.error('❌ Cookie cleanup error:', error);
    diagnosticResults.summary.criticalIssues.push('Cookie cleanup tool unavailable');
  }
  
  // Phase 2: Authentication Check
  console.log('\n2️⃣ PHASE 2: Authentication Verification');
  console.log('═'.repeat(50));
  
  let authResults = null;
  try {
    if (typeof debugAuthState === 'function') {
      authResults = await debugAuthState();
      diagnosticResults.phases.push({
        phase: 'authentication',
        success: authResults.authUser !== null,
        details: authResults
      });
    } else if (typeof quickAuthCheck === 'function') {
      const isAuth = await quickAuthCheck();
      diagnosticResults.phases.push({
        phase: 'authentication',
        success: isAuth,
        details: { authenticated: isAuth }
      });
    }
  } catch (error) {
    console.error('❌ Auth check error:', error);
    diagnosticResults.summary.criticalIssues.push('Authentication check failed');
  }
  
  // Phase 3: RPC Function Audit
  console.log('\n3️⃣ PHASE 3: RPC Function Verification');
  console.log('═'.repeat(50));
  
  let rpcResults = null;
  try {
    if (typeof auditRPCFunctions === 'function') {
      rpcResults = await auditRPCFunctions();
      const existingFunctions = Object.values(rpcResults).filter(r => r.exists).length;
      diagnosticResults.phases.push({
        phase: 'rpcFunctions',
        success: existingFunctions > 0,
        details: { existingFunctions, results: rpcResults }
      });
      
      if (existingFunctions === 0) {
        diagnosticResults.summary.recommendations.push('No RPC functions found - use direct table operations');
      }
    }
  } catch (error) {
    console.error('❌ RPC audit error:', error);
    diagnosticResults.summary.criticalIssues.push('RPC function audit failed');
  }
  
  // Phase 4: Database Schema Verification
  console.log('\n4️⃣ PHASE 4: Database Schema Check');
  console.log('═'.repeat(50));
  
  try {
    if (typeof verifyDatabaseSchema === 'function') {
      await verifyDatabaseSchema();
    }
    
    // Test basic table access
    const { data: testMessages, error: testError } = await supabase
      .from(wolfpack_chat_messages')
      .select('id')
      .limit(1);
    
    diagnosticResults.phases.push({
      phase: 'databaseSchema',
      success: !testError,
      details: { accessible: !testError, error: testError?.message }
    });
    
    if (testError) {
      diagnosticResults.summary.criticalIssues.push('Database table access failed');
    }
  } catch (error) {
    console.error('❌ Database schema error:', error);
    diagnosticResults.summary.criticalIssues.push('Database schema verification failed');
  }
  
  // Phase 5: Chat Flow Test
  console.log('\n5️⃣ PHASE 5: Chat Flow Verification');
  console.log('═'.repeat(50));
  
  let chatResults = null;
  try {
    if (typeof debugChatFlow === 'function') {
      chatResults = await debugChatFlow('general', 'Diagnostic test message');
      diagnosticResults.phases.push({
        phase: 'chatFlow',
        success: chatResults.success,
        details: chatResults
      });
      
      if (!chatResults.success) {
        diagnosticResults.summary.criticalIssues.push('Chat flow has critical issues');
      }
    }
  } catch (error) {
    console.error('❌ Chat flow error:', error);
    diagnosticResults.summary.criticalIssues.push('Chat flow test failed');
  }
  
  // Phase 6: Network Diagnostic
  console.log('\n6️⃣ PHASE 6: Network Connectivity');
  console.log('═'.repeat(50));
  
  try {
    if (typeof quickNetworkDiagnostic === 'function') {
      const networkResults = await quickNetworkDiagnostic();
      const allPassed = networkResults.every(r => r.success);
      diagnosticResults.phases.push({
        phase: 'network',
        success: allPassed,
        details: networkResults
      });
      
      if (!allPassed) {
        diagnosticResults.summary.criticalIssues.push('Network connectivity issues detected');
      }
    }
  } catch (error) {
    console.error('❌ Network diagnostic error:', error);
    diagnosticResults.summary.criticalIssues.push('Network diagnostic failed');
  }
  
  // Calculate summary statistics
  diagnosticResults.summary.totalTests = diagnosticResults.phases.length;
  diagnosticResults.summary.passedTests = diagnosticResults.phases.filter(p => p.success).length;
  diagnosticResults.summary.failedTests = diagnosticResults.summary.totalTests - diagnosticResults.summary.passedTests;
  
  // Generate recommendations
  if (diagnosticResults.summary.criticalIssues.length === 0) {
    diagnosticResults.summary.recommendations.push('All systems appear functional');
  } else {
    diagnosticResults.summary.recommendations.push('Address critical issues before proceeding');
  }
  
  // Final Summary
  console.log('\n🎯 DIAGNOSTIC SUMMARY');
  console.log('═'.repeat(50));
  console.table({
    'Total Tests': diagnosticResults.summary.totalTests,
    'Passed': diagnosticResults.summary.passedTests,
    'Failed': diagnosticResults.summary.failedTests,
    'Critical Issues': diagnosticResults.summary.criticalIssues.length
  });
  
  if (diagnosticResults.summary.criticalIssues.length > 0) {
    console.log('\n❌ CRITICAL ISSUES:');
    diagnosticResults.summary.criticalIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }
  
  if (diagnosticResults.summary.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    diagnosticResults.summary.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  console.log('\n📊 Detailed results stored in: window.diagnosticResults');
  window.diagnosticResults = diagnosticResults;
  
  return diagnosticResults;
};

// =============================================================================
// QUICK DEBUG COMMANDS
// =============================================================================

window.quickChatTest = async function() {
  console.log('⚡ QUICK CHAT TEST');
  
  try {
    // Quick auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Not authenticated');
      return false;
    }
    console.log('✅ Authenticated');
    
    // Quick message send test
    if (typeof simulateMessageSend === 'function') {
      const result = await simulateMessageSend('Quick test');
      console.log(result.steps.every(s => s.success) ? '✅ Chat working' : '❌ Chat issues');
      return result.steps.every(s => s.success);
    } else {
      console.log('⚠️ Chat simulation not available');
      return null;
    }
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return false;
  }
};

window.emergencyResetChat = function() {
  console.log('🚨 EMERGENCY CHAT RESET');
  
  // Clear all chat-related state
  localStorage.removeItem('wolfpack-chat-state');
  sessionStorage.removeItem('wolfpack-session');
  
  // Clear cookies
  if (typeof emergencyCleanup === 'function') {
    emergencyCleanup();
  } else {
    console.log('Manual cookie cleanup required');
  }
};

// =============================================================================
// HELP SYSTEM
// =============================================================================

window.debugHelp = function() {
  console.log(`
🎯 WOLFPACK CHAT DEBUG TOOLS

MASTER COMMANDS:
  runFullDiagnostic()     - Complete system diagnosis
  quickChatTest()         - Fast chat functionality test
  emergencyResetChat()    - Reset all chat state
  loadAllDebugTools()     - Load all debug modules

PHASE-SPECIFIC TOOLS:
  
  🍪 Cookie/Auth:
    emergencyCleanup()    - Fix corrupted cookies
    quickAuthCheck()      - Fast auth status
    debugAuthState()      - Detailed auth analysis
  
  🔧 RPC Functions:
    auditRPCFunctions()   - Check which RPC functions exist
    testChatFunctionParameters() - Test parameter signatures
  
  💬 Chat Flow:
    debugChatFlow()       - Complete chat flow test
    simulateMessageSend() - Detailed message send test
    testMessageRetrieval() - Test message loading
  
  🌐 Network:
    startNetworkMonitoring() - Monitor all requests
    quickNetworkDiagnostic() - Test connectivity
    analyzeNetworkLogs()  - Analyze captured requests

INSPECTION:
  window.diagnosticResults - Last full diagnostic results
  window.networkLogs      - Captured network requests
  window.authStateHistory - Auth state changes

Start with: runFullDiagnostic()
  `);
};

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

console.log('✅ Master Debug Tool loaded!');
console.log('📋 Type debugHelp() for available commands');
console.log('🚀 Type runFullDiagnostic() to start comprehensive testing');

// Auto-load debug tools if in debug mode
if (localStorage.getItem('auto-debug') === 'true') {
  console.log('🔄 Auto-debug mode detected - loading all tools...');
  loadAllDebugTools().then(() => {
    console.log('🎯 Auto-running full diagnostic...');
    runFullDiagnostic();
  });
}