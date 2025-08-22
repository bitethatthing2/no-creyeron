// auth-cookie-cleanup.ts - Utilities for cleaning up corrupted auth cookies

/**
 * Clear all Supabase auth-related cookies
 * This is the nuclear option - clears everything
 */
export const clearAllSupabaseAuthCookies = () => {
  if (typeof window === 'undefined') return;

  // Get all cookies
  const cookies = document.cookie.split(';');
  
  // Clear any cookie that contains 'supabase' or 'sb-' in the name
  cookies.forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    if (name.includes('supabase') || name.includes('sb-')) {
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
};

/**
 * Safe base64 decode with error handling
 */
export const safeBase64Decode = (str: string): string | null => {
  try {
    // Handle URL-safe base64
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with = if necessary
    const padded = base64 + '=='.substring(0, (4 - base64.length % 4) % 4);
    return atob(padded);
  } catch (error) {
    console.error('Failed to decode base64:', error);
    return null;
  }
};

/**
 * Check if a cookie value is corrupted
 */
export const isCookieCorrupted = (value: string): boolean => {
  if (!value) return false;
  
  // Check for common corruption patterns
  if (value.includes('undefined') || value.includes('null')) return true;
  
  // Try to decode if it looks like base64
  if (value.match(/^[A-Za-z0-9+/\-_]+=*$/)) {
    const decoded = safeBase64Decode(value);
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
};

/**
 * Get a specific cookie value
 */
export const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  
  return null;
};

/**
 * Clear a specific cookie
 */
export const clearCookie = (name: string) => {
  if (typeof window === 'undefined') return;
  
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
};

/**
 * Check and clear corrupted Supabase cookies
 */
export const checkAndClearCorruptedCookies = () => {
  if (typeof window === 'undefined') return;

  const cookies = document.cookie.split(';');
  let corruptedFound = false;
  
  cookies.forEach(cookie => {
    const [name, value] = cookie.split('=').map(s => s.trim());
    
    if (name && (name.includes('supabase') || name.includes('sb-'))) {
      if (isCookieCorrupted(value)) {
        console.warn(`Corrupted cookie detected: ${name}`);
        clearCookie(name);
        corruptedFound = true;
      }
    }
  });

  if (corruptedFound) {
    console.log('Cleared corrupted cookies. Refreshing auth state...');
  }

  return corruptedFound;
};

/**
 * Complete auth cleanup and reset
 */
export const cleanupAndResetAuth = async (supabase: any) => {
  try {
    // 1. Sign out from Supabase (if possible)
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log('Could not sign out:', error);
    }

    // 2. Clear all auth cookies
    clearAllSupabaseAuthCookies();

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
};

/**
 * Initialize cookie monitoring and cleanup
 * Call this early in your app initialization
 */
export const initCookieCleanup = () => {
  if (typeof window === 'undefined') return;

  // Check for corrupted cookies on load
  const hadCorrupted = checkAndClearCorruptedCookies();
  
  if (hadCorrupted) {
    // If we found corrupted cookies, do a full cleanup
    clearAllSupabaseAuthCookies();
  }

  // Optional: Set up periodic checking (every 5 minutes)
  setInterval(() => {
    checkAndClearCorruptedCookies();
  }, 5 * 60 * 1000);
};

// Export a quick fix function that can be called from console
if (typeof window !== 'undefined') {
  (window as any).fixAuthCookies = () => {
    console.log('Clearing all Supabase auth cookies...');
    clearAllSupabaseAuthCookies();
    console.log('Done! Please refresh the page.');
  };
}