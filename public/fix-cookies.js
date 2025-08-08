// Emergency cookie fix script
// Run this in browser console to immediately fix corrupted cookies

(function() {
  console.log('🚨 Emergency Cookie Fix Starting...');
  
  // Clear all cookies
  document.cookie.split(";").forEach(cookie => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    // Clear from multiple paths
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
  });
  
  // Clear localStorage
  localStorage.clear();
  
  // Clear sessionStorage  
  sessionStorage.clear();
  
  console.log('✅ Cookie fix complete!');
  console.log('🔄 Reloading page in 2 seconds...');
  
  // Show notification
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:16px;border-radius:8px;z-index:99999;font-family:system-ui;';
  div.textContent = '✅ Cookies fixed! Reloading...';
  document.body.appendChild(div);
  
  // Auto reload
  setTimeout(() => window.location.reload(), 2000);
})();