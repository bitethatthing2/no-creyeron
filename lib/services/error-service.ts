/**
 * Centralized Error Service
 * Provides comprehensive error handling, logging, and user feedback
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  NETWORK = 'network',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_SERVICE = 'external_service',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  userId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  // Auth specific fields
  email?: string;
  targetUserId?: string;
  newRole?: string;
  // API specific fields
  operation?: string;
  endpoint?: string;
  // Validation specific fields
  field?: string;
  value?: any;
  rule?: string;
  reason?: string;
  // Service specific fields
  service?: string;
  attempt?: number;
}

export interface AppError {
  id: string;
  message: string;
  userMessage: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  originalError?: Error;
  stack?: string;
  retryable: boolean;
  timestamp: Date;
}

class ErrorService {
  private errors: AppError[] = [];
  private maxErrors = 1000; // Keep last 1000 errors in memory
  private errorListeners: ((error: AppError) => void)[] = [];

  /**
   * Create and log an error with full context
   */
  createError(
    message: string,
    userMessage: string,
    severity: ErrorSeverity,
    category: ErrorCategory,
    context: ErrorContext = {},
    originalError?: Error,
    retryable: boolean = false
  ): AppError {
    const error: AppError = {
      id: this.generateErrorId(),
      message,
      userMessage,
      severity,
      category,
      context: {
        ...context,
        timestamp: new Date(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      },
      originalError,
      stack: originalError?.stack || new Error().stack,
      retryable,
      timestamp: new Date()
    };

    this.logError(error);
    this.notifyListeners(error);
    
    return error;
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(
    error: Error,
    context: ErrorContext = {}
  ): AppError {
    return this.createError(
      `Authentication failed: ${error.message}`,
      'Please sign in again to continue',
      ErrorSeverity.HIGH,
      ErrorCategory.AUTHENTICATION,
      { ...context, component: 'AuthService' },
      error,
      true
    );
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(
    error: Error,
    operation: string,
    context: ErrorContext = {}
  ): AppError {
    const isConnectionError = error.message.includes('connection') || 
                             error.message.includes('timeout');
    
    return this.createError(
      `Database operation failed: ${operation} - ${error.message}`,
      isConnectionError 
        ? 'Connection issue. Please try again in a moment.'
        : 'Unable to save your changes. Please try again.',
      isConnectionError ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      ErrorCategory.DATABASE,
      { ...context, operation },
      error,
      true
    );
  }

  /**
   * Handle network/API errors
   */
  handleNetworkError(
    error: Error,
    endpoint: string,
    context: ErrorContext = {}
  ): AppError {
    const isOffline = !navigator.onLine;
    const isTimeout = error.message.includes('timeout');
    
    return this.createError(
      `Network request failed: ${endpoint} - ${error.message}`,
      isOffline 
        ? 'You appear to be offline. Please check your connection.'
        : isTimeout
        ? 'Request timed out. Please try again.'
        : 'Unable to connect to server. Please try again.',
      isOffline ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      ErrorCategory.NETWORK,
      { ...context, endpoint },
      error,
      true
    );
  }

  /**
   * Handle validation errors
   */
  handleValidationError(
    field: string,
    value: any,
    rule: string,
    context: ErrorContext = {}
  ): AppError {
    return this.createError(
      `Validation failed for ${field}: ${rule}`,
      `Please check the ${field} field and try again`,
      ErrorSeverity.LOW,
      ErrorCategory.VALIDATION,
      { ...context, field, value, rule },
      undefined,
      false
    );
  }

  /**
   * Handle business logic errors
   */
  handleBusinessLogicError(
    operation: string,
    reason: string,
    userMessage: string,
    context: ErrorContext = {}
  ): AppError {
    return this.createError(
      `Business rule violation: ${operation} - ${reason}`,
      userMessage,
      ErrorSeverity.MEDIUM,
      ErrorCategory.BUSINESS_LOGIC,
      { ...context, operation, reason },
      undefined,
      false
    );
  }

  /**
   * Handle external service errors (Supabase, etc.)
   */
  handleExternalServiceError(
    service: string,
    error: Error,
    context: ErrorContext = {}
  ): AppError {
    return this.createError(
      `External service error: ${service} - ${error.message}`,
      'Service temporarily unavailable. Please try again later.',
      ErrorSeverity.HIGH,
      ErrorCategory.EXTERNAL_SERVICE,
      { ...context, service },
      error,
      true
    );
  }

  /**
   * Handle unknown errors with smart categorization
   */
  handleUnknownError(
    error: Error,
    context: ErrorContext = {}
  ): AppError {
    // Try to categorize based on error message
    let category = ErrorCategory.UNKNOWN;
    let userMessage = 'An unexpected error occurred. Please try again.';
    let retryable = true;

    if (error.message.includes('auth') || error.message.includes('login')) {
      category = ErrorCategory.AUTHENTICATION;
      userMessage = 'Authentication error. Please sign in again.';
    } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      category = ErrorCategory.AUTHORIZATION;
      userMessage = 'You don\'t have permission to perform this action.';
      retryable = false;
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      category = ErrorCategory.NETWORK;
      userMessage = 'Network error. Please check your connection and try again.';
    }

    return this.createError(
      `Unhandled error: ${error.message}`,
      userMessage,
      ErrorSeverity.MEDIUM,
      category,
      context,
      error,
      retryable
    );
  }

  /**
   * Log error based on severity
   */
  private logError(error: AppError): void {
    // Store in memory
    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Console logging based on severity
    const logData = {
      id: error.id,
      message: error.message,
      severity: error.severity,
      category: error.category,
      context: error.context,
      stack: error.stack
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🚨 CRITICAL ERROR:', logData);
        break;
      case ErrorSeverity.HIGH:
        console.error('❌ HIGH SEVERITY ERROR:', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('⚠️ MEDIUM SEVERITY ERROR:', logData);
        break;
      case ErrorSeverity.LOW:
        console.info('ℹ️ LOW SEVERITY ERROR:', logData);
        break;
    }

    // Send to external monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(error);
    }
  }

  /**
   * Send error to external monitoring service
   */
  private async sendToMonitoring(error: AppError): Promise<void> {
    try {
      // This would integrate with services like Sentry, LogRocket, etc.
      // For now, we'll just send to a custom endpoint
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            id: error.id,
            message: error.message,
            severity: error.severity,
            category: error.category,
            context: error.context,
            stack: error.stack,
            timestamp: error.timestamp
          }
        })
      });
    } catch (monitoringError) {
      console.error('Failed to send error to monitoring:', monitoringError);
    }
  }

  /**
   * Add error listener for real-time error handling
   */
  addErrorListener(listener: (error: AppError) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all error listeners
   */
  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error listener failed:', listenerError);
      }
    });
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit: number = 50): AppError[] {
    return this.errors.slice(-limit);
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): AppError[] {
    return this.errors.filter(error => error.category === category);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
    return this.errors.filter(error => error.severity === severity);
  }

  /**
   * Clear errors (for debugging/testing)
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create retry function for retryable errors
   */
  createRetryFunction(
    originalFunction: () => Promise<any>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): () => Promise<any> {
    return async () => {
      let lastError: Error;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await originalFunction();
        } catch (error) {
          lastError = error as Error;
          
          if (attempt === maxRetries) {
            throw this.handleUnknownError(lastError, {
              action: 'retry_exhausted',
              metadata: { maxRetries, attempt }
            });
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
      }
    };
  }
}

// Create singleton instance
export const errorService = new ErrorService();

// Global error handler for unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorService.handleUnknownError(
      new Error(event.error?.message || event.message),
      {
        component: 'GlobalHandler',
        action: 'unhandled_error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      }
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorService.handleUnknownError(
      new Error(event.reason?.message || 'Unhandled promise rejection'),
      {
        component: 'GlobalHandler',
        action: 'unhandled_rejection',
        metadata: { reason: event.reason }
      }
    );
  });
}