import { supabase } from '@/lib/supabase';

export interface NotificationData {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  data?: Record<string, unknown>;
}

/**
 * Creates a new notification for a user
 */
export async function createNotification(notification: NotificationData) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: notification.recipientId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link || null,
        data: notification.data || {},
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
}

/**
 * Creates multiple notifications at once
 */
export async function createNotifications(notifications: NotificationData[]) {
  try {
    const notificationRecords = notifications.map(notification => ({
      recipient_id: notification.recipientId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link || null,
      data: notification.data || {},
      read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationRecords)
      .select();

    if (error) {
      console.error('Error creating notifications:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Failed to create notifications:', err);
    return null;
  }
}

/**
 * Common notification types and their creators
 */
export const NotificationCreators = {
  orderReady: (recipientId: string, orderId: string) => ({
    recipientId,
    type: 'order_ready',
    title: 'Your order is ready!',
    message: `Your order #${orderId} is ready for pickup.`,
    link: `/orders/${orderId}`,
    data: { orderId, category: 'order' }
  }),

  newMessage: (recipientId: string, senderName: string, messageId?: string) => ({
    recipientId,
    type: 'message',
    title: `New message from ${senderName}`,
    message: 'You have a new message in Wolf Pack chat.',
    link: '/wolfpack/chat',
    data: { sender: senderName, messageId, category: 'message' }
  }),

  announcement: (recipientId: string, title: string, message: string, link?: string) => ({
    recipientId,
    type: 'announcement',
    title,
    message,
    link,
    data: { category: 'announcement' }
  }),

  welcome: (recipientId: string) => ({
    recipientId,
    type: 'welcome',
    title: 'Welcome to High Energy Sports Bar!',
    message: 'Thanks for joining our community. Check out our latest features.',
    link: '/welcome',
    data: { category: 'welcome', welcomeFlow: true }
  }),

  // Wolfpack feed notifications
  wolfpackLike: (recipientId: string, likerName: string, videoId: string) => ({
    recipientId,
    type: 'wolfpack_like',
    title: 'New like on your video!',
    message: `${likerName} liked your Wolfpack video.`,
    link: `/wolfpack/video/${videoId}`,
    data: { 
      likerName, 
      videoId, 
      category: 'wolfpack',
      actionType: 'like'
    }
  }),

  wolfpackComment: (recipientId: string, commenterName: string, videoId: string, commentPreview?: string) => ({
    recipientId,
    type: 'wolfpack_comment',
    title: 'New comment on your video!',
    message: `${commenterName} commented: ${commentPreview ? commentPreview.substring(0, 50) + (commentPreview.length > 50 ? '...' : '') : 'Check it out!'}`,
    link: `/wolfpack/video/${videoId}`,
    data: { 
      commenterName, 
      videoId, 
      commentPreview,
      category: 'wolfpack',
      actionType: 'comment'
    }
  }),

  wolfpackFollow: (recipientId: string, followerName: string, followerId: string) => ({
    recipientId,
    type: 'wolfpack_follow',
    title: 'New follower!',
    message: `${followerName} started following you on Wolfpack.`,
    link: '/wolfpack/feed',
    data: { 
      followerName, 
      followerId,
      category: 'wolfpack',
      actionType: 'follow'
    }
  }),

  wolfpackMention: (recipientId: string, mentionerName: string, videoId: string, commentPreview?: string) => ({
    recipientId,
    type: 'wolfpack_mention',
    title: 'You were mentioned!',
    message: `${mentionerName} mentioned you in a comment: ${commentPreview ? commentPreview.substring(0, 50) + (commentPreview.length > 50 ? '...' : '') : 'Check it out!'}`,
    link: `/wolfpack/video/${videoId}`,
    data: { 
      mentionerName, 
      videoId, 
      commentPreview,
      category: 'wolfpack',
      actionType: 'mention'
    }
  }),

  wolfpackVideoPosted: (recipientId: string, posterName: string, videoId: string) => ({
    recipientId,
    type: 'wolfpack_new_video',
    title: 'New video from someone you follow!',
    message: `${posterName} posted a new Wolfpack video.`,
    link: `/wolfpack/video/${videoId}`,
    data: { 
      posterName, 
      videoId,
      category: 'wolfpack',
      actionType: 'new_video'
    }
  })
};