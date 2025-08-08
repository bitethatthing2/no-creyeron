'use client';

import React from 'react';
import { toast } from 'sonner';

export interface ErrorContext {
  userId?: string;
  feature?: string;
  action?: string;
  component?: string;
  timestamp?: string;
  userAgent?: string;
  url?: string;
}

export interface AppError {
  message: string;
  stack?: string;
  context: ErrorContext;
  level: 'info' | 'warning' | 'error' | 'critical';
}

class ErrorTracker {
  private errors: AppError[] = [];
  private maxErrors = 100; // Keep last 100 errors in memory
  
  constructor() {
    // Set up global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError.bind(this));
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }
  }

  private handleGlobalError(event: ErrorEvent) {
    // Skip generic "Script error." which happens with cross-origin scripts
    if (event.message === 'Script error.' && !event.error) {
      return;
    }
    
    this.logError(event.error || new Error(event.message), {
      feature: 'global',
      action: 'unhandled_error',
      component: 'window',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }, 'error');
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    this.logError(new Error(`Unhandled promise rejection: ${event.reason}`), {
      feature: 'global',
      action: 'unhandled_rejection',
      component: 'promise'
    }, 'error');
  }

  logError(
    error: Error | string, 
    context: Partial<ErrorContext> = {}, 
    level: AppError['level'] = 'error'
  ) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    const appError: AppError = {
      message: errorMessage,
      stack: errorStack,
      level,
      context: {
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? (window.navigator.userAgent || undefined) : undefined,
        url: typeof window !== 'undefined' ? (window.location.href || undefined) : undefined,
        ...context
      }
    };

    // Add to memory store
    this.errors.unshift(appError);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${level.toUpperCase()}: ${errorMessage}`);
      console.log('Context:', context);
      if (errorStack) console.log('Stack:', errorStack);
      console.groupEnd();
    }

    // Show user-friendly notification for critical errors
    if (level === 'critical') {
      toast.error('Something went wrong', {
        description: 'We\'ve been notified and are working on a fix.'
      });
    }

    // Send to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(appError);
    }
  }

  private async sendToExternalService(error: AppError) {
    try {
      // Implement integration with error tracking service like Sentry, LogRocket, etc.
      // Example:
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(error)
      // });
      
      // For now, just log to console in production
      console.error('Production error:', error);
    } catch (e) {
      console.warn('Failed to send error to external service:', e);
    }
  }

  getErrors(): AppError[] {
    return [...this.errors];
  }

  getErrorsByLevel(level: AppError['level']): AppError[] {
    return this.errors.filter(error => error.level === level);
  }

  getErrorsByFeature(feature: string): AppError[] {
    return this.errors.filter(error => error.context.feature === feature);
  }

  clearErrors() {
    this.errors = [];
  }

  // Helper methods for common error scenarios
  logWolfpackError(error: Error | string, action: string, context: Partial<ErrorContext> = {}) {
    this.logError(error, {
      ...context,
      feature: 'wolfpack',
      action
    });
  }

  logAuthError(error: Error | string, action: string, context: Partial<ErrorContext> = {}) {
    this.logError(error, {
      ...context,
      feature: 'authentication',
      action
    });
  }

  logLocationError(error: Error | string, action: string, context: Partial<ErrorContext> = {}) {
    this.logError(error, {
      ...context,
      feature: 'location',
      action
    });
  }

  logPaymentError(error: Error | string, action: string, context: Partial<ErrorContext> = {}) {
    this.logError(error, {
      ...context,
      feature: 'payment',
      action
    }, 'critical');
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

// Helper function for easier usage in components
export function trackError(
  error: Error | string,
  context?: Partial<ErrorContext>,
  level?: AppError['level']
) {
  errorTracker.logError(error, context, level);
}

// Wrapper for async functions to automatically catch and log errors
export function withErrorTracking<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context: Partial<ErrorContext>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      errorTracker.logError(error as Error, context);
      throw error; // Re-throw to maintain original behavior
    }
  };
}

// React error boundary helper
export function createErrorBoundary(fallbackComponent: React.ComponentType<{ error: Error }>) {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error?: Error }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      errorTracker.logError(error, {
        feature: 'react',
        action: 'component_error',
        component: errorInfo.componentStack || undefined
      }, 'critical');
    }

    render() {
      if (this.state.hasError && this.state.error) {
        return React.createElement(fallbackComponent, { error: this.state.error });
      }

      return this.props.children;
    }
  };
}