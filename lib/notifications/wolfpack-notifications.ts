import { supabase } from '@/lib/supabase';

export interface WolfPackNotificationData {
  type: 'chat_message' | 'order_update' | 'member_joined' | 'member_left' | 'event_announcement' | 'wink_received';
  sessionId?: string;
  memberId?: string;
  memberName?: string;
  orderId?: string;
  messageContent?: string;
  eventTitle?: string;
  eventDescription?: string;
  eventTime?: string;
  status?: string;
  estimatedTime?: number;
}

export interface NotificationPreferences {
  chat_messages?: boolean;
  order_updates?: boolean;
  member_activity?: boolean;
  events?: boolean;
  social_interactions?: boolean;
  announcements?: boolean;
  marketing?: boolean;
}

/**
 * Send a WolfPack chat message notification to all members
 */
export async function sendChatMessageNotification(
  sessionId: string,
  senderName: string,
  messageContent: string,
  excludeUserId?: string
): Promise<boolean> {
  try {
    // Get all active WolfPack members except sender
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('is_wolfpack_member', true)
      .neq('id', excludeUserId || '');

    if (membersError || !members || members.length === 0) {
      console.log('No other members to notify');
      return true;
    }

    // Get notification preferences and device tokens for all members
    const userIds = members.map(m => m.id);
    
    // Get users with preferences
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, notification_preferences')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return false;
    }

    // Get active device tokens
    const { data: deviceTokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('id, user_id, token, platform')
      .in('user_id', userIds)
      .eq('is_active', true);

    if (tokensError || !deviceTokens || deviceTokens.length === 0) {
      console.log('No active device tokens found');
      return true;
    }

    // Build notifications for users who have chat notifications enabled
    const notifications = [];
    
    for (const token of deviceTokens) {
      const user = users?.find(u => u.id === token.user_id);
      const prefs = user?.notification_preferences as NotificationPreferences | null;
      
      // Check if user wants chat notifications (default true if not set)
      if (!prefs || prefs.chat_messages !== false) {
        notifications.push({
          user_id: token.user_id,
          device_token_id: token.id,
          title: `${senderName} in WolfPack`,
          body: messageContent.length > 50 
            ? `${messageContent.substring(0, 50)}...` 
            : messageContent,
          data: {
            type: 'chat_message',
            sessionId,
            memberId: excludeUserId,
            memberName: senderName,
            messageContent: messageContent.substring(0, 100)
          },
          status: 'pending',
          type: 'wolfpack_chat',
          priority: 'high',
          link: `/wolfpack/chat?session=${sessionId}`
        });
      }
    }

    if (notifications.length === 0) {
      console.log('No recipients want chat notifications');
      return true;
    }

    // Insert notifications
    const { error: insertError } = await supabase
      .from('push_notifications')
      .insert(notifications);

    if (insertError) {
      console.error('Error creating notifications:', insertError);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Error sending chat message notification:', error);
    return false;
  }
}

/**
 * Send order status update notification to a specific user
 */
export async function sendOrderUpdateNotification(
  userId: string,
  orderId: string,
  status: string,
  estimatedTime?: number
): Promise<boolean> {
  try {
    // Get user preferences
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, notification_preferences')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return false;
    }

    // Check if user wants order notifications
    const prefs = user.notification_preferences as NotificationPreferences | null;
    if (prefs && prefs.order_updates === false) {
      console.log('User has disabled order notifications');
      return true;
    }

    // Get active device tokens for user
    const { data: deviceTokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('id, token, platform')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (tokensError || !deviceTokens || deviceTokens.length === 0) {
      console.log('No active device tokens for user');
      return false;
    }

    // Prepare notification content
    let title = 'Order Update';
    let body = '';

    switch (status) {
      case 'confirmed':
        title = '🍴 Order Confirmed!';
        body = estimatedTime 
          ? `Your order is being prepared. Estimated time: ${estimatedTime} minutes`
          : 'Your order has been confirmed and is being prepared';
        break;
      case 'preparing':
        title = '👨‍🍳 Order in Kitchen';
        body = estimatedTime
          ? `Your food is being prepared. Ready in about ${estimatedTime} minutes`
          : 'Your order is currently being prepared';
        break;
      case 'ready':
        title = '🔔 Order Ready!';
        body = 'Your order is ready for pickup. Head to the counter!';
        break;
      case 'delivered':
        title = '✅ Order Delivered';
        body = 'Your order has been delivered. Enjoy your meal!';
        break;
      default:
        body = `Your order status has been updated to: ${status}`;
    }

    // Create notifications for all devices
    const notifications = deviceTokens.map(token => ({
      user_id: userId,
      device_token_id: token.id,
      title,
      body,
      data: {
        type: 'order_update',
        orderId,
        status,
        estimatedTime
      },
      status: 'pending',
      type: 'order_update',
      priority: status === 'ready' ? 'high' : 'normal',
      link: `/orders/${orderId}`
    }));

    const { error: insertError } = await supabase
      .from('push_notifications')
      .insert(notifications);

    if (insertError) {
      console.error('Error creating notifications:', insertError);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Error sending order notification:', error);
    return false;
  }
}

/**
 * Send notification when someone joins the WolfPack
 */
export async function sendMemberJoinedNotification(
  sessionId: string,
  newMemberName: string,
  newMemberUserId: string
): Promise<boolean> {
  try {
    // Get all other active members
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('id')
      .eq('is_wolfpack_member', true)
      .neq('id', newMemberUserId);

    if (membersError || !members || members.length === 0) {
      return true;
    }

    const userIds = members.map(m => m.id);

    // Get users with preferences
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, notification_preferences')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return false;
    }

    // Get device tokens
    const { data: deviceTokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('id, user_id, token, platform')
      .in('user_id', userIds)
      .eq('is_active', true);

    if (tokensError || !deviceTokens || deviceTokens.length === 0) {
      return true;
    }

    // Build notifications
    const notifications = [];
    
    for (const token of deviceTokens) {
      const user = users?.find(u => u.id === token.user_id);
      const prefs = user?.notification_preferences as NotificationPreferences | null;
      
      if (!prefs || prefs.member_activity !== false) {
        notifications.push({
          user_id: token.user_id,
          device_token_id: token.id,
          title: '🐺 New Pack Member!',
          body: `${newMemberName} has joined your WolfPack`,
          data: {
            type: 'member_joined',
            sessionId,
            memberId: newMemberUserId,
            memberName: newMemberName
          },
          status: 'pending',
          type: 'wolfpack_member',
          priority: 'normal',
          link: `/wolfpack?session=${sessionId}`
        });
      }
    }

    if (notifications.length === 0) {
      return true;
    }

    const { error: insertError } = await supabase
      .from('push_notifications')
      .insert(notifications);

    return !insertError;

  } catch (error) {
    console.error('Error sending member joined notification:', error);
    return false;
  }
}

/**
 * Send event announcement to all WolfPack members
 */
export async function sendEventAnnouncementNotification(
  sessionId: string,
  eventTitle: string,
  eventDescription: string,
  eventTime?: string
): Promise<boolean> {
  try {
    // Get all active members for the specific session
    // Since wolf_pack_members doesn't have session_id, we'll get all active wolfpack members
    // and filter by location if needed, or use a different approach based on your session logic
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('id')
      .eq('is_wolfpack_member', true);

    if (membersError || !members || members.length === 0) {
      return true;
    }

    const userIds = members.map(m => m.id);

    // Get users with preferences
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, notification_preferences')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return false;
    }

    // Get device tokens
    const { data: deviceTokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('id, user_id, token, platform')
      .in('user_id', userIds)
      .eq('is_active', true);

    if (tokensError || !deviceTokens || deviceTokens.length === 0) {
      return true;
    }

    const body = eventTime 
      ? `${eventDescription} • ${eventTime}`
      : eventDescription;

    // Build notifications
    const notifications = [];
    
    for (const token of deviceTokens) {
      const user = users?.find(u => u.id === token.user_id);
      const prefs = user?.notification_preferences as NotificationPreferences | null;
      
      if (!prefs || prefs.events !== false) {
        notifications.push({
          user_id: token.user_id,
          device_token_id: token.id,
          title: `🎉 ${eventTitle}`,
          body: body.length > 100 ? `${body.substring(0, 100)}...` : body,
          data: {
            type: 'event_announcement',
            sessionId,
            eventTitle,
            eventDescription,
            eventTime
          },
          status: 'pending',
          type: 'wolfpack_event',
          priority: 'high',
          link: `/wolfpack/events?session=${sessionId}`
        });
      }
    }

    if (notifications.length === 0) {
      return true;
    }

    const { error: insertError } = await supabase
      .from('push_notifications')
      .insert(notifications);

    return !insertError;

  } catch (error) {
    console.error('Error sending event notification:', error);
    return false;
  }
}

/**
 * Send wink notification to a specific user
 */
export async function sendWinkNotification(
  recipientUserId: string,
  senderName: string,
  senderUserId: string,
  sessionId?: string
): Promise<boolean> {
  try {
    // Get recipient preferences and privacy settings
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, notification_preferences, privacy_settings')
      .eq('id', recipientUserId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return false;
    }

    // Check privacy settings
    const privacySettings = user.privacy_settings as { accept_winks?: boolean } | null;
    if (privacySettings && privacySettings.accept_winks === false) {
      console.log('User has disabled winks');
      return true;
    }

    // Check notification preferences
    const prefs = user.notification_preferences as NotificationPreferences | null;
    if (prefs && prefs.social_interactions === false) {
      console.log('User has disabled social interaction notifications');
      return true;
    }

    // Get device tokens
    const { data: deviceTokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('id, token, platform')
      .eq('user_id', recipientUserId)
      .eq('is_active', true);

    if (tokensError || !deviceTokens || deviceTokens.length === 0) {
      console.log('No active device tokens');
      return false;
    }

    // Create notifications
    const notifications = deviceTokens.map(token => ({
      user_id: recipientUserId,
      device_token_id: token.id,
      title: '😉 Someone winked at you!',
      body: `${senderName} sent you a wink`,
      data: {
        type: 'wink_received',
        sessionId,
        memberId: senderUserId,
        memberName: senderName
      },
      status: 'pending',
      type: 'social_interaction',
      priority: 'normal',
      link: sessionId ? `/wolfpack?session=${sessionId}` : '/wolfpack'
    }));

    const { error: insertError } = await supabase
      .from('push_notifications')
      .insert(notifications);

    return !insertError;

  } catch (error) {
    console.error('Error sending wink notification:', error);
    return false;
  }
}

/**
 * Get user's notification preferences
 */
export async function getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('notification_preferences')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }

    return (data?.notification_preferences as NotificationPreferences) || {
      chat_messages: true,
      order_updates: true,
      member_activity: true,
      events: true,
      social_interactions: true,
      announcements: true,
      marketing: false
    };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return null;
  }
}

