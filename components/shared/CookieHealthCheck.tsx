'use client';

import * as React from 'react';
import { initCookieHealthCheck, exposeCookieUtils } from '@/lib/utils/cookie-utils';

export function CookieHealthCheck() {
  React.useEffect(() => {
    // Initialize cookie health checks
    initCookieHealthCheck();
    
    // Expose utilities to window for debugging
    exposeCookieUtils();
    
    // Log that cookie utilities are available
    console.log('Auth cookie health check initialized. Use window.fixAuthCookies() if you encounter auth issues.');
  }, []);

  return null;
}