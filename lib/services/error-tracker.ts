/**
 * Enhanced Error Tracking and Management Service
 * Provides comprehensive error handling, logging, and monitoring
 */

export enum ErrorCategory {
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  VALIDATION = "validation",
  DATABASE = "database",
  NETWORK = "network",
  BUSINESS_LOGIC = "business_logic",
  EXTERNAL_API = "external_api",
  FILE_SYSTEM = "file_system",
  RATE_LIMITING = "rate_limiting",
  PERFORMANCE = "performance",
  SECURITY = "security",
  SYSTEM = "system",
  USER_INPUT = "user_input",
  THIRD_PARTY = "third_party",
}

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  url?: string;
  method?: string;
  timestamp?: string;
  stackTrace?: string;
  additionalData?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AppError extends Error {
  code?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context?: ErrorContext;
  userMessage?: string;
  originalError?: Error;
  retryable?: boolean;
  timestamp: string;
}

export interface ErrorReport {
  id: string;
  error: AppError;
  reportedAt: string;
  resolved?: boolean;
  resolvedAt?: string;
  notes?: string;
}

class ErrorService {
  private errorReports = new Map<string, ErrorReport>();
  private errorCounts = new Map<string, number>();
  private rateLimits = new Map<string, number>();
  private isProduction = process.env.NODE_ENV === "production";
  private maxErrorsPerType = 100;
  private rateWindowMs = 60000; // 1 minute

