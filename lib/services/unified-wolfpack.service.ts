/**
 * UNIFIED WOLFPACK SERVICE - SINGLE SOURCE OF TRUTH
 *
 * This is the ONE service for ALL app functionality:
 * - Wolfpack Social (videos, likes, follows, comments)
 * - DJ/Broadcast Management
 * - Menu/Restaurant Features
 * - Admin Functions
 * - Notifications
 * - Media Optimization
 * - Authentication
 * - Performance Monitoring
 *
 * No more scattered services, no more confusion.
 */

"use client";

import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

// =============================================================================
// TYPES - Single source of truth for all types
// =============================================================================

export interface WolfpackUser {
  id: string;
  display_name: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  location: string | null;
  wolfpack_status: string | null;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
}

export interface WolfpackVideo {
  id: string;
  user_id: string;
  caption: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  location_tag: string | null;
  is_active: boolean;
  users?: WolfpackUser;
}

export interface WolfpackComment {
  id: string;
  user_id: string;
  video_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  likes_count: number;
  like_count?: number; // Alternative field name used in some places
  user?: WolfpackUser;
  replies?: WolfpackComment[];
  replies_count?: number;
  user_liked?: boolean; // Whether current user has liked this comment
}

export interface ServiceResponse<T = any> {
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
  // AUTHENTICATION - BULLETPROOF SESSION MANAGEMENT
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
      // Don't redirect here - let the calling component handle it
      return null;
    }
    return { user: session.user, session };
  }

  // Helper method for when you want to redirect
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
        .eq("id", conversationid)
        .maybeSingle();

      if (error) {
        console.error("Error getting user profile:", error);
        return null;
      }

      return data; // Will be null if no user found, which is fine
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
              wolfpack_status: "pending",
              location: "florida_state",
              state: "Florida",
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

  async signOut(): Promise<ServiceResponse> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Redirect to home
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
      console.log(
        "📺 Fetching feed videos (limit:",
        limit,
        "offset:",
        offset,
        ")",
      );

      const currentUser = await this.getCurrentUser();

      // Try RPC function first if user is authenticated
      if (currentUser) {
        try {
          // Get the database user ID first
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
              console.log("✅ Fetched", rpcData.length, "videos via RPC");
              return {
                success: true,
                data: rpcData || [],
              };
            } else {
              console.log(
                "RPC failed, falling back to direct query:",
                rpcError?.message,
              );
            }
          }
        } catch (rpcError) {
          console.log("RPC not available, using direct query");
        }
      }

      // Fallback to direct query
      const { data, error } = await supabase
        .from("wolfpack_videos")
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
          is_active,
          users!user_id (
            id,
            display_name,
            username,
            first_name,
            last_name,
            avatar_url,
            location,
            wolfpack_status
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("❌ Database error:", error);
        throw error;
      }

      console.log("✅ Fetched", data?.length || 0, "videos from database");

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error("❌ Error fetching feed:", error);
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
    conversationid?: string,
  ): Promise<ServiceResponse<{ liked: boolean }>> {
    // If noconversationid provided, get from current user
    let actualUserId = conversationid;
    if (!actualUserId) {
      const auth = await this.requireAuth();
      if (!auth) {
        return {
          success: false,
          error: "Authentication required to like videos",
        };
      }

      const profile = await this.getCurrentUserProfile();
      if (!profile) {
        return {
          success: false,
          error: "User profile not found",
        };
      }
      actualUserId = profile.id;
    }

    try {
      // Check if already liked
      const { data: existingLike, error: likeCheckError } = await supabase
        .from("wolfpack_post_likes")
        .select("id")
        .eq("video_id", videoId)
        .eq("user_id", actualUserId)
        .single();

      // Handle table not existing or RLS policy issues
      if (
        likeCheckError &&
        (likeCheckError.code === "PGRST202" ||
          likeCheckError.message?.includes("406"))
      ) {
        console.warn(
          "wolfpack_post_likes table not accessible, skipping like functionality",
        );
        return { success: false, error: "Like functionality not available" };
      }

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
        await supabase.rpc("increment_video_likes", {
          video_id: videoId,
        });

        // Send notification to video owner
        await this.notifyLike(videoId, actualUserId);

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
    // If no followerId provided, get from current user
    let actualFollowerId = followerId;
    if (!actualFollowerId) {
      const auth = await this.requireAuth();
      if (!auth) {
        return {
          success: false,
          error: "Authentication required to follow users",
        };
      }

      const profile = await this.getCurrentUserProfile();
      if (!profile) {
        return {
          success: false,
          error: "User profile not found",
        };
      }
      actualFollowerId = profile.id;
    }

    try {
      // Check if already following
      const { data: existingFollow } = await supabase
        .from("wolfpack_follows")
        .select("id")
        .eq("follower_id", actualFollowerId)
        .eq("following_id", followingId)
        .single();

      if (existingFollow) {
        // Unfollow
        const { error } = await supabase
          .from("wolfpack_follows")
          .delete()
          .eq("follower_id", actualFollowerId)
          .eq("following_id", followingId);

        if (error) throw error;
        return { success: true, data: { following: false } };
      } else {
        // Follow
        const { error } = await supabase
          .from("wolfpack_follows")
          .insert({ follower_id: actualFollowerId, following_id: followingId });

        if (error) throw error;
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

  async trackShare(
    videoId: string,
    conversationid: string,
    platform: string,
  ): Promise<ServiceResponse> {
    try {
      // Track share action
      const { error } = await supabase
        .from("wolfpack_shares")
        .insert({
          video_id: videoId,
          user_id: conversationid,
          platform,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error tracking share:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to track share",
      };
    }
  }

  // =========================================================================
  // MESSAGING PERMISSIONS
  // =========================================================================

  async canMessageUser(
    targetUserId: string,
  ): Promise<ServiceResponse<boolean>> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: "Authentication required",
        };
      }

      // Get both users' profiles
      const [senderProfile, targetProfile] = await Promise.all([
        this.getCurrentUserProfile(),
        this.getUserProfile(targetUserId),
      ]);

      if (!senderProfile || !targetProfile) {
        return {
          success: false,
          error: "User not found",
        };
      }

      // Check if both users are in the wolfpack (active status)
      const canMessage = senderProfile.wolfpack_status === "active" &&
        targetProfile.wolfpack_status === "active";

      return {
        success: true,
        data: canMessage,
      };
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
    currentUserId: string,
    limit = 20,
  ): Promise<ServiceResponse<WolfpackUser[]>> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(`
          id,
          display_name,
          username,
          first_name,
          last_name,
          avatar_url,
          location,
          wolfpack_status
        `)
        .neq("id", currentUserId)
        .or(
          `display_name.ilike.%${query}%,username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`,
        )
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
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
    currentUserId: string,
    limit = 10,
  ): Promise<ServiceResponse<WolfpackUser[]>> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(`
          id,
          display_name,
          username,
          first_name,
          last_name,
          avatar_url,
          location,
          wolfpack_status
        `)
        .neq("id", currentUserId)
        .or("location.eq.florida_state,state.eq.Florida")
        .eq("wolfpack_status", "active")
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
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

  async getAllWolfpackMembers(
    currentUserId: string,
    limit = 100,
  ): Promise<ServiceResponse<WolfpackUser[]>> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(`
          id,
          display_name,
          username,
          first_name,
          last_name,
          avatar_url,
          location,
          wolfpack_status
        `)
        .neq("id", currentUserId)
        .eq("wolfpack_status", "active")
        .order("display_name", { ascending: true })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error("Error getting wolfpack members:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to get wolfpack members",
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
      // Always use direct query for now (reliable)
      const { data, error } = await supabase
        .from("wolfpack_comments")
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
            avatar_url
          )
        `)
        .eq("video_id", videoId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Organize into tree structure
      const comments = this.organizeCommentsIntoTree(data || []);

      return {
        success: true,
        data: comments,
      };
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
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: "Authentication required to comment",
        };
      }

      // Get the database user profile to get the correct user ID
      const profile = await this.getCurrentUserProfile();
      if (!profile) {
        return {
          success: false,
          error: "User profile not found",
        };
      }

      // Use direct insert for now (reliable)
      const { data, error } = await supabase
        .from("wolfpack_comments")
        .insert({
          video_id: videoId,
          user_id: profile.id,
          content: content.trim(),
          parent_comment_id: parentCommentId || null,
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
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error("Error adding comment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add comment",
      };
    }
  }

  async getBatchComments(
    videoIds: string[],
    limitPerPost = 3,
  ): Promise<ServiceResponse<Record<string, WolfpackComment[]>>> {
    try {
      if (videoIds.length === 0) {
        return { success: true, data: {} };
      }

      // Use direct query for batch fetching (reliable)
      const { data, error } = await supabase
        .from("wolfpack_comments")
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
            avatar_url
          )
        `)
        .in("video_id", videoIds)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group comments by video_id and limit per video
      const groupedComments: Record<string, WolfpackComment[]> = {};

      for (const comment of data || []) {
        if (!groupedComments[comment.video_id]) {
          groupedComments[comment.video_id] = [];
        }

        if (groupedComments[comment.video_id].length < limitPerPost) {
          groupedComments[comment.video_id].push(comment);
        }
      }

      return {
        success: true,
        data: groupedComments,
      };
    } catch (error) {
      console.error("Error getting batch comments:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to get comments",
      };
    }
  }

  async getBatchCommentCounts(
    videoIds: string[],
  ): Promise<ServiceResponse<Record<string, number>>> {
    try {
      if (videoIds.length === 0) {
        return { success: true, data: {} };
      }

      // Get comment counts for multiple videos efficiently
      const { data, error } = await supabase
        .from("wolfpack_comments")
        .select("video_id")
        .in("video_id", videoIds)
        .eq("is_deleted", false);

      if (error) throw error;

      // Count comments per video
      const counts: Record<string, number> = {};
      for (const videoId of videoIds) {
        counts[videoId] = 0;
      }

      for (const comment of data || []) {
        counts[comment.video_id] = (counts[comment.video_id] || 0) + 1;
      }

      return {
        success: true,
        data: counts,
      };
    } catch (error) {
      console.error("Error getting comment counts:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to get comment counts",
      };
    }
  }

  async toggleCommentLike(
    commentId: string,
  ): Promise<
    ServiceResponse<{
      success: boolean;
      action: "added" | "removed";
      user_has_liked: boolean;
      new_like_count: number;
    }>
  > {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: "Authentication required to like comments",
        };
      }

      // Call the RPC function to toggle the like
      const { data, error } = await supabase.rpc("toggle_comment_like", {
        p_comment_id: commentId,
      });

      if (error) throw error;

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error("Error toggling comment like:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to toggle comment like",
      };
    }
  }

  async getCommentsWithLikes(
    videoId: string,
    limit = 50,
    offset = 0,
  ): Promise<ServiceResponse<WolfpackComment[]>> {
    try {
      const currentUser = await this.getCurrentUser();
      constconversationid = currentUser?.id;

      // Get comments with like status
      const { data: comments, error: commentsError } = await supabase
        .from("wolfpack_comments")
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
          like_count,
          users:user_id (
            id,
            display_name,
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq("video_id", videoId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (commentsError) throw commentsError;

      // If user is logged in, get their reactions
      let userReactions: Set<string> = new Set();
      if (userId && comments && comments.length > 0) {
        const commentIds = comments.map((c) => c.id);

        const { data: reactions, error: reactionsError } = await supabase
          .from("wolfpack_comment_reactions")
          .select("comment_id")
          .eq("user_id", conversationid)
          .eq("reaction_type", "❤️")
          .in("comment_id", commentIds);

        if (!reactionsError && reactions) {
          userReactions = new Set(reactions.map((r) => r.comment_id));
        }
      }

      // Enhance comments with like status
      const enhancedComments = (comments || []).map((comment) => ({
        ...comment,
        user_liked: userReactions.has(comment.id),
        like_count: comment.like_count || comment.likes_count || 0,
      }));

      // Organize into tree structure
      const organizedComments = this.organizeCommentsIntoTree(enhancedComments);

      return {
        success: true,
        data: organizedComments,
      };
    } catch (error) {
      console.error("Error getting comments with likes:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to get comments",
      };
    }
  }

  private organizeCommentsIntoTree(
    comments: (WolfpackComment & {
      users?: WolfpackUser;
      replies?: WolfpackComment[];
      user_liked?: boolean;
    })[],
  ): WolfpackComment[] {
    const commentMap = new Map();
    const rootComments: WolfpackComment[] = [];

    // First pass: create map of all comments
    comments.forEach((comment) => {
      commentMap.set(comment.id, {
        ...comment,
        replies: [],
        user: comment.users,
        user_liked: comment.user_liked || false,
        like_count: comment.like_count || 0,
      });
    });

    // Second pass: organize into tree
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
  // VIDEO MANAGEMENT
  // =========================================================================

  async deleteVideo(
    videoId: string,
    conversationid?: string,
  ): Promise<ServiceResponse> {
    // If noconversationid provided, get from current user
    let actualUserId = conversationid;
    if (!actualUserId) {
      const auth = await this.requireAuth();
      if (!auth) {
        return {
          success: false,
          error: "Authentication required to delete videos",
        };
      }

      const profile = await this.getCurrentUserProfile();
      if (!profile) {
        return {
          success: false,
          error: "User profile not found",
        };
      }
      actualUserId = profile.id;
    }

    try {
      const { error } = await supabase.rpc("delete_user_video", {
        video_id_param: videoId,
      });

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
  // FIREBASE PUSH NOTIFICATIONS - COMPREHENSIVE SYSTEM
  // =========================================================================

  async sendNotification(params: {
    conversationid: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    type:
      | "dj_broadcast"
      | "message"
      | "like"
      | "comment"
      | "follow"
      | "event"
      | "admin";
  }): Promise<ServiceResponse> {
    try {
      // Get user's FCM token
      const { data: user } = await supabase
        .from("users")
        .select("fcm_token, notification_preferences")
        .eq("id", params.userId)
        .single();

      if (!user?.fcm_token) {
        return {
          success: false,
          error: "User has no FCM token",
        };
      }

      // Check if user has notifications enabled for this type
      const prefs = user.notification_preferences || {};
      const typeEnabled = this.checkNotificationPreference(params.type, prefs);

      if (!typeEnabled) {
        return {
          success: false,
          error: "User has disabled this notification type",
        };
      }

      // Send notification via API
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: user.fcm_token,
          title: params.title,
          body: params.body,
          data: {
            type: params.type,
            ...params.data,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      // Log notification in database
      await supabase
        .from("notifications")
        .insert({
          user_id: params.userId,
          title: params.title,
          body: params.body,
          type: params.type,
          data: params.data,
          sent_at: new Date().toISOString(),
        });

      return { success: true };
    } catch (error) {
      console.error("Error sending notification:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to send notification",
      };
    }
  }

  private checkNotificationPreference(
    type: string,
    prefs: Record<string, boolean>,
  ): boolean {
    switch (type) {
      case "dj_broadcast":
        return prefs.events !== false;
      case "message":
        return prefs.chatMessages !== false;
      case "like":
      case "comment":
      case "follow":
        return prefs.socialInteractions !== false;
      case "event":
        return prefs.events !== false;
      case "admin":
        return prefs.announcements !== false;
      default:
        return true;
    }
  }

  // DJ Broadcast Notifications
  async notifyDJBroadcast(
    djId: string,
    eventTitle: string,
    eventData: Record<string, unknown>,
  ): Promise<ServiceResponse> {
    try {
      // Get all users who should be notified about DJ events
      const { data: users } = await supabase
        .from("users")
        .select("id, fcm_token, notification_preferences")
        .eq("wolfpack_status", "active")
        .not("fcm_token", "is", null);

      if (!users?.length) {
        return { success: true, data: { notified: 0 } };
      }

      let notified = 0;
      for (const user of users) {
        const result = await this.sendNotification({
          conversationid: user.id,
          title: "🎵 DJ Live Now!",
          body: `${eventTitle} - Tune in to the Wolf Pack!`,
          type: "dj_broadcast",
          data: {
            djId,
            eventId: eventData.id,
            action: "join_broadcast",
          },
        });

        if (result.success) notified++;
      }

      return { success: true, data: { notified } };
    } catch (error) {
      console.error("Error sending DJ broadcast notifications:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to send DJ notifications",
      };
    }
  }

  // Message Notifications
  async notifyNewMessage(
    fromUserId: string,
    toUserId: string,
    message: string,
  ): Promise<ServiceResponse> {
    try {
      const { data: fromUser } = await supabase
        .from("users")
        .select("display_name, username, first_name, last_name")
        .eq("id", fromUserId)
        .single();

      const senderName = this.getDisplayName(fromUser || {} as WolfpackUser);

      return await this.sendNotification({
        conversationid: toUserId,
        title: `💬 New message from ${senderName}`,
        body: message.length > 50 ? message.substring(0, 50) + "..." : message,
        type: "message",
        data: {
          fromUserId,
          action: "open_message",
        },
      });
    } catch (error) {
      console.error("Error sending message notification:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to send message notification",
      };
    }
  }

  // Social Interaction Notifications
  async notifyLike(
    videoId: string,
    likerUserId: string,
  ): Promise<ServiceResponse> {
    try {
      // Get video owner
      const { data: video } = await supabase
        .from("wolfpack_videos")
        .select("user_id, caption")
        .eq("id", videoId)
        .single();

      if (!video || video.user_id === likerUserId) {
        return { success: true }; // Don't notify self-likes
      }

      const { data: liker } = await supabase
        .from("users")
        .select("display_name, username, first_name, last_name")
        .eq("id", likerUserId)
        .single();

      const likerName = this.getDisplayName(liker || {} as WolfpackUser);

      return await this.sendNotification({
        conversationid: video.user_id,
        title: "❤️ Someone liked your video!",
        body: `${likerName} liked your post`,
        type: "like",
        data: {
          videoId,
          likerUserId,
          action: "open_video",
        },
      });
    } catch (error) {
      console.error("Error sending like notification:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to send like notification",
      };
    }
  }

  async notifyComment(
    videoId: string,
    commenterUserId: string,
    comment: string,
  ): Promise<ServiceResponse> {
    try {
      // Get video owner
      const { data: video } = await supabase
        .from("wolfpack_videos")
        .select("user_id, caption")
        .eq("id", videoId)
        .single();

      if (!video || video.user_id === commenterUserId) {
        return { success: true }; // Don't notify self-comments
      }

      const { data: commenter } = await supabase
        .from("users")
        .select("display_name, username, first_name, last_name")
        .eq("id", commenterUserId)
        .single();

      const commenterName = this.getDisplayName(
        commenter || {} as WolfpackUser,
      );

      return await this.sendNotification({
        conversationid: video.user_id,
        title: "💬 New comment on your video!",
        body: `${commenterName}: ${
          comment.length > 50 ? comment.substring(0, 50) + "..." : comment
        }`,
        type: "comment",
        data: {
          videoId,
          commenterUserId,
          action: "open_comments",
        },
      });
    } catch (error) {
      console.error("Error sending comment notification:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to send comment notification",
      };
    }
  }

  async notifyFollow(
    followerId: string,
    followingId: string,
  ): Promise<ServiceResponse> {
    try {
      const { data: follower } = await supabase
        .from("users")
        .select("display_name, username, first_name, last_name")
        .eq("id", followerId)
        .single();

      const followerName = this.getDisplayName(follower || {} as WolfpackUser);

      return await this.sendNotification({
        conversationid: followingId,
        title: "🐺 New follower!",
        body: `${followerName} started following you`,
        type: "follow",
        data: {
          followerId,
          action: "open_profile",
        },
      });
    } catch (error) {
      console.error("Error sending follow notification:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to send follow notification",
      };
    }
  }

  // Admin Notifications
  async notifyAllUsers(
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<ServiceResponse> {
    try {
      const { data: users } = await supabase
        .from("users")
        .select("id")
        .eq("wolfpack_status", "active");

      if (!users?.length) {
        return { success: true, data: { notified: 0 } };
      }

      let notified = 0;
      for (const user of users) {
        const result = await this.sendNotification({
          conversationid: user.id,
          title,
          body,
          type: "admin",
          data,
        });

        if (result.success) notified++;
      }

      return { success: true, data: { notified } };
    } catch (error) {
      console.error("Error sending admin notifications:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Failed to send admin notifications",
      };
    }
  }

  // DJ Notification Methods
  async notifyDJLive(
    djName: string,
    eventTitle: string,
    streamUrl?: string,
  ): Promise<ServiceResponse> {
    const data = streamUrl
      ? { streamUrl, action: "join_stream" }
      : { action: "join_dj" };

    return this.notifyAllUsers(
      `🎵 ${djName} is LIVE!`,
      `${eventTitle} - Join the Wolfpack now!`,
      data,
    );
  }

  async notifyAdminAnnouncement(
    title: string,
    message: string,
    actionUrl?: string,
  ): Promise<ServiceResponse> {
    const data = actionUrl
      ? { link: actionUrl, action: "open_link" }
      : { action: "dismiss" };

    return this.notifyAllUsers(
      `📢 ${title}`,
      message,
      data,
    );
  }

  // =========================================================================
  // UTILITIES
  // =========================================================================

  getDisplayName(user: WolfpackUser): string {
    return user.display_name ||
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.username ||
      "Anonymous";
  }

  getAvatarUrl(user: WolfpackUser): string {
    return user.avatar_url || "/icons/wolf-icon.png";
  }
}

// =============================================================================
// EXPORT SINGLETON INSTANCE
// =============================================================================

export const wolfpackService = UnifiedWolfpackService.getInstance();
export default wolfpackService;

// Export the class for testing if needed
export { UnifiedWolfpackService };
