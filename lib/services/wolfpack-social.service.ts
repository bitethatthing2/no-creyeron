/**
 * WOLFPACK SOCIAL SERVICE
 * Handles likes, comments, follows, and sharing functionality
 *
 * ANALYSIS:
 * - Tables found: wolfpack_post_likes, content_comments, wolfpack_comment_reactions,
 *   social_follows, wolfpack_video_shares, content_posts
 * - Missing columns: shares_count doesn't exist in content_posts table
 * - Missing column: shared_to_platform doesn't exist (it's just 'platform')
 * - The imported database functions need to be created separately
 */

import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Type aliases from your database
type Tables = Database["public"]["Tables"];
type CommentRow = Tables["content_comments"]["Row"];
type UserRow = Tables["users"]["Row"];
type ShareRow = Tables["wolfpack_shares"]["Row"];

// Define the insert type for wolfpack_shares
interface ShareInsert {
  video_id: string;
  shared_by_user_id: string;
  shared_to_user_id?: string | null;
  share_type: string;
  message?: string | null;
  platform?: string | null;
}

// Public interfaces for backward compatibility
export interface WolfpackLike {
  id: string;
  user_id: string;
  video_id: string;
  created_at: string;
}

export interface WolfpackComment {
  id: string;
  user_id: string;
  video_id: string;
  parent_comment_id?: string | null;
  content: string;
  created_at: string | null;
  updated_at: string | null;
  is_deleted: boolean;
  user?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
    display_name?: string | null;
  };
  reactions?: Array<{
    emoji: string;
    count: number;
    user_reacted: boolean;
  }>;
  replies_count?: number;
}

export interface WolfpackFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface WolfpackVideoStats {
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
}

/**
 * Database helper functions that should be in @/lib/database/likes
 * These need to be implemented in a separate file
 */
async function checkIfUserLikedPost(videoId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("wolfpack_post_likes")
    .select("id")
    .eq("video_id", videoId)
    .eq("user_id", user.id)
    .maybeSingle();

  return !!data;
}

async function getLikeCount(videoId: string): Promise<number> {
  const { count } = await supabase
    .from("wolfpack_post_likes")
    .select("*", { count: "exact", head: true })
    .eq("video_id", videoId);

  return count || 0;
}

async function togglePostLike(videoId: string): Promise<{ liked: boolean }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Check if already liked
  const { data: existingLike } = await supabase
    .from("wolfpack_post_likes")
    .select("id")
    .eq("video_id", videoId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingLike) {
    // Unlike
    await supabase
      .from("wolfpack_post_likes")
      .delete()
      .eq("id", existingLike.id);
    return { liked: false };
  } else {
    // Like
    await supabase
      .from("wolfpack_post_likes")
      .insert({
        video_id: videoId,
        user_id: user.id,
      });
    return { liked: true };
  }
}

/**
 * Database helper functions that should be in @/lib/database/comments
 */
async function createComment(
  videoId: string,
  content: string,
  parentId?: string,
): Promise<CommentRow & { user?: Partial<UserRow> }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data: comment, error } = await supabase
    .from("content_comments")
    .insert({
      video_id: videoId,
      user_id: user.id,
      content,
      parent_comment_id: parentId || null,
    })
    .select(`
      *,
      user:users!content_posts_user_id_fkey (
        id,
        first_name,
        last_name,
        avatar_url,
        display_name
      )
    `)
    .single();

  if (error) throw error;
  return comment;
}

