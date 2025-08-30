import { createServerSupabaseClient } from "@/lib/auth/server";
import { Database } from "@/types/database.types";
import { Json } from "@/types/database.types";

type NotificationType =
  Database["public"]["Tables"]["notifications"]["Row"]["type"];
export interface NotificationData {
  recipientId: string; // Public user ID
  type: NotificationType;
  title?: string;
  message: string;
  action_url?: string;
  content_type?: string;
  content_id?: string;
  related_user_id?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  expires_at?: string;
  data?: Json;
}
export interface BulkNotificationData {
  type: NotificationType;
  title?: string;
  message: string;
  action_url?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  expires_at?: string;
  data?: Json;
}

/**
 * Create a single notification (server-side)
 */
export async function createNotification(data: NotificationData) {
  try {
    const supabase = createServerSupabaseClient();

    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        recipient_id: data.recipientId,
        type: data.type,
        title: data.title || null,
        message: data.message,
        action_url: data.action_url || null,
        content_type: data.content_type || null,
        content_id: data.content_id || null,
        related_user_id: data.related_user_id || null,
        priority: data.priority || "normal",
        data: data.data || {},
        status: "unread",
        is_read: false,
        is_push_sent: false,
      })
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
    const supabase = createServerSupabaseClient();

    const notifications = recipientIds.map((recipientId) => ({
      recipient_id: recipientId,
      type: data.type,
      title: data.title || null,
      message: data.message,
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
    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        status: "read",
        updated_at: new Date().toISOString(),
      })
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
 * Delete expired notifications
 */
export async function deleteExpiredNotifications() {
  try {
    const supabase = createServerSupabaseClient();

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
 * Get user's notifications
 */
export async function getUserNotifications(
  userId: string,
  limit = 50,
  onlyUnread = false,
) {
  try {
    const supabase = createServerSupabaseClient();

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

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
