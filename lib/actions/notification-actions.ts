// If your function has a different name or is in a different location, update this import
// For example, if it's called createServerClient or is in lib/supabase/server.ts
import { createServerClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database.types";

// Extract types from database schema
type Tables = Database["public"]["Tables"];
type NotificationRow = Tables["notifications"]["Row"];
type NotificationInsert = Tables["notifications"]["Insert"];
type NotificationUpdate = Tables["notifications"]["Update"];
type NotificationType = NotificationRow["type"];
type NotificationContentType = NotificationRow["content_type"];
type NotificationPriority = NotificationRow["priority"];

export interface NotificationData {
  recipientId: string;
  type: NotificationType;
  title?: string;
  message: string;
  action_url?: string;
  content_type?: NotificationContentType;
  content_id?: string;
  related_user_id?: string;
  priority?: NotificationPriority;
  expires_at?: string;
  data?: Json;
}

export interface BulkNotificationData {
  type: NotificationType;
  title?: string;
  message: string;
  action_url?: string;
  priority?: NotificationPriority;
  expires_at?: string;
  data?: Json;
}

/**
 * Create a single notification (server-side)
 */
export async function createNotification(data: NotificationData) {
  try {
    const supabase = await createServerClient();

    const insertData: NotificationInsert = {
      recipient_id: data.recipientId,
      type: data.type,
      message: data.message,
      title: data.title || null,
      action_url: data.action_url || null,
      content_type: data.content_type || null,
      content_id: data.content_id || null,
      related_user_id: data.related_user_id || null,
      priority: data.priority || "normal",
      expires_at: data.expires_at || null,
      data: data.data || {},
      status: "unread",
      is_read: false,
      is_push_sent: false,
    };

    const { data: notification, error } = await supabase
      .from("notifications")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true, notification };
  } catch (error) {
    console.error("Error in createNotification:", error);
    return { success: false, error: "Failed to create notification" };
  }
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(
  recipientIds: string[],
  data: BulkNotificationData,
) {
  try {
    const supabase = await createServerClient();

    const notifications: NotificationInsert[] = recipientIds.map((
      recipientId,
    ) => ({
      recipient_id: recipientId,
      type: data.type,
      message: data.message,
      title: data.title || null,
      action_url: data.action_url || null,
      priority: data.priority || "normal",
      expires_at: data.expires_at || null,
      data: data.data || {},
      status: "unread",
      is_read: false,
      is_push_sent: false,
    }));

    const { data: insertedNotifications, error } = await supabase
      .from("notifications")
      .insert(notifications)
      .select();

    if (error) {
      console.error("Error creating bulk notifications:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      notifications: insertedNotifications,
      count: insertedNotifications?.length || 0,
    };
  } catch (error) {
    console.error("Error in createBulkNotifications:", error);
    return { success: false, error: "Failed to create bulk notifications" };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string) {
  try {
    const supabase = await createServerClient();

    const updateData: NotificationUpdate = {
      is_read: true,
      read_at: new Date().toISOString(),
      status: "read",
    };

    const { error } = await supabase
      .from("notifications")
      .update(updateData)
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in markNotificationRead:", error);
    return { success: false, error: "Failed to mark notification as read" };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string) {
  try {
    const supabase = await createServerClient();

    const updateData: NotificationUpdate = {
      is_read: true,
      read_at: new Date().toISOString(),
      status: "read",
    };

    const { error } = await supabase
      .from("notifications")
      .update(updateData)
      .eq("recipient_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in markAllNotificationsRead:", error);
    return {
      success: false,
      error: "Failed to mark all notifications as read",
    };
  }
}

/**
 * Delete expired notifications
 */
export async function deleteExpiredNotifications() {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select();

    if (error) {
      console.error("Error deleting expired notifications:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      deletedCount: data?.length || 0,
    };
  } catch (error) {
    console.error("Error in deleteExpiredNotifications:", error);
    return { success: false, error: "Failed to delete expired notifications" };
  }
}

/**
 * Get user's notifications with pagination
 */
export async function getUserNotifications(
  userId: string,
  limit = 50,
  offset = 0,
  onlyUnread = false,
) {
  try {
    const supabase = await createServerClient();

    let query = supabase
      .from("notifications")
      .select(`
        *,
        related_user:users!notifications_related_user_fkey(
          id,
          display_name,
          username,
          profile_image_url
        )
      `)
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (onlyUnread) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return { success: false, error: error.message, notifications: [] };
    }

    return {
      success: true,
      notifications: data || [],
    };
  } catch (error) {
    console.error("Error in getUserNotifications:", error);
    return {
      success: false,
      error: "Failed to fetch notifications",
      notifications: [],
    };
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string) {
  try {
    const supabase = await createServerClient();

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Error fetching unread count:", error);
      return { success: false, error: error.message, count: 0 };
    }

    return {
      success: true,
      count: count || 0,
    };
  } catch (error) {
    console.error("Error in getUnreadNotificationCount:", error);
    return {
      success: false,
      error: "Failed to fetch unread count",
      count: 0,
    };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string,
  userId: string,
) {
  try {
    const supabase = await createServerClient();

    // Only allow users to delete their own notifications
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("recipient_id", userId);

    if (error) {
      console.error("Error deleting notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteNotification:", error);
    return { success: false, error: "Failed to delete notification" };
  }
}

/**
 * Update notification push status
 */
export async function updateNotificationPushStatus(
  notificationId: string,
  isPushSent: boolean,
) {
  try {
    const supabase = await createServerClient();

    const updateData: NotificationUpdate = {
      is_push_sent: isPushSent,
    };

    if (isPushSent) {
      updateData.push_sent_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("notifications")
      .update(updateData)
      .eq("id", notificationId);

    if (error) {
      console.error("Error updating push status:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in updateNotificationPushStatus:", error);
    return { success: false, error: "Failed to update push status" };
  }
}
