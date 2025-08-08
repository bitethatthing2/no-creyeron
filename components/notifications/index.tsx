'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Export the notification context hooks
export { useNotifications, useSafeNotifications, NotificationProvider } from '@/lib/contexts/unified-notification-context';

// Export basic components
export { NotificationIndicator } from './NotificationIndicator';

// Export client components with dynamic imports
export const NotificationPopover = dynamic(() => import('./NotificationPopover'), {
  loading: () => (
    <div className="h-10 w-10 animate-pulse bg-muted rounded-full"></div>
  ),
  ssr: false
});
