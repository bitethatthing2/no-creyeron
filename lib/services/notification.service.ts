// Notification Service
export class NotificationService {
  constructor(private supabase: any) {}

  /**
   * Get notifications for current user
   */
  async getMyNotifications(limit = 20) {
    try {
      const { data, error } = await this.supabase
        .from("wolfpack_activity_notifications")
        .select(`
          *,
          related_user:users!related_user_id (
            id,
            display_name,
            username,
            avatar_url
          ),
          related_video:wolfpack_videos!related_video_id (
            id,
            thumbnail_url,
            caption
          )
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    try {
      const { error } = await this.supabase
        .from("wolfpack_activity_notifications")
        .update({ status: "read" })
        .eq("id", notificationId);

      if (error) throw error;
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const { error } = await this.supabase
        .from("wolfpack_activity_notifications")
        .update({ status: "read" })
        .eq("status", "unread");

      if (error) throw error;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    try {
      const { count, error } = await this.supabase
        .from("wolfpack_activity_notifications")
        .select("*", { count: "exact" })
        .eq("status", "unread");

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string) {
    try {
      const { error } = await this.supabase
        .from("wolfpack_activity_notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }
}
