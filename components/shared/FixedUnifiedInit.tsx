'use client';

import * as React from 'react';
import { FixedNotificationService } from '@/lib/services/fixed-notification.service';
import { FixedLikesService } from '@/lib/services/fixed-likes.service';

// Global services instance
declare global {
  interface Window {
    fixedNotificationService?: FixedNotificationService;
    fixedLikesService?: FixedLikesService;
  }
}

export default function FixedUnifiedInit() {
  const [initialized, setInitialized] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('Initializing fixed unified services...');
        
        // Initialize notification service (non-blocking)
        const notificationService = new FixedNotificationService();
        window.fixedNotificationService = notificationService;
        
        try {
          const fcmInitialized = await notificationService.initialize();
          if (fcmInitialized) {
            console.log('✅ FCM initialized successfully');
          } else {
            console.log('⚠️ FCM initialization failed, but app continues without notifications');
          }
        } catch (fcmError) {
          console.warn('FCM initialization error (non-blocking):', fcmError);
        }
        
        // Initialize likes service
        const likesService = new FixedLikesService();
        window.fixedLikesService = likesService;
        console.log('✅ Likes service initialized');
        
        setInitialized(true);
        console.log('🚀 Fixed unified services initialized successfully');
        
      } catch (error) {
        console.error('❌ Error during service initialization:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        
        // Still mark as initialized so app can continue
        setInitialized(true);
      }
    };

    // Only initialize once
    if (!initialized && typeof window !== 'undefined') {
      initializeServices();
    }
  }, [initialized]);

  // Optional: Show initialization status (remove in production)
  if (process.env.NODE_ENV === 'development') {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        right: 0, 
        zIndex: 9999, 
        background: 'rgba(0,0,0,0.8)', 
        color: 'white', 
        padding: '8px', 
        fontSize: '12px',
        display: initialized ? 'none' : 'block'
      }}>
        {error ? `❌ Init Error: ${error}` : '🔄 Initializing services...'}
      </div>
    );
  }

  return null;
}

// Hook for easy access to services
export function useFixedServices() {
  const [servicesReady, setServicesReady] = React.useState(false);

  React.useEffect(() => {
    const checkServices = () => {
      if (typeof window !== 'undefined' && 
          window.fixedLikesService && 
          window.fixedNotificationService) {
        setServicesReady(true);
      } else {
        // Check again in 100ms
        setTimeout(checkServices, 100);
      }
    };

    checkServices();
  }, []);

  return {
    likesService: typeof window !== 'undefined' ? window.fixedLikesService : null,
    notificationService: typeof window !== 'undefined' ? window.fixedNotificationService : null,
    ready: servicesReady
  };
}