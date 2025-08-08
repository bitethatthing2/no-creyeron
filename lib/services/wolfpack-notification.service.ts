/**
 * Wolfpack Notification Service
 * Handles notifications specifically for Wolfpack feed events
 */

import {
  createNotification,
  NotificationCreators,
} from "@/lib/notifications/create-notification";
import { supabase } from "@/lib/supabase";

interface WolfpackUser {
  id: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface WolfpackVideo {
  id: string;
  user_id: string;
  title?: string;
  description?: string;
}

export class WolfpackNotificationService {
  /**
   * Send notification when someone likes a video
   */
  static async notifyVideoLiked(
    videoId: string,
    videoOwnerId: string,
    likerId: string,
  ): Promise<void> {
    try {
      // Don't notify if user likes their own video
      if (videoOwnerId === likerId) return;

      // Get liker's information
      const { data: liker } = await supabase
        .from("users")
        .select("id, display_name, first_name, last_name, username")
        .eq("id", likerId)
        .single();

      if (!liker) return;

      const likerName = this.getUserDisplayName(liker);
      const notificationData = NotificationCreators.wolfpackLike(
        videoOwnerId,
        likerName,
        videoId,
      );

      // Create in-app notification
      await createNotification(notificationData);

      // Send push notification
      await this.sendPushNotification(videoOwnerId, {
        title: notificationData.title,
        body: notificationData.message,
        data: {
          type: "wolfpack_like",
          videoId,
          likerId,
          link: notificationData.link,
        },
        icon: "/icons/android-big-icon.png",
        badge: "/icons/android-lil-icon-white.png",
        requireInteraction: false,
      });
    } catch (error) {
      console.error("Error sending like notification:", error);
    }
  }

  /**
   * Send notification when someone wolfpack_comments on a video
   */
  static async notifyVideoCommented(
    videoId: string,
    videoOwnerId: string,
    commenterId: string,
    commentContent: string,
  ): Promise<void> {
    try {
      // Don't notify if user wolfpack_comments on their own video
      if (videoOwnerId === commenterId) return;

      // Get commenter's information
      const { data: commenter } = await supabase
        .from("users")
        .select("id, display_name, first_name, last_name, username")
        .eq("id", commenterId)
        .single();

      if (!commenter) return;

      const commenterName = this.getUserDisplayName(commenter);
      const commentPreview = commentContent.length > 50
        ? commentContent.substring(0, 50) + "..."
        : commentContent;

      const notificationData = NotificationCreators.wolfpackComment(
        videoOwnerId,
        commenterName,
        videoId,
        commentPreview,
      );

      // Create in-app notification
      await createNotification(notificationData);

      // Send push notification
      await this.sendPushNotification(videoOwnerId, {
        title: notificationData.title,
        body: notificationData.message,
        data: {
          type: "wolfpack_comment",
          videoId,
          commenterId,
          link: notificationData.link,
        },
        icon: "/icons/android-big-icon.png",
        badge: "/icons/android-lil-icon-white.png",
        requireInteraction: true,
      });
    } catch (error) {
      console.error("Error sending comment notification:", error);
    }
  }

  /**
   * Send notification when someone follows a user
   */
  static async notifyUserFollowed(
    followedUserId: string,
    followerId: string,
  ): Promise<void> {
    try {
      // Don't notify if user follows themselves (shouldn't happen)
      if (followedUserId === followerId) return;

      // Get follower's information
      const { data: follower } = await supabase
        .from("users")
        .select("id, display_name, first_name, last_name, username")
        .eq("id", followerId)
        .single();

      if (!follower) return;

      const followerName = this.getUserDisplayName(follower);
      const notificationData = NotificationCreators.wolfpackFollow(
        followedUserId,
        followerName,
        followerId,
      );

      // Create in-app notification
      await createNotification(notificationData);

      // Send push notification
      await this.sendPushNotification(followedUserId, {
        title: notificationData.title,
        body: notificationData.message,
        data: {
          type: "wolfpack_follow",
          followerId,
          link: notificationData.link,
        },
        icon: "/icons/android-big-icon.png",
        badge: "/icons/android-lil-icon-white.png",
        requireInteraction: false,
      });
    } catch (error) {
      console.error("Error sending follow notification:", error);
    }
  }

  /**
   * Send notification when a new video is posted by someone you follow
   */
  static async notifyFollowersOfNewVideo(
    videoId: string,
    posterId: string,
  ): Promise<void> {
    try {
      // Get poster's information
      const { data: poster } = await supabase
        .from("users")
        .select("id, display_name, first_name, last_name, username")
        .eq("id", posterId)
        .single();

      if (!poster) return;

      // Get all followers of the poster
      const { data: followers } = await supabase
        .from("wolfpack_follows")
        .select("follower_id")
        .eq("following_id", posterId);

      if (!followers || followers.length === 0) return;

      const posterName = this.getUserDisplayName(poster);

      // Send notification to each follower
      for (const follow of followers) {
        const notificationData = NotificationCreators.wolfpackVideoPosted(
          follow.follower_id,
          posterName,
          videoId,
        );

        // Create in-app notification
        await createNotification(notificationData);

        // Send push notification
        await this.sendPushNotification(follow.follower_id, {
          title: notificationData.title,
          body: notificationData.message,
          data: {
            type: "wolfpack_new_video",
            videoId,
            posterId,
            link: notificationData.link,
          },
          icon: "/icons/android-big-icon.png",
          badge: "/icons/android-lil-icon-white.png",
          requireInteraction: false,
        });
      }
    } catch (error) {
      console.error("Error sending new video notifications:", error);
    }
  }

