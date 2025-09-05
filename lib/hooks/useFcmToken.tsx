import { useMemo, useCallback, useEffect } from 'react';
import { 
  useToggle, 
  useLocalStorage, 
  useDebounceCallback, 
  useInterval, 
  useIsClient, 
  useIsMounted 
} from 'usehooks-ts';
import { supabase } from '@/lib/supabase';
import { 
  getMessagingInstance, 
  fetchToken, 
  requestNotificationPermission, 
  setupForegroundMessageHandler 
} from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Types for better type safety
interface NotificationState {
  token: string | null;
  permission: NotificationPermission | null;
  isLoading: boolean;
  error: string | null;
  lastRefresh: number;
  retryCount: number;
}

interface DeviceInfo {
  device_id: string;
  userAgent?: string;
  platform?: string;
  language?: string;
  screen?: {
    width: number;
    height: number;
  };
  browser?: string;
  os?: string;
}

interface FCMTokenResponse {
  success: boolean;
  token?: string;
  message?: string;
  error?: string;
}

// Constants
const TOKEN_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
const TOKEN_VALIDITY_PERIOD = 24 * 60 * 60 * 1000; // 24 hours
const HEALTH_CHECK_INTERVAL = 60 * 1000; // 1 minute
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * Custom hook for managing FCM (Firebase Cloud Messaging) tokens
 * Handles registration, storage, refresh, and notification setup
 */
