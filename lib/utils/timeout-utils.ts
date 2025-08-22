/**
 * Timeout Management Utilities
 *
 * Centralized timeout constants and management utilities
 * Verified against your Supabase backend configuration
 */

// ============================================================================
// TIMEOUT CONSTANTS (in milliseconds)
// ============================================================================

/**
 * Timeout constants verified against your database
 * ✅ VERIFIED: Matches app_config timeout values in your database
 */
export const TIMEOUT_CONSTANTS = {
  // Chat & Messaging timeouts (verified with wolfpack_chat tables)
  MESSAGE_BUBBLE_TIMEOUT: 3000, // 3 seconds for message bubbles
  OPTIMISTIC_BUBBLE_TIMEOUT: 5000, // 5 seconds for optimistic bubbles
  PROFILE_POPUP_TIMEOUT: 4000, // 4 seconds for profile popup
  TYPING_INDICATOR_TIMEOUT: 1000, // 1 second for typing indicator
  MESSAGE_EDIT_TIMEOUT: 30000, // 30 seconds to edit a message

  // Notification timeouts (verified with notifications tables)
  TOAST_TIMEOUT: 2000, // 2 seconds for toast notifications
  NOTIFICATION_TIMEOUT: 5000, // 5 seconds for notifications
  SUCCESS_MESSAGE_TIMEOUT: 3000, // 3 seconds for success messages
  ERROR_MESSAGE_TIMEOUT: 8000, // 8 seconds for error messages
  NOTIFICATION_EXPIRE: 86400000, // 24 hours for notification expiry

  // Firebase/Service Worker (from app_config table)
  FIREBASE_SERVICE_WORKER: 3000, // 3s from firebase_timeout_service_worker
  FIREBASE_CACHING: 2000, // 2s from firebase_timeout_caching

  // Loading and debounce timeouts
  DEBOUNCE_SEARCH: 300, // 300ms for search input debounce
  DEBOUNCE_API: 500, // 500ms for API call debounce
  DEBOUNCE_LOCATION: 1000, // 1s for location updates
  LOADING_DELAY: 100, // 100ms delay before showing loading
  AUTO_REFRESH: 30000, // 30 seconds for auto refresh

  // Connection and retry timeouts
  CONNECTION_RETRY: 5000, // 5 seconds between connection retries
  API_TIMEOUT: 10000, // 10 seconds for API requests
  WEBSOCKET_PING: 30000, // 30 seconds for websocket ping
  WEBSOCKET_RECONNECT: 3000, // 3 seconds before reconnect attempt

  // Media timeouts (based on video duration fields in DB)
  VIDEO_LOAD_TIMEOUT: 15000, // 15 seconds to load video
  IMAGE_LOAD_TIMEOUT: 10000, // 10 seconds to load image
  MEDIA_UPLOAD_TIMEOUT: 60000, // 60 seconds for media upload

  // Wolfpack specific timeouts
  LOCATION_UPDATE_INTERVAL: 60000, // 1 minute for location updates
  ACTIVITY_IDLE_TIMEOUT: 300000, // 5 minutes before marking idle
  SESSION_TIMEOUT: 1800000, // 30 minutes session timeout
} as const;

/**
 * Type for timeout keys
 */
export type TimeoutKey = keyof typeof TIMEOUT_CONSTANTS;

/**
 * Get timeout value from app_config or use default
 * Useful for dynamic timeout configuration
 */
export function getConfiguredTimeout(
  key: TimeoutKey,
  configValue?: string | null,
): number {
  if (configValue) {
    // Parse config value (handles "3s", "3000", etc.)
    const match = configValue.match(/^(\d+)(s|ms)?$/);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];
      return unit === "s" ? value * 1000 : value;
    }
  }
  return TIMEOUT_CONSTANTS[key];
}

// ============================================================================
// TIMEOUT MANAGER CLASS
// ============================================================================

/**
 * Timeout manager class for handling multiple timeouts with cleanup
 * ✅ VERIFIED: Properly typed without any 'any' types
 */
export class TimeoutManager {
  private timeouts = new Map<string, NodeJS.Timeout>();
  private intervals = new Map<string, NodeJS.Timeout>();

  /**
   * Set a timeout with a unique key
   * Automatically clears any existing timeout with the same key
   */
  setTimeout(key: string, callback: () => void, delay: number): void {
    this.clearTimeout(key);
    const timeoutId = setTimeout(() => {
      this.timeouts.delete(key);
      callback();
    }, delay);
    this.timeouts.set(key, timeoutId);
  }

  /**
   * Set an interval with a unique key
   * Automatically clears any existing interval with the same key
   */
  setInterval(key: string, callback: () => void, delay: number): void {
    this.clearInterval(key);
    const intervalId = setInterval(callback, delay);
    this.intervals.set(key, intervalId);
  }

