'use client';

import * as React from 'react';

export function PwaInitializer() {
  const [updatePromptShown, setUpdatePromptShown] = React.useState(false);
  
  React.useEffect(() => {
    // TEMPORARILY DISABLED - Service worker causing update loop
    return;
    
    // Initialize service worker for PWA functionality
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        })
        .then(registration => {
          console.log('[PWA] Service Worker registered:', registration);
          
          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available, show update notification only once
                  if (!updatePromptShown) {
                    setUpdatePromptShown(true);
                    showUpdateAvailable(newWorker);
                  }
                }
              });
            }
          });
        })
        .catch(error => {
          console.error('[PWA] Service Worker registration failed:', error);
        });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', event => {
        const { type, data } = event.data;
        console.log('[PWA] Message from SW:', type, data);
        
        switch (type) {
          case 'SYNC_SOCIAL_ACTIONS':
            // Handle social action sync
            break;
          default:
            break;
        }
      });
    }

    // Handle install prompt
    let deferredPrompt: any;
    
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = e;
      console.log('[PWA] Install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handle app installation
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App was installed');
      deferredPrompt = null;
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return null; // This component doesn't render anything
}

let updateNotificationShown = false;

function showUpdateAvailable(newWorker: ServiceWorker) {
  // Prevent multiple update notifications
  if (updateNotificationShown) {
    return;
  }
  updateNotificationShown = true;
  
  // Use setTimeout to debounce and prevent immediate prompts
  setTimeout(() => {
    if (confirm('New version available! Update now?')) {
      newWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    } else {
      // Reset the flag after user declines, but wait before allowing another prompt
      setTimeout(() => {
        updateNotificationShown = false;
      }, 60000); // Wait 1 minute before allowing another prompt
    }
  }, 1000); // Wait 1 second before showing prompt
}
