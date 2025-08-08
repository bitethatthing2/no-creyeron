// Monitoring utilities for tracking wolfpack fallback usage and other issues

export const trackFallbackUsage = (component: string, isUsingFallback: boolean) => {
  if (isUsingFallback) {
    // In production, this could send to your analytics service
    console.warn(`[${component}] Using wolfpack fallback query`);
    
    // Example: Send to analytics (uncomment when analytics is set up)
    // analytics.track('wolfpack_fallback_used', {
    //   component,
    //   timestamp: new Date().toISOString(),
    //   user_agent: navigator.userAgent,
    //   url: window.location.href
    // });

    // For development, also track in localStorage for debugging
    if (process.env.NODE_ENV === 'development') {
      const fallbackLog = JSON.parse(localStorage.getItem('wolfpack_fallback_log') || '[]');
      fallbackLog.push({
        component,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
      
      // Keep only last 50 entries
      if (fallbackLog.length > 50) {
        fallbackLog.splice(0, fallbackLog.length - 50);
      }
      
      localStorage.setItem('wolfpack_fallback_log', JSON.stringify(fallbackLog));
    }
  }
};

export const trackDatabaseError = (operation: string, error: Error | { message?: string; code?: string }) => {
  console.error(`[Database Error] ${operation}:`, error);
  
  // In production, send to error tracking service
  // errorTracker.captureException(error, {
  //   tags: { operation, component: 'wolfpack' },
  //   extra: { timestamp: new Date().toISOString() }
  // });
  
  // For development, log to localStorage
  if (process.env.NODE_ENV === 'development') {
    const errorLog = JSON.parse(localStorage.getItem('wolfpack_error_log') || '[]');
    errorLog.push({
      operation,
      error: error.message || error.toString(),
      code: (error as { code?: string }).code,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
    
    // Keep only last 50 entries
    if (errorLog.length > 50) {
      errorLog.splice(0, errorLog.length - 50);
    }
    
    localStorage.setItem('wolfpack_error_log', JSON.stringify(errorLog));
  }
};

// Utility to get fallback usage statistics (for development)
export const getFallbackStats = () => {
  if (typeof window === 'undefined') return null;
  
  const fallbackLog = JSON.parse(localStorage.getItem('wolfpack_fallback_log') || '[]');
  const errorLog = JSON.parse(localStorage.getItem('wolfpack_error_log') || '[]');
  
  return {
    fallbackUsage: fallbackLog,
    errors: errorLog,
    summary: {
      totalFallbacks: fallbackLog.length,
      totalErrors: errorLog.length,
      componentsUsingFallback: [...new Set(fallbackLog.map((f: { component: string }) => f.component))],
      recentFallbacks: fallbackLog.slice(-10)
    }
  };
};

// Clear monitoring data (for development)
export const clearMonitoringData = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('wolfpack_fallback_log');
  localStorage.removeItem('wolfpack_error_log');
  console.log('Wolfpack monitoring data cleared');
};
