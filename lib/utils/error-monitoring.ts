'use client';

import { captureError } from './error-utils';

/**
 * Sets up comprehensive client-side error monitoring
 * Captures console errors, unhandled exceptions, promise rejections, and network errors
 */
export function setupErrorMonitoring() {
  if (typeof window === 'undefined') return;
  
  // Store errors for later analysis
  if (!window.hasOwnProperty('errors')) {
    window.errors = [];
  }
  
  // Override console.error
  const originalConsoleError = console.error;
  console.error = function(...args) {
    try {
      // Store error in window.errors
      window.errors.push({
        type: 'console.error',
        args: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ),
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
      
      // Attempt to capture as a formal error
      if (args[0] instanceof Error) {
        captureError(args[0], { 
          source: 'console.error',
          context: { args: args.slice(1) }
        });
      } else if (typeof args[0] === 'string') {
        captureError(new Error(args[0]), { 
          source: 'console.error',
          context: { args: args.slice(1) }
        });
      }
    } catch (e) {
      // Don't let our error monitoring crash the app
      originalConsoleError.call(console, 'Error in error monitoring:', e);
    }
    
    // Call original
    originalConsoleError.apply(console, args);
  };
  
  // Global error handler
  window.addEventListener('error', function(event) {
    try {
      // Store in window.errors
      window.errors.push({
        type: 'uncaught',
        message: event.message,
        source: event.filename,
        lineNo: event.lineno,
        colNo: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
      
      // Capture using our error utility
      if (event.error) {
        captureError(event.error, {
          source: 'window.onerror',
          context: {
            source: event.filename,
            lineNo: event.lineno,
            colNo: event.colno
          }
        });
      } else {
        captureError(new Error(event.message), {
          source: 'window.onerror',
          context: {
            source: event.filename,
            lineNo: event.lineno,
            colNo: event.colno
          }
        });
      }
    } catch (e) {
      console.error('Error in error handler:', e);
    }
  });
  
  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', function(event) {
    try {
      // Store in window.errors
      window.errors.push({
        type: 'unhandledrejection',
        reason: event.reason?.toString(),
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
      
      // Capture using our error utility
      if (event.reason instanceof Error) {
        captureError(event.reason, {
          source: 'unhandledrejection'
        });
      } else {
        captureError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
          source: 'unhandledrejection',
          context: { originalReason: event.reason }
        });
      }
    } catch (e) {
      console.error('Error in promise rejection handler:', e);
    }
  });
  
  // Network error monitoring
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    try {
      const response = await originalFetch.apply(window, args);
      
      // Track API errors
      if (!response.ok && (
        typeof args[0] === 'string' && args[0].includes('/api/')
      )) {
        const url = typeof args[0] === 'string' ? args[0] : 
                   (args[0] && typeof args[0] === 'object' && 'url' in args[0]) ? 
                   (args[0] as Request).url : 'unknown';
        
        // Store in window.errors
        window.errors.push({
          type: 'api',
          url: response.url,
          status: response.status,
          statusText: response.statusText,
          timestamp: new Date().toISOString()
        });
        
        // Clone the response so we can read the body
        const clonedResponse = response.clone();
        try {
          const errorData = await clonedResponse.json();
          
          captureError(new Error(`API Error: ${response.status} ${response.statusText}`), {
            source: 'fetch',
            context: {
              url,
              status: response.status,
              statusText: response.statusText,
              response: errorData
            }
          });
        } catch (jsonErr) {
          captureError(new Error(`API Error: ${response.status} ${response.statusText}`), {
            source: 'fetch',
            context: {
              url,
              status: response.status,
              statusText: response.statusText
            }
          });
        }
      }
      
      return response;
    } catch (err: unknown) {
      // Store network error
      const requestUrl = typeof args[0] === 'string' ? args[0] : 
                        (args[0] && typeof args[0] === 'object' && 'url' in args[0]) ? 
                        (args[0] as Request).url : 'unknown';
      
      window.errors.push({
        type: 'fetch',
        url: requestUrl,
        error: err instanceof Error ? err.toString() : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      // Capture using our error utility
      captureError(
        err instanceof Error ? err : new Error(`Fetch Error: ${String(err)}`), 
        {
          source: 'fetch',
          context: {
            url: requestUrl,
            options: args[1]
          }
        }
      );
      
      throw err;
    }
  };
  
  console.log('Error monitoring initialized');
}

// Add TypeScript declarations
declare global {
  interface Window {
    errors: Array<{
      type: string;
      [key: string]: any;
    }>;
  }
}
