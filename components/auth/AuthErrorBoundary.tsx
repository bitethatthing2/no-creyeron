'use client';

import React from 'react';

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class AuthErrorBoundary extends React.Component<
  { children: React.ReactNode },
  AuthErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AUTH ERROR BOUNDARY] Authentication error:', error, errorInfo);
    
    // You could send this to an error reporting service
    if (typeof window !== 'undefined') {
      // Clear any corrupted auth storage
      try {
        localStorage.removeItem('wolfpack-auth');
        localStorage.removeItem('wolfpack-user-cache');
      } catch (e) {
        console.error('Failed to clear auth storage:', e);
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    
    // Reload the page to reset auth state
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-md mx-auto text-center">
            <div className="text-6xl mb-6">🐺</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Authentication Error
            </h1>
            <p className="text-gray-400 mb-6">
              Something went wrong with the authentication system. This usually happens when there's corrupted session data.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={this.handleRetry}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Clear Cache & Retry
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Go to Home
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer mb-2">
                  Error Details (Development)
                </summary>
                <pre className="bg-gray-900 p-4 rounded text-xs text-red-400 overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}