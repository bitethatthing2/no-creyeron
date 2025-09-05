'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to console
    console.error('ErrorBoundary caught error:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Here you could send the error to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleErrorRetry = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI for admin panel errors
      return (
        <div className="p-6 bg-destructive/10 rounded-lg border border-destructive/20">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-destructive mt-0.5" />
            <div>
              <h3 className="text-lg font-medium mb-2 text-destructive">Application Error</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We encountered an unexpected error. This may be due to connectivity issues or a temporary problem.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={this.handleErrorRetry}
                  variant="default"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>
                <p className="text-xs text-muted-foreground">
                  If this error persists, please refresh the page or contact support.
                </p>
                {process.env.NODE_ENV !== 'production' && this.state.error && (
                  <div className="mt-4 p-4 bg-muted text-left rounded-md overflow-auto max-w-full">
                    <p className="font-mono text-sm text-destructive mb-2">{this.state.error.toString()}</p>
                    <details>
                      <summary className="cursor-pointer text-xs text-muted-foreground">Stack trace</summary>
                      <pre className="mt-2 text-xs whitespace-pre-wrap overflow-auto max-h-48">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with ErrorBoundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ErrorBoundary;