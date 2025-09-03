/**
 * Timeout Management Utilities
 *
 * Centralized timeout constants and management utilities
 * Aligned with your actual Supabase backend schema
 */

// ============================================================================
// TIMEOUT CONSTANTS (in milliseconds)
// ============================================================================

/**
 * Timeout constants based on your actual database schema
 * Verified against chat_messages, chat_participants, notifications tables
 */
export const TIMEOUT_CONSTANTS = {
  // Chat & Messaging timeouts (based on chat_* tables)
  TYPING_INDICATOR_TIMEOUT: 5000, // 5 seconds - matches v_typing_users view logic
  MESSAGE_EDIT_WINDOW: 300000, // 5 minutes to edit a message
  MESSAGE_DELETE_WINDOW: 600000, // 10 minutes to delete own message
  CONVERSATION_REFRESH: 30000, // 30 seconds to refresh conversation list
  MESSAGE_POLL_INTERVAL: 10000, // 10 seconds for polling new messages
  READ_RECEIPT_DELAY: 1000, // 1 second delay before marking as read
  REACTION_COOLDOWN: 500, // 500ms between reaction changes

  // Notification timeouts (based on notifications table)
  NOTIFICATION_DISPLAY: 5000, // 5 seconds for notification display
  NOTIFICATION_FADE: 300, // 300ms fade animation
  PUSH_NOTIFICATION_TTL: 86400000, // 24 hours TTL for push notifications
  NOTIFICATION_BATCH_DELAY: 2000, // 2 seconds to batch notifications

  // UI Feedback timeouts
  TOAST_SUCCESS: 3000, // 3 seconds for success toast
  TOAST_ERROR: 5000, // 5 seconds for error toast
  TOAST_WARNING: 4000, // 4 seconds for warning toast
  TOAST_INFO: 3000, // 3 seconds for info toast
  LOADING_SPINNER_DELAY: 200, // 200ms before showing loading spinner
  OPTIMISTIC_UPDATE_TIMEOUT: 5000, // 5 seconds for optimistic updates

  // API and Network timeouts
  API_TIMEOUT: 10000, // 10 seconds for API requests
  API_RETRY_DELAY: 2000, // 2 seconds between retries
  WEBSOCKET_PING: 30000, // 30 seconds for websocket ping
  WEBSOCKET_RECONNECT: 3000, // 3 seconds before reconnect attempt
  REALTIME_SUBSCRIBE_TIMEOUT: 5000, // 5 seconds to establish realtime connection

  // Search and Input debouncing
  DEBOUNCE_SEARCH: 300, // 300ms for search input
  DEBOUNCE_USERNAME: 500, // 500ms for username availability check
  DEBOUNCE_TYPING: 1000, // 1 second for typing indicator
  DEBOUNCE_SCROLL: 100, // 100ms for scroll events
  DEBOUNCE_RESIZE: 200, // 200ms for resize events

  // Media timeouts (based on media fields in chat_messages)
  VIDEO_LOAD_TIMEOUT: 15000, // 15 seconds to load video
  IMAGE_LOAD_TIMEOUT: 10000, // 10 seconds to load image
  THUMBNAIL_LOAD_TIMEOUT: 5000, // 5 seconds to load thumbnail
  MEDIA_UPLOAD_TIMEOUT: 60000, // 60 seconds for media upload
  MEDIA_PROCESS_TIMEOUT: 30000, // 30 seconds for media processing

  // User activity (based on users.last_seen_at)
  USER_ONLINE_THRESHOLD: 300000, // 5 minutes - user considered online
  USER_AWAY_THRESHOLD: 900000, // 15 minutes - user considered away
  USER_OFFLINE_THRESHOLD: 1800000, // 30 minutes - user considered offline
  PRESENCE_UPDATE_INTERVAL: 60000, // 1 minute between presence updates
  LAST_SEEN_UPDATE_INTERVAL: 120000, // 2 minutes between last_seen updates

  // Content and Posts (based on content_posts table)
  POST_REFRESH_INTERVAL: 60000, // 1 minute to refresh feed
  VIEW_COUNT_DEBOUNCE: 3000, // 3 seconds to count as a view
  TRENDING_SCORE_UPDATE: 300000, // 5 minutes to update trending scores
  COMMENT_EDIT_WINDOW: 180000, // 3 minutes to edit comment

  // Session and Auth
  SESSION_TIMEOUT: 1800000, // 30 minutes session timeout
  SESSION_REFRESH: 600000, // 10 minutes before session refresh
  AUTH_TOKEN_REFRESH: 300000, // 5 minutes before token refresh
  IDLE_WARNING: 1500000, // 25 minutes before idle warning
  IDLE_LOGOUT: 1800000, // 30 minutes before auto-logout

  // Cleanup and Maintenance
  CACHE_CLEANUP_INTERVAL: 300000, // 5 minutes between cache cleanup
  TEMP_DATA_CLEANUP: 600000, // 10 minutes for temp data cleanup
  OLD_MESSAGE_CLEANUP: 86400000, // 24 hours for old message cleanup
} as const;

