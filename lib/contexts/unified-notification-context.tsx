'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

/**
 * Notification type from database
 */
type Notification = Database['public']['Tables']['notifications']['Row'];

/**
 * Notification context interface
 */
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  dismissAllNotifications: () => Promise<void>;
}

/**
 * Notification context
 */
const NotificationContext = React.createContext<NotificationContextType | null>(null);

/**
 * Notification provider props
 */
interface NotificationProviderProps {
  children: React.ReactNode;
}

/**
 * Notification provider component
 * Provides notification state and actions to child components
 */
export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch notifications from Supabase
  const fetchNotifications = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user for notifications');
        setNotifications([]);
        return;
      }

      // Get the public user profile
      const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!publicUser) {
        console.log('No public user profile found');
        setNotifications([]);
        return;
      }

      // Fetch notifications directly from the table
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', publicUser.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = React.useCallback(async (notificationId: string) => {
    try {
      // First, call the RPC function if it exists
      let rpcError: unknown = null;
      try {
        const { error } = await supabase.rpc('mark_notification_read', {
          notification_id: notificationId
        });
        rpcError = error;
      } catch (e) {
        rpcError = e;
      }

      if (rpcError) {
        // Try direct update as fallback
        const { error: updateError } = await supabase
          .from('notifications')
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
            status: 'read',
            updated_at: new Date().toISOString()
          })
          .eq('id', notificationId);

        if (updateError) {
          console.error('Failed to mark notification as read:', updateError);
          return;
        }
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId 
          ? { 
              ...n, 
              is_read: true, 
              read_at: new Date().toISOString(),
              status: 'read' 
            } 
          : n
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = React.useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get the public user profile
      const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!publicUser) return;

      // Update all unread notifications
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
          status: 'read',
          updated_at: new Date().toISOString()
        })
        .eq('recipient_id', publicUser.id)
        .eq('is_read', false);

      if (error) {
        console.error('Failed to mark all notifications as read:', error);
        return;
      }

      // Update local state
      setNotifications(prev => prev.map(n => ({ 
        ...n, 
        is_read: true,
        read_at: new Date().toISOString(),
        status: 'read'
      })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  // Dismiss notification (mark as dismissed status)
  const dismissNotification = React.useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          status: 'dismissed',
          is_read: true,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Failed to dismiss notification:', error);
        return;
      }

      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  }, []);

  // Dismiss all notifications
  const dismissAllNotifications = React.useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get the public user profile
      const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!publicUser) return;

      // Update all notifications to dismissed
      const { error } = await supabase
        .from('notifications')
        .update({
          status: 'dismissed',
          is_read: true,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('recipient_id', publicUser.id)
        .in('status', ['unread', 'read']);

      if (error) {
        console.error('Failed to dismiss all notifications:', error);
        return;
      }

      // Clear local state
      setNotifications([]);
    } catch (err) {
      console.error('Failed to dismiss all notifications:', err);
    }
  }, []);

  // Refresh notifications
  const refreshNotifications = React.useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Calculate unread count
  const unreadCount = React.useMemo(() => {
    return notifications.filter(n => !n.is_read && n.status === 'unread').length;
  }, [notifications]);

  // Load notifications on mount
  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up real-time subscription for notifications
  React.useEffect(() => {
    let subscription: ReturnType<typeof supabase['channel']> | null = null;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get the public user profile
      const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!publicUser) return;

      // Subscribe to changes in notifications table
      subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${publicUser.id}`
          },
          (payload) => {
            console.log('Notification change:', payload);
            
            if (payload.eventType === 'INSERT') {
              // Add new notification to the beginning of the list
              setNotifications(prev => [payload.new as Notification, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              // Update existing notification
              setNotifications(prev => 
                prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
              );
            } else if (payload.eventType === 'DELETE') {
              // Remove deleted notification
              setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  // Context value
  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    dismissAllNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to use notification context
 * Throws an error if used outside of NotificationProvider
 */
export function useNotifications() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

/**
 * Safe hook to use notification context
 * Returns null if used outside of NotificationProvider (doesn't throw)
 */
export function useSafeNotifications() {
  const context = React.useContext(NotificationContext);
  return context;
}

// Helper function to create a notification
export async function createNotification(
  recipientId: string,
  notification: {
    type: string;
    title?: string;
    message: string;
    action_url?: string;
    content_type?: string;
    content_id?: string;
    related_user_id?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    data?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: recipientId,
        type: notification.type,
        title: notification.title || null,
        message: notification.message,
        action_url: notification.action_url || null,
        content_type: notification.content_type || null,
        content_id: notification.content_id || null,
        related_user_id: notification.related_user_id || null,
        priority: notification.priority || 'normal',
        data: notification.data || {},
        status: 'unread',
        is_read: false,
      });

    if (error) {
      console.error('Failed to create notification:', error);
    }
  } catch (err) {
    console.error('Error creating notification:', err);
  }
}

export default NotificationProvider;