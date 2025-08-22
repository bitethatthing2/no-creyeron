'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { debugLog, performanceLog } from '@/lib/debug';
import { RealtimeChannel } from '@supabase/supabase-js';

// If you need Database types in the future, uncomment:
// import { Database } from '@/types/database.types';
// type Tables = Database['public']['Tables'];

// Core notification type from unified_notifications table
export interface Notification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  body: string;
  actor_id?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  action_url?: string | null;
  image_url?: string | null;
  is_read: boolean;
  read_at?: string | null;
  is_archived: boolean;
  archived_at?: string | null;
  push_sent: boolean;
  push_sent_at?: string | null;
  push_error?: string | null;
  priority: NotificationPriority;
  expires_at?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined fields
  actor?: UserProfile;
}

// Notification preferences type
export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  type_preferences: TypePreferences;
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  timezone: string;
  max_notifications_per_hour: number;
  max_notifications_per_day: number;
  created_at: string;
  updated_at: string;
}

// Type preferences for different notification types
export interface TypePreferences {
  like?: { push: boolean; email: boolean };
  event?: { push: boolean; email: boolean };
  follow?: { push: boolean; email: boolean };
  system?: { push: boolean; email: boolean };
  comment?: { push: boolean; email: boolean };
  mention?: { push: boolean; email: boolean };
  message?: { push: boolean; email: boolean };
  marketing?: { push: boolean; email: boolean };
  friend_request?: { push: boolean; email: boolean };
  location_nearby?: { push: boolean; email: boolean };
  [key: string]: { push: boolean; email: boolean } | undefined;
}

// FCM token type
export interface FCMToken {
  id: string;
  user_id: string;
  token: string;
  device_info?: {
    userAgent?: string;
    language?: string;
    platform?: string;
    [key: string]: unknown;
  };
  platform?: 'web' | 'ios' | 'android' | null;
  is_active: boolean;
  last_used_at: string;
  created_at: string;
  updated_at: string;
}

// Notification topic type
export interface NotificationTopic {
  id: string;
  topic_key: string;
  display_name: string;
  description?: string | null;
  is_active: boolean;
  requires_role?: string | null;
  created_at: string;
  updated_at: string;
}

// User profile subset
export interface UserProfile {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  profile_image_url?: string | null;
}

// Notification type enum
export enum NotificationType {
  LIKE = 'like',
  COMMENT = 'comment',
  FOLLOW = 'follow',
  MENTION = 'mention',
  MESSAGE = 'message',
  FRIEND_REQUEST = 'friend_request',
  EVENT = 'event',
  SYSTEM = 'system',
  MARKETING = 'marketing',
  LOCATION_NEARBY = 'location_nearby',
  ORDER_NEW = 'order_new',
  ORDER_READY = 'order_ready',
  VIDEO_LIKE = 'video_like',
  VIDEO_COMMENT = 'video_comment',
  WINK = 'wink',
  CHAT = 'chat'
}

// Notification priority enum
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Platform enum
export enum Platform {
  WEB = 'web',
  IOS = 'ios',
  ANDROID = 'android'
}

// Notification state
interface NotificationState {
  notifications: Notification[];
  preferences: NotificationPreferences | null;
  topics: NotificationTopic[];
  fcmTokens: FCMToken[];
  unreadCount: number;
  isEnabled: boolean;
  isInitialized: boolean;
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
}

