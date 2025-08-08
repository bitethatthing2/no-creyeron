'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary specifically for notification-related errors
 * Prevents the entire app from crashing when notification context issues occur
 */
export class NotificationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a notification context error
    if (error.message.includes('useNotifications must be used within a UnifiedNotificationProvider')) {
      console.warn('Notification context error caught by error boundary:', error.message);
      return { hasError: true, error };
    }
    
    // For other errors, let them bubble up
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('NotificationErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Return fallback UI or null to hide the component
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}

export default NotificationErrorBoundary;
