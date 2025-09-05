import { useMemo, useCallback } from 'react';
import { useToggle, useLocalStorage, useDebounceCallback, useInterval, useIsClient, useIsMounted } from 'usehooks-ts';
import { supabase } from '@/lib/supabase';
import { getMessagingInstance, fetchToken, requestNotificationPermission, setupForegroundMessageHandler } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface NotificationState {
  token: string | null;
  permission: NotificationPermission | null;
  isLoading: boolean;
  error: string | null;
  lastRefresh: number;
}

// Dramatically simplified FCM hook using usehooks-ts
export function useFcmToken() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const isClient = useIsClient();
  const isMounted = useIsMounted();
  
  // Persistent state with auto-expiry
  const [state, setState] = useLocalStorage<NotificationState>('fcm-token-state', {
    token: null,
    permission: null,
    isLoading: false,
    error: null,
    lastRefresh: 0
  });
  
  const [isRegistering, setIsRegistering, toggleRegistering] = useToggle(false);

  // Auto-store token in database with debouncing
  const storeTokenInSupabase = useDebounceCallback(async (tokenToStore: string) => {
    if (!currentUser?.id || !tokenToStore) return false;

    try {
      const deviceInfo = isClient ? {
        userAgent: navigator.userAgent,
        platform: navigator.platform || 'web',
        language: navigator.language,
        screen: { width: window.screen.width, height: window.screen.height }
      } : {};

      const { error } = await supabase.rpc('upsert_fcm_token', {
        p_user_id: currentUser.id,
        p_token: tokenToStore,
        p_device_info: deviceInfo,
        p_platform: 'web'
      });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error storing FCM token:', err);
      setState(prev => ({ ...prev, error: err instanceof Error ? err.message : 'Storage failed' }));
      return false;
    }
  }, 1000);

  // Register token with optimistic updates
  const registerToken = useCallback(async (): Promise<string | null> => {
    if (!isClient || !currentUser || isRegistering) return null;

    setIsRegistering(true);
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request permission
      const permission = await requestNotificationPermission();
      setState(prev => ({ ...prev, permission }));
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Get token
      const token = await fetchToken();
      if (!token) {
        throw new Error('Failed to get FCM token');
      }

      // Store optimistically
      setState(prev => ({ 
        ...prev, 
        token, 
        lastRefresh: Date.now(),
        isLoading: false,
        error: null 
      }));

      // Store in database (debounced)
      await storeTokenInSupabase(token);

      // Setup foreground message handler
      if (isClient) {
        const messaging = getMessagingInstance();
        if (messaging) {
          setupForegroundMessageHandler(messaging, (payload) => {
            const title = payload.data?.title || payload.notification?.title || 'New Notification';
            const body = payload.data?.body || payload.notification?.body || '';
            const url = payload.data?.action_url || payload.fcmOptions?.link || '/notifications';
            
            toast(title, {
              description: body,
              action: {
                label: 'View',
                onClick: () => router.push(url)
              }
            });
          });
        }
      }

      return token;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Registration failed';
      setState(prev => ({ ...prev, error, isLoading: false }));
      return null;
    } finally {
      setIsRegistering(false);
    }
  }, [currentUser, isClient, isRegistering, router, setState, setIsRegistering, storeTokenInSupabase]);

  // Auto-refresh token every 30 minutes
  useInterval(() => {
    const isExpired = Date.now() - state.lastRefresh > 30 * 60 * 1000; // 30 minutes
    if (isExpired && state.token && !isRegistering && isMounted) {
      registerToken();
    }
  }, 60000); // Check every minute

  // Auto-register on mount if user is authenticated
  useEffect(() => {
    if (isClient && currentUser && !state.token && !isRegistering && isMounted) {
      registerToken();
    }
  }, [currentUser, isClient, isMounted, state.token, isRegistering, registerToken]);

  return {
    token: state.token,
    notificationPermissionStatus: state.permission,
    isLoading: state.isLoading || isRegistering,
    error: state.error,
    registerToken,
    hasPermission: state.permission === 'granted',
    isTokenValid: !!(state.token && Date.now() - state.lastRefresh < 24 * 60 * 60 * 1000), // 24 hours
    refreshToken: registerToken
  };
}

// Simple context for sharing across components
export const useFcmContext = useFcmToken;