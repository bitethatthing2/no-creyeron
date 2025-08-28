'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function UnifiedNotificationInit() {
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) {
      // TODO: Re-implement notification service after backend cleanup
      console.log('Notification service disabled during cleanup');
    }
  }, [user]);

  return null; // This component doesn't render anything
}

export default UnifiedNotificationInit;