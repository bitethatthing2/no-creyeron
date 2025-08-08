'use client';

import { useEffect } from 'react';
import { initCookieHealthCheck, exposeCookieUtils } from '@/lib/utils/cookie-utils';

export function CookieHealthCheck() {
  useEffect(() => {
    // Initialize cookie health checks
    initCookieHealthCheck();
    
    // Expose utilities to window for debugging
    exposeCookieUtils();
    
    // Log that cookie utilities are available
    console.log('Auth cookie health check initialized. Use window.fixAuthCookies() if you encounter auth issues.');
  }, []);

  return null;
}