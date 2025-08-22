// Browser console script to immediately clear all cookies
// Usage: Copy and paste this into browser console, or run clearAllCookies() if already loaded

(function() {
  'use strict';
  
  // Clear all cookies function
  function clearAllCookies() {
    console.log('🔄 Clearing all cookies...');
    
    const cookies = document.cookie.split(';');
    let cleared = 0;
    
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      if (name) {
        // Clear cookie for current path
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        
        // Clear cookie for root path
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
        
        // Clear cookie with domain variations
        if (window.location.hostname !== 'localhost') {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
        }
        
        cleared++;
        console.log(`  ✓ Cleared: ${name}`);
      }
    }
    
    console.log(`✅ Cleared ${cleared} cookies`);
    console.log('🔄 Reloading page...');
    
    // Reload the page after clearing cookies
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
  
  // Clear only Supabase auth cookies
  function clearSupabaseCookies() {
    console.log('🔄 Clearing Supabase cookies...');
    
    const supabaseCookieNames = [
      'sb-access-token',
      'sb-refresh-token', 
      'supabase-auth-token',
      'supabase.auth.token',
      'sb-tvnpgbjypnezoasbhbwx-auth-token',
      'sb-tvnpgbjypnezoasbhbwx-auth-token-code-verifier'
    ];
    
    let cleared = 0;
    
    // Also check existing cookies for any sb- or supabase patterns
    const cookies = document.cookie.split(';');
    const foundSupabaseCookies = [];
    
    for (const cookie of cookies) {
      const [name] = cookie.split('=').map(s => s.trim());
      if (name && (name.includes('sb-') || name.includes('supabase'))) {
        foundSupabaseCookies.push(name);
      }
    }
    
    // Combine known names with found names
    const allSupabaseCookies = [...new Set([...supabaseCookieNames, ...foundSupabaseCookies])];
    
    for (const cookieName of allSupabaseCookies) {
      // Clear cookie for current path
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      
      // Clear cookie for root path  
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
      
      // Clear cookie with domain variations
      if (window.location.hostname !== 'localhost') {
        document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
      }
      
      cleared++;
      console.log(`  ✓ Cleared: ${cookieName}`);
    }
    
    console.log(`✅ Cleared ${cleared} Supabase cookies`);
    console.log('🔄 Reloading page...');
    
    // Reload the page after clearing cookies
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
  
  // Expose functions globally
  window.clearAllCookies = clearAllCookies;
  window.clearSupabaseCookies = clearSupabaseCookies;
  
  console.log('🍪 Cookie clearing utilities loaded!');
  console.log('📋 Available functions:');
  console.log('  • clearAllCookies() - Clear all cookies and reload');
  console.log('  • clearSupabaseCookies() - Clear only Supabase auth cookies and reload');
  console.log('');
  console.log('💡 Quick fix for auth issues:');  
  console.log('  Copy/paste: clearAllCookies()');
  
  // Auto-run if this script is loaded directly (not just defined)
  if (window.location.search.includes('clear-cookies')) {
    console.log('🚀 Auto-clearing cookies due to URL parameter...');
    clearAllCookies();
  }
})();

// One-liner for immediate cookie clearing:
// document.cookie.split(";").forEach(function(c) { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); }); window.location.reload();
