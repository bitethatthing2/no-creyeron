'use client';

import { supabase } from '@/lib/supabase';
import * as React from 'react';
import { Unsubscribe } from 'firebase/messaging';
import { getMessagingInstance, fetchToken, requestNotificationPermission, setupForegroundMessageHandler } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
// Initialize Supabase client
// Global flags to prevent multiple operations
let isRegistrationInProgress = false;
let registrationPromise: Promise<string | null> | null = null;

// Create a Context to share token across components
interface FcmContextType {
  token: string | null;
  notificationPermissionStatus: NotificationPermission | null;
  isLoading: boolean;
  error: string | null;
  registerToken: () => Promise<string | null>;
}

const FcmContext = React.createContext<FcmContextType>({
  token: null,
  notificationPermissionStatus: null,
  isLoading: false,
  error: null,
  registerToken: async () => null
});

// Export hook to use the FCM Context
export const useFcmContext = () => React.useContext(FcmContext);

// Helper to store token in Supabase
const storeTokenInSupabase = async (tokenToStore: string): Promise<boolean> => {
  if (!tokenToStore) return false;
  
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return false;
    }

    // Get the user's profile to get their actual user ID
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return false;
    }

    // Build device info
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform || 'web',
      language: navigator.language,
      vendor: navigator.vendor,
      screen: {
        width: window.screen.width,
        height: window.screen.height
      }
    };

    // Use the upsert_fcm_token RPC function
    const { error } = await supabase
      .rpc('upsert_fcm_token', {
        p_user_id: profile.id,
        p_token: tokenToStore,
        p_device_info: deviceInfo,
        p_platform: 'web'
      });

    if (error) {
      console.error('Error storing FCM token:', error);
      return false;
    }

    console.log('FCM token stored successfully');
    
    // Topic subscription removed as it requires Firebase Admin SDK
    // This should be handled server-side if needed
    return true;
  } catch (error) {
    console.error('Error storing FCM token:', error);
    return false;
  }
};

// Topic subscription removed - requires Firebase Admin SDK on server-side

// Export this function to be used by other components that need to get permission and token
export async function getNotificationPermissionAndToken(): Promise<string | null> {
  // If registration is already in progress, return the existing promise
  if (isRegistrationInProgress && registrationPromise) {
    return registrationPromise;
  }
  
  // Set registration in progress flag
  isRegistrationInProgress = true;
  
  // Create a new registration promise
  registrationPromise = (async () => {
    try {
      // Request permission first
      const permissionResult = await requestNotificationPermission();
      if (permissionResult !== 'granted') {
        console.log('Notification permission was not granted.');
        return null;
      }

      // Then get token
      const token = await fetchToken();
      if (!token) {
        return null;
      }

      // Store token in Supabase
      await storeTokenInSupabase(token);
      
      return token;
    } catch (error) {
      console.error('Error getting notification permission or token:', error);
      return null;
    } finally {
      // Reset registration in progress flag
      isRegistrationInProgress = false;
    }
  })();
  
  return registrationPromise;
}

export function useFcmToken() {
  const [token, setToken] = React.useState<string | null>(null);
  const [notificationPermissionStatus, setNotificationPermissionStatus] = React.useState<NotificationPermission | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const messageHandlerRef = React.useRef<Unsubscribe | null>(null);
  const hasRegisteredLocallyRef = React.useRef(false);
  const router = useRouter();

  // Check permission state on mount
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkPermission = async () => {
      try {
        if (!('Notification' in window)) {
          setNotificationPermissionStatus('denied');
          return;
        }
        
        // Get current permission state
        const permissionState = Notification.permission as NotificationPermission;
        setNotificationPermissionStatus(permissionState);
      } catch (err) {
        console.error('Error checking notification permission:', err);
      }
    };
    
    checkPermission();
  }, []);

  // Setup message handlers if permission is granted
  React.useEffect(() => {
    // Skip setup if not in browser or already registered
    if (typeof window === 'undefined' || hasRegisteredLocallyRef.current) return;
    
    // Only proceed if notification permission is granted or if Notification API directly reports granted
    if (notificationPermissionStatus !== 'granted' && 
        !(window.Notification && Notification.permission === 'granted')) {
      return;
    }
    
    // Set up foreground message handler
    const setupMessageHandler = async () => {
      try {
        const messaging = getMessagingInstance();
        if (!messaging) return;
        
        // Clear previous handler if it exists
        if (messageHandlerRef.current) {
          messageHandlerRef.current();
          messageHandlerRef.current = null;
        }
        
        // Create new handler
        messageHandlerRef.current = setupForegroundMessageHandler(messaging, (payload) => {
          console.log('Foreground message received:', payload);
          
          // Extract data from payload
          const notification = payload.notification || {};
          const data = payload.data || {};
          const title = notification.title || data.title || 'New Notification';
          const body = notification.body || data.body || '';
          const link = data.link || '/';
          
          // Show toast notification for foreground messages
          toast(
            <div className="flex flex-col gap-1">
              <div className="font-medium">{title}</div>
              <div className="text-sm text-muted-foreground">{body}</div>
            </div>,
            {
              duration: 8000,
              action: {
                label: "View",
                onClick: () => {
                  if (link) {
                    if (link.startsWith('http')) {
                      window.open(link, '_blank');
                    } else {
                      router.push(link);
                    }
                  }
                }
              }
            }
          );
        });
        
      } catch (error) {
        console.error('Error setting up foreground message handler:', error);
      }
    };
    
    // Mark as registered to prevent duplicate registrations
    hasRegisteredLocallyRef.current = true;
    
    // Set up the handler
    setupMessageHandler();
    
    // Cleanup on unmount
    return () => {
      if (messageHandlerRef.current) {
        messageHandlerRef.current = null;
      }
    };
  }, [notificationPermissionStatus, router]);

  // Handle token registration
  const registerToken = async (): Promise<string | null> => {
    // Prevent multiple registrations
    if (isLoading) return null;
    if (token) return token;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if browser supports notifications
      if (typeof window === 'undefined' || !('Notification' in window)) {
        throw new Error('This browser does not support notifications');
      }
      
      // Request permission if not already granted
      let permissionStatus = Notification.permission;
      if (permissionStatus !== 'granted') {
        permissionStatus = await Notification.requestPermission();
        setNotificationPermissionStatus(permissionStatus);
      }
      
      if (permissionStatus !== 'granted') {
        // Permission denied
        return null;
      }
      
      // Get FCM token using the centralized implementation
      const newToken = await getNotificationPermissionAndToken();
      if (!newToken) {
        throw new Error('Failed to get FCM token');
      }
      
      // Update state with new token
      setToken(newToken);
      return newToken;
    } catch (err) {
      console.error('Error registering FCM token:', err);
      setError(err instanceof Error ? err.message : 'Failed to register for notifications');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    token,
    notificationPermissionStatus,
    isLoading,
    error,
    registerToken
  };
}

// Provider component to wrap your app
export function FcmProvider({ children }: { children: React.ReactNode }) {
  const fcmState = useFcmToken();
  
  return (
    <FcmContext.Provider value={fcmState}>
      {children}
    </FcmContext.Provider>
  );
}