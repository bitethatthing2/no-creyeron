// Fixed notification service
import { supabase } from '@/lib/supabase';

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export class FixedNotificationService {
  static async sendNotification(
    userId: string, 
    notification: NotificationData
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('wolfpack_activity_notifications')
        .insert({
          recipient_id: userId,
          title: notification.title,
          message: notification.body,
          data: notification.data,
          status: 'sent',
          type: 'system',
        });

      return !error;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('wolfpack_activity_notifications')
        .update({ status: 'read' })
        .eq('id', notificationId);

      return !error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
}

export default FixedNotificationService;