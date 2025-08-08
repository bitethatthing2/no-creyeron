'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/lib/services/unified-notification.service';

export function UnifiedNotificationInit() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Initialize notification service when user is authenticated
      notificationService.initialize().catch(console.error);
    }
  }, [user]);

  return null; // This component doesn't render anything
}

export default UnifiedNotificationInit;