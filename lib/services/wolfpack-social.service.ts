import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
// Import the new typed database functions
import {
  checkIfUserLikedPost,
  getLikeCount as getPostLikeCount,
  togglePostLike,
} from "@/lib/database/likes";
import {
  createComment as createNewComment,
  deleteComment as removeComment,
  getwolfpack_commentsForPost,
} from "@/lib/database/comments";

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
  parent_comment_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  user?: {
    id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
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

export interface wolfpack_videostats {
  likes_count: number;
  wolfpack_comments_count: number;
  user_liked: boolean;
}

class WolfpackSocialService {
  private subscriptions: Map<string, RealtimeChannel> = new Map();

  // Like functionality - Updated to use new typed functions
  async toggleLike(
    videoId: string,
    userId: string,
  ): Promise<{ success: boolean; liked: boolean }> {
    try {
      const result = await togglePostLike(videoId);
      return { success: true, liked: result.liked };
    } catch (error) {
      console.error("Error toggling like:", error);

      // Check if it's a 409 Conflict error (user already liked)
      const errorMessage = error?.message?.toLowerCase() || "";
      if (
        errorMessage.includes("409") || errorMessage.includes("duplicate") ||
        errorMessage.includes("unique")
      ) {
        console.log("Handling 409 Conflict - user already liked");
        return { success: true, liked: true };
      }

      return { success: false, liked: false };
    }
  }

  // Get video stats with user like status - Updated to use correct RPC and table names
  async getwolfpack_videostats(
    videoId: string,
    userId?: string,
  ): Promise<wolfpack_videostats> {
    try {
      // Get like count from correct table
      const likeCount = await getPostLikeCount(videoId);

      // Get comment count from correct table
      const { count: commentCount } = await supabase
        .from("wolfpack_comments")
        .select("*", { count: "exact", head: true })
        .eq("video_id", videoId);

      // Check if user liked (if userId provided)
      let userLiked = false;
      if (userId) {
        userLiked = await checkIfUserLikedPost(videoId);
      }

      return {
        likes_count: likeCount,
        wolfpack_comments_count: commentCount || 0,
        user_liked: userLiked,
      };
    } catch (error) {
      console.error("Error getting video stats:", error);
      return { likes_count: 0, wolfpack_comments_count: 0, user_liked: false };
    }
  }

  // Comment functionality - Updated to use new typed functions
  async createComment(
    videoId: string,
    userId: string,
    content: string,
    parentId?: string,
  ): Promise<{ success: boolean; comment?: WolfpackComment }> {
    try {
      const comment = await createNewComment(
        videoId,
        content,
        parentId || undefined,
      );

      // Convert to old interface format for backward compatibility
      const formattedComment: WolfpackComment = {
        id: comment.id,
        user_id: comment.user_id,
        video_id: comment.video_id,
        parent_comment_id: comment.parent_comment_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at || comment.created_at,
        is_deleted: false,
        user: comment.user
          ? {
            id: comment.user.id,
            first_name: comment.user.first_name,
            last_name: comment.user.last_name,
            avatar_url: comment.user.avatar_url,
          }
          : undefined,
      };

      return { success: true, comment: formattedComment };
    } catch (error) {
      console.error("Error creating comment:", error);
      return { success: false };
    }
  }

  async getwolfpack_comments(
    videoId: string,
    userId?: string,
    parentId: string | null = null,
  ): Promise<WolfpackComment[]> {
    try {
      // Use the new typed function for basic wolfpack_comments
      const wolfpack_comments = await getwolfpack_commentsForPost(videoId);

      // Convert to old interface format for backward compatibility
      const formattedwolfpack_comments: WolfpackComment[] = wolfpack_comments
        .map((comment) => ({
          id: comment.id,
          user_id: comment.user_id,
          video_id: comment.video_id,
          parent_comment_id: comment.parent_comment_id,
          content: comment.content,
          created_at: comment.created_at,
          updated_at: comment.updated_at || comment.created_at,
          is_deleted: false,
          user: comment.user
            ? {
              id: comment.user.id,
              first_name: comment.user.first_name,
              last_name: comment.user.last_name,
              avatar_url: comment.user.avatar_url,
            }
            : undefined,
          reactions: [], // Will be populated by real-time subscription or manual fetch
          replies_count: 0, // Could be enhanced later
        }));

      return formattedwolfpack_comments;
    } catch (error) {
      console.error("Error getting wolfpack_comments:", error);
      return [];
    }
  }

  async addCommentReaction(
    commentId: string,
    userId: string,
    reactionType: string = "❤️",
  ): Promise<{ success: boolean }> {
    try {
      const { data, error } = await supabase
        .from("wolfpack_comment_reactions")
        .insert({
          comment_id: commentId,
          user_id: userId,
          reaction_type: reactionType,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error adding reaction:", error);
      return { success: false };
    }
  }

  async removeCommentReaction(
    commentId: string,
    userId: string,
    reactionType?: string,
  ): Promise<{ success: boolean }> {
    try {
      let query = supabase
        .from("wolfpack_comment_reactions")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", userId);

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

  // Get reactions for a comment
  async getCommentReactions(commentId: string) {
    try {
      const { data, error } = await supabase
        .from("wolfpack_comment_reactions")
        .select(`
          *,
          user:users(id, first_name, last_name, avatar_url, display_name)
        `)
        .eq("comment_id", commentId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting comment reactions:", error);
      return [];
    }
  }

  // Check if user has reacted to a comment
  async hasUserReacted(
    commentId: string,
    userId: string,
    reactionType?: string,
  ): Promise<boolean> {
    try {
      let query = supabase
        .from("wolfpack_comment_reactions")
        .select("id")
        .eq("comment_id", commentId)
        .eq("user_id", userId);

      if (reactionType) {
        query = query.eq("reaction_type", reactionType);
      }

      const { data, error } = await query.single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error("Error checking user reaction:", error);
      return false;
    }
  }

  // Follow functionality
  async toggleFollow(
    followerId: string,
    followingId: string,
  ): Promise<{ success: boolean; following: boolean }> {
    try {
      // Prevent self-following
      if (followerId === followingId) {
        return { success: false, following: false };
      }

      // Test basic connection first
      const { data: testData, error: testError } = await supabase
        .from("wolfpack_follows")
        .select("id")
        .limit(1);

      if (testError) {
        console.error("Basic wolfpack_follows query failed:", testError);
        return { success: false, following: false };
      }

      // Check if already following with proper error handling
      const { data: existingFollow, error: checkError } = await supabase
        .from("wolfpack_follows")
        .select("id")
        .eq("follower_id", followerId)
        .eq("following_id", followingId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no match

      if (checkError) {
        console.error("Error checking follow status:", checkError);
        return { success: false, following: false };
      }

      if (existingFollow) {
        // Unfollow
        const { error } = await supabase
          .from("wolfpack_follows")
          .delete()
          .eq("id", existingFollow.id);

        if (error) throw error;
        return { success: true, following: false };
      } else {
        // Follow
        const { error } = await supabase
          .from("wolfpack_follows")
          .insert({ follower_id: followerId, following_id: followingId });

        if (error) throw error;
        return { success: true, following: true };
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      return { success: false, following: false };
    }
  }

  async getUserSocialStats(userId: string) {
    try {
      // Note: RPC function get_user_social_stats may not exist
      // Let's calculate manually from wolfpack_follows table if it exists

      // Check if wolfpack_follows table exists
      const { data: testData, error: testError } = await supabase
        .from("wolfpack_follows")
        .select("id")
        .limit(1);

      if (testError) {
        console.warn("wolfpack_follows table does not exist:", testError);
        return { followers_count: 0, following_count: 0 };
      }

      // Get followers count
      const { count: followersCount } = await supabase
        .from("wolfpack_follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      // Get following count
      const { count: followingCount } = await supabase
        .from("wolfpack_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      return {
        followers_count: followersCount || 0,
        following_count: followingCount || 0,
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      return { followers_count: 0, following_count: 0 };
    }
  }

  async getFollowers(userId: string, limit = 50) {
    try {
      // Test basic connection first
      const { data: testData, error: testError } = await supabase
        .from("wolfpack_follows")
        .select("id")
        .limit(1);

      if (testError) {
        console.error("Basic wolfpack_follows query failed:", testError);
        return [];
      }

      const { data, error } = await supabase
        .from("wolfpack_follows")
        .select(`
          *,
          follower:users!follower_id (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq("following_id", userId)
        .limit(limit)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting followers:", error);
      return [];
    }
  }

  async getFollowing(userId: string, limit = 50) {
    try {
      // Test basic connection first
      const { data: testData, error: testError } = await supabase
        .from("wolfpack_follows")
        .select("id")
        .limit(1);

      if (testError) {
        console.error("Basic wolfpack_follows query failed:", testError);
        return [];
      }

      const { data, error } = await supabase
        .from("wolfpack_follows")
        .select(`
          *,
          following:users!following_id (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq("follower_id", userId)
        .limit(limit)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting following:", error);
      return [];
    }
  }

  // Find friends functionality
  async findFriends(userId: string, searchTerm?: string) {
    try {
      let query = supabase
        .from("users")
        .select("id, first_name, last_name, avatar_url")
        .neq("id", userId)
        .limit(20);

      if (searchTerm) {
        query = query.or(
          `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`,
        );
      }

      const { data: users, error } = await query;
      if (error) throw error;

      // Get follow status for each user
      const usersWithFollowStatus = await Promise.all(
        (users || []).map(async (user) => {
          const { data: follow } = await supabase
            .from("wolfpack_follows")
            .select("id")
            .eq("follower_id", userId)
            .eq("following_id", user.id)
            .single();

          const stats = await this.getUserSocialStats(user.id);

          return {
            ...user,
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

  // Real-time subscriptions
  subscribeTowolfpack_videostats(
    videoId: string,
    callback: (stats: wolfpack_videostats) => void,
    userId?: string,
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
          table: "wolfpack_post_likes", // ✅ Correct table name
          filter: `video_id=eq.${videoId}`,
        },
        async () => {
          const stats = await this.getwolfpack_videostats(videoId, userId);
          callback(stats);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wolfpack_comments", // ✅ Correct table name
          filter: `video_id=eq.${videoId}`,
        },
        async () => {
          const stats = await this.getwolfpack_videostats(videoId, userId);
          callback(stats);
        },
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  subscribeTowolfpack_comments(
    videoId: string,
    callback: (wolfpack_comments: WolfpackComment[]) => void,
    userId?: string,
  ): () => void {
    const channelName = `wolfpack_comments-${videoId}`;

    // Clean up existing subscription
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wolfpack_comments",
          filter: `video_id=eq.${videoId}`,
        },
        async () => {
          const wolfpack_comments = await this.getwolfpack_comments(
            videoId,
            userId,
          );
          callback(wolfpack_comments);
        },
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  private unsubscribe(channelName: string) {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
    }
  }

  // Clean up all subscriptions
  cleanup() {
    this.subscriptions.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }

  // Share tracking methods
  async trackShare(
    videoId: string,
    userId: string,
    platform: string = "direct",
  ) {
    try {
      // Track the share event in database
      const { data, error } = await supabase
        .from("wolfpack_video_shares")
        .insert({
          video_id: videoId,
          shared_by_user_id: userId,
          share_type: platform,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error tracking share:", error);
        return { success: false };
      }

      // Update video shares count
      await this.updatewolfpack_videosharesCount(videoId);

      return { success: true, share: data };
    } catch (error) {
      console.error("Error tracking share:", error);
      return { success: false };
    }
  }

  async updatewolfpack_videosharesCount(videoId: string) {
    try {
      // Get current shares count
      const { data: sharesData, error: sharesError } = await supabase
        .from("wolfpack_video_shares")
        .select("id")
        .eq("video_id", videoId);

      if (sharesError) {
        console.error("Error getting shares count:", sharesError);
        return;
      }

      const sharesCount = sharesData?.length || 0;

      // Update video shares count
      const { error: updateError } = await supabase
        .from("wolfpack_videos")
        .update({ shares_count: sharesCount })
        .eq("id", videoId);

      if (updateError) {
        console.error("Error updating video shares count:", updateError);
      }
    } catch (error) {
      console.error("Error updating shares count:", error);
    }
  }

  async getwolfpack_videoshares(videoId: string) {
    try {
      const { data, error } = await supabase
        .from("wolfpack_video_shares")
        .select(`
          *,
          user:users!shared_by_user_id (
            id,
            first_name,
            last_name,
            avatar_url
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
}

export const wolfpackSocialService = new WolfpackSocialService();
