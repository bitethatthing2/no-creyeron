/**
 * Timeout Management Utilities
 * 
 * Centralized timeout constants and management utilities
 * to prevent magic numbers scattered throughout the codebase.
 */

// Timeout constants (in milliseconds)
export const TIMEOUT_CONSTANTS = {
  // Chat-related timeouts
  MESSAGE_BUBBLE_TIMEOUT: 3000,        // 3 seconds for message bubbles
  OPTIMISTIC_BUBBLE_TIMEOUT: 5000,     // 5 seconds for optimistic bubbles
  PROFILE_POPUP_TIMEOUT: 4000,         // 4 seconds for profile popup
  TYPING_INDICATOR_TIMEOUT: 1000,      // 1 second for typing indicator
  
  // UI feedback timeouts
  TOAST_TIMEOUT: 2000,                 // 2 seconds for toast notifications
  NOTIFICATION_TIMEOUT: 5000,          // 5 seconds for notifications
  SUCCESS_MESSAGE_TIMEOUT: 3000,       // 3 seconds for success messages
  ERROR_MESSAGE_TIMEOUT: 8000,         // 8 seconds for error messages
  
  // Loading and debounce timeouts
  DEBOUNCE_SEARCH: 300,                // 300ms for search input debounce
  DEBOUNCE_API: 500,                   // 500ms for API call debounce
  LOADING_DELAY: 100,                  // 100ms delay before showing loading
  AUTO_REFRESH: 30000,                 // 30 seconds for auto refresh
  
  // Connection and retry timeouts
  CONNECTION_RETRY: 5000,              // 5 seconds between connection retries
  API_TIMEOUT: 10000,                  // 10 seconds for API requests
  WEBSOCKET_PING: 30000,               // 30 seconds for websocket ping
} as const;

/**
 * Timeout manager class for handling multiple timeouts with cleanup
 */
export class TimeoutManager {
  private timeouts = new Map<string, NodeJS.Timeout>();

  /**
   * Set a timeout with a unique key
   * Automatically clears any existing timeout with the same key
   */
  set(key: string, callback: () => void, delay: number): void {
    this.clear(key);
    const timeoutId = setTimeout(callback, delay);
    this.timeouts.set(key, timeoutId);
  }

  /**
   * Clear a specific timeout by key
   */
  clear(key: string): void {
    const timeoutId = this.timeouts.get(key);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(key);
    }
  }

  /**
   * Clear all timeouts
   */
  clearAll(): void {
    this.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.timeouts.clear();
  }

  /**
   * Check if a timeout exists for a key
   */
  has(key: string): boolean {
    return this.timeouts.has(key);
  }

  /**
   * Get the number of active timeouts
   */
  size(): number {
    return this.timeouts.size;
  }
}

/**
 * Create a timeout manager instance
 * Note: For React components, use this in a useRef to maintain instance across renders
 */
export function createTimeoutManager(): TimeoutManager {
  return new TimeoutManager();
}

/**
 * Utility for creating debounced functions
 */
export function createDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number = TIMEOUT_CONSTANTS.DEBOUNCE_API
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Utility for creating throttled functions
 */
export function createThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number = TIMEOUT_CONSTANTS.DEBOUNCE_API
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Promise-based timeout utility
 */
export function timeout(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Race a promise against a timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number = TIMEOUT_CONSTANTS.API_TIMEOUT,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), ms);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Retry utility with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = TIMEOUT_CONSTANTS.CONNECTION_RETRY
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff: baseDelay * 2^attempt
      const delay = baseDelay * Math.pow(2, attempt);
      await timeout(delay);
    }
  }

  throw lastError!;
}