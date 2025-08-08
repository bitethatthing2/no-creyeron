import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

type WolfpackPost =
  & Database["public"]["Tables"]["wolfpack_videos"]["Row"]
  & {
    likes_count: number;
    wolfpack_comments_count: number;
    shares_count: number;
    username: string;
    avatar_url?: string;
    is_liked?: boolean; // Only available for authenticated users
  };

interface FeedOptions {
  limit?: number;
  offset?: number;
  currentUserId?: string;
}

export class WolfpackFeedServiceEnhanced {
  /**
   * Fetch public feed - accessible without authentication
   * Returns posts without user-specific data like "is_liked"
   */
  static async fetchPublicFeed(options: FeedOptions = {}): Promise<{
    posts: WolfpackPost[];
    hasMore: boolean;
  }> {
    const { limit = 10, offset = 0 } = options;

    try {
      // Fetch posts with public data only
      const { data: posts, error } = await supabase
        .from("wolfpack_videos")
        .select(`
          *,
          users!wolfpack_videos_user_id_fkey(
            display_name,
            avatar_url
          ),
          wolfpack_post_likes(count),
          wolfpack_comments(count)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching public feed:", error);
        throw error;
      }

      // Transform data for public consumption
      const transformedPosts: WolfpackPost[] = (posts || []).map((post) => ({
        ...post,
        username: post.users?.display_name || "Anonymous",
        avatar_url: post.users?.avatar_url || undefined,
        likes_count: Array.isArray(post.wolfpack_post_likes)
          ? post.wolfpack_post_likes.length
          : 0,
        wolfpack_comments_count: Array.isArray(post.wolfpack_comments)
          ? post.wolfpack_comments.length
          : 0,
        shares_count: 0, // You can add shares tracking later
        is_liked: undefined, // Not available for anonymous users
      }));

      return {
        posts: transformedPosts,
        hasMore: posts?.length === limit,
      };
    } catch (error) {
      console.error("Failed to fetch public feed:", error);
      return {
        posts: [],
        hasMore: false,
      };
    }
  }

  /**
   * Fetch authenticated feed - includes user-specific data
   * Returns posts with "is_liked" status and personalized content
   */
  static async fetchAuthenticatedFeed(
    options: FeedOptions & { currentUserId: string },
  ): Promise<{
    posts: WolfpackPost[];
    hasMore: boolean;
  }> {
    const { limit = 10, offset = 0, currentUserId } = options;

    try {
      // Fetch posts with user-specific data
      const { data: posts, error } = await supabase
        .from("wolfpack_videos")
        .select(`
          *,
          users!wolfpack_videos_user_id_fkey(
            display_name,
            avatar_url
          ),
          wolfpack_post_likes(count),
          wolfpack_comments(count),
          user_likes:wolfpack_post_likes!inner(user_id)
        `)
        .eq("is_active", true)
        .eq("user_likes.user_id", currentUserId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching authenticated feed:", error);
        throw error;
      }

      // Transform data for authenticated users
      const transformedPosts: WolfpackPost[] = (posts || []).map((post) => ({
        ...post,
        username: post.users?.display_name || "Anonymous",
        avatar_url: post.users?.avatar_url || undefined,
        likes_count: Array.isArray(post.wolfpack_post_likes)
          ? post.wolfpack_post_likes.length
          : 0,
        wolfpack_comments_count: Array.isArray(post.wolfpack_comments)
          ? post.wolfpack_comments.length
          : 0,
        shares_count: 0,
        is_liked: Array.isArray(post.user_likes) && post.user_likes.length > 0,
      }));

      return {
        posts: transformedPosts,
        hasMore: posts?.length === limit,
      };
    } catch (error) {
      console.error("Failed to fetch authenticated feed:", error);
      // Fallback to public feed if authenticated feed fails
      return this.fetchPublicFeed({ limit, offset });
    }
  }

  /**
   * Smart feed fetcher - automatically chooses public or authenticated based on user status
   */
  static async fetchFeed(options: FeedOptions = {}): Promise<{
    posts: WolfpackPost[];
    hasMore: boolean;
  }> {
    const { currentUserId } = options;

    if (currentUserId) {
      return this.fetchAuthenticatedFeed({ ...options, currentUserId });
    } else {
      return this.fetchPublicFeed(options);
    }
  }

  /**
   * Like a post - requires authentication
   */
  static async likePost(
    postId: string,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from("wolfpack_post_likes")
        .select("id")
        .eq("video_id", postId)
        .eq("user_id", userId)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from("wolfpack_post_likes")
          .delete()
          .eq("video_id", postId)
          .eq("user_id", userId);

        if (error) throw error;
        return { success: true };
      } else {
        // Like
        const { error } = await supabase
          .from("wolfpack_post_likes")
          .insert({
            video_id: postId,
            user_id: userId,
            created_at: new Date().toISOString(),
          });

        if (error) throw error;
        return { success: true };
      }
    } catch (error) {
      console.error("Failed to like post:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to like post",
      };
    }
  }

  /**
   * Share a post - can be done without authentication
   */
  static async sharePost(
    postId: string,
    userId?: string,
  ): Promise<{ success: boolean; shareUrl: string }> {
    try {
      // Increment share count (you might want to add a shares table)
      // For now, just return the share URL
      const shareUrl = `${window.location.origin}/wolfpack/video/${postId}`;

      // Optionally track share if user is authenticated
      if (userId) {
        // You can add share tracking here
        console.log(`User ${userId} shared post ${postId}`);
      }

      return {
        success: true,
        shareUrl,
      };
    } catch (error) {
      console.error("Failed to share post:", error);
      return {
        success: false,
        shareUrl: "",
      };
    }
  }

  /**
   * Get user's feed preferences (for authenticated users)
   */
  static async getUserFeedPreferences(userId: string): Promise<{
    showFollowingOnly: boolean;
    contentFilters: string[];
  }> {
    try {
      // This would fetch from a user_preferences table
      // For now, return defaults
      return {
        showFollowingOnly: false,
        contentFilters: [],
      };
    } catch (error) {
      console.error("Failed to get user preferences:", error);
      return {
        showFollowingOnly: false,
        contentFilters: [],
      };
    }
  }

  /**
   * Follow/unfollow a user - requires authentication
   */
  static async toggleFollow(
    targetUserId: string,
    currentUserId: string,
  ): Promise<{
    success: boolean;
    isFollowing: boolean;
    error?: string;
  }> {
    try {
      // Check if already following
      const { data: existingFollow } = await supabase
        .from("user_follows") // You might need to create this table
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId)
        .single();

      if (existingFollow) {
        // Unfollow
        const { error } = await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetUserId);

        if (error) throw error;
        return { success: true, isFollowing: false };
      } else {
        // Follow
        const { error } = await supabase
          .from("user_follows")
          .insert({
            follower_id: currentUserId,
            following_id: targetUserId,
            created_at: new Date().toISOString(),
          });

        if (error) throw error;
        return { success: true, isFollowing: true };
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      return {
        success: false,
        isFollowing: false,
        error: error instanceof Error ? error.message : "Failed to follow user",
      };
    }
  }
}
