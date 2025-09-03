// General monitoring utilities for tracking API fallbacks, database errors, and performance issues

/**
 * Track when fallback methods are used instead of primary APIs
 * Useful for monitoring API reliability and identifying issues
 */
export const trackFallbackUsage = (
  component: string,
  operation: string,
  reason?: string,
) => {
  const fallbackEvent = {
    component,
    operation,
    reason,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : "server",
    userAgent: typeof navigator !== "undefined"
      ? navigator.userAgent
      : "server",
  };

  // Always log to console in development
  if (process.env.NODE_ENV === "development") {
    console.warn(
      `[${component}] Fallback used for ${operation}`,
      reason ? `- ${reason}` : "",
    );
  }

  // Production analytics integration
  if (process.env.NODE_ENV === "production") {
    // Example: Send to your analytics service
    // analytics.track('api_fallback_used', fallbackEvent);

    // Example: Send to monitoring service like Sentry
    // Sentry.captureMessage(`Fallback used: ${component} - ${operation}`, 'warning', {
    //   extra: fallbackEvent
    // });
  }

  // Development: Store in localStorage for debugging
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    const fallbackLog = JSON.parse(
      localStorage.getItem("app_fallback_log") || "[]",
    );
    fallbackLog.push(fallbackEvent);

    // Keep only last 100 entries to prevent storage bloat
    if (fallbackLog.length > 100) {
      fallbackLog.splice(0, fallbackLog.length - 100);
    }

    localStorage.setItem("app_fallback_log", JSON.stringify(fallbackLog));
  }
};

/**
 * Track database errors for monitoring and debugging
 */
export const trackDatabaseError = (
  operation: string,
  error: Error | { message?: string; code?: string; details?: unknown },
  context?: { table?: string; userId?: string; [key: string]: unknown },
) => {
  const errorEvent = {
    operation,
    error: {
      message: error instanceof Error
        ? error.message
        : error.message || "Unknown error",
      code: "code" in error ? error.code : undefined,
      stack: error instanceof Error ? error.stack : undefined,
      details: "details" in error ? error.details : undefined,
    },
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : "server",
  };

  // Always log errors
  console.error(`[Database Error] ${operation}:`, error, context);

  // Production error tracking
  if (process.env.NODE_ENV === "production") {
    // Example: Send to error tracking service
    // Sentry.captureException(error instanceof Error ? error : new Error(error.message || 'Database error'), {
    //   tags: { operation, database: 'supabase' },
    //   extra: errorEvent
    // });

    // Example: Send to analytics
    // analytics.track('database_error', errorEvent);
  }

  // Development: Store in localStorage
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    const errorLog = JSON.parse(localStorage.getItem("app_error_log") || "[]");
    errorLog.push(errorEvent);

    // Keep only last 100 entries
    if (errorLog.length > 100) {
      errorLog.splice(0, errorLog.length - 100);
    }

    localStorage.setItem("app_error_log", JSON.stringify(errorLog));
  }
};

/**
 * Track API performance metrics
 */
export const trackAPIPerformance = (
  endpoint: string,
  method: string,
  responseTime: number,
  status: number,
  size?: number,
) => {
  const performanceEvent = {
    endpoint,
    method,
    responseTime,
    status,
    size,
    timestamp: new Date().toISOString(),
    slow: responseTime > 2000, // Flag slow requests (>2s)
    failed: status >= 400,
  };

  // Log slow or failed requests
  if (performanceEvent.slow || performanceEvent.failed) {
    console.warn(
      `[API Performance] ${method} ${endpoint}: ${responseTime}ms (${status})`,
      performanceEvent,
    );
  }

  // Production monitoring
  if (process.env.NODE_ENV === "production") {
    // Example: Send to monitoring service
    // analytics.track('api_performance', performanceEvent);

    // Alert on critical issues
    if (responseTime > 5000 || status >= 500) {
      // Sentry.captureMessage(`Critical API performance issue: ${endpoint}`, 'error', {
      //   extra: performanceEvent
      // });
    }
  }

  // Development tracking
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    const perfLog = JSON.parse(
      localStorage.getItem("app_performance_log") || "[]",
    );
    perfLog.push(performanceEvent);

    if (perfLog.length > 100) {
      perfLog.splice(0, perfLog.length - 100);
    }

    localStorage.setItem("app_performance_log", JSON.stringify(perfLog));
  }
};

/**
 * Track user actions for analytics
 */
