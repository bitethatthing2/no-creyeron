import { useMemo, useCallback, useEffect } from 'react';
import { useToggle, useLocalStorage, useDebounceCallback, useInterval, useIsClient } from 'usehooks-ts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { usePrevious } from './enhanced/usePrevious';

interface NotificationPayload {
  recipient_ids: string[];
  title: string;
  body: string;
  type: 'message' | 'post_like' | 'post_comment' | 'follow' | 'system';
  action_url?: string;
  image_url?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface NotificationState {
  unreadCount: number;
  lastChecked: number;
  sending: boolean;
  error: string | null;
}

// Base notification hook using usehooks-ts
export function useNotifications() {
  const { currentUser } = useAuth();
  const isClient = useIsClient();
  
  const [state, setState] = useLocalStorage<NotificationState>('notification-state', {
    unreadCount: 0,
    lastChecked: 0,
    sending: false,
    error: null
  });
  
  const [isSending, setIsSending, toggleSending] = useToggle(false);

  // Debounced notification sender
  const sendNotification = useDebounceCallback(async (payload: NotificationPayload) => {
    if (!isClient || isSending) return;
    
    setIsSending(true);
    setState(prev => ({ ...prev, sending: true, error: null }));

    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send notification');
      }

      return await response.json();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Send failed';
      setState(prev => ({ ...prev, error, sending: false }));
      throw err;
    } finally {
      setIsSending(false);
      setState(prev => ({ ...prev, sending: false }));
    }
  }, 1000);

  // Update unread count
  const updateUnreadCount = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', currentUser.id)
        .eq('read', false);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        unreadCount: count || 0,
        lastChecked: Date.now()
      }));
    } catch (err) {
      console.error('Error updating unread count:', err);
    }
  }, [currentUser?.id, setState]);

  // Auto-refresh unread count every 30 seconds
  useInterval(() => {
    if (currentUser?.id) {
      updateUnreadCount();
    }
  }, 30000);

  // Load unread count on mount
  useEffect(() => {
    if (currentUser?.id && isClient) {
      updateUnreadCount();
    }
  }, [currentUser?.id, isClient, updateUnreadCount]);

  return {
    unreadCount: state.unreadCount,
    isLoading: state.sending || isSending,
    error: state.error,
    sendNotification,
    updateUnreadCount,
    markAsRead: async (notificationIds: string[]) => {
      if (!currentUser?.id) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .in('id', notificationIds)
        .eq('recipient_id', currentUser.id);

      if (!error) {
        setState(prev => ({
          ...prev,
          unreadCount: Math.max(0, prev.unreadCount - notificationIds.length)
        }));
      }
      
      return !error;
    }
  };
}

// Message-specific notifications hook
export function useMessageNotifications() {
  const notifications = useNotifications();
  const { currentUser } = useAuth();

  const sendMessageNotification = useCallback(async (
    recipientId: string,
    senderName: string,
    messagePreview: string,
    conversationId: string
  ) => {
    if (!currentUser?.id || recipientId === currentUser.id) return;

    return notifications.sendNotification({
      recipient_ids: [recipientId],
      title: `New message from ${senderName}`,
      body: messagePreview.length > 50 ? `${messagePreview.slice(0, 50)}...` : messagePreview,
      type: 'message',
      action_url: `/messages/conversation/${conversationId}`,
      priority: 'normal'
    });
  }, [notifications, currentUser?.id]);

  return {
    ...notifications,
    sendMessageNotification
  };
}

// Social feed notifications hook  
export function useSocialNotifications() {
  const notifications = useNotifications();
  const { currentUser } = useAuth();

  const sendLikeNotification = useCallback(async (
    recipientId: string,
    likerName: string,
    postId: string,
    postThumbnail?: string
  ) => {
    if (!currentUser?.id || recipientId === currentUser.id) return;

    return notifications.sendNotification({
      recipient_ids: [recipientId],
      title: `${likerName} liked your post`,
      body: 'Tap to see your post',
      type: 'post_like',
      action_url: `/social/post/${postId}`,
      image_url: postThumbnail,
      priority: 'low'
    });
  }, [notifications, currentUser?.id]);

  const sendCommentNotification = useCallback(async (
    recipientId: string,
    commenterName: string,
    commentText: string,
    postId: string,
    postThumbnail?: string
  ) => {
    if (!currentUser?.id || recipientId === currentUser.id) return;

    return notifications.sendNotification({
      recipient_ids: [recipientId],
      title: `${commenterName} commented on your post`,
      body: commentText.length > 50 ? `${commentText.slice(0, 50)}...` : commentText,
      type: 'post_comment',
      action_url: `/social/post/${postId}`,
      image_url: postThumbnail,
      priority: 'normal'
    });
  }, [notifications, currentUser?.id]);

  const sendFollowNotification = useCallback(async (
    recipientId: string,
    followerName: string,
    followerId: string
  ) => {
    if (!currentUser?.id || recipientId === currentUser.id) return;

    return notifications.sendNotification({
      recipient_ids: [recipientId],
      title: `${followerName} started following you`,
      body: 'Tap to view their profile',
      type: 'follow',
      action_url: `/profile/${followerId}`,
      priority: 'low'
    });
  }, [notifications, currentUser?.id]);

  return {
    ...notifications,
    sendLikeNotification,
    sendCommentNotification,
    sendFollowNotification
  };
}

// Permission management hook
export function useNotificationPermissions() {
  const [permissions, setPermissions] = useLocalStorage<{
    granted: boolean;
    requested: boolean;
    lastRequested: number;
  }>('notification-permissions', {
    granted: false,
    requested: false,
    lastRequested: 0
  });

  const requestPermissions = useCallback(async () => {
    if (typeof window === 'undefined' || permissions.granted) return true;

    // Don't spam permission requests (wait at least 24 hours)
    if (permissions.requested && Date.now() - permissions.lastRequested < 24 * 60 * 60 * 1000) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      setPermissions({
        granted,
        requested: true,
        lastRequested: Date.now()
      });
      
      return granted;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  }, [permissions, setPermissions]);

  return {
    hasPermission: permissions.granted,
    canRequest: !permissions.requested || (Date.now() - permissions.lastRequested > 24 * 60 * 60 * 1000),
    requestPermissions
  };
}