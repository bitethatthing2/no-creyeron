/**
 * Notification Service
 * Handles all notification operations for the application
 */

import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

// Type aliases
type Tables = Database["public"]["Tables"];
type Notification = Tables["notifications"]["Row"];
type NotificationInsert = Tables["notifications"]["Insert"];
type PushToken = Tables["push_tokens"]["Row"];
type PushTokenInsert = Tables["push_tokens"]["Insert"];

// Notification types based on your database schema
export type NotificationType =
  | "info"
  | "warning"
  | "error"
  | "success"
  | "order_new"
  | "order_ready"
  | "order_cancelled"
  | "follow"
  | "unfollow"
  | "like"
  | "comment"
  | "mention"
  | "share"
  | "post_like"
  | "post_comment"
  | "message"
  | "friend_request"
  | "system"
  | "promotion"
  | "achievement";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";
export type NotificationStatus = "unread" | "read" | "dismissed";

interface NotificationData {
  [key: string]: unknown;
}

interface CreateNotificationParams {
  recipientId: string;
  type: NotificationType;
  title?: string;
  message: string;
  relatedUserId?: string;
  contentType?:
    | "post"
    | "comment"
    | "user"
    | "order"
    | "message"
    | "conversation"
    | "event"
    | "menu_item";
  contentId?: string;
  actionUrl?: string;
  priority?: NotificationPriority;
  data?: NotificationData;
  expiresAt?: string;
}

class NotificationService {
  private supabase = supabase;