/**
 * Update user's notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  try {
    // Use the database function to properly merge preferences
    const {  error } = await supabase
      .rpc('update_notification_preferences', {
        p_user_id: userId,
        p_preferences: preferences
      });

    if (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return false;
  }
}

/**
 * Register a device token for push notifications
 */
export async function registerDeviceToken(token: string, platform: 'ios' | 'android' | 'web' = 'web'): Promise<boolean> {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('User not authenticated');
      return false;
    }

    // Get user ID from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      console.error('User not found in database');
      return false;
    }

    // Check if token already exists
    const { data: existingToken } = await supabase
      .from('device_tokens')
      .select('id')
      .eq('token', token)
      .single();

    if (existingToken) {
      // Update existing token
      const { error: updateError } = await supabase
        .from('device_tokens')
        .update({
          user_id: userData.id,
          platform,
          is_active: true,
          last_used: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('token', token);

      if (updateError) {
        console.error('Error updating device token:', updateError);
        return false;
      }
    } else {
      // Insert new token
      const { error: insertError } = await supabase
        .from('device_tokens')
        .insert({
          user_id: userData.id,
          token,
          platform,
          is_active: true
        });

      if (insertError) {
        console.error('Error inserting device token:', insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error registering device token:', error);
    return false;
  }
}

/**
 * Unregister a device token
 */
export async function unregisterDeviceToken(token: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('device_tokens')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('token', token);

    if (error) {
      console.error('Error unregistering device token:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error unregistering device token:', error);
    return false;
  }
}

/**
 * Get notification history for a user
 */
export async function getNotificationHistory(userId: string, limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from('push_notifications')
      .select(`
        id,
        title,
        body,
        data,
        status,
        type,
        sent_at,
        delivered_at,
        read_at,
        clicked_at,
        link
      `)
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notification history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting notification history:', error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('push_notifications')
      .update({
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Mark notification as clicked
 */
export async function markNotificationAsClicked(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('push_notifications')
      .update({
        clicked_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as clicked:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking notification as clicked:', error);
    return false;
  }
}