  /**
   * Send notification when someone is mentioned in a comment
   */
  static async notifyMentionedUsers(
    videoId: string,
    commenterId: string,
    commentContent: string,
    mentionedUserIds: string[],
  ): Promise<void> {
    try {
      // Get commenter's information
      const { data: commenter } = await supabase
        .from("users")
        .select("id, display_name, first_name, last_name, username")
        .eq("id", commenterId)
        .single();

      if (!commenter) return;

      const commenterName = this.getUserDisplayName(commenter);
      const commentPreview = commentContent.length > 50
        ? commentContent.substring(0, 50) + "..."
        : commentContent;

      // Send notification to each mentioned user
      for (const mentionedUserId of mentionedUserIds) {
        // Don't notify if user mentions themselves
        if (mentionedUserId === commenterId) continue;

        const notificationData = NotificationCreators.wolfpackMention(
          mentionedUserId,
          commenterName,
          videoId,
          commentPreview,
        );

        // Create in-app notification
        await createNotification(notificationData);

        // Send push notification
        await this.sendPushNotification(mentionedUserId, {
          title: notificationData.title,
          body: notificationData.message,
          data: {
            type: "wolfpack_mention",
            videoId,
            commenterId,
            link: notificationData.link,
          },
          icon: "/icons/android-big-icon.png",
          badge: "/icons/android-lil-icon-white.png",
          requireInteraction: true,
        });
      }
    } catch (error) {
      console.error("Error sending mention notifications:", error);
    }
  }

  /**
   * Extract user mentions from comment content
   */
  static extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]); // Extract username without @
    }

    return mentions;
  }

  /**
   * Convert usernames to user IDs
   */
  static async resolveUsernames(usernames: string[]): Promise<string[]> {
    if (usernames.length === 0) return [];

    try {
      const { data: users } = await supabase
        .from("users")
        .select("id")
        .in("username", usernames);

      return users?.map((user) => user.id) || [];
    } catch (error) {
      console.error("Error resolving usernames:", error);
      return [];
    }
  }

  /**
   * Send push notification via the notification API
   */
  private static async sendPushNotification(
    userId: string,
    notificationPayload: {
      title: string;
      body: string;
      data?: Record<string, string>;
      icon?: string;
      badge?: string;
      requireInteraction?: boolean;
    },
  ): Promise<void> {
    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          title: notificationPayload.title,
          body: notificationPayload.body,
          data: notificationPayload.data,
          icon: notificationPayload.icon,
          badge: notificationPayload.badge,
          requireInteraction: notificationPayload.requireInteraction,
        }),
      });

      if (!response.ok) {
        throw new Error(`Push notification failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  }

  /**
   * Get user's display name in order of preference
   */
  private static getUserDisplayName(user: WolfpackUser): string {
    if (user.display_name) return user.display_name;
    if (user.username) return user.username;
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    return "Anonymous User";
  }

  /**
   * Check if user has notifications enabled for a specific type
   */
  static async hasNotificationsEnabled(
    userId: string,
    notificationType:
      | "likes"
      | "wolfpack_comments"
      | "follows"
      | "mentions"
      | "new_wolfpack_videos",
  ): Promise<boolean> {
    try {
      // Check user's notification preferences
      const { data: preferences } = await supabase
        .from("user_notification_preferences")
        .select(notificationType)
        .eq("user_id", userId)
        .single();

      // Default to enabled if no preferences set
      return preferences?.[notificationType] ?? true;
    } catch (error) {
      console.error("Error checking notification preferences:", error);
      // Default to enabled on error
      return true;
    }
  }

  /**
   * Batch send notifications for multiple users
   */
  static async sendBatchNotifications(
    notifications: Array<{
      userId: string;
      title: string;
      body: string;
      data?: Record<string, string>;
    }>,
  ): Promise<void> {
    try {
      // Group notifications by user to avoid spam
      const notificationsByUser = notifications.reduce((acc, notification) => {
        if (!acc[notification.userId]) {
          acc[notification.userId] = [];
        }
        acc[notification.userId].push(notification);
        return acc;
      }, {} as Record<string, typeof notifications>);

      // Send notifications with rate limiting
      for (
        const [userId, userNotifications] of Object.entries(notificationsByUser)
      ) {
        // For multiple notifications to same user, batch them or send the most recent
        const notification = userNotifications[userNotifications.length - 1];

        await this.sendPushNotification(userId, {
          title: notification.title,
          body: notification.body,
          data: notification.data,
        });

        // Small delay to avoid overwhelming the notification service
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error("Error sending batch notifications:", error);
    }
  }
}

export default WolfpackNotificationService;