async function getCommentsForPost(
  videoId: string,
): Promise<Array<CommentRow & { user?: Partial<UserRow> }>> {
  const { data, error } = await supabase
    .from("content_comments")
    .select(`
      *,
      user:users!content_posts_user_id_fkey (
        id,
        first_name,
        last_name,
        avatar_url,
        display_name
      )
    `)
    .eq("video_id", videoId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

class WolfpackSocialService {
  private subscriptions: Map<string, RealtimeChannel> = new Map();

  /**
   * Like functionality
   */
  async toggleLike(
    videoId: string,
  ): Promise<{ success: boolean; liked: boolean }> {
    try {
      const result = await togglePostLike(videoId);
      return { success: true, liked: result.liked };
    } catch (error) {
      console.error("Error toggling like:", error);

      // Check if it's a duplicate key error (user already liked)
      const errorMessage = error instanceof Error
        ? error.message.toLowerCase()
        : "";
      if (
        errorMessage.includes("duplicate") ||
        errorMessage.includes("unique") ||
        errorMessage.includes("23505") // PostgreSQL unique violation code
      ) {
        console.log("Handling duplicate like - user already liked");
        return { success: true, liked: true };
      }

      return { success: false, liked: false };
    }
  }

  /**
   * Get video stats with user like status
   */
  async getVideoStats(videoId: string): Promise<WolfpackVideoStats> {
    try {
      // Get like count
      const likeCount = await getLikeCount(videoId);

      // Get comment count
      const { count: commentCount } = await supabase
        .from("content_comments")
        .select("*", { count: "exact", head: true })
        .eq("video_id", videoId);

      // Check if user liked
      const userLiked = await checkIfUserLikedPost(videoId);

      return {
        likes_count: likeCount,
        comments_count: commentCount || 0,
        user_liked: userLiked,
      };
    } catch (error) {
      console.error("Error getting video stats:", error);
      return { likes_count: 0, comments_count: 0, user_liked: false };
    }
  }

  /**
   * Comment functionality
   */
  async createComment(
    videoId: string,
    content: string,
    parentId?: string,
  ): Promise<{ success: boolean; comment?: WolfpackComment }> {
    try {
      const comment = await createComment(videoId, content, parentId);

      // Convert to interface format
      const formattedComment: WolfpackComment = {
        id: comment.id,
        user_id: comment.user_id,
        video_id: comment.video_id,
        parent_comment_id: comment.parent_comment_id,
        content: comment.content,
        created_at: comment.created_at || null,
        updated_at: comment.updated_at || comment.created_at || null,
        is_deleted: false,
        user: comment.user && comment.user.id
          ? {
            id: comment.user.id,
            first_name: comment.user.first_name,
            last_name: comment.user.last_name,
            avatar_url: comment.user.avatar_url,
            display_name: comment.user.display_name,
          }
          : undefined,
      };

      return { success: true, comment: formattedComment };
    } catch (error) {
      console.error("Error creating comment:", error);
      return { success: false };
    }
  }

  // Alias for backward compatibility
  async addComment(
    videoId: string,
    content: string,
    parentId?: string,
  ): Promise<{ success: boolean; comment?: WolfpackComment }> {
    return this.createComment(videoId, content, parentId);
  }

  /**
   * Get comments for a video
   */
  async getComments(videoId: string): Promise<WolfpackComment[]> {
    try {
      const comments = await getCommentsForPost(videoId);

      // Convert to interface format
      const formattedComments: WolfpackComment[] = comments.map((comment) => ({
        id: comment.id,
        user_id: comment.user_id,
        video_id: comment.video_id,
        parent_comment_id: comment.parent_comment_id,
        content: comment.content,
        created_at: comment.created_at || null,
        updated_at: comment.updated_at || comment.created_at || null,
        is_deleted: false,
        user: comment.user && comment.user.id
          ? {
            id: comment.user.id,
            first_name: comment.user.first_name,
            last_name: comment.user.last_name,
            avatar_url: comment.user.avatar_url,
            display_name: comment.user.display_name,
          }
          : undefined,
        reactions: [],
        replies_count: 0,
      }));

      return formattedComments;
    } catch (error) {
      console.error("Error getting comments:", error);
      return [];
    }
  }

  // Aliases for backward compatibility
  async getcontent_comments(videoId: string): Promise<WolfpackComment[]> {
    return this.getComments(videoId);
  }

  async getCommentsWithLikes(videoId: string): Promise<WolfpackComment[]> {
    return this.getComments(videoId);
  }

  /**
   * Comment reactions
   */
  async addCommentReaction(
    commentId: string,
    reactionType: string = "❤️",
  ): Promise<{ success: boolean }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false };

      const { error } = await supabase
        .from("wolfpack_comment_reactions")
        .insert({
          comment_id: commentId,
          user_id: user.id,
          reaction_type: reactionType,
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error adding reaction:", error);
      return { success: false };
    }
  }

  async removeCommentReaction(
    commentId: string,
    reactionType?: string,
  ): Promise<{ success: boolean }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false };

      let query = supabase
        .from("wolfpack_comment_reactions")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);

      if (reactionType) {
        query = query.eq("reaction_type", reactionType);
      }

      const { error } = await query;
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error removing reaction:", error);
      return { success: false };
    }
  }

  async getCommentReactions(commentId: string) {
    try {
      const { data, error } = await supabase
        .from("wolfpack_comment_reactions")
        .select(`
          *,
          user:users!content_posts_user_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url,
            display_name
          )
        `)
        .eq("comment_id", commentId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting comment reactions:", error);
      return [];
    }
  }

  async hasUserReacted(
    commentId: string,
    reactionType?: string,
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      let query = supabase
        .from("wolfpack_comment_reactions")
        .select("id")
        .eq("comment_id", commentId)
        .eq("user_id", user.id);

      if (reactionType) {
        query = query.eq("reaction_type", reactionType);
      }

      const { data } = await query.maybeSingle();
      return !!data;
    } catch (error) {
      console.error("Error checking user reaction:", error);
      return false;
    }
  }

  /**
   * Follow functionality
   */
  async toggleFollow(
    followingId: string,
  ): Promise<{ success: boolean; following: boolean }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, following: false };

      // Prevent self-following
      if (user.id === followingId) {
        return { success: false, following: false };
      }

      // Check if already following
      const { data: existingFollow } = await supabase
        .from("social_follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", followingId)
        .maybeSingle();

      if (existingFollow) {
        // Unfollow
        const { error } = await supabase
          .from("social_follows")
          .delete()
          .eq("id", existingFollow.id);

        if (error) throw error;
        return { success: true, following: false };
      } else {
        // Follow
        const { error } = await supabase
          .from("social_follows")
          .insert({
            follower_id: user.id,
            following_id: followingId,
          });

        if (error) throw error;
        return { success: true, following: true };
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      return { success: false, following: false };
    }
  }

  async getUserSocialStats(userId?: string) {
    try {
      const targetUserId = userId ||
        (await supabase.auth.getUser()).data.user?.id;
      if (!targetUserId) return { followers_count: 0, following_count: 0 };

      // Get followers count
      const { count: followersCount } = await supabase
        .from("social_follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", targetUserId);

      // Get following count
      const { count: followingCount } = await supabase
        .from("social_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", targetUserId);

      return {
        followers_count: followersCount || 0,
        following_count: followingCount || 0,
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      return { followers_count: 0, following_count: 0 };
    }
  }

  async getFollowers(userId?: string, limit = 50) {
    try {
      const targetUserId = userId ||
        (await supabase.auth.getUser()).data.user?.id;
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from("social_follows")
        .select(`
          *,
          follower:users!follower_id (
            id,
            first_name,
            last_name,
            avatar_url,
            display_name
          )
        `)
        .eq("following_id", targetUserId)
        .limit(limit)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting followers:", error);
      return [];
    }
  }

  async getFollowing(userId?: string, limit = 50) {
    try {
      const targetUserId = userId ||
        (await supabase.auth.getUser()).data.user?.id;
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from("social_follows")
        .select(`
          *,
          following:users!following_id (
            id,
            first_name,
            last_name,
            avatar_url,
            display_name
          )
        `)
        .eq("follower_id", targetUserId)
        .limit(limit)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting following:", error);
      return [];
    }
  }

  async findFriends(searchTerm?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from("users")
        .select("id, first_name, last_name, avatar_url, display_name")
        .neq("id", user.id)
        .limit(20);

      if (searchTerm) {
        query = query.or(
          `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`,
        );
      }

      const { data: users, error } = await query;
      if (error) throw error;

      // Get follow status for each user
      const usersWithFollowStatus = await Promise.all(
        (users || []).map(async (foundUser) => {
          const { data: follow } = await supabase
            .from("social_follows")
            .select("id")
            .eq("follower_id", user.id)
            .eq("following_id", foundUser.id)
            .maybeSingle();

          const stats = await this.getUserSocialStats(foundUser.id);

          return {
            ...foundUser,
            is_following: !!follow,
            ...stats,
          };
        }),
      );

      return usersWithFollowStatus;
    } catch (error) {
      console.error("Error finding friends:", error);
      return [];
    }
  }

  /**
   * Share tracking
   */
  async trackShare(
    videoId: string,
    platform: string = "direct",
  ): Promise<{ success: boolean; share?: ShareRow }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false };

      const shareData: ShareInsert = {
        video_id: videoId,
        shared_by_user_id: user.id,
        share_type: "external",
        platform: platform,
      };

      const { data, error } = await supabase
        .from("wolfpack_shares")
        .insert(shareData)
        .select()
        .single();

      if (error) {
        console.error("Error tracking share:", error);
        return { success: false };
      }

      return { success: true, share: data };
    } catch (error) {
      console.error("Error tracking share:", error);
      return { success: false };
    }
  }

  async getVideoShares(
    videoId: string,
  ): Promise<Array<ShareRow & { user?: Partial<UserRow> }>> {
    try {
      const { data, error } = await supabase
        .from("wolfpack_shares")
        .select(`
          *,
          user:users!shared_by_user_id (
            id,
            first_name,
            last_name,
            avatar_url,
            display_name
          )
        `)
        .eq("video_id", videoId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error getting video shares:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error getting video shares:", error);
      return [];
    }
  }

  // Alias for backward compatibility
  async getcontent_postshares(
    videoId: string,
  ): Promise<Array<ShareRow & { user?: Partial<UserRow> }>> {
    return this.getVideoShares(videoId);
  }

  /**
   * Real-time subscriptions
   */
  subscribeToVideoStats(
    videoId: string,
    callback: (stats: WolfpackVideoStats) => void,
  ): () => void {
    const channelName = `video-stats-${videoId}`;

    // Clean up existing subscription
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wolfpack_post_likes",
          filter: `video_id=eq.${videoId}`,
        },
        async () => {
          const stats = await this.getVideoStats(videoId);
          callback(stats);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "content_comments",
          filter: `video_id=eq.${videoId}`,
        },
        async () => {
          const stats = await this.getVideoStats(videoId);
          callback(stats);
        },
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  // Aliases for backward compatibility
  subscribeTocontent_poststats(
    videoId: string,
    callback: (stats: WolfpackVideoStats) => void,
  ): () => void {
    return this.subscribeToVideoStats(videoId, callback);
  }

  subscribeToComments(
    videoId: string,
    callback: (comments: WolfpackComment[]) => void,
  ): () => void {
    const channelName = `comments-${videoId}`;

    // Clean up existing subscription
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "content_comments",
          filter: `video_id=eq.${videoId}`,
        },
        async () => {
          const comments = await this.getComments(videoId);
          callback(comments);
        },
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  // Alias for backward compatibility
  subscribeTocontent_comments(
    videoId: string,
    callback: (comments: WolfpackComment[]) => void,
  ): () => void {
    return this.subscribeToComments(videoId, callback);
  }

  private unsubscribe(channelName: string) {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
    }
  }

  /**
   * Clean up all subscriptions
   */
  cleanup() {
    this.subscriptions.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }
}

export const wolfpackSocialService = new WolfpackSocialService();
