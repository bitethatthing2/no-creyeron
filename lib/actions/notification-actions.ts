import { createServerClient } from '@/lib/supabase/server';

export interface NotificationData {
  userId: string;
  type: 'info' | 'warning' | 'error';
  body: string;
  link?: string;
  expiresAt?: Date;
}

export interface BulkNotificationData {
  type: 'info' | 'warning' | 'error';
  body: string;
  link?: string;
  expiresAt?: Date;
}

export async function createNotification(data: NotificationData) {
  try {
    const supabase = await createServerClient();
    
    const { data: notification, error } = await supabase
      .from('push_notifications')
      .insert({
        id: data.userId,
        title: data.type.charAt(0).toUpperCase() + data.type.slice(1), // Convert type to title
        body: data.body,
        type: data.type,
        link: data.link
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, notification };
  } catch (error) {
    console.error('Error in createNotification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

export async function createBulkNotifications(userIds: string[], data: BulkNotificationData) {
  try {
    const supabase = await createServerClient();
    
    const notifications = userIds.map(userId => ({
      id: userId,
      title: data.type.charAt(0).toUpperCase() + data.type.slice(1), // Convert type to title
      body: data.body,
      type: data.type,
      link: data.link
    }));
    
    const { data: insertedNotifications, error } = await supabase
      .from('push_notifications')
      .insert(notifications)
      .select();
    
    if (error) {
      console.error('Error creating bulk notifications:', error);
      return { success: false, error: error.message };
    }
    
    return { 
      success: true, 
      notifications: insertedNotifications,
      count: insertedNotifications?.length || 0
    };
  } catch (error) {
    console.error('Error in createBulkNotifications:', error);
    return { success: false, error: 'Failed to create bulk notifications' };
  }
}