/**
 * Type for timeout keys
 */
export type TimeoutKey = keyof typeof TIMEOUT_CONSTANTS;

/**
 * Get timeout value with optional override from app_config
 */
export function getConfiguredTimeout(
  key: TimeoutKey,
  configValue?: string | null,
): number {
  if (configValue) {
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
 */
export class TimeoutManager {
  private timeouts = new Map<string, NodeJS.Timeout>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private animationFrames = new Map<string, number>();

  /**
   * Set a timeout with a unique key
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
   */
  setInterval(key: string, callback: () => void, delay: number): void {
    this.clearInterval(key);
    const intervalId = setInterval(callback, delay);
    this.intervals.set(key, intervalId);
  }

  /**
   * Request animation frame with a unique key
   */
  requestAnimationFrame(key: string, callback: FrameRequestCallback): void {
    this.cancelAnimationFrame(key);
    const frameId = requestAnimationFrame((time) => {
      this.animationFrames.delete(key);
      callback(time);
    });
    this.animationFrames.set(key, frameId);
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
   * Cancel animation frame by key
   */
  cancelAnimationFrame(key: string): void {
    const frameId = this.animationFrames.get(key);
    if (frameId) {
      cancelAnimationFrame(frameId);
      this.animationFrames.delete(key);
    }
  }

  /**
   * Clear all timeouts, intervals, and animation frames
   */
  clearAll(): void {
    this.timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this.intervals.forEach((intervalId) => clearInterval(intervalId));
    this.animationFrames.forEach((frameId) => cancelAnimationFrame(frameId));
    this.timeouts.clear();
    this.intervals.clear();
    this.animationFrames.clear();
  }

  /**
   * Check if a timeout exists
   */
  hasTimeout(key: string): boolean {
    return this.timeouts.has(key);
  }

  /**
   * Check if an interval exists
   */
  hasInterval(key: string): boolean {
    return this.intervals.has(key);
  }

  /**
   * Get active counts
   */
  getActiveCounts(): { timeouts: number; intervals: number; frames: number } {
    return {
      timeouts: this.timeouts.size,
      intervals: this.intervals.size,
      frames: this.animationFrames.size,
    };
  }

  /**
   * Cleanup method for React components
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
 */
export function createTimeoutManager(): TimeoutManager {
  return new TimeoutManager();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Debounce function with proper typing
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number = TIMEOUT_CONSTANTS.DEBOUNCE_SEARCH,
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
 * Throttle function with proper typing
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number = TIMEOUT_CONSTANTS.DEBOUNCE_SEARCH,
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let lastCall = 0;
  let lastResult: ReturnType<T> | undefined;

  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      lastResult = func(...args) as ReturnType<T>;
      return lastResult;
    }
    return lastResult;
  };
}

/**
 * Promise-based delay utility
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
  errorMessage = "Operation timed out",
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), ms)
    ),
  ]);
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {},
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = TIMEOUT_CONSTANTS.API_RETRY_DELAY,
    maxDelay = 30000,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      const backoffDelay = Math.min(
        baseDelay * Math.pow(2, attempt),
        maxDelay,
      );
      await delay(backoffDelay);
    }
  }

  throw lastError;
}

// ============================================================================
// REACT HOOKS HELPERS
// ============================================================================

/**
 * Create cleanup-safe timeouts for React
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
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      const key = `frame_${Date.now()}_${Math.random()}`;
      manager.requestAnimationFrame(key, callback);
      return () => manager.cancelAnimationFrame(key);
    },
    cleanup: () => manager.cleanup(),
  };
}

// ============================================================================
// USER ACTIVITY UTILITIES (Based on users.last_seen_at)
// ============================================================================

/**
 * Get user online status based on last seen time
 */
export function getUserOnlineStatus(
  lastSeenAt: Date | string | null,
): "online" | "away" | "offline" {
  if (!lastSeenAt) return "offline";

  const lastSeen = typeof lastSeenAt === "string"
    ? new Date(lastSeenAt)
    : lastSeenAt;

  const timeSinceLastSeen = Date.now() - lastSeen.getTime();

  if (timeSinceLastSeen < TIMEOUT_CONSTANTS.USER_ONLINE_THRESHOLD) {
    return "online";
  } else if (timeSinceLastSeen < TIMEOUT_CONSTANTS.USER_AWAY_THRESHOLD) {
    return "away";
  } else {
    return "offline";
  }
}

/**
 * Check if user session has expired
 */
export function isSessionExpired(sessionStartTime: Date | string): boolean {
  const sessionStart = typeof sessionStartTime === "string"
    ? new Date(sessionStartTime)
    : sessionStartTime;

  return Date.now() - sessionStart.getTime() >
    TIMEOUT_CONSTANTS.SESSION_TIMEOUT;
}

/**
 * Check if user should be warned about idle timeout
 */
export function shouldWarnIdle(lastActivityTime: Date | string): boolean {
  const lastActivity = typeof lastActivityTime === "string"
    ? new Date(lastActivityTime)
    : lastActivityTime;

  const idleTime = Date.now() - lastActivity.getTime();
  return idleTime > TIMEOUT_CONSTANTS.IDLE_WARNING &&
    idleTime < TIMEOUT_CONSTANTS.IDLE_LOGOUT;
}

// ============================================================================
// TYPING INDICATOR UTILITIES (Based on v_typing_users view)
// ============================================================================

/**
 * Check if typing indicator should still be shown
 * Based on the 5-second window in v_typing_users view
 */
export function isTypingIndicatorActive(
  typingTimestamp: Date | string,
): boolean {
  const timestamp = typeof typingTimestamp === "string"
    ? new Date(typingTimestamp)
    : typingTimestamp;

  return Date.now() - timestamp.getTime() <
    TIMEOUT_CONSTANTS.TYPING_INDICATOR_TIMEOUT;
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format timeout duration for display
 */
export function formatTimeout(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  return `${Math.round(ms / 3600000)}h`;
}

/**
 * Format time ago for display
 */
export function formatTimeAgo(date: Date | string): string {
  const time = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - time.getTime();

  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return time.toLocaleDateString();
}

// ============================================================================
// EXPORTS
// ============================================================================

const timeoutUtils = {
  TIMEOUT_CONSTANTS,
  TimeoutManager,
  createTimeoutManager,
  debounce,
  throttle,
  delay,
  withTimeout,
  retryWithBackoff,
  createSafeTimeout,
  getUserOnlineStatus,
  isSessionExpired,
  shouldWarnIdle,
  isTypingIndicatorActive,
  formatTimeout,
  formatTimeAgo,
  getConfiguredTimeout,
};

export default timeoutUtils;
