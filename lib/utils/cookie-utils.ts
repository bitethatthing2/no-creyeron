// Cookie utility functions to handle Supabase auth cookie issues

/**
 * Decode base64 with proper error handling for corrupted cookies
 */
export function safeBase64Decode(str: string): string | null {
  try {
    // Handle URL-safe base64
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    
    return atob(padded);
  } catch (error) {
    console.warn('Failed to decode base64 string:', error);
    return null;
  }
}

/**
 * Check if a cookie value is corrupted
 */
export function isCookieCorrupted(cookieValue: string): boolean {
  if (!cookieValue) return false;
  
  // Check for common corruption patterns
  if (cookieValue.includes('undefined') || cookieValue.includes('null')) return true;
  
  try {
    // Check if it looks like a base64 encoded JWT
    if (cookieValue.includes('.')) {
      const parts = cookieValue.split('.');
      for (const part of parts) {
        if (part && safeBase64Decode(part) === null) {
          return true;
        }
      }
    } else if (cookieValue.startsWith('base64-')) {
      // Check if base64 encoded cookie is valid
      const base64Part = cookieValue.replace('base64-', '');
      return safeBase64Decode(base64Part) === null;
    } else if (cookieValue.match(/^[A-Za-z0-9+/\-_]+=*$/)) {
      // Try to decode if it looks like base64
      const decoded = safeBase64Decode(cookieValue);
      if (!decoded) return true;
      
      // Try to parse as JSON if it looks like JSON
      if (decoded.startsWith('{') || decoded.startsWith('[')) {
        try {
          JSON.parse(decoded);
        } catch {
          return true;
        }
      }
    }
    
    return false;
  } catch {
    return true;
  }
}

/**
 * Clear all cookies for the current domain
 */
export function clearAllCookies(): void {
  if (typeof document === 'undefined') return;
  
  try {
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      if (name) {
        // Clear cookie for current path
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        
        // Clear cookie for root path
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
        
        // Clear cookie with domain
        if (window.location.hostname !== 'localhost') {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
        }
      }
    }
    
    console.log('All cookies cleared');
  } catch (error) {
    console.error('Error clearing cookies:', error);
  }
}

/**
 * Clear all Supabase auth-related cookies and storage
 * This is the nuclear option - clears everything
 */
export function clearSupabaseCookies(): void {
  if (typeof document === 'undefined') return;
  
  // Get all cookies
  const cookies = document.cookie.split(';');
  
  // Clear any cookie that contains 'supabase' or 'sb-' in the name
  cookies.forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    if (name && (name.includes('supabase') || name.includes('sb-'))) {
      // Clear the cookie by setting it to expire in the past
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      // Also try with domain variations
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    }
  });

  // Also clear from localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });

  // Clear from sessionStorage
  Object.keys(sessionStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
  
  console.log('Supabase cookies and storage cleared');
}

/**
 * Check and clear corrupted Supabase cookies
 */
export function checkAndClearCorruptedCookies(): boolean {
  if (typeof document === 'undefined') return false;
  
  let foundCorrupted = false;
  const cookies = document.cookie.split(';');
  
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=').map(s => s.trim());
    
    // Check Supabase-related cookies
    if (name && value && (name.includes('sb-') || name.includes('supabase'))) {
      if (isCookieCorrupted(value)) {
        console.warn(`Corrupted cookie detected: ${name}`);
        foundCorrupted = true;
      }
    }
  }
  
  if (foundCorrupted) {
    console.log('Clearing corrupted Supabase cookies...');
    clearSupabaseCookies();
    return true;
  }
  
  return false;
}

/**
 * Auto-check and clear corrupted cookies on page load
 */
export function initCookieHealthCheck(): void {
  if (typeof window === 'undefined') return;
  
  // Check cookies when the page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => checkAndClearCorruptedCookies(), 100);
    });
  } else {
    setTimeout(() => checkAndClearCorruptedCookies(), 100);
  }
  
  // Also check when the page becomes visible (useful for SPA navigation)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      setTimeout(() => checkAndClearCorruptedCookies(), 100);
    }
  });
}

// Extend Window interface for cookie utilities
declare global {
  interface Window {
    clearAllCookies?: () => void;
    clearSupabaseCookies?: () => void;
    checkAndClearCorruptedCookies?: () => boolean;
    fixAuthCookies?: () => void;
  }
}

/**
 * Complete auth cleanup and reset
 */
export async function cleanupAndResetAuth(supabase: any): Promise<{ success: boolean; error?: any }> {
  try {
    // 1. Sign out from Supabase (if possible)
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log('Could not sign out:', error);
    }

    // 2. Clear all auth cookies
    clearSupabaseCookies();

    // 3. Clear the Supabase client's internal state
    if (supabase.auth.session) {
      supabase.auth.session = null;
    }

    // 4. Reload the page to ensure clean state
    if (typeof window !== 'undefined') {
      window.location.reload();
    }

    return { success: true };
  } catch (error) {
    console.error('Error during auth cleanup:', error);
    return { success: false, error };
  }
}

/**
 * Browser console utility to manually clear cookies
 */
export function exposeCookieUtils(): void {
  if (typeof window === 'undefined') return;
  
  // Expose utilities to window for manual debugging
  window.clearAllCookies = clearAllCookies;
  window.clearSupabaseCookies = clearSupabaseCookies;
  window.checkAndClearCorruptedCookies = checkAndClearCorruptedCookies;
  window.fixAuthCookies = () => {
    console.log('Clearing all Supabase auth cookies...');
    clearSupabaseCookies();
    console.log('Done! Please refresh the page.');
  };
  
  console.log('Cookie utilities exposed to window: clearAllCookies(), clearSupabaseCookies(), checkAndClearCorruptedCookies(), fixAuthCookies()');
}
