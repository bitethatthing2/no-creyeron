import { supabase, createClient } from '@/lib/supabase/client';
// utils/notifications/NotificationHelpers.ts
// Use actual database types based on your schema
type NotificationType = 'info' | 'warning' | 'error' | 'order_new' | 'order_ready';

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface CreateNotificationParams {
  recipientId: string;
  message: string;
  type?: NotificationType;
  link?: string;
  metadata?: Record<string, unknown> | null;
}

interface BulkNotificationParams {
  recipientIds: string[];
  message: string;
  type?: NotificationType;
  link?: string;
  metadata?: Record<string, unknown> | null;
}

/**
 * Helper functions for creating notifications
 */
export class NotificationHelpers {
  private static getSupabaseClient() {
    return supabase;
  }

  /**
   * Create a single notification using the database function
   */
  static async createNotification({
    recipientId,
    message,
    type = 'info',
    link,
    metadata = {}
  }: CreateNotificationParams): Promise<string | null> {
    try {
      const supabase = this.getSupabaseClient();
      
      const { data, error } = await supabase.rpc('create_notification', {
        p_recipient_id: recipientId,
        p_message: message,
        p_type: type,
        p_link: link || undefined,
        p_metadata: metadata as any
      });

      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }

      console.log('Created notification:', data);
      return data;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }

  /**
   * Create notifications for multiple users
   */
  static async createBulkNotifications({
    recipientIds,
    message,
    type = 'info',
    link,
    metadata = {}
  }: BulkNotificationParams): Promise<string[]> {
    try {
      const supabase = this.getSupabaseClient();
      const notificationIds: string[] = [];

      // Create notifications one by one since we don't have a bulk function
      for (const recipientId of recipientIds) {
        const { data, error } = await supabase.rpc('create_notification', {
          p_recipient_id: recipientId,
          p_message: message,
          p_type: type,
          p_link: link || undefined,
          p_metadata: metadata as any
        });

        if (error) {
          console.error('Error creating notification for user:', recipientId, error);
          continue;
        }

        if (data) {
          notificationIds.push(data);
        }
      }

      console.log('Created bulk notifications:', notificationIds.length);
      return notificationIds;
    } catch (error) {
      console.error('Failed to create bulk notifications:', error);
      return [];
    }
  }

  /**
   * Create order-related notifications
   */
  static async notifyOrderReady(recipientId: string, orderDetails: {
    orderId: string;
    location?: string;
    items?: string[];
  }): Promise<string | null> {
    const message = `Your order #${orderDetails.orderId} is ready for pickup${
      orderDetails.location ? ` at ${orderDetails.location}` : ''
    }!`;

    return this.createNotification({
      recipientId,
      message,
      type: 'order_ready',
      metadata: {
        order_id: orderDetails.orderId,
        location: orderDetails.location,
        items: orderDetails.items,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Create new order notifications for staff
   */
  static async notifyNewOrder(staffIds: string[], orderDetails: {
    orderId: string;
    customerName?: string;
    items: string[];
    total?: number;
  }): Promise<string[]> {
    const message = `New order #${orderDetails.orderId}${
      orderDetails.customerName ? ` from ${orderDetails.customerName}` : ''
    } - ${orderDetails.items.length} item(s)`;

    return this.createBulkNotifications({
      recipientIds: staffIds,
      message,
      type: 'order_new',
      metadata: {
        order_id: orderDetails.orderId,
        customer_name: orderDetails.customerName,
        items: orderDetails.items,
        total: orderDetails.total,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Create wolfpack/social notifications
   */
  static async notifyWolfpackActivity(recipientId: string, activity: {
    type: 'message' | 'wink' | 'member_joined' | 'event';
    fromUser?: string;
    message: string;
    link?: string;
  }): Promise<string | null> {
    return this.createNotification({
      recipientId,
      message: activity.message,
      type: 'info',
      link: activity.link,
      metadata: {
        activity_type: activity.type,
        from_user: activity.fromUser,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Create system announcements
   */
  static async createSystemAnnouncement(
    recipientIds: string[], 
    announcement: {
      title: string;
      message: string;
      priority?: 'info' | 'warning' | 'error';
      link?: string;
    }
  ): Promise<string[]> {
    const message = announcement.title ? 
      `${announcement.title}: ${announcement.message}` : 
      announcement.message;

    return this.createBulkNotifications({
      recipientIds,
      message,
      type: announcement.priority || 'info',
      link: announcement.link,
      metadata: {
        announcement_type: 'system',
        title: announcement.title,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Get all bartenders for notifications
   */
  static async getBartenderIds(): Promise<string[]> {
    try {
      const supabase = this.getSupabaseClient();
      
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'bartender')
        .eq('status', 'active');

      if (error) throw error;
      
      return data.map(user => user.id);
    } catch (error) {
      console.error('Error fetching bartender IDs:', error);
      return [];
    }
  }

  /**
   * Get all active wolfpack members for notifications
   */
  static async getWolfpackMemberIds(): Promise<string[]> {
    try {
      const supabase = this.getSupabaseClient();
      
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('wolfpack_status', 'active')
        .eq('status', 'active');

      if (error) throw error;
      
      return data.map(user => user.id);
    } catch (error) {
      console.error('Error fetching wolfpack member IDs:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const supabase = this.getSupabaseClient();
      
      const { data, error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId
      });

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId?: string, limit: number = 50): Promise<NotificationRow[]> {
    try {
      const supabase = this.getSupabaseClient();
      
      const { data, error } = await supabase.rpc('fetch_notifications', {
        p_user_id: userId || undefined,
        p_limit: limit,
        p_offset: 0
      });

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return (data as any) || [];
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }
}

// Example usage functions you can call from your app
export const notificationExamples = {
  // When a drink order is ready
  orderReady: async (userId: string, orderId: string) => {
    await NotificationHelpers.notifyOrderReady(userId, {
      orderId,
      location: 'Main Bar',
      items: ['Beer', 'Wings']
    });
  },

  // When a new order comes in
  newOrder: async (orderId: string, customerName: string, items: string[]) => {
    const bartenderIds = await NotificationHelpers.getBartenderIds();
    await NotificationHelpers.notifyNewOrder(bartenderIds, {
      orderId,
      customerName,
      items
    });
  },

  // When someone sends a wink
  winkReceived: async (recipientId: string, senderName: string) => {
    await NotificationHelpers.notifyWolfpackActivity(recipientId, {
      type: 'wink',
      fromUser: senderName,
      message: `${senderName} sent you a wink! 😉`,
      link: '/wolfpack/messages'
    });
  },

  // System maintenance announcement
  maintenanceAlert: async () => {
    const allUserIds = await NotificationHelpers.getWolfpackMemberIds();
    await NotificationHelpers.createSystemAnnouncement(allUserIds, {
      title: 'Scheduled Maintenance',
      message: 'The app will be down for maintenance from 2-4 AM EST.',
      priority: 'warning'
    });
  }
};