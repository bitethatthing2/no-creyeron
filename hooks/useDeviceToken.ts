'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { supabase } from '@/lib/supabase';
import type { DeviceToken, FCMTokenData, DeviceInfo } from '@/types/global/notifications';

/**
 * Detect device information for token registration
 */
function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return { type: 'web', name: 'Server' };
  }

  const ua = navigator.userAgent;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as { standalone?: boolean }).standalone === true;

  if (/iPad|iPhone|iPod/.test(ua)) {
    return {
      type: 'ios',
      name: `iOS ${/OS (\d+_\d+)/.exec(ua)?.[1]?.replace('_', '.') || 'Unknown'}`,
      version: process.env.NEXT_PUBLIC_APP_VERSION,
      isStandalone
    };
  }

  if (/Android/.test(ua)) {
    return {
      type: 'android',
      name: `Android ${/Android (\d+\.\d+)/.exec(ua)?.[1] || 'Unknown'}`,
      version: process.env.NEXT_PUBLIC_APP_VERSION,
      isStandalone
    };
  }

  return {
    type: 'web',
    name: `${navigator.platform} - ${/Chrome|Firefox|Safari|Edge|Opera/.exec(ua)?.[0] || 'Browser'}`,
    version: process.env.NEXT_PUBLIC_APP_VERSION,
    isStandalone
  };
}

export function useDeviceToken(userId?: string) {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [deviceToken, setDeviceToken] = useState<DeviceToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  /**
   * Request notification permission and get FCM token
   */
  const requestPermissionAndToken = useCallback(async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;

    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        throw new Error('This browser does not support notifications');
      }

      // Request permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Initialize Firebase messaging
      const messaging = getMessaging();
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

      if (!vapidKey) {
        throw new Error('VAPID key not configured');
      }

      // Get FCM token
      const token = await getToken(messaging, { vapidKey });
      
      if (!token) {
        throw new Error('No registration token available');
      }

      return token;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get FCM token';
      setError(errorMessage);
      console.error('Error getting FCM token:', err);
      return null;
    }
  }, []);

  /**
   * Save device token to database
   */
  const saveDeviceToken = useCallback(async (tokenData: FCMTokenData, userId: string): Promise<DeviceToken | null> => {
    try {      const deviceInfo = getDeviceInfo();

      // First, deactivate any existing tokens for this user
      await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .eq('id', userId);

      // Insert new active token
      const { data, error } = await supabase
        .from('device_tokens')
        .insert({
          id: userId,
          token: tokenData.token,
          device_type: deviceInfo.type,
          device_name: deviceInfo.name,
          app_version: deviceInfo.version || process.env.NEXT_PUBLIC_APP_VERSION,
          is_active: true,
          last_used_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Type assertion with proper type checking
      if (data && 'id' in data && 'device_type' in data) {
        return data as unknown as DeviceToken;
      }
      
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save device token';
      setError(errorMessage);
      console.error('Error saving device token:', err);
      return null;
    }
  }, []);

  /**
   * Load existing device token for user
   */
  const loadDeviceToken = useCallback(async (userId: string): Promise<DeviceToken | null> => {
    try {      const { data, error } = await supabase
        .from('device_tokens')
        .select('*')
        .eq('id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return data as DeviceToken | null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load device token';
      setError(errorMessage);
      console.error('Error loading device token:', err);
      return null;
    }
  }, []);

  /**
   * Initialize FCM token management
   */
  const initializeToken = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      // First, load existing token from database
      const existingToken = await loadDeviceToken(userId);
      
      if (existingToken) {
        setDeviceToken(existingToken);
        setFcmToken(existingToken.token);
        
        // Update last used timestamp
        if (existingToken.id) {
          await supabase
            .from('device_tokens')
            .update({
              last_used_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingToken.id);
        }
      }

      // Check current permission status
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize token';
      setError(errorMessage);
      console.error('Error initializing token:', err);
    } finally {
      setLoading(false);
    }
  }, [loadDeviceToken]);

  /**
   * Register new FCM token
   */
  const registerToken = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const token = await requestPermissionAndToken();
      
      if (!token) {
        return false;
      }

      const tokenData: FCMTokenData = {
        token,
        deviceType: getDeviceInfo().type,
        deviceName: getDeviceInfo().name,
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION
      };

      const savedToken = await saveDeviceToken(tokenData, userId);
      
      if (savedToken) {
        setDeviceToken(savedToken);
        setFcmToken(token);
        return true;
      }

      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register token';
      setError(errorMessage);
      console.error('Error registering token:', err);
      return false;
    }
  }, [requestPermissionAndToken, saveDeviceToken]);

  /**
   * Deactivate current device token
   */
  const deactivateToken = useCallback(async (): Promise<boolean> => {
    if (!deviceToken) return false;

    try {
      if (!deviceToken.id) {
        throw new Error('Device token ID is missing');
      }
      
      const { error } = await supabase
        .from('device_tokens')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', deviceToken.id);

      if (error) {
        throw new Error(error.message);
      }

      setDeviceToken(null);
      setFcmToken(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate token';
      setError(errorMessage);
      console.error('Error deactivating token:', err);
      return false;
    }
  }, [deviceToken]);

  // Initialize token when userId is available
  useEffect(() => {
    if (userId) {
      initializeToken(userId);
    } else {
      setLoading(false);
    }
  }, [userId, initializeToken]);

  // Set up FCM message listener
  useEffect(() => {
    if (typeof window === 'undefined' || !fcmToken) return;

    try {
      const messaging = getMessaging();
      
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        
        // Handle foreground notifications
        if (payload.notification) {
          const { title, body } = payload.notification;
          
          // Show browser notification if permission is granted
          if (Notification.permission === 'granted') {
            new Notification(title || 'Side Hustle Bar', {
              body: body || '',
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-72x72.png',
              data: payload.data
            });
          }
        }
      });

      return unsubscribe;
    } catch (err) {
      console.error('Error setting up message listener:', err);
    }
  }, [fcmToken]);

  return {
    fcmToken,
    deviceToken,
    loading,
    error,
    permission,
    registerToken: userId ? () => registerToken(userId) : null,
    deactivateToken,
    refresh: userId ? () => initializeToken(userId) : null,
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
    deviceInfo: getDeviceInfo()
  };
}
