// Debug script to clear auth cache and force refresh
// Run this in the browser console

async function fixAuthCache() {
  console.log('🔧 Starting auth cache fix...');
  
  // 1. Clear all Supabase cookies
  const cookiesToClear = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    'supabase.auth.token',
    'sb-tvnpgbjypnezoasbhbwx-auth-token',
    'sb-tvnpgbjypnezoasbhbwx-auth-token-code-verifier'
  ];
  
  cookiesToClear.forEach(name => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
  });
  
  console.log('✅ Cookies cleared');
  
  // 2. Clear localStorage Supabase data
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('sb-'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  console.log('✅ LocalStorage cleared');
  
  // 3. Clear sessionStorage
  sessionStorage.clear();
  console.log('✅ SessionStorage cleared');
  
  // 4. Sign out from Supabase
  if (window.supabase) {
    await window.supabase.auth.signOut();
    console.log('✅ Signed out from Supabase');
  }
  
  console.log('🎉 Auth cache cleared! Please refresh the page and log in again.');
  
  // Auto refresh in 2 seconds
  setTimeout(() => {
    window.location.href = '/login';
  }, 2000);
}

// Run the fix
fixAuthCache();