  /**
   * Create a new notification
   */
  async createNotification(
    params: CreateNotificationParams,
  ): Promise<Notification | null> {
    try {
      const notification: NotificationInsert = {
        recipient_id: params.recipientId,
        type: params.type,
        title: params.title,
        message: params.message,
        related_user_id: params.relatedUserId,
        content_type: params.contentType,
        content_id: params.contentId,
        action_url: params.actionUrl,
        priority: params.priority || "normal",
        status: "unread",
        data: params.data as import("@/types/supabase").Json || {},
        expires_at: params.expiresAt,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from("notifications")
        .insert(notification)
        .select()
        .single();

      if (error) {
        console.error("Error creating notification:", error);
        return null;
      }

      // Trigger push notification if user has tokens
      if (data) {
        await this.sendPushNotification(params.recipientId, data);
      }

      return data;
    } catch (error) {
      console.error("Failed to create notification:", error);
      return null;
    }
  }

  /**
   * Send chat message notification
   */
  async sendChatMessageNotification(
    recipientId: string,
    senderId: string,
    conversationId: string,
    messagePreview: string,
  ): Promise<Notification | null> {
    return this.createNotification({
      recipientId,
      type: "message",
      title: "New Message",
      message: messagePreview,
      relatedUserId: senderId,
      contentType: "conversation",
      contentId: conversationId,
      actionUrl: `/chat/${conversationId}`,
      priority: "high",
    });
  }

  /**
   * Send order update notification
   */
  async sendOrderUpdateNotification(
    recipientId: string,
    orderId: string,
    status: "new" | "ready" | "cancelled",
    message: string,
  ): Promise<Notification | null> {
    const typeMap = {
      new: "order_new" as NotificationType,
      ready: "order_ready" as NotificationType,
      cancelled: "order_cancelled" as NotificationType,
    };

    return this.createNotification({
      recipientId,
      type: typeMap[status],
      title: `Order ${status}`,
      message,
      contentType: "order",
      contentId: orderId,
      actionUrl: `/orders/${orderId}`,
      priority: "high",
    });
  }

  /**
   * Send follow notification
   */
  async sendFollowNotification(
    recipientId: string,
    followerId: string,
    followerName: string,
  ): Promise<Notification | null> {
    return this.createNotification({
      recipientId,
      type: "follow",
      title: "New Follower",
      message: `${followerName} started following you`,
      relatedUserId: followerId,
      contentType: "user",
      contentId: followerId,
      actionUrl: `/profile/${followerId}`,
    });
  }

  /**
   * Send post interaction notification
   */
  async sendPostInteractionNotification(
    recipientId: string,
    interactorId: string,
    interactorName: string,
    postId: string,
    interactionType: "like" | "comment",
  ): Promise<Notification | null> {
    const typeMap = {
      like: "post_like" as NotificationType,
      comment: "post_comment" as NotificationType,
    };

    const messages = {
      like: `${interactorName} liked your post`,
      comment: `${interactorName} commented on your post`,
    };

    return this.createNotification({
      recipientId,
      type: typeMap[interactionType],
      title: interactionType === "like" ? "Post Liked" : "New Comment",
      message: messages[interactionType],
      relatedUserId: interactorId,
      contentType: "post",
      contentId: postId,
      actionUrl: `/posts/${postId}`,
    });
  }

  /**
   * Send system announcement
   */
  async sendSystemAnnouncement(
    recipientId: string,
    title: string,
    message: string,
    actionUrl?: string,
  ): Promise<Notification | null> {
    return this.createNotification({
      recipientId,
      type: "system",
      title,
      message,
      actionUrl,
      priority: "high",
    });
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    limit: number = 20,
    status?: NotificationStatus,
  ): Promise<Notification[]> {
    try {
      let query = this.supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("notifications")
        .update({
          status: "read",
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", notificationId);

      if (error) {
        console.error("Error marking notification as read:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("notifications")
        .update({
          status: "read",
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("recipient_id", userId)
        .eq("status", "unread");

      if (error) {
        console.error("Error marking all notifications as read:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      return false;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("notifications")
        .update({
          status: "dismissed",
        })
        .eq("id", notificationId);

      if (error) {
        console.error("Error deleting notification:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to delete notification:", error);
      return false;
    }
  }

  /**
   * Register device token for push notifications
   */
  async registerDeviceToken(
    userId: string,
    token: string,
    platform: "web" | "ios" | "android" = "web",
    deviceInfo?: Record<string, unknown>,
  ): Promise<boolean> {
    try {
      const tokenData: PushTokenInsert = {
        user_id: userId,
        token,
        platform,
        device_info: (deviceInfo as import("@/types/supabase").Json) || {},
        is_active: true,
        last_used_at: new Date().toISOString(),
      };

      const { error } = await this.supabase
        .from("push_tokens")
        .upsert(tokenData, {
          onConflict: "user_id,token",
        });

      if (error) {
        console.error("Error registering device token:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to register device token:", error);
      return false;
    }
  }

  /**
   * Unregister device token
   */
  async unregisterDeviceToken(userId: string, token: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("push_tokens")
        .update({
          is_active: false,
        })
        .eq("user_id", userId)
        .eq("token", token);

      if (error) {
        console.error("Error unregistering device token:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to unregister device token:", error);
      return false;
    }
  }

  /**
   * Get active push tokens for a user
   */
  private async getUserPushTokens(userId: string): Promise<PushToken[]> {
    try {
      const { data, error } = await this.supabase
        .from("push_tokens")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching push tokens:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Failed to fetch push tokens:", error);
      return [];
    }
  }

  /**
   * Send push notification to user's devices
   */
  private async sendPushNotification(
    userId: string,
    notification: Notification,
  ): Promise<void> {
    try {
      const tokens = await this.getUserPushTokens(userId);

      if (tokens.length === 0) {
        return; // No tokens to send to
      }

      // Here you would integrate with your push notification service
      // (Firebase Cloud Messaging, OneSignal, etc.)
      // For now, just log
      console.log(
        `Would send push notification to ${tokens.length} devices for user ${userId}`,
      );

      // Update is_push_sent flag
      await this.supabase
        .from("notifications")
        .update({
          is_push_sent: true,
          push_sent_at: new Date().toISOString(),
        })
        .eq("id", notification.id);
    } catch (error) {
      console.error("Failed to send push notification:", error);
    }
  }

  /**
   * Get notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .eq("status", "unread");

      if (error) {
        console.error("Error getting unread count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Failed to get unread count:", error);
      return 0;
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void,
  ) {
    return this.supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        },
      )
      .subscribe();
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Export commonly used functions for convenience
export const {
  createNotification,
  sendChatMessageNotification,
  sendOrderUpdateNotification,
  sendFollowNotification,
  sendPostInteractionNotification,
  sendSystemAnnouncement,
  getUserNotifications,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  registerDeviceToken,
  unregisterDeviceToken,
  getUnreadCount,
  subscribeToNotifications,
} = notificationService;
