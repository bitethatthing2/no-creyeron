/**
 * UNIFIED WOLFPACK SERVICE - CLEANED VERSION
 *
 * This service handles ALL app functionality:
 * - Wolfpack Social (videos, likes, follows, comments)
 * - Messaging & Chat
 * - Notifications (unified system)
 * - User Management
 * - Authentication
 *
 * REMOVED: All DJ/Broadcast features (legacy code not in database)
 * UPDATED: Using actual database tables (unified_notifications, user_fcm_tokens, etc.)
 */

"use client";

import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import type {
  User as DBUser,
  UserActivityStatus,
  UserLocation,
  UserProfile,
  UserWithProfile,
  WolfpackComment as DBWolfpackComment,
  WolfpackMembership,
  WolfpackVideo as DBWolfpackVideo,
} from "@/types/database-models";

// =============================================================================
// TYPES - Based on actual database schema
// =============================================================================

// Partial user type for when we're only selecting specific fields
export interface WolfpackUserPartial {
  id: string;
  display_name?: string | null;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  profile_image_url?: string | null;
  location?: string | null;
  wolfpack_status?: string | null;
}

// Full user type extending database type
export interface WolfpackUser extends DBUser {
  // Add computed fields
  display_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  profile_image_url?: string | null;
  location?: string | null;
  wolfpack_status?: string | null;
  wolfpack_tier?: string | null;
  is_online?: boolean;
  last_activity?: string | null;
  last_seen_at?: string | null;
  notification_preferences?: Record<string, boolean>;
  privacy_settings?: {
    accept_messages?: boolean;
    show_location?: boolean;
    accept_winks?: boolean;
    profile_visible?: boolean;
  };
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
}

// Extended video type with relations
export interface WolfpackVideo extends DBWolfpackVideo {
  users?: WolfpackUserPartial; // Videos only get partial user data
  user?: WolfpackUserPartial; // Alternative naming
  likes_count?: number; // Computed field
  comments_count?: number; // Computed field
  user_liked?: boolean; // Computed field
}

// Extended comment type with relations
export interface WolfpackComment extends DBWolfpackComment {
  user?: WolfpackUserPartial; // Comments only get partial user data
  users?: WolfpackUserPartial; // Alternative field name from Supabase
  replies?: WolfpackComment[];
  replies_count?: number;
  user_liked?: boolean;
}