// Action types
type NotificationAction = 
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'UPDATE_NOTIFICATION'; payload: { id: string; updates: Partial<Notification> } }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'SET_PREFERENCES'; payload: NotificationPreferences | null }
  | { type: 'SET_TOPICS'; payload: NotificationTopic[] }
  | { type: 'SET_FCM_TOKENS'; payload: FCMToken[] }
  | { type: 'SET_UNREAD_COUNT'; payload: number }
  | { type: 'SET_INITIAL_STATE'; payload: { enabled: boolean; initialized: boolean; hasPermission: boolean } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ENABLED'; payload: { enabled: boolean; initialized: boolean; hasPermission: boolean } };

// Initial state
const initialState: NotificationState = {
  notifications: [],
  preferences: null,
  topics: [],
  fcmTokens: [],
  unreadCount: 0,
  isEnabled: false,
  isInitialized: false,
  hasPermission: false,
  isLoading: false,
  error: null,
};

// Reducer
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + (action.payload.is_read ? 0 : 1)
      };
    
    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload.id ? { ...n, ...action.payload.updates } : n
        )
      };
    
    case 'DELETE_NOTIFICATION':
      const notif = state.notifications.find(n => n.id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        unreadCount: notif && !notif.is_read ? state.unreadCount - 1 : state.unreadCount
      };
    
    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload };
    
    case 'SET_TOPICS':
      return { ...state, topics: action.payload };
    
    case 'SET_FCM_TOKENS':
      return { ...state, fcmTokens: action.payload };
    
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };
    
    case 'SET_INITIAL_STATE':
      return {
        ...state,
        isEnabled: action.payload.enabled,
        isInitialized: action.payload.initialized,
        hasPermission: action.payload.hasPermission,
      };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_ENABLED':
      return {
        ...state,
        isEnabled: action.payload.enabled,
        isInitialized: action.payload.initialized,
        hasPermission: action.payload.hasPermission,
        isLoading: false,
        error: null,
      };
    
    default:
      return state;
  }
}

// Return type
interface UseNotificationsReturn extends NotificationState {
  // Core actions
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  
  // Notification management
  loadNotifications: (limit?: number, offset?: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  archiveNotification: (notificationId: string) => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  
  // Send notifications
  sendNotification: (recipientId: string, notification: CreateNotificationPayload) => Promise<boolean>;
  sendBulkNotifications: (notifications: CreateNotificationPayload[]) => Promise<boolean>;
  
  // Preferences
  loadPreferences: () => Promise<void>;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<boolean>;
  updateTypePreference: (type: string, channel: 'push' | 'email', enabled: boolean) => Promise<boolean>;
  
  // Topics
  loadTopics: () => Promise<void>;
  subscribeToTopic: (topicKey: string) => Promise<boolean>;
  unsubscribeFromTopic: (topicKey: string) => Promise<boolean>;
  
  // FCM tokens
  registerFCMToken: (token: string, platform?: Platform) => Promise<boolean>;
  removeFCMToken: (tokenId: string) => Promise<boolean>;
  
  // Real-time
  subscribeToNotifications: () => () => void;
}

// Payload for creating notifications
export interface CreateNotificationPayload {
  recipient_id: string;
  type: NotificationType;
  title: string;
  body: string;
  actor_id?: string;
  entity_type?: string;
  entity_id?: string;
  action_url?: string;
  image_url?: string;
  priority?: NotificationPriority;
  expires_at?: string;
  metadata?: Record<string, unknown>;
}

export function useNotifications(): UseNotificationsReturn {
  const { currentUser } = useAuth();
  const [state, dispatch] = React.useReducer(notificationReducer, initialState);
  const subscriptionRef = React.useRef<RealtimeChannel | null>(null);
  const currentUserId = currentUser?.id || null;

  // Check browser support and permission status
  React.useEffect(() => {
    const checkInitialState = () => {
      const hasSupport = 'Notification' in window;
      const hasPermission = hasSupport && Notification.permission === 'granted';
      
      dispatch({
        type: 'SET_INITIAL_STATE',
        payload: { 
          enabled: hasPermission, 
          initialized: hasSupport, 
          hasPermission 
        }
      });
    };

    checkInitialState();
  }, []);

  // Clean up subscriptions on unmount
  React.useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);

  // Request permission
  const requestPermission = React.useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      dispatch({ type: 'SET_ERROR', payload: 'Notifications not supported' });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      dispatch({
        type: 'SET_ENABLED',
        payload: { enabled: granted, initialized: true, hasPermission: granted }
      });
      