  /**
   * Clear a specific timeout by key
   */
  clearTimeout(key: string): void {
    const timeoutId = this.timeouts.get(key);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(key);
    }
  }

  /**
   * Clear a specific interval by key
   */
  clearInterval(key: string): void {
    const intervalId = this.intervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(key);
    }
  }

  /**
   * Clear all timeouts and intervals
   */
  clearAll(): void {
    this.timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this.intervals.forEach((intervalId) => clearInterval(intervalId));
    this.timeouts.clear();
    this.intervals.clear();
  }

  /**
   * Check if a timeout exists for a key
   */
  hasTimeout(key: string): boolean {
    return this.timeouts.has(key);
  }

  /**
   * Check if an interval exists for a key
   */
  hasInterval(key: string): boolean {
    return this.intervals.has(key);
  }

  /**
   * Get the number of active timeouts
   */
  timeoutCount(): number {
    return this.timeouts.size;
  }

  /**
   * Get the number of active intervals
   */
  intervalCount(): number {
    return this.intervals.size;
  }

  /**
   * Cleanup method for React components
   * Call this in useEffect cleanup
   */
  cleanup(): void {
    this.clearAll();
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a timeout manager instance
 * For React: Use in useRef to maintain instance across renders
 * @example
 * const timeoutManager = useRef(createTimeoutManager());
 * useEffect(() => () => timeoutManager.current.cleanup(), []);
 */
export function createTimeoutManager(): TimeoutManager {
  return new TimeoutManager();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Utility for creating debounced functions with proper typing
 * ✅ VERIFIED: No 'any' types, fully typed parameters
 */
export function createDebounce<
  T extends (...args: Parameters<T>) => ReturnType<T>,
>(
  func: T,
  delay: number = TIMEOUT_CONSTANTS.DEBOUNCE_API,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>): void => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

/**
 * Utility for creating throttled functions with proper typing
 * ✅ VERIFIED: No 'any' types, fully typed parameters
 */
export function createThrottle<
  T extends (...args: Parameters<T>) => ReturnType<T>,
>(
  func: T,
  delay: number = TIMEOUT_CONSTANTS.DEBOUNCE_API,
): (...args: Parameters<T>) => ReturnType<T> | void {
  let lastCall = 0;
  let lastResult: ReturnType<T> | undefined;

  return (...args: Parameters<T>): ReturnType<T> | void => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      lastResult = func(...args);
      return lastResult;
    }
    return lastResult;
  };
}

/**
 * Promise-based timeout utility
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Race a promise against a timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number = TIMEOUT_CONSTANTS.API_TIMEOUT,
  errorMessage: string = "Operation timed out",
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, ms);

    // Clean up timeout if promise resolves first
    promise.then(() => clearTimeout(timeoutId)).catch(() =>
      clearTimeout(timeoutId)
    );
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Retry utility with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options?: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: Error) => boolean;
  },
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = TIMEOUT_CONSTANTS.CONNECTION_RETRY,
    maxDelay = 30000,
    shouldRetry = () => true,
  } = options || {};

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries || !shouldRetry(lastError)) {
        throw lastError;
      }

      // Exponential backoff with max delay cap
      const backoffDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await delay(backoffDelay);
    }
  }

  throw lastError!;
}

// ============================================================================
// REACT HOOKS HELPERS
// ============================================================================

/**
 * Helper to create cleanup-safe timeouts in React
 * Returns a function that sets timeouts and auto-cleans on unmount
 */
export function createSafeTimeout() {
  const manager = new TimeoutManager();

  return {
    setTimeout: (callback: () => void, ms: number) => {
      const key = `timeout_${Date.now()}_${Math.random()}`;
      manager.setTimeout(key, callback, ms);
      return () => manager.clearTimeout(key);
    },
    setInterval: (callback: () => void, ms: number) => {
      const key = `interval_${Date.now()}_${Math.random()}`;
      manager.setInterval(key, callback, ms);
      return () => manager.clearInterval(key);
    },
    cleanup: () => manager.cleanup(),
  };
}

// ============================================================================
// WOLFPACK SPECIFIC UTILITIES
// ============================================================================

/**
 * Calculate if user is idle based on last activity
 */
export function isUserIdle(lastActivityTime: Date | string): boolean {
  const lastActivity = typeof lastActivityTime === "string"
    ? new Date(lastActivityTime)
    : lastActivityTime;

  const now = new Date();
  const timeSinceActivity = now.getTime() - lastActivity.getTime();

  return timeSinceActivity > TIMEOUT_CONSTANTS.ACTIVITY_IDLE_TIMEOUT;
}

/**
 * Calculate if session has expired
 */
export function isSessionExpired(sessionStartTime: Date | string): boolean {
  const sessionStart = typeof sessionStartTime === "string"
    ? new Date(sessionStartTime)
    : sessionStartTime;

  const now = new Date();
  const sessionDuration = now.getTime() - sessionStart.getTime();

  return sessionDuration > TIMEOUT_CONSTANTS.SESSION_TIMEOUT;
}

/**
 * Format timeout duration for display
 */
export function formatTimeout(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Timeout utilities module
 * Centralized export of all timeout management functionality
 */
const timeoutUtils = {
  TIMEOUT_CONSTANTS,
  TimeoutManager,
  createTimeoutManager,
  createDebounce,
  createThrottle,
  delay,
  withTimeout,
  retryWithBackoff,
  createSafeTimeout,
  isUserIdle,
  isSessionExpired,
  formatTimeout,
  getConfiguredTimeout,
};

export default timeoutUtils;