export function useFcmToken() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const isClient = useIsClient();
  const isMounted = useIsMounted();
  
  // Persistent state with auto-expiry and retry logic
  const [state, setState] = useLocalStorage<NotificationState>('fcm-token-state', {
    token: null,
    permission: null,
    isLoading: false,
    error: null,
    lastRefresh: 0,
    retryCount: 0
  });
  
  const [isRegistering, toggleIsRegistering, setIsRegistering] = useToggle(false);

  /**
   * Generate device information for tracking
   */
  const getDeviceInfo = useCallback((): DeviceInfo => {
    if (!isClient) {
      return { device_id: `web-${Date.now()}` };
    }

    const userAgent = navigator.userAgent;
    const deviceId = localStorage.getItem('device-id') || `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store device ID for consistency
    if (!localStorage.getItem('device-id')) {
      localStorage.setItem('device-id', deviceId);
    }

    // Parse browser and OS info from userAgent
    const getBrowserInfo = () => {
      if (userAgent.includes('Chrome')) return 'Chrome';
      if (userAgent.includes('Safari')) return 'Safari';
      if (userAgent.includes('Firefox')) return 'Firefox';
      if (userAgent.includes('Edge')) return 'Edge';
      return 'Unknown';
    };

    const getOSInfo = () => {
      if (userAgent.includes('Windows')) return 'Windows';
      if (userAgent.includes('Mac')) return 'MacOS';
      if (userAgent.includes('Linux')) return 'Linux';
      if (userAgent.includes('Android')) return 'Android';
      if (userAgent.includes('iOS')) return 'iOS';
      return 'Unknown';
    };

    return {
      device_id: deviceId,
      userAgent,
      platform: navigator.platform || 'web',
      language: navigator.language,
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      browser: getBrowserInfo(),
      os: getOSInfo()
    };
  }, [isClient]);

  /**
   * Store FCM token in Supabase using RPC function
   * Debounced to prevent excessive database calls
   */
  const storeTokenInSupabase = useDebounceCallback(async (
    tokenToStore: string,
    retryAttempt = 0
  ): Promise<boolean> => {
    if (!currentUser?.id || !tokenToStore) {
      console.warn('Missing user ID or token for storage');
      return false;
    }

    try {
      const deviceInfo = getDeviceInfo();

      // Call the RPC function that exists in your database
      const { data, error } = await supabase.rpc('upsert_fcm_token', {
        p_token: tokenToStore,
        p_platform: 'web',
        p_device_info: deviceInfo
      }) as { data: FCMTokenResponse | null; error: any };

      if (error) {
        throw error;
      }

      if (data?.success) {
        console.log('FCM token stored successfully');
        setState(prev => ({ ...prev, retryCount: 0 }));
        return true;
      }

      throw new Error(data?.error || 'Failed to store token');
    } catch (err) {
      console.error('Error storing FCM token:', err);
      
      // Retry logic
      if (retryAttempt < MAX_RETRY_ATTEMPTS) {
        console.log(`Retrying token storage (attempt ${retryAttempt + 1}/${MAX_RETRY_ATTEMPTS})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        const result = await storeTokenInSupabase(tokenToStore, retryAttempt + 1);
        return result ?? false;
      }

      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Storage failed',
        retryCount: retryAttempt
      }));
      return false;
    }
  }, 1000);

  /**
   * Setup notification click handlers for foreground messages
   */
  const setupNotificationHandlers = useCallback((messaging: any) => {
    setupForegroundMessageHandler(messaging, (payload) => {
      // Extract notification data from different payload structures
      const title = payload.data?.title || 
                   payload.notification?.title || 
                   'New Notification';
      
      const body = payload.data?.body || 
                  payload.notification?.body || 
                  payload.data?.message || 
                  '';
      
      const actionUrl = payload.data?.action_url || 
                       payload.fcmOptions?.link || 
                       (payload.data?.content_type ? 
                         `/${payload.data.content_type}/${payload.data.content_id}` : 
                         '/notifications');

      // Show toast notification with action button
      toast(title, {
        description: body,
        duration: 5000,
        action: {
          label: 'View',
          onClick: () => {
            // Track notification click
            if (currentUser?.id) {
              supabase.from('notifications')
                .update({ 
                  is_read: true, 
                  read_at: new Date().toISOString() 
                })
                .eq('recipient_id', currentUser.id)
                .eq('title', title)
                .gte('created_at', new Date(Date.now() - 60000).toISOString());
            }
            router.push(actionUrl);
          }
        }
      });
    });
  }, [currentUser?.id, router]);

  /**
   * Main token registration function
   * Handles permission request, token fetch, and storage
   */
  const registerToken = useCallback(async (): Promise<string | null> => {
    // Validation checks
    if (!isClient) {
      console.log('Not in client environment, skipping registration');
      return null;
    }

    if (!currentUser) {
      console.log('No authenticated user, skipping registration');
      return null;
    }

    if (isRegistering) {
      console.log('Registration already in progress');
      return null;
    }

    console.log('Starting FCM token registration...');
    setIsRegistering(true);
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Step 1: Request notification permission
      const permission = await requestNotificationPermission();
      setState(prev => ({ ...prev, permission }));
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied. Please enable notifications in your browser settings.');
      }

      // Step 2: Get FCM token
      const token = await fetchToken();
      if (!token) {
        throw new Error('Failed to get FCM token. Please check your Firebase configuration.');
      }

      console.log('FCM token obtained successfully');

      // Step 3: Store token optimistically in local state
      setState(prev => ({ 
        ...prev, 
        token, 
        lastRefresh: Date.now(),
        isLoading: false,
        error: null,
        retryCount: 0
      }));

      // Step 4: Store token in database (async, don't wait)
      storeTokenInSupabase(token)?.catch(err => {
        console.error('Background token storage failed:', err);
      });

      // Step 5: Setup message handlers
      const messaging = getMessagingInstance();
      if (messaging) {
        setupNotificationHandlers(messaging);
      }

      return token;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      console.error('FCM registration error:', errorMessage);
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false,
        retryCount: prev.retryCount + 1
      }));
      
      // Show user-friendly error toast
      if (errorMessage.includes('permission')) {
        toast.error('Notifications Disabled', {
          description: 'Please enable notifications in your browser settings to receive updates.'
        });
      }
      
      return null;
    } finally {
      setIsRegistering(false);
    }
  }, [
    currentUser, 
    isClient, 
    isRegistering, 
    setState, 
    setIsRegistering, 
    storeTokenInSupabase,
    setupNotificationHandlers
  ]);

  /**
   * Manual token refresh function
   */
  const refreshToken = useCallback(async (): Promise<string | null> => {
    console.log('Manually refreshing FCM token...');
    setState(prev => ({ ...prev, token: null, lastRefresh: 0 }));
    return registerToken();
  }, [registerToken, setState]);

  /**
   * Check if token needs refresh
   */
  const shouldRefreshToken = useMemo(() => {
    const now = Date.now();
    const timeSinceRefresh = now - state.lastRefresh;
    return timeSinceRefresh > TOKEN_REFRESH_INTERVAL && state.token && !isRegistering;
  }, [state.lastRefresh, state.token, isRegistering]);

  /**
   * Auto-refresh token at intervals
   */
  useInterval(() => {
    if (shouldRefreshToken && isMounted()) {
      console.log('Auto-refreshing FCM token...');
      registerToken();
    }
  }, HEALTH_CHECK_INTERVAL);

  /**
   * Initial registration on mount
   */
  useEffect(() => {
    if (isClient && currentUser && !state.token && !isRegistering && isMounted()) {
      // Add a small delay to ensure Firebase is initialized
      const timer = setTimeout(() => {
        registerToken();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentUser, isClient, isMounted, state.token, isRegistering, registerToken]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Clean up any pending operations
      if (isRegistering) {
        setIsRegistering(false);
      }
    };
  }, [isRegistering, setIsRegistering]);

  // Public API
  return {
    // Token and permission state
    token: state.token,
    notificationPermissionStatus: state.permission,
    hasPermission: state.permission === 'granted',
    
    // Loading and error states
    isLoading: state.isLoading || isRegistering,
    error: state.error,
    retryCount: state.retryCount,
    
    // Token validity
    isTokenValid: !!(state.token && Date.now() - state.lastRefresh < TOKEN_VALIDITY_PERIOD),
    lastRefresh: state.lastRefresh,
    
    // Actions
    registerToken,
    refreshToken,
    
    // Utility functions
    clearError: () => setState(prev => ({ ...prev, error: null })),
    resetState: () => setState({
      token: null,
      permission: null,
      isLoading: false,
      error: null,
      lastRefresh: 0,
      retryCount: 0
    })
  };
}

// Export as default for easier imports
export default useFcmToken;

// Also export as named export for compatibility
export const useFcmContext = useFcmToken;