export const trackUserAction = (
  action: string,
  category: string,
  properties?: { [key: string]: unknown },
) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[User Action] ${category} - ${action}`, properties);
  }

  // Production analytics
  if (process.env.NODE_ENV === "production") {
    // Example: Send to analytics service
    // analytics.track(action, {
    //   category,
    //   ...properties
    // });

    // Example: Google Analytics
    // gtag('event', action, {
    //   event_category: category,
    //   ...properties
    // });
  }
};

/**
 * Get monitoring statistics for development debugging
 */
export const getMonitoringStats = () => {
  if (typeof window === "undefined") return null;

  const fallbackLog = JSON.parse(
    localStorage.getItem("app_fallback_log") || "[]",
  );
  const errorLog = JSON.parse(localStorage.getItem("app_error_log") || "[]");
  const perfLog = JSON.parse(
    localStorage.getItem("app_performance_log") || "[]",
  );

  // Calculate performance metrics
  interface PerformanceLogEntry {
    endpoint: string;
    method: string;
    responseTime: number;
    status: number;
    size?: number;
    timestamp: string;
    slow: boolean;
    failed: boolean;
  }

  const avgResponseTime = perfLog.length > 0
    ? perfLog.reduce(
      (sum: number, p: PerformanceLogEntry) => sum + p.responseTime,
      0,
    ) / perfLog.length
    : 0;

  const slowRequests = perfLog.filter((p: PerformanceLogEntry) => p.slow);
  const failedRequests = perfLog.filter((p: PerformanceLogEntry) => p.failed);

  return {
    fallbacks: {
      total: fallbackLog.length,
      recent: fallbackLog.slice(-10),
      byComponent: fallbackLog.reduce(
        (acc: Record<string, number>, f: { component: string }) => {
          acc[f.component] = (acc[f.component] || 0) + 1;
          return acc;
        },
        {},
      ),
    },
    errors: {
      total: errorLog.length,
      recent: errorLog.slice(-10),
      byOperation: errorLog.reduce(
        (acc: Record<string, number>, e: { operation: string }) => {
          acc[e.operation] = (acc[e.operation] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    },
    performance: {
      totalRequests: perfLog.length,
      avgResponseTime: Math.round(avgResponseTime),
      slowRequests: slowRequests.length,
      failedRequests: failedRequests.length,
      recent: perfLog.slice(-10),
    },
    summary: {
      healthScore: calculateHealthScore(fallbackLog, errorLog, perfLog),
    },
  };
};

/**
 * Calculate a health score based on monitoring data
 */
interface FallbackLogEntry {
  component: string;
  operation: string;
  reason?: string;
  timestamp: string;
  url: string;
  userAgent: string;
}

interface ErrorLogEntry {
  operation: string;
  error: {
    message: string;
    code?: string;
    stack?: string;
    details?: unknown;
  };
  context?: { table?: string; userId?: string; [key: string]: unknown };
  timestamp: string;
  url: string;
}

interface PerformanceLogEntry {
  endpoint: string;
  method: string;
  responseTime: number;
  status: number;
  size?: number;
  timestamp: string;
  slow: boolean;
  failed: boolean;
}

const calculateHealthScore = (
  fallbacks: FallbackLogEntry[],
  errors: ErrorLogEntry[],
  performance: PerformanceLogEntry[],
): number => {
  let score = 100;

  // Deduct for recent errors (last hour)
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recentErrors = errors.filter((e) => e.timestamp > hourAgo);
  score -= Math.min(recentErrors.length * 5, 30); // Max 30 point deduction

  // Deduct for fallback usage
  const recentFallbacks = fallbacks.filter((f) => f.timestamp > hourAgo);
  score -= Math.min(recentFallbacks.length * 2, 20); // Max 20 point deduction

  // Deduct for slow/failed requests
  const recentPerf = performance.filter((p) => p.timestamp > hourAgo);
  const slowRate = recentPerf.filter((p) => p.slow).length /
    Math.max(recentPerf.length, 1);
  const failRate = recentPerf.filter((p) => p.failed).length /
    Math.max(recentPerf.length, 1);

  score -= Math.round(slowRate * 20); // Up to 20 points for slow requests
  score -= Math.round(failRate * 30); // Up to 30 points for failed requests

  return Math.max(0, Math.min(100, score));
};

/**
 * Clear all monitoring data (for development)
 */
export const clearMonitoringData = () => {
  if (typeof window === "undefined") return;

  const keys = ["app_fallback_log", "app_error_log", "app_performance_log"];
  keys.forEach((key) => localStorage.removeItem(key));

  console.log("Monitoring data cleared");
};

/**
 * Export monitoring data for debugging
 */
export const exportMonitoringData = () => {
  if (typeof window === "undefined") return null;

  const data = {
    fallbacks: JSON.parse(localStorage.getItem("app_fallback_log") || "[]"),
    errors: JSON.parse(localStorage.getItem("app_error_log") || "[]"),
    performance: JSON.parse(
      localStorage.getItem("app_performance_log") || "[]",
    ),
    exported: new Date().toISOString(),
  };

  // Create downloadable JSON file
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `monitoring-data-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return data;
};
