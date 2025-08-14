'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { initPwaEventListeners, refreshInstallationState } from '@/lib/pwa/pwaEventHandler';

export function PwaInitializer() {
  const pathname = usePathname();

  React.useEffect(() => {
    // Initialize PWA functionality early to prevent duplicate handlers
    try {
      initPwaEventListeners();
    } catch (error) {
      console.error('Failed to initialize PWA:', error);
    }
  }, []);

  // Handle route changes
  React.useEffect(() => {
    // Refresh PWA state on route changes to handle navigation scenarios
    try {
      refreshInstallationState();
    } catch (error) {
      console.error('Failed to refresh PWA state on route change:', error);
    }
  }, [pathname]);

  return null; // This component doesn't render anything
}
