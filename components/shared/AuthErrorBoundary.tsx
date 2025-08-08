'use client';

import React from 'react';
import { cleanupAndResetAuth } from '@/lib/utils/cookie-utils';
import { supabase } from '@/lib/supabase';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
}

export class AuthErrorBoundary extends React.Component<
  AuthErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Check if it's an auth-related error
    if (
      error.message.includes('auth') ||
      error.message.includes('cookie') ||
      error.message.includes('atob') ||
      error.message.includes('base64') ||
      error.message.includes('JWT') ||
      error.message.includes('token')
    ) {
      console.error('Auth error caught:', error);
      // Attempt to fix it automatically in background
      this.handleAuthError();
    }
  }

  handleAuthError = async () => {
    await cleanupAndResetAuth(supabase);
  };

  render() {
    if (this.state.hasError) {
      const isAuthError = this.state.error && (
        this.state.error.message.includes('auth') ||
        this.state.error.message.includes('cookie') ||
        this.state.error.message.includes('atob') ||
        this.state.error.message.includes('base64') ||
        this.state.error.message.includes('JWT') ||
        this.state.error.message.includes('token')
      );

      if (isAuthError) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-black">
            <div className="max-w-md w-full bg-gray-900 rounded-lg shadow-xl p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <h2 className="text-xl font-bold text-white">Authentication Error</h2>
              </div>
              <p className="text-gray-300 mb-6">
                We detected an issue with your authentication session. This usually happens when cookies become corrupted.
              </p>
              <div className="space-y-3">
                <button
                  onClick={this.handleAuthError}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Clear Session and Reload
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Just Reload Page
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Error: {this.state.error?.message}
              </p>
            </div>
          </div>
        );
      }

      // For non-auth errors, show a generic error boundary
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black">
          <div className="max-w-md w-full bg-gray-900 rounded-lg shadow-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
              <h2 className="text-xl font-bold text-white">Something went wrong</h2>
            </div>
            <p className="text-gray-300 mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Reload Page
            </button>
            {this.state.error && (
              <details className="mt-4">
                <summary className="text-xs text-gray-500 cursor-pointer">Error details</summary>
                <pre className="text-xs text-gray-400 mt-2 p-2 bg-gray-800 rounded overflow-auto">
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