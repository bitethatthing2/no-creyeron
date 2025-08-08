'use client';

import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Bell } from "lucide-react";
import { onAppInstalled } from '@/lib/pwa/pwaEventHandler';

export function PwaStatusToast() {
  const { toast } = useToast();
  const [hasShownNotificationToast, setHasShownNotificationToast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register for appinstalled events - but don't show a toast here
    // The PwaInstallGuide component will handle showing the installation success toast
    const unregisterAppInstalled = onAppInstalled(() => {
      // Just update localStorage to prevent showing again
      try {
        localStorage.setItem('pwa-install-toast-shown', 'true');
      } catch (error) {
        console.error('[PwaStatusToast] Error updating localStorage:', error);
      }
    });

    // Check if notification permission was granted
    const checkNotificationPermission = () => {
      if ('Notification' in window && 
          Notification.permission === 'granted' && 
          !hasShownNotificationToast &&
          !localStorage.getItem('pwa-notification-toast-shown')) {
        
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive updates about events, promotions, and your orders.",
          duration: 5000,
          className: "bg-background text-foreground border border-input",
          action: (
            <div className="h-5 w-5 text-foreground">
              <Bell className="h-full w-full" />
            </div>
          ),
        });
        
        setHasShownNotificationToast(true);
        
        // Save to localStorage to prevent showing again
        try {
          localStorage.setItem('pwa-notification-toast-shown', 'true');
        } catch (error) {
          console.error('[PwaStatusToast] Error updating localStorage:', error);
        }
      }
    };

    // Check notification permission on mount and when it changes
    checkNotificationPermission();
    
    // Listen for permission changes using the Permissions API if available
    let permissionStatus: PermissionStatus | null = null;
    
    const handlePermissionChange = () => {
      checkNotificationPermission();
    };
    
    // Use the Permissions API to listen for notification permission changes
    if ('permissions' in navigator && 'query' in navigator.permissions) {
      navigator.permissions.query({ name: 'notifications' as PermissionName })
        .then((status) => {
          permissionStatus = status;
          status.addEventListener('change', handlePermissionChange);
        })
        .catch((error) => {
          console.warn('[PwaStatusToast] Permissions API not fully supported:', error);
        });
    }

    return () => {
      unregisterAppInstalled();
      if (permissionStatus) {
        permissionStatus.removeEventListener('change', handlePermissionChange);
      }
    };
  }, [toast, hasShownNotificationToast]);

  return null; // This component doesn't render anything
}
