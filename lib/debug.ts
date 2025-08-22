/**
 * Debug Logger Utility
 * Provides structured logging for different aspects of the application
 * Only logs in development mode to avoid console pollution in production
 */

// Type definitions for better type safety
type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD";

interface ApiLogData {
  request?: unknown;
  response?: unknown;
  headers?: Record<string, string>;
  duration?: number;
}

interface ErrorContext {
  userId?: string;
  action?: string;
  metadata?: Record<string, unknown>;
  stack?: string;
}

interface AuthEventData {
  userId?: string;
  email?: string;
  provider?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

interface MessagingEventData {
  senderId?: string;
  recipientId?: string;
  messageId?: string;
  conversationId?: string;
  type?: string;
  metadata?: Record<string, unknown>;
}

interface RealtimePayload {
  event?: string;
  type?: string;
  old?: Record<string, unknown>;
  new?: Record<string, unknown>;
  errors?: string[];
}

interface QueryData {
  params?: Record<string, unknown>;
  result?: unknown;
  duration?: number;
  rowCount?: number;
}

/**
 * Main debug logging utility
 */
export const debugLog = {
  /**
   * Log database queries and their results
   */
  query: (name: string, data: QueryData): void => {
    if (process.env.NODE_ENV === "development") {
      console.group(`🔍 Query: ${name}`);
      console.log("Data:", data);
      console.log("Timestamp:", new Date().toISOString());
      console.groupEnd();
    }
  },

  /**
   * Log errors with full context and stack trace
   */
  error: (
    name: string,
    error: Error | unknown,
    context?: ErrorContext,
  ): void => {
    console.group(`❌ Error: ${name}`);

    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    } else {
      console.error("Error:", error);
    }

    if (context) {
      console.log("Context:", context);
    }

    console.log("Timestamp:", new Date().toISOString());
    console.trace();
    console.groupEnd();
  },

  /**
   * Log successful operations
   */
  success: (name: string, result: unknown): void => {
    if (process.env.NODE_ENV === "development") {
      console.log(`✅ Success: ${name}`, result);
    }
  },

  /**
   * Log API calls with method, URL, status, and response data
   */
  api: (
    method: HttpMethod | string,
    url: string,
    status: number,
    data?: ApiLogData,
  ): void => {
    if (process.env.NODE_ENV === "development") {
      const emoji = status >= 400 ? "🚨" : status >= 300 ? "⚠️" : "✅";
      console.group(`${emoji} API ${method.toUpperCase()}: ${url} (${status})`);

      if (data) {
        if (data.request) console.log("Request:", data.request);
        if (data.response) console.log("Response:", data.response);
        if (data.headers) console.log("Headers:", data.headers);
        if (data.duration) console.log(`Duration: ${data.duration}ms`);
      }

      console.log("Timestamp:", new Date().toISOString());
      console.groupEnd();
    }
  },

  /**
   * Log messaging events (chat, notifications, etc.)
   */
  messaging: (event: string, data: MessagingEventData): void => {
    if (process.env.NODE_ENV === "development") {
      console.group(`💬 Messaging: ${event}`);
      console.log("Data:", data);
      console.log("Timestamp:", new Date().toISOString());
      console.groupEnd();
    }
  },

  /**
   * Log authentication events
   */
  auth: (event: string, data: AuthEventData): void => {
    if (process.env.NODE_ENV === "development") {
      console.group(`🔐 Auth: ${event}`);

      // Sanitize sensitive data in development logs
      const sanitizedData = {
        ...data,
        email: data.email ? `${data.email.substring(0, 3)}***` : undefined,
      };

      console.log("Data:", sanitizedData);
      console.log("Timestamp:", new Date().toISOString());
      console.groupEnd();
    }
  },

  /**
   * Log realtime/websocket events
   */
  realtime: (
    channel: string,
    event: string,
    payload: RealtimePayload,
  ): void => {
    if (process.env.NODE_ENV === "development") {
      console.group(`📡 Realtime: ${channel} -> ${event}`);
      console.log("Payload:", payload);
      console.log("Timestamp:", new Date().toISOString());
      console.groupEnd();
    }
  },

  /**
   * Generic log function for custom use cases
   */
  custom: (emoji: string, label: string, data: unknown): void => {
    if (process.env.NODE_ENV === "development") {
      console.group(`${emoji} ${label}`);
      console.log("Data:", data);
      console.log("Timestamp:", new Date().toISOString());
      console.groupEnd();
    }
  },
};

/**
 * Performance monitoring utility
 */
export const performanceLog = {
  /**
   * Start timing an operation
   * @returns The start time for use with the end() method
   */
  start: (name: string): number => {
    if (process.env.NODE_ENV === "development") {
      console.time(`⏱️ ${name}`);
      return performance.now();
    }
    return 0;
  },

  /**
   * End timing an operation and log the duration
   * @param name - The name of the operation (must match the start() call)
   * @param startTime - Optional start time from start() method for precise timing
   */
  end: (name: string, startTime?: number): void => {
    if (process.env.NODE_ENV === "development") {
      console.timeEnd(`⏱️ ${name}`);

      if (startTime) {
        const duration = performance.now() - startTime;
        const emoji = duration > 1000 ? "🐌" : duration > 500 ? "⚡" : "🚀";
        console.log(`${emoji} ${name} took ${duration.toFixed(2)}ms`);

        // Warn if operation took too long
        if (duration > 2000) {
          console.warn(
            `⚠️ Performance warning: ${name} took ${
              (duration / 1000).toFixed(2)
            } seconds`,
          );
        }
      }
    }
  },

  /**
   * Measure and log the execution time of an async function
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = this.start(name);
    try {
      const result = await fn();
      this.end(name, startTime);
      return result;
    } catch (error) {
      this.end(name, startTime);
      debugLog.error(`Performance measure failed: ${name}`, error);
      throw error;
    }
  },

  /**
   * Log memory usage (Node.js environments)
   */
  memory: (label: string): void => {
    if (
      process.env.NODE_ENV === "development" &&
      typeof process !== "undefined" && process.memoryUsage
    ) {
      const usage = process.memoryUsage();
      console.group(`💾 Memory Usage: ${label}`);
      console.log(`RSS: ${(usage.rss / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Heap Used: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(
        `Heap Total: ${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      );
      console.log(`External: ${(usage.external / 1024 / 1024).toFixed(2)} MB`);
      console.groupEnd();
    }
  },
};

/**
 * Utility to create a scoped logger for a specific module
 */
export function createScopedLogger(scope: string) {
  return {
    log: (message: string, data?: unknown) =>
      debugLog.custom("📝", `[${scope}] ${message}`, data),

    error: (message: string, error: Error | unknown, context?: ErrorContext) =>
      debugLog.error(`[${scope}] ${message}`, error, context),

    success: (message: string, result?: unknown) =>
      debugLog.success(`[${scope}] ${message}`, result),

    warn: (message: string, data?: unknown) => {
      if (process.env.NODE_ENV === "development") {
        console.warn(`⚠️ [${scope}] ${message}`, data || "");
      }
    },

    debug: (message: string, data?: unknown) => {
      if (process.env.NODE_ENV === "development") {
        console.debug(`🔧 [${scope}] ${message}`, data || "");
      }
    },
  };
}

// Example usage:
// const logger = createScopedLogger('AuthModule');
// logger.log('User logged in', { userId: '123' });
// logger.error('Authentication failed', new Error('Invalid token'));