      return granted;
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err instanceof Error ? err.message : 'Failed to request permission' 
      });
      return false;
    }
  }, []);

  // Enable notifications
  const enableNotifications = React.useCallback(async (): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Request permission first
      const permissionGranted = await requestPermission();
      if (!permissionGranted) {
        throw new Error('Notification permission denied');
      }

      // Update user preferences in database
      if (currentUserId) {
        const { error } = await supabase
          .from('unified_notification_preferences')
          .upsert({
            user_id: currentUserId,
            push_enabled: true,
            in_app_enabled: true
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;

        // Register service worker and get FCM token if needed
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('Service Worker registered:', registration);
            
            // Here you would typically get the FCM token
            // This requires Firebase SDK setup
          } catch (swError) {
            console.error('Service Worker registration failed:', swError);
          }
        }
      }
      
      dispatch({
        type: 'SET_ENABLED',
        payload: { enabled: true, initialized: true, hasPermission: true }
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable notifications';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return false;
    }
  }, [currentUserId, requestPermission]);

  // Disable notifications
  const disableNotifications = React.useCallback(async (): Promise<boolean> => {
    if (!currentUserId) return false;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Update preferences in database
      const { error } = await supabase
        .from('unified_notification_preferences')
        .update({
          push_enabled: false,
          in_app_enabled: false
        })
        .eq('user_id', currentUserId);

      if (error) throw error;

      // Deactivate all FCM tokens
      await supabase
        .from('user_fcm_tokens')
        .update({ is_active: false })
        .eq('user_id', currentUserId);

      dispatch({
        type: 'SET_ENABLED',
        payload: { enabled: false, initialized: true, hasPermission: false }
      });

      return true;
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err instanceof Error ? err.message : 'Failed to disable notifications' 
      });
      return false;
    }
  }, [currentUserId]);

  // Load notifications
  const loadNotifications = React.useCallback(async (limit = 50, offset = 0) => {
    if (!currentUserId) return;

    const startTime = performanceLog.start('loadNotifications');
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Get notifications with actor info
      const { data, error, count } = await supabase
        .from('unified_notifications')
        .select(`
          *,
          actor:users!actor_id(
            id,
            email,
            first_name,
            last_name,
            display_name,
            username,
            avatar_url,
            profile_image_url
          )
        `, { count: 'exact' })
        .eq('recipient_id', currentUserId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const notifications = (data || []) as Notification[];
      dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });

      // Calculate unread count
      const unreadCount = notifications.filter(n => !n.is_read).length;
      dispatch({ type: 'SET_UNREAD_COUNT', payload: unreadCount });

      debugLog.success('loadNotifications', { 
        count: notifications.length,
        total: count,
        unread: unreadCount
      });
      performanceLog.end('loadNotifications', startTime);
    } catch (err) {
      debugLog.error('loadNotifications', err);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err instanceof Error ? err.message : 'Failed to load notifications' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [currentUserId]);

  // Load preferences
  const loadPreferences = React.useCallback(async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('unified_notification_preferences')
        .select('*')
        .eq('user_id', currentUserId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore not found error

      dispatch({ type: 'SET_PREFERENCES', payload: data || null });
    } catch (err) {
      debugLog.error('loadPreferences', err);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err instanceof Error ? err.message : 'Failed to load preferences' 
      });
    }
  }, [currentUserId]);

  // Load topics
  const loadTopics = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notification_topics')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;

      dispatch({ type: 'SET_TOPICS', payload: data || [] });
    } catch (err) {
      debugLog.error('loadTopics', err);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err instanceof Error ? err.message : 'Failed to load topics' 
      });
    }
  }, []);

  // Load FCM tokens
  const loadFCMTokens = React.useCallback(async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('user_fcm_tokens')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('is_active', true);

      if (error) throw error;

      dispatch({ type: 'SET_FCM_TOKENS', payload: data || [] });
    } catch (err) {
      debugLog.error('loadFCMTokens', err);
    }
  }, [currentUserId]);

  // Mark notification as read
  const markAsRead = React.useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('unified_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) throw error;

      dispatch({ 
        type: 'UPDATE_NOTIFICATION', 
        payload: { 
          id: notificationId, 
          updates: { is_read: true, read_at: new Date().toISOString() } 
        } 
      });

      // Update unread count
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification && !notification.is_read) {
        dispatch({ type: 'SET_UNREAD_COUNT', payload: state.unreadCount - 1 });
      }

      return true;
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err instanceof Error ? err.message : 'Failed to mark as read' 
      });
      return false;
    }
  }, [state.notifications, state.unreadCount]);

  // Mark all as read
  const markAllAsRead = React.useCallback(async (): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      const { error } = await supabase
        .from('unified_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('recipient_id', currentUserId)
        .eq('is_read', false);

      if (error) throw error;

      // Update all notifications in state
      const updatedNotifications = state.notifications.map(n => ({
        ...n,
        is_read: true,
        read_at: new Date().toISOString()
      }));
      
      dispatch({ type: 'SET_NOTIFICATIONS', payload: updatedNotifications });
      dispatch({ type: 'SET_UNREAD_COUNT', payload: 0 });

      return true;
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err instanceof Error ? err.message : 'Failed to mark all as read' 
      });
      return false;
    }
  }, [currentUserId, state.notifications]);

  // Archive notification
  const archiveNotification = React.useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('unified_notifications')
        .update({ 
          is_archived: true, 
          archived_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) throw error;

      dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId });
      return true;
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err instanceof Error ? err.message : 'Failed to archive notification' 
      });
      return false;
    }
  }, []);

  // Delete notification
  const deleteNotification = React.useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('unified_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId });
      return true;
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err instanceof Error ? err.message : 'Failed to delete notification' 
      });
      return false;
    }
  }, []);

  // Send notification
  const sendNotification = React.useCallback(async (
    recipientId: string, 
    notification: CreateNotificationPayload
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('unified_notifications')
        .insert({
          ...notification,
          recipient_id: recipientId,
          priority: notification.priority || NotificationPriority.NORMAL
        });

      if (error) throw error;

      // Optionally trigger push notification via Edge Function
      if (state.isEnabled && state.hasPermission) {
        await supabase.functions.invoke('send-push-notification', {
          body: { recipientId, notification }
        });
      }

      return true;
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err instanceof Error ? err.message : 'Failed to send notification' 
      });
      return false;
    }
  }, [state.isEnabled, state.hasPermission]);

  // Send bulk notifications
  const sendBulkNotifications = React.useCallback(async (
    notifications: CreateNotificationPayload[]
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('unified_notifications')
        .insert(notifications.map(n => ({
          ...n,
          priority: n.priority || NotificationPriority.NORMAL
        })));

      if (error) throw error;

      return true;
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err instanceof Error ? err.message : 'Failed to send bulk notifications' 
      });
      return false;
    }
  }, []);

  // Update preferences
  const updatePreferences = React.useCallback(async (
    updates: Partial<NotificationPreferences>
  ): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      const { data, error } = await supabase
        .from('unified_notification_preferences')
        .upsert({
          user_id: currentUserId,
          ...updates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'SET_PREFERENCES', payload: data });
      return true;
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err instanceof Error ? err.message : 'Failed to update preferences' 
      });
      return false;
    }
  }, [currentUserId]);

  // Update type preference
  const updateTypePreference = React.useCallback(async (
    type: string, 
    channel: 'push' | 'email', 
    enabled: boolean
  ): Promise<boolean> => {
    if (!state.preferences) return false;

    const updatedTypePreferences: TypePreferences = {
      ...state.preferences.type_preferences,
      [type]: {
        push: state.preferences.type_preferences[type]?.push ?? false,
        email: state.preferences.type_preferences[type]?.email ?? false,
        [channel]: enabled
      }
    };

    return updatePreferences({ type_preferences: updatedTypePreferences });
  }, [state.preferences, updatePreferences]);

  // Subscribe to topic
  const subscribeToTopic = React.useCallback(async (topicKey: string): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      // Here you would typically subscribe via FCM
      // For now, we'll just track it in the database
      // Example implementation:
      // await supabase.functions.invoke('subscribe-to-topic', { 
      //   body: { topicKey, userId: currentUserId } 
      // });
      
      // Placeholder - remove this comment when implementing
      void topicKey; // Acknowledge parameter is intentionally unused for now
      
      return true;
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err instanceof Error ? err.message : 'Failed to subscribe to topic' 
      });
      return false;
    }
  }, [currentUserId]);

  // Unsubscribe from topic
  const unsubscribeFromTopic = React.useCallback(async (topicKey: string): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      // Here you would typically unsubscribe via FCM
      // For now, we'll just track it in the database
      // Example implementation:
      // await supabase.functions.invoke('unsubscribe-from-topic', { 
      //   body: { topicKey, userId: currentUserId } 
      // });
      
      // Placeholder - remove this comment when implementing
      void topicKey; // Acknowledge parameter is intentionally unused for now
      
      return true;
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err instanceof Error ? err.message : 'Failed to unsubscribe from topic' 
      });
      return false;
    }
  }, [currentUserId]);

  // Register FCM token
  const registerFCMToken = React.useCallback(async (
    token: string, 
    platform: Platform = Platform.WEB
  ): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      // Check if token already exists
      const { data: existing } = await supabase
        .from('user_fcm_tokens')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('token', token)
        .single();

      if (existing) {
        // Update last used
        await supabase
          .from('user_fcm_tokens')
          .update({ 
            last_used_at: new Date().toISOString(),
            is_active: true 
          })
          .eq('id', existing.id);
      } else {
        // Insert new token
        const { error } = await supabase
          .from('user_fcm_tokens')
          .insert({
            user_id: currentUserId,
            token,
            platform,
            device_info: {
              userAgent: navigator.userAgent,
              language: navigator.language,
              platform: navigator.platform
            }
          });

        if (error) throw error;
      }

      await loadFCMTokens();
      return true;
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err instanceof Error ? err.message : 'Failed to register FCM token' 
      });
      return false;
    }
  }, [currentUserId, loadFCMTokens]);

  // Remove FCM token
  const removeFCMToken = React.useCallback(async (tokenId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_fcm_tokens')
        .update({ is_active: false })
        .eq('id', tokenId);

      if (error) throw error;

      await loadFCMTokens();
      return true;
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err instanceof Error ? err.message : 'Failed to remove FCM token' 
      });
      return false;
    }
  }, [loadFCMTokens]);

  // Subscribe to real-time notifications
  const subscribeToNotifications = React.useCallback(() => {
    if (!currentUserId) return () => {};

    // Remove existing subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    const channel = supabase
      .channel(`notifications:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'unified_notifications',
          filter: `recipient_id=eq.${currentUserId}`
        },
        async (payload) => {
          // Fetch full notification with actor info
          const { data } = await supabase
            .from('unified_notifications')
            .select(`
              *,
              actor:users!actor_id(
                id,
                email,
                first_name,
                last_name,
                display_name,
                username,
                avatar_url,
                profile_image_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            dispatch({ type: 'ADD_NOTIFICATION', payload: data as Notification });

            // Show browser notification if enabled
            if (state.isEnabled && state.hasPermission && !data.is_read) {
              const notification = new Notification(data.title, {
                body: data.body,
                icon: data.image_url || '/icons/notification-icon.png',
                badge: '/icons/badge-icon.png',
                tag: data.id,
                requireInteraction: data.priority === NotificationPriority.HIGH,
                data: {
                  url: data.action_url
                }
              });

              notification.onclick = () => {
                if (data.action_url) {
                  window.open(data.action_url, '_blank');
                }
                notification.close();
              };
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'unified_notifications',
          filter: `recipient_id=eq.${currentUserId}`
        },
        (payload) => {
          dispatch({ 
            type: 'UPDATE_NOTIFICATION', 
            payload: { 
              id: payload.new.id as string, 
              updates: payload.new as Partial<Notification> 
            } 
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'unified_notifications',
          filter: `recipient_id=eq.${currentUserId}`
        },
        (payload) => {
          dispatch({ type: 'DELETE_NOTIFICATION', payload: payload.old.id as string });
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      subscriptionRef.current = null;
    };
  }, [currentUserId, state.isEnabled, state.hasPermission]);

  // Load initial data when user is available
  React.useEffect(() => {
    if (!currentUserId) return;

    const loadInitialData = async () => {
      await Promise.all([
        loadNotifications(),
        loadPreferences(),
        loadTopics(),
        loadFCMTokens()
      ]);
    };

    loadInitialData();
  }, [currentUserId, loadNotifications, loadPreferences, loadTopics, loadFCMTokens]);

  return {
    ...state,
    
    // Core actions
    enableNotifications,
    disableNotifications,
    requestPermission,
    
    // Notification management
    loadNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    
    // Send notifications
    sendNotification,
    sendBulkNotifications,
    
    // Preferences
    loadPreferences,
    updatePreferences,
    updateTypePreference,
    
    // Topics
    loadTopics,
    subscribeToTopic,
    unsubscribeFromTopic,
    
    // FCM tokens
    registerFCMToken,
    removeFCMToken,
    
    // Real-time
    subscribeToNotifications
  };
}