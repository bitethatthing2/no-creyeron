'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useFcmContext } from '@/lib/hooks/useFcmToken';
import { toast } from "sonner";

export function FcmTokenRegistration() {
  const { token, notificationPermissionStatus, registerToken, isLoading } = useFcmContext();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isBrowserSupported, setIsBrowserSupported] = useState(false);
  
  // Check browser support in useEffect to avoid hydration mismatch
  useEffect(() => {
    setIsBrowserSupported('Notification' in window);
  }, []);
  
  // Use the permission from context
  const permission = notificationPermissionStatus || 'default';
  
  // Handle permission request and token registration using the centralized context
  const handleEnableNotifications = async () => {
    if (!isBrowserSupported || permission !== 'default') return;
    
    setIsRegistering(true);
    
    try {
      // Use the centralized token registration from context
      const fcmToken = await registerToken();
      
      if (fcmToken) {
        toast.success("Notifications enabled successfully", {
          description: "You'll receive important updates and announcements",
          duration: 5000,
        });
      } else {
        // Check current permission after registration attempt
        const currentPermission = Notification.permission;
        if (currentPermission === 'denied') {
          toast.error("Notifications blocked", {
            description: "Please enable notifications in your browser settings to receive updates",
            duration: 5000,
          });
        } else {
          toast.error("Couldn't enable notifications", {
            description: "Please try again or check your browser settings",
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error("Something went wrong", {
        description: "Couldn't enable notifications. Please try again later.",
        duration: 5000,
      });
    } finally {
      setIsRegistering(false);
    }
  };
  
  // Determine the button state and text
  let buttonText = 'Enable Notifications';
  let buttonDisabled = false;
  let statusText = '';
  
  if (!isBrowserSupported) {
    buttonText = 'Notifications Not Supported';
    buttonDisabled = true;
    statusText = 'Your browser does not support notifications';
  } else if (permission === 'granted' && token) {
    buttonText = 'Notifications Enabled';
    buttonDisabled = true;
    statusText = 'You will receive notifications for new updates';
  } else if (permission === 'denied') {
    buttonText = 'Notifications Blocked';
    buttonDisabled = true;
    statusText = 'Please enable notifications in your browser settings';
  }
  
  return (
    <div className="p-4 bg-card rounded-lg border shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Push Notifications</h3>
      
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {statusText || 'Get notified about new announcements and updates'}
        </p>
      </div>
      
      <Button 
        className={`w-full py-2 ${permission === 'granted' ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'}`}
        disabled={buttonDisabled || isRegistering || isLoading}
        onClick={handleEnableNotifications}
      >
        <Bell className={`mr-2 h-4 w-4 ${(isRegistering || isLoading) ? 'animate-pulse' : ''}`} />
        {isRegistering || isLoading ? 'Enabling...' : buttonText}
      </Button>
    </div>
  );
}
