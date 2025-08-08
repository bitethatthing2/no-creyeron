'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useFcmContext, getNotificationPermissionAndToken } from '@/lib/hooks/useFcmToken';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NotificationGuideProps {
  variant?: 'button' | 'icon' | 'minimal';
  className?: string;
}

export default function NotificationGuide({ 
  variant = 'button',
  className = ''
}: NotificationGuideProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isBrowserSupported, setIsBrowserSupported] = useState(false);
  const { notificationPermissionStatus: permissionState, registerToken } = useFcmContext();

  // Check browser support in useEffect to prevent hydration mismatch
  useEffect(() => {
    setIsBrowserSupported('Notification' in window);
  }, []);

  // Request notification permission and register FCM token
  const handleRequestPermission = async () => {
    if (!isBrowserSupported) return;
    
    setIsLoading(true);
    try {
      // Trigger native permission dialog
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Register token using context method
        const token = await registerToken();
        
        if (token) {
          console.log('FCM token registered successfully');
          toast.success('Notifications enabled', {
            description: 'You will now receive important updates and announcements',
            duration: 5000,
          });
        } else {
          console.warn('Failed to register FCM token');
          toast.error('Could not enable notifications', {
            description: 'Please try again or check your browser settings',
            duration: 5000,
          });
        }
      } else if (permission === 'denied') {
        toast.error('Notifications blocked', {
          description: 'Please enable notifications in your browser settings',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Something went wrong', {
        description: 'Could not enable notifications',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render based on variant
  if (variant === 'button') {
    return (
      <Button 
        onClick={handleRequestPermission}
        className={cn(
          "gap-2",
          permissionState === 'granted' ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground",
          className
        )}
        disabled={permissionState === 'granted' || isLoading}
      >
        <Bell className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
        {isLoading 
          ? 'Enabling...' 
          : permissionState === 'granted' 
            ? 'Notifications Enabled' 
            : 'Enable Notifications'
        }
      </Button>
    );
  }

  if (variant === 'icon') {
    return (
      <Button 
        className={cn(
          "p-0 h-9 w-9 rounded-full",
          permissionState === 'granted' ? "bg-green-500 hover:bg-green-600" : "",
          className
        )}
        onClick={handleRequestPermission}
        disabled={permissionState === 'granted' || isLoading}
        aria-label={permissionState === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
      >
        <Bell className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
      </Button>
    );
  }

  // Minimal variant
  return (
    <button
      onClick={handleRequestPermission}
      disabled={permissionState === 'granted' || isLoading}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium",
        permissionState === 'granted' ? "text-green-500" : "",
        permissionState === 'granted' || isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      <Bell className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
      {isLoading 
        ? 'Enabling...' 
        : permissionState === 'granted' 
          ? 'Notifications Enabled' 
          : 'Enable Notifications'
      }
    </button>
  );
}