  /**
   * Create a standardized error
   */
  createError(
    message: string,
    userMessage: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    context?: ErrorContext,
    originalError?: Error,
  ): AppError {
    const error = new Error(message) as AppError;
    error.category = category;
    error.severity = severity;
    error.context = {
      timestamp: new Date().toISOString(),
      stackTrace: error.stack,
      ...context,
    };
    error.userMessage = userMessage;
    error.originalError = originalError;
    error.timestamp = new Date().toISOString();
    error.retryable = this.isRetryableError(category);

    this.trackError(error);
    return error;
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(
    error: Error | string,
    context?: ErrorContext,
  ): AppError {
    const message = typeof error === "string" ? error : error.message;
    const originalError = typeof error === "string" ? undefined : error;

    // Common auth error patterns
    if (message.includes("Invalid login credentials")) {
      return this.createError(
        message,
        "Invalid email or password. Please check your credentials and try again.",
        ErrorSeverity.LOW,
        ErrorCategory.AUTHENTICATION,
        context,
        originalError,
      );
    }

    if (message.includes("Email not confirmed")) {
      return this.createError(
        message,
        "Please check your email and click the confirmation link before signing in.",
        ErrorSeverity.MEDIUM,
        ErrorCategory.AUTHENTICATION,
        context,
        originalError,
      );
    }

    if (message.includes("Too many requests")) {
      return this.createError(
        message,
        "Too many login attempts. Please wait a few minutes before trying again.",
        ErrorSeverity.MEDIUM,
        ErrorCategory.RATE_LIMITING,
        context,
        originalError,
      );
    }

    if (message.includes("User already registered")) {
      return this.createError(
        message,
        "An account with this email already exists. Try signing in instead.",
        ErrorSeverity.LOW,
        ErrorCategory.VALIDATION,
        context,
        originalError,
      );
    }

    // Generic auth error
    return this.createError(
      message,
      "Authentication failed. Please try again.",
      ErrorSeverity.MEDIUM,
      ErrorCategory.AUTHENTICATION,
      context,
      originalError,
    );
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(
    error: Error,
    operation: string,
    context?: ErrorContext,
  ): AppError {
    const enhancedContext = {
      operation,
      ...context,
    };

    // PostgreSQL/Supabase specific errors
    if (error.message.includes("duplicate key")) {
      return this.createError(
        `Database constraint violation during ${operation}: ${error.message}`,
        "This item already exists. Please try with different information.",
        ErrorSeverity.LOW,
        ErrorCategory.VALIDATION,
        enhancedContext,
        error,
      );
    }

    if (error.message.includes("foreign key")) {
      return this.createError(
        `Foreign key constraint violation during ${operation}: ${error.message}`,
        "Invalid reference data. Please refresh and try again.",
        ErrorSeverity.MEDIUM,
        ErrorCategory.DATABASE,
        enhancedContext,
        error,
      );
    }

    if (error.message.includes("not null")) {
      return this.createError(
        `Required field missing during ${operation}: ${error.message}`,
        "Required information is missing. Please check all required fields.",
        ErrorSeverity.LOW,
        ErrorCategory.VALIDATION,
        enhancedContext,
        error,
      );
    }

    if (error.message.includes("connection") || error.message.includes("timeout")) {
      return this.createError(
        `Database connection issue during ${operation}: ${error.message}`,
        "Connection problem. Please check your internet connection and try again.",
        ErrorSeverity.HIGH,
        ErrorCategory.NETWORK,
        enhancedContext,
        error,
      );
    }

    // Generic database error
    return this.createError(
      `Database operation failed: ${operation} - ${error.message}`,
      "A database error occurred. Please try again later.",
      ErrorSeverity.HIGH,
      ErrorCategory.DATABASE,
      enhancedContext,
      error,
    );
  }

  /**
   * Handle validation errors
   */
  handleValidationError(
    field: string,
    value: unknown,
    message: string,
    context?: ErrorContext,
  ): AppError {
    return this.createError(
      `Validation failed for field '${field}' with value '${value}': ${message}`,
      message,
      ErrorSeverity.LOW,
      ErrorCategory.VALIDATION,
      { field, value, ...context },
    );
  }

  /**
   * Handle network errors
   */
  handleNetworkError(
    error: Error,
    url?: string,
    context?: ErrorContext,
  ): AppError {
    const enhancedContext = { url, ...context };

    if (error.message.includes("fetch")) {
      return this.createError(
        `Network request failed: ${error.message}`,
        "Network error. Please check your connection and try again.",
        ErrorSeverity.MEDIUM,
        ErrorCategory.NETWORK,
        enhancedContext,
        error,
      );
    }

    return this.createError(
      `Network error: ${error.message}`,
      "Connection problem. Please try again.",
      ErrorSeverity.MEDIUM,
      ErrorCategory.NETWORK,
      enhancedContext,
      error,
    );
  }

  /**
   * Handle API errors
   */
  handleApiError(
    error: Error,
    endpoint: string,
    statusCode?: number,
    context?: ErrorContext,
  ): AppError {
    const severity = statusCode && statusCode >= 500 
      ? ErrorSeverity.HIGH 
      : ErrorSeverity.MEDIUM;

    return this.createError(
      `API error at ${endpoint}: ${error.message} (Status: ${statusCode})`,
      statusCode === 429 
        ? "Too many requests. Please wait a moment and try again."
        : "Service temporarily unavailable. Please try again later.",
      severity,
      ErrorCategory.EXTERNAL_API,
      { endpoint, statusCode, ...context },
      error,
    );
  }

  /**
   * Track error occurrence
   */
  private trackError(error: AppError): void {
    try {
      // Rate limiting for error reporting
      const errorKey = `${error.category}:${error.message}`;
      const now = Date.now();
      
      if (this.rateLimits.has(errorKey)) {
        const lastReport = this.rateLimits.get(errorKey)!;
        if (now - lastReport < this.rateWindowMs) {
          return; // Skip if within rate limit window
        }
      }

      this.rateLimits.set(errorKey, now);

      // Count error occurrences
      const count = (this.errorCounts.get(errorKey) || 0) + 1;
      this.errorCounts.set(errorKey, count);

      // Create error report
      const report: ErrorReport = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        error,
        reportedAt: new Date().toISOString(),
      };

      this.errorReports.set(report.id, report);

      // Log error based on severity and environment
      this.logError(error, count);

      // Clean up old reports
      this.cleanupOldReports();

      // Send to external monitoring (if configured)
      this.sendToMonitoring(error, count);
    } catch (trackingError) {
      // Don't let error tracking itself fail the application
      console.error("Error tracking failed:", trackingError);
    }
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: AppError, count: number): void {
    const logData = {
      message: error.message,
      category: error.category,
      severity: error.severity,
      context: error.context,
      count,
      timestamp: error.timestamp,
    };

    if (!this.isProduction) {
      // Development: detailed logging
      console.group(`🚨 ${error.severity.toUpperCase()} Error - ${error.category}`);
      console.error("Message:", error.message);
      console.error("User Message:", error.userMessage);
      console.error("Context:", error.context);
      if (error.originalError) {
        console.error("Original Error:", error.originalError);
      }
      console.error("Stack:", error.stack);
      console.groupEnd();
    } else {
      // Production: structured logging
      switch (error.severity) {
        case ErrorSeverity.CRITICAL:
          console.error("CRITICAL ERROR:", JSON.stringify(logData));
          break;
        case ErrorSeverity.HIGH:
          console.error("HIGH SEVERITY ERROR:", JSON.stringify(logData));
          break;
        case ErrorSeverity.MEDIUM:
          console.warn("MEDIUM SEVERITY ERROR:", JSON.stringify(logData));
          break;
        case ErrorSeverity.LOW:
          console.info("LOW SEVERITY ERROR:", JSON.stringify(logData));
          break;
      }
    }
  }

  /**
   * Send error to external monitoring service
   */
  private sendToMonitoring(error: AppError, count: number): void {
    // Here you would integrate with services like:
    // - Sentry: Sentry.captureException(error)
    // - Datadog: DD.logger.error(error.message, error.context)
    // - Custom analytics service
    
    if (this.isProduction && error.severity === ErrorSeverity.CRITICAL) {
      // Example: Send critical errors to monitoring
      console.log("Would send to monitoring service:", {
        error: error.message,
        category: error.category,
        severity: error.severity,
        count,
      });
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(category: ErrorCategory): boolean {
    const retryableCategories = [
      ErrorCategory.NETWORK,
      ErrorCategory.DATABASE,
      ErrorCategory.EXTERNAL_API,
      ErrorCategory.RATE_LIMITING,
    ];
    return retryableCategories.includes(category);
  }

  /**
   * Clean up old error reports
   */
  private cleanupOldReports(): void {
    if (this.errorReports.size <= this.maxErrorsPerType) return;

    const reports = Array.from(this.errorReports.values());
    reports.sort((a, b) => new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime());

    // Remove oldest reports
    const toRemove = reports.slice(0, reports.length - this.maxErrorsPerType);
    toRemove.forEach(report => this.errorReports.delete(report.id));
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    topErrors: Array<{ error: string; count: number }>;
  } {
    const stats = {
      totalErrors: this.errorReports.size,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      topErrors: [] as Array<{ error: string; count: number }>,
    };

    // Initialize counters
    Object.values(ErrorCategory).forEach(category => {
      stats.errorsByCategory[category] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      stats.errorsBySeverity[severity] = 0;
    });

    // Count errors
    this.errorReports.forEach(report => {
      stats.errorsByCategory[report.error.category]++;
      stats.errorsBySeverity[report.error.severity]++;
    });

    // Top errors
    stats.topErrors = Array.from(this.errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  /**
   * Get error reports
   */
  getErrorReports(limit: number = 50): ErrorReport[] {
    return Array.from(this.errorReports.values())
      .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
      .slice(0, limit);
  }

  /**
   * Mark error as resolved
   */
  resolveError(errorId: string, notes?: string): boolean {
    const report = this.errorReports.get(errorId);
    if (!report) return false;

    report.resolved = true;
    report.resolvedAt = new Date().toISOString();
    report.notes = notes;
    
    return true;
  }

  /**
   * Clear all error reports
   */
  clearErrors(): void {
    this.errorReports.clear();
    this.errorCounts.clear();
    this.rateLimits.clear();
  }
}

// Create singleton instance
export const errorService = new ErrorService();

// Export commonly used functions for convenience
export const {
  createError,
  handleAuthError,
  handleDatabaseError,
  handleValidationError,
  handleNetworkError,
  handleApiError,
  getErrorStats,
  getErrorReports,
  resolveError,
  clearErrors,
} = errorService;