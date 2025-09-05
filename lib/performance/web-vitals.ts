'use client';

import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

interface PerformanceEntry {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

// Define thresholds based on Google's recommendations
const PERFORMANCE_THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FID: { good: 100, needsImprovement: 300 },
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 }
} as const;

type MetricName = keyof typeof PERFORMANCE_THRESHOLDS;

function getRating(name: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = PERFORMANCE_THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

function sendToAnalytics(metric: PerformanceEntry): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group(`📊 Web Vital: ${metric.name}`);
    console.log(`Value: ${metric.value}ms`);
    console.log(`Rating: ${metric.rating}`);
    console.log(`ID: ${metric.id}`);
    console.groupEnd();
  }

  // Send to analytics service (implement as needed)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      custom_map: { metric_rating: metric.rating }
    });
  }

  // Send to custom analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
      keepalive: true
    }).catch(console.error);
  }
}

export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;

  // Only run in browser environment
  try {
    onCLS((metric) => {
      const entry: PerformanceEntry = {
        name: 'CLS',
        value: metric.value,
        rating: getRating('CLS', metric.value),
        delta: metric.delta,
        id: metric.id
      };
      sendToAnalytics(entry);
    });

    onFID((metric) => {
      const entry: PerformanceEntry = {
        name: 'FID',
        value: metric.value,
        rating: getRating('FID', metric.value),
        delta: metric.delta,
        id: metric.id
      };
      sendToAnalytics(entry);
    });

    onFCP((metric) => {
      const entry: PerformanceEntry = {
        name: 'FCP',
        value: metric.value,
        rating: getRating('FCP', metric.value),
        delta: metric.delta,
        id: metric.id
      };
      sendToAnalytics(entry);
    });

    onLCP((metric) => {
      const entry: PerformanceEntry = {
        name: 'LCP',
        value: metric.value,
        rating: getRating('LCP', metric.value),
        delta: metric.delta,
        id: metric.id
      };
      sendToAnalytics(entry);
    });

    onTTFB((metric) => {
      const entry: PerformanceEntry = {
        name: 'TTFB',
        value: metric.value,
        rating: getRating('TTFB', metric.value),
        delta: metric.delta,
        id: metric.id
      };
      sendToAnalytics(entry);
    });
  } catch (error) {
    console.error('Failed to initialize performance monitoring:', error);
  }
}

// Hook for React components
export function usePerformanceMonitoring(): void {
  if (typeof window !== 'undefined') {
    // Initialize on mount
    initPerformanceMonitoring();
  }
}

// Performance observer for additional metrics
export function observeNavigationTiming(): void {
  if (typeof window === 'undefined') return;

  try {
    // Observe navigation timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            
            // Custom metrics
            const metrics = {
              dns_lookup: navEntry.domainLookupEnd - navEntry.domainLookupStart,
              tcp_connection: navEntry.connectEnd - navEntry.connectStart,
              request_time: navEntry.responseStart - navEntry.requestStart,
              response_time: navEntry.responseEnd - navEntry.responseStart,
              dom_parsing: navEntry.domInteractive - navEntry.responseEnd,
              resource_loading: navEntry.loadEventStart - navEntry.domContentLoadedEventEnd
            };

            if (process.env.NODE_ENV === 'development') {
              console.group('📊 Navigation Timing');
              Object.entries(metrics).forEach(([key, value]) => {
                console.log(`${key}: ${value}ms`);
              });
              console.groupEnd();
            }

            // Send to analytics
            if (process.env.NODE_ENV === 'production') {
              fetch('/api/analytics/navigation-timing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metrics),
                keepalive: true
              }).catch(console.error);
            }
          }
        });
      });

      observer.observe({ type: 'navigation', buffered: true });
    }
  } catch (error) {
    console.error('Failed to observe navigation timing:', error);
  }
}

// Component performance measurement
export function measureComponentPerformance<T extends (...args: unknown[]) => unknown>(
  fn: T,
  componentName: string
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    const duration = end - start;

    if (process.env.NODE_ENV === 'development' && duration > 16.67) { // 60fps threshold
      console.warn(`🐌 Slow component render: ${componentName} took ${duration.toFixed(2)}ms`);
    }

    return result;
  }) as T;
}

// Resource loading performance
export function observeResourceLoading(): void {
  if (typeof window === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Track slow resources (>1s)
          if (resourceEntry.duration > 1000) {
            console.warn('🐌 Slow resource:', {
              name: resourceEntry.name,
              duration: `${resourceEntry.duration.toFixed(2)}ms`,
              size: resourceEntry.transferSize || 'unknown'
            });

            // Send to analytics for production
            if (process.env.NODE_ENV === 'production') {
              fetch('/api/analytics/slow-resources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  url: resourceEntry.name,
                  duration: resourceEntry.duration,
                  size: resourceEntry.transferSize
                }),
                keepalive: true
              }).catch(console.error);
            }
          }
        }
      });
    });

    observer.observe({ type: 'resource', buffered: true });
  } catch (error) {
    console.error('Failed to observe resource loading:', error);
  }
}

// Global error tracking for performance impact
export function trackPerformanceErrors(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    console.error('💥 JavaScript Error:', {
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno
    });

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'javascript',
          message: event.message,
          source: event.filename,
          line: event.lineno,
          column: event.colno,
          stack: event.error?.stack
        }),
        keepalive: true
      }).catch(console.error);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('💥 Unhandled Promise Rejection:', event.reason);

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'promise_rejection',
          reason: String(event.reason),
          stack: event.reason?.stack
        }),
        keepalive: true
      }).catch(console.error);
    }
  });
}

// Initialize all performance monitoring
export function initAllPerformanceMonitoring(): void {
  initPerformanceMonitoring();
  observeNavigationTiming();
  observeResourceLoading();
  trackPerformanceErrors();
}

// TypeScript declarations for gtag
declare global {
  interface Window {
    gtag?: (
      command: 'event',
      action: string,
      parameters: Record<string, unknown>
    ) => void;
  }
}

const performanceMonitoring = {
  init: initAllPerformanceMonitoring,
  webVitals: initPerformanceMonitoring,
  navigation: observeNavigationTiming,
  resources: observeResourceLoading,
  errors: trackPerformanceErrors,
  measureComponent: measureComponentPerformance
};

export default performanceMonitoring;