export interface UnifiedNotification {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  body: string;
  actor_id?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  action_url?: string | null;
  image_url?: string | null;
  is_read?: boolean;
  read_at?: string | null;
  is_archived?: boolean;
  archived_at?: string | null;
  push_sent?: boolean;
  push_sent_at?: string | null;
  push_error?: string | null;
  priority?: string | null;
  expires_at?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface FCMToken {
  id: string;
  user_id: string;
  token: string;
  platform?: "web" | "ios" | "android" | null;
  device_info?: Record<string, unknown>;
  is_active?: boolean;
  last_used_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// UNIFIED WOLFPACK SERVICE CLASS
// =============================================================================

class UnifiedWolfpackService {
  private static instance: UnifiedWolfpackService;

  static getInstance(): UnifiedWolfpackService {
    if (!UnifiedWolfpackService.instance) {
      UnifiedWolfpackService.instance = new UnifiedWolfpackService();
    }
    return UnifiedWolfpackService.instance;
  }

  // =========================================================================
  // AUTHENTICATION
  // =========================================================================

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error("Error getting current session:", error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return !!session?.user;
  }

  async requireAuth(): Promise<{ user: User; session: Session } | null> {
    const session = await this.getCurrentSession();
    if (!session?.user) {
      return null;
    }
    return { user: session.user, session };
  }

  redirectToLogin(): void {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  async getUserProfile(userId: string): Promise<WolfpackUser | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error getting user profile:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  }

  async getCurrentUserProfile(): Promise<WolfpackUser | null> {
    const auth = await this.requireAuth();
    if (!auth) return null;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", auth.user.id)
        .single();

      if (error) {
        // Create profile if it doesn't exist
        if (error.code === "PGRST116") {
          console.log("[AUTH] Creating new user profile");
          const { data: newProfile, error: insertError } = await supabase
            .from("users")
            .insert({
              auth_id: auth.user.id,
              email: auth.user.email!,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (insertError) throw insertError;
          return newProfile;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error getting current user profile:", error);
      return null;
    }
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<WolfpackUser>,
  ): Promise<ServiceResponse<WolfpackUser>> {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error("Error updating user profile:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to update profile",
      };
    }
  }

  async signOut(): Promise<ServiceResponse> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      if (typeof window !== "undefined") {
        window.location.href = "/";
      }

      return { success: true };
    } catch (error) {
      console.error("Error signing out:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sign out",
      };
    }
  }

  // =========================================================================
  // FEED OPERATIONS
  // =========================================================================

  async getFeedVideos(
    limit = 15,
    offset = 0,
  ): Promise<ServiceResponse<WolfpackVideo[]>> {
    try {
      const currentUser = await this.getCurrentUser();

      // Try RPC function first if user is authenticated
      if (currentUser) {
        try {
          const profile = await this.getCurrentUserProfile();
          if (profile) {
            const { data: rpcData, error: rpcError } = await supabase.rpc(
              "get_video_feed",
              {
                p_user_id: profile.id,
                p_limit: limit,
                p_offset: offset,
              },
            );

            if (!rpcError && rpcData) {
              return {
                success: true,
                data: rpcData || [],
              };
            }
          }
        } catch (rpcError) {
          console.log("RPC not available, using direct query");
        }
      }

      // Fallback to direct query
      const { data, error } = await supabase
        .from("content_posts")
        .select(`
          id,
          user_id,
          caption,
          video_url,
          thumbnail_url,
          like_count,
          comment_count,
          created_at,
          location_tag,
          location_id,
          is_active,
          users:user_id (
            id,
            display_name,
            username,
            first_name,
            last_name,
            avatar_url,
            profile_image_url,
            location,
            wolfpack_status
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Transform to ensure users is a single object
      const transformedData = (data || []).map((video) => ({
        ...video,
        users: Array.isArray(video.users) ? video.users[0] : video.users,
      })) as WolfpackVideo[];

      return {
        success: true,
        data: transformedData,
      };
    } catch (error) {
      console.error("Error fetching feed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch feed",
      };
    }
  }

  // =========================================================================
  // SOCIAL INTERACTIONS
  // =========================================================================

  async toggleLike(
    videoId: string,
    userId?: string,
  ): Promise<ServiceResponse<{ liked: boolean }>> {
    let actualUserId = userId;
    if (!actualUserId) {
      const profile = await this.getCurrentUserProfile();
      if (!profile) {
        return {
          success: false,
          error: "Authentication required",
        };
      }
      actualUserId = profile.id;
    }

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from("wolfpack_post_likes")
        .select("id")
        .eq("video_id", videoId)
        .eq("user_id", actualUserId)
        .maybeSingle();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from("wolfpack_post_likes")
          .delete()
          .eq("video_id", videoId)
          .eq("user_id", actualUserId);

        if (error) throw error;

        // Decrement like count
        await supabase.rpc("decrement_video_likes", { video_id: videoId });

        return { success: true, data: { liked: false } };
      } else {
        // Like
        const { error } = await supabase
          .from("wolfpack_post_likes")
          .insert({ video_id: videoId, user_id: actualUserId });

        if (error) throw error;

        // Increment like count
        await supabase.rpc("increment_video_likes", { video_id: videoId });

        // Create notification
        await this.createNotification({
          type: "like",
          videoId,
          actorId: actualUserId,
        });

        return { success: true, data: { liked: true } };
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to toggle like",
      };
    }
  }

  async toggleFollow(
    followingId: string,
    followerId?: string,
  ): Promise<ServiceResponse<{ following: boolean }>> {
    let actualFollowerId = followerId;
    if (!actualFollowerId) {
      const profile = await this.getCurrentUserProfile();
      if (!profile) {
        return {
          success: false,
          error: "Authentication required",
        };
      }
      actualFollowerId = profile.id;
    }

    try {
      // Check if already following
      const { data: existingFollow } = await supabase
        .from("social_follows")
        .select("id")
        .eq("follower_id", actualFollowerId)
        .eq("following_id", followingId)
        .maybeSingle();

      if (existingFollow) {
        // Unfollow
        const { error } = await supabase
          .from("social_follows")
          .delete()
          .eq("follower_id", actualFollowerId)
          .eq("following_id", followingId);

        if (error) throw error;
        return { success: true, data: { following: false } };
      } else {
        // Follow
        const { error } = await supabase
          .from("social_follows")
          .insert({
            follower_id: actualFollowerId,
            following_id: followingId,
            created_at: new Date().toISOString(),
          });

        if (error) throw error;

        // Create notification
        await this.createNotification({
          type: "follow",
          recipientId: followingId,
          actorId: actualFollowerId,
        });

        return { success: true, data: { following: true } };
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to toggle follow",
      };
    }
  }

  // =========================================================================
  // MESSAGING & CHAT
  // =========================================================================

  async canMessageUser(
    targetUserId: string,
  ): Promise<ServiceResponse<boolean>> {
    try {
      const currentProfile = await this.getCurrentUserProfile();
      if (!currentProfile) {
        return { success: false, error: "Authentication required" };
      }

      const targetProfile = await this.getUserProfile(targetUserId);
      if (!targetProfile) {
        return { success: false, error: "User not found" };
      }

      // Check wolfpack status and privacy settings
      const canMessage = currentProfile.wolfpack_status === "active" &&
        targetProfile.wolfpack_status === "active" &&
        targetProfile.privacy_settings?.accept_messages !== false;

      return { success: true, data: canMessage };
    } catch (error) {
      console.error("Error checking message permissions:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to check permissions",
      };
    }
  }

  // =========================================================================
  // USER SEARCH & DISCOVERY
  // =========================================================================

  async searchUsers(
    query: string,
    limit = 20,
  ): Promise<ServiceResponse<WolfpackUser[]>> {
    try {
      const currentProfile = await this.getCurrentUserProfile();
      if (!currentProfile) {
        return { success: false, error: "Authentication required" };
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .neq("id", currentProfile.id)
        .or(
          `display_name.ilike.%${query}%,username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`,
        )
        .limit(limit);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error("Error searching users:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to search users",
      };
    }
  }

  async getSuggestedUsers(
    limit = 10,
  ): Promise<ServiceResponse<WolfpackUser[]>> {
    try {
      const currentProfile = await this.getCurrentUserProfile();
      if (!currentProfile) {
        return { success: false, error: "Authentication required" };
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .neq("id", currentProfile.id)
        .eq("wolfpack_status", "active")
        .limit(limit);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error("Error getting suggested users:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to get suggested users",
      };
    }
  }

  // =========================================================================
  // COMMENTS
  // =========================================================================

  async getComments(
    videoId: string,
    limit = 50,
    offset = 0,
  ): Promise<ServiceResponse<WolfpackComment[]>> {
    try {
      const { data, error } = await supabase
        .from("content_comments")
        .select(`
          id,
          user_id,
          video_id,
          parent_comment_id,
          content,
          created_at,
          updated_at,
          is_deleted,
          likes_count,
          users:user_id (
            id,
            display_name,
            username,
            first_name,
            last_name,
            avatar_url,
            profile_image_url
          )
        `)
        .eq("video_id", videoId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Transform and organize into tree
      const transformedData = (data || []).map((comment) => ({
        ...comment,
        users: Array.isArray(comment.users) ? comment.users[0] : comment.users,
        user: Array.isArray(comment.users) ? comment.users[0] : comment.users,
      })) as WolfpackComment[];

      const comments = this.organizeCommentsIntoTree(transformedData);

      return { success: true, data: comments };
    } catch (error) {
      console.error("Error getting comments:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to get comments",
      };
    }
  }

  async addComment(
    videoId: string,
    content: string,
    parentCommentId?: string,
  ): Promise<ServiceResponse<WolfpackComment>> {
    try {
      const profile = await this.getCurrentUserProfile();
      if (!profile) {
        return { success: false, error: "Authentication required" };
      }

      const { data, error } = await supabase
        .from("content_comments")
        .insert({
          video_id: videoId,
          user_id: profile.id,
          content: content.trim(),
          parent_comment_id: parentCommentId || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select(`
          id,
          user_id,
          video_id,
          parent_comment_id,
          content,
          created_at,
          updated_at,
          is_deleted,
          likes_count,
          users:user_id (
            id,
            display_name,
            username,
            first_name,
            last_name,
            avatar_url,
            profile_image_url
          )
        `)
        .single();

      if (error) throw error;

      // Transform the data
      const transformedData: WolfpackComment = {
        ...data,
        users: Array.isArray(data.users) ? data.users[0] : data.users,
        user: Array.isArray(data.users) ? data.users[0] : data.users,
      };

      // Create notification for video owner
      const { data: video } = await supabase
        .from("content_posts")
        .select("user_id")
        .eq("id", videoId)
        .single();

      if (video && video.user_id !== profile.id) {
        await this.createNotification({
          type: "comment",
          recipientId: video.user_id,
          actorId: profile.id,
          videoId,
          comment: content,
        });
      }

      return { success: true, data: transformedData };
    } catch (error) {
      console.error("Error adding comment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add comment",
      };
    }
  }

  private organizeCommentsIntoTree(
    comments: WolfpackComment[],
  ): WolfpackComment[] {
    const commentMap = new Map();
    const rootComments: WolfpackComment[] = [];

    // First pass: create map
    comments.forEach((comment) => {
      commentMap.set(comment.id, {
        ...comment,
        replies: [],
        user: comment.users || comment.user,
        user_liked: comment.user_liked || false,
        like_count: comment.like_count || comment.likes_count || 0,
      });
    });

    // Second pass: organize tree
    comments.forEach((comment) => {
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id));
          parent.replies_count = (parent.replies_count || 0) + 1;
        }
      } else {
        rootComments.push(commentMap.get(comment.id));
      }
    });

    return rootComments;
  }

  // =========================================================================
  // NOTIFICATIONS - Using unified_notifications table
  // =========================================================================

  async createNotification(params: {
    type: string;
    recipientId?: string;
    actorId?: string;
    videoId?: string;
    comment?: string;
  }): Promise<ServiceResponse> {
    try {
      let recipientId = params.recipientId;

      // Get recipient from video if needed
      if (!recipientId && params.videoId) {
        const { data: video } = await supabase
          .from("content_posts")
          .select("user_id")
          .eq("id", params.videoId)
          .single();

        if (video) {
          recipientId = video.user_id;
        }
      }

      if (!recipientId || recipientId === params.actorId) {
        return { success: true }; // Don't notify self
      }

      // Get actor info
      let actorName = "Someone";
      if (params.actorId) {
        const actor = await this.getUserProfile(params.actorId);
        if (actor) {
          actorName = this.getDisplayName(actor);
        }
      }

      // Build notification
      let title = "";
      let body = "";
      let entityType = null;
      let entityId = null;

      switch (params.type) {
        case "like":
          title = "❤️ New like!";
          body = `${actorName} liked your video`;
          entityType = "video";
          entityId = params.videoId;
          break;
        case "comment":
          title = "💬 New comment!";
          body = params.comment
            ? `${actorName}: ${params.comment.substring(0, 50)}...`
            : `${actorName} commented on your video`;
          entityType = "video";
          entityId = params.videoId;
          break;
        case "follow":
          title = "🐺 New follower!";
          body = `${actorName} started following you`;
          entityType = "user";
          entityId = params.actorId;
          break;
        case "message":
          title = "💬 New message!";
          body = `${actorName} sent you a message`;
          entityType = "message";
          break;
        default:
          title = "📢 Notification";
          body = "You have a new notification";
      }

      // Insert into unified_notifications
      const { error } = await supabase
        .from("unified_notifications")
        .insert({
          recipient_id: recipientId,
          type: params.type,
          title,
          body,
          actor_id: params.actorId,
          entity_type: entityType,
          entity_id: entityId,
          is_read: false,
          is_archived: false,
          push_sent: false,
          priority: "normal",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Try to send push notification if user has FCM token
      await this.sendPushNotification(recipientId, title, body, {
        type: params.type,
        entity_id: entityId,
      });

      return { success: true };
    } catch (error) {
      console.error("Error creating notification:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to create notification",
      };
    }
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<ServiceResponse> {
    try {
      // Get user's FCM tokens
      const { data: tokens } = await supabase
        .from("user_fcm_tokens")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (!tokens || tokens.length === 0) {
        return { success: false, error: "No FCM tokens found" };
      }

      // Check user's notification preferences
      const user = await this.getUserProfile(userId);
      if (!user?.notification_preferences?.social_interactions) {
        return { success: false, error: "User has disabled notifications" };
      }

      // Send to each active token
      for (const tokenRecord of tokens) {
        try {
          const response = await fetch("/api/notifications/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: tokenRecord.token,
              title,
              body,
              data,
            }),
          });

          if (!response.ok) {
            // Mark token as inactive if it fails
            await supabase
              .from("user_fcm_tokens")
              .update({ is_active: false })
              .eq("id", tokenRecord.id);
          }
        } catch (error) {
          console.error("Error sending to token:", error);
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Error sending push notification:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send push",
      };
    }
  }

  async getNotifications(
    limit = 50,
    offset = 0,
  ): Promise<ServiceResponse<UnifiedNotification[]>> {
    try {
      const profile = await this.getCurrentUserProfile();
      if (!profile) {
        return { success: false, error: "Authentication required" };
      }

      const { data, error } = await supabase
        .from("unified_notifications")
        .select("*")
        .eq("recipient_id", profile.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error("Error getting notifications:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to get notifications",
      };
    }
  }

  async markNotificationAsRead(
    notificationId: string,
  ): Promise<ServiceResponse> {
    try {
      const { error } = await supabase
        .from("unified_notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", notificationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to mark as read",
      };
    }
  }

  async markAllNotificationsAsRead(): Promise<ServiceResponse> {
    try {
      const profile = await this.getCurrentUserProfile();
      if (!profile) {
        return { success: false, error: "Authentication required" };
      }

      const { error } = await supabase
        .from("unified_notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("recipient_id", profile.id)
        .eq("is_read", false);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Error marking all as read:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to mark all as read",
      };
    }
  }

  // =========================================================================
  // FCM TOKEN MANAGEMENT
  // =========================================================================

  async registerFCMToken(
    token: string,
    platform: "web" | "ios" | "android" = "web",
  ): Promise<ServiceResponse> {
    try {
      const profile = await this.getCurrentUserProfile();
      if (!profile) {
        return { success: false, error: "Authentication required" };
      }

      // Check if token already exists
      const { data: existing } = await supabase
        .from("user_fcm_tokens")
        .select("id")
        .eq("user_id", profile.id)
        .eq("token", token)
        .maybeSingle();

      if (existing) {
        // Update existing token
        const { error } = await supabase
          .from("user_fcm_tokens")
          .update({
            is_active: true,
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert new token
        const { error } = await supabase
          .from("user_fcm_tokens")
          .insert({
            user_id: profile.id,
            token,
            platform,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      return { success: true };
    } catch (error) {
      console.error("Error registering FCM token:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to register token",
      };
    }
  }

  async removeFCMToken(token: string): Promise<ServiceResponse> {
    try {
      const profile = await this.getCurrentUserProfile();
      if (!profile) {
        return { success: false, error: "Authentication required" };
      }

      const { error } = await supabase
        .from("user_fcm_tokens")
        .update({ is_active: false })
        .eq("user_id", profile.id)
        .eq("token", token);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Error removing FCM token:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to remove token",
      };
    }
  }

  // =========================================================================
  // VIDEO MANAGEMENT
  // =========================================================================

  async deleteVideo(videoId: string): Promise<ServiceResponse> {
    try {
      const profile = await this.getCurrentUserProfile();
      if (!profile) {
        return { success: false, error: "Authentication required" };
      }

      // Verify ownership
      const { data: video } = await supabase
        .from("content_posts")
        .select("user_id")
        .eq("id", videoId)
        .single();

      if (!video || video.user_id !== profile.id) {
        return { success: false, error: "Not authorized to delete this video" };
      }

      // Soft delete
      const { error } = await supabase
        .from("content_posts")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", videoId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Error deleting video:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to delete video",
      };
    }
  }

  // =========================================================================
  // UTILITIES
  // =========================================================================

  getDisplayName(user: Partial<WolfpackUserPartial>): string {
    return user.display_name ||
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.username ||
      "Anonymous";
  }

  getAvatarUrl(user: Partial<WolfpackUserPartial>): string {
    return user.profile_image_url ||
      user.avatar_url ||
      "/icons/wolf-icon.png";
  }

  async updateOnlineStatus(isOnline: boolean): Promise<ServiceResponse> {
    try {
      const profile = await this.getCurrentUserProfile();
      if (!profile) {
        return { success: false, error: "Authentication required" };
      }

      const updates: Partial<WolfpackUser> = {
        is_online: isOnline,
        last_activity: new Date().toISOString(),
      };

      if (!isOnline) {
        updates.last_seen_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", profile.id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Error updating online status:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to update status",
      };
    }
  }
}

// =============================================================================
// EXPORT SINGLETON INSTANCE
// =============================================================================

export const wolfpackService = UnifiedWolfpackService.getInstance();
export default wolfpackService;

// Export the class for testing if needed
export { UnifiedWolfpackService };
