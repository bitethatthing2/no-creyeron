'use client';

import React, { ReactNode } from 'react';
import dynamic from 'next/dynamic';

/**
 * Generic client component wrapper that ensures proper code splitting
 * and consistent error handling for client-side components
 */
interface ClientComponentWrapperProps {
  children: ReactNode;
}

/**
 * Wraps client components to ensure they're properly code-split
 * and only loaded on the client side
 */
export function ClientComponentWrapper({
  children
}: ClientComponentWrapperProps) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error boundary component for catching client-side rendering errors
 */
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Client component error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
          <p className="text-sm text-red-600 mt-1">
            {this.state.error?.message || 'An unknown error occurred'}
          </p>
          <button
            className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Creates a dynamically imported client component that's only loaded on the client side
 */
export function createClientComponent<T extends React.JSX.IntrinsicAttributes>(
  importFunc: () => Promise<{ default: React.ComponentType<T> }>,
  displayName: string,
  loadingComponent: ReactNode = <div>Loading {displayName}...</div>
) {
  const Component = dynamic(importFunc, {
    loading: () => <>{loadingComponent}</>,
    ssr: false
  });

  // Create a wrapper that includes the error boundary
  const WrappedComponent = (props: T) => (
    <ClientComponentWrapper>
      <Component {...props} />
    </ClientComponentWrapper>
  );

  // Set a display name for easier debugging
  WrappedComponent.displayName = `ClientComponent(${displayName})`;

  return WrappedComponent;
}
