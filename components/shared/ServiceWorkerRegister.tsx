'use client';

import { useEffect, useState, useRef } from 'react';

// Performance metric types
interface PerformanceMetric {
  name: string;
  value: number;
  id: string;
  navigationType?: string;
  entries?: PerformanceEntry[];
  delta?: number;
}

// Performance Event Timing interface (for FID)
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  startTime: number;
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      eventName: string,
      eventParameters?: Record<string, string | number | boolean>
    ) => void;
  }
}

// Global flag to prevent multiple registrations across page reloads
let hasRegisteredServiceWorker = false;

// Performance monitoring
const reportWebVitals = (metric: PerformanceMetric) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Performance]', metric);
  }
  
  // Send to analytics in production
  // Example: send to Google Analytics, Vercel Analytics, etc.
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta ?? 0,
    });
  }
};

export default function ServiceWorkerRegister() {
  const [, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const registrationAttempted = useRef(false);

  useEffect(() => {
    // Initialize performance monitoring
    if ('PerformanceObserver' in window) {
      try {
        // Observe Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          reportWebVitals({
            name: 'LCP',
            value: lastEntry.startTime,
            id: 'v3-' + Date.now(),
            navigationType: 'navigate'
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Observe First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const perfEntry = entry as PerformanceEventTiming;
            reportWebVitals({
              name: 'FID',
              value: perfEntry.processingStart - perfEntry.startTime,
              id: 'v3-' + Date.now(),
              navigationType: 'navigate'
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Observe Cumulative Layout Shift
        let clsValue = 0;
        const clsEntries: PerformanceEntry[] = [];

        // Define LayoutShift type
        interface LayoutShift extends PerformanceEntry {
          value: number;
          hadRecentInput: boolean;
        }

        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const layoutShiftEntry = entry as LayoutShift;
            if (!layoutShiftEntry.hadRecentInput) {
              clsValue += layoutShiftEntry.value;
              clsEntries.push(entry);
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Report CLS when page is about to unload
        window.addEventListener('beforeunload', () => {
          reportWebVitals({
            name: 'CLS',
            value: clsValue,
            id: 'v3-' + Date.now(),
            entries: clsEntries,
            navigationType: 'navigate'
          });
        });

        // Observe Time to First Byte
        const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigationEntry) {
          reportWebVitals({
            name: 'TTFB',
            value: navigationEntry.responseStart - navigationEntry.requestStart,
            id: 'v3-' + Date.now(),
            navigationType: navigationEntry.type
          });
        }

      } catch (error) {
        console.warn('[Performance] Error setting up performance monitoring:', error);
      }
    }
    
    // Skip if already registered or attempted
    if (hasRegisteredServiceWorker || registrationAttempted.current) {
      return;
    }
    
    // Mark as attempted immediately to prevent race conditions
    registrationAttempted.current = true;
    
    // Feature detection for service workers
    if (!('serviceWorker' in navigator)) {
      console.warn('[ServiceWorker] Service workers are not supported in this browser.');
      return;
    }

    const registerServiceWorker = async () => {
      try {
        // Check if service worker is already controlling the page
        if (navigator.serviceWorker.controller) {
          console.log('[ServiceWorker] Service Worker is already controlling this page');
          
          // Get the existing registration
          const existingReg = await navigator.serviceWorker.ready;
          setSwRegistration(existingReg);
          hasRegisteredServiceWorker = true;
          
          // Preload critical menu images
          const controller = navigator.serviceWorker.controller as ServiceWorker;
          if (controller) {
            controller.postMessage({
              type: 'PRELOAD_MENU_IMAGES',
            });
          }
          
          return;
        }
        
        // Wait for DOM to be fully loaded
        if (document.readyState !== 'complete') {
          await new Promise<void>((resolve) => {
            window.addEventListener('load', () => resolve(), { once: true });
          });
        }

        // Register the service worker with a more reliable approach
        console.log('[ServiceWorker] Registering service worker...');
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none' // Ensure we always check for updates
        });
        
        console.log('[ServiceWorker] Service Worker registered with scope:', registration.scope);
        setSwRegistration(registration);
        hasRegisteredServiceWorker = true;
        
        // Ensure the service worker is activated
        if (registration.installing) {
          console.log('[ServiceWorker] Service Worker installing');
          
          const installingWorker = registration.installing;
          installingWorker.addEventListener('statechange', () => {
            console.log('[ServiceWorker] Service Worker state changed to:', installingWorker.state);
            if (installingWorker.state === 'activated') {
              console.log('[ServiceWorker] Service Worker activated');
              setSwRegistration(registration);
              
              // Preload critical menu images after activation
              const controller = navigator.serviceWorker.controller;
              if (controller) {
                (controller as ServiceWorker).postMessage({
                  type: 'PRELOAD_MENU_IMAGES'
                });
              }
            }
          });
        } else if (registration.waiting) {
          console.log('[ServiceWorker] Service Worker waiting');
          
          // Force waiting service worker to activate
          const waitingWorker = registration.waiting;
          if (waitingWorker) {
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        } else if (registration.active) {
          console.log('[ServiceWorker] Service Worker is active');
          
          // Preload critical menu images
          const controller = navigator.serviceWorker.controller;
          if (controller) {
            (controller as ServiceWorker).postMessage({
              type: 'PRELOAD_MENU_IMAGES'
            });
          }
        }
        
        // Check for updates periodically
        setInterval(() => {
          registration.update().catch(err => {
            console.error('[ServiceWorker] Error updating service worker:', err);
          });
        }, 60 * 60 * 1000); // Check every hour
      } catch (error) {
        console.error('[ServiceWorker] Service Worker registration failed:', error);
      }
    };

    // Register service worker as soon as possible
    registerServiceWorker();
    
    // Listen for service worker updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[ServiceWorker] Service Worker updated and controlling the page');
    });
    
    // Listen for service worker messages
    navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
      if (event.data && event.data.type === 'CACHE_UPDATED') {
        console.log('[ServiceWorker] New content is available; please refresh.');
        // You could show a toast notification here if desired
      }
      
      // Handle notification actions
      if (event.data && event.data.type === 'NOTIFICATION_ACTION') {
        console.log('[ServiceWorker] Notification action received:', event.data);
        // Handle notification actions here
      }
      
      // Handle offline/online status messages
      if (event.data && event.data.type === 'OFFLINE_STATUS') {
        console.log(`[ServiceWorker] App is ${event.data.isOffline ? 'offline' : 'online'}`);
        // Could update UI to show offline status
      }
      
      // Handle performance data from service worker
      if (event.data && event.data.type === 'PERFORMANCE_DATA') {
        reportWebVitals(event.data.metric);
      }
    });
    
    // Track online/offline status
    window.addEventListener('online', () => {
      console.log('[ServiceWorker] App is online');
      // Notify service worker about online status
      const controller = navigator.serviceWorker.controller;
      if (controller) {
        controller.postMessage({
          type: 'ONLINE_STATUS',
          isOnline: true
        });
      }
    });
    
    window.addEventListener('offline', () => {
      console.log('[ServiceWorker] App is offline');
      // Notify service worker about offline status
      const controller = navigator.serviceWorker.controller;
      if (controller) {
        controller.postMessage({
          type: 'ONLINE_STATUS',
          isOnline: false
        });
      }
    });
  }, []);

  return null;
}