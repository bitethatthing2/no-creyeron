import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase/types";

// Use the actual database types
type ContentPost = Database["public"]["Tables"]["content_posts"]["Row"];
type ContentComment = Database["public"]["Tables"]["content_comments"]["Row"];

// Enhanced post type with additional computed fields
type WolfpackPost = ContentPost & {
  username: string;
  avatar_url?: string | null;
  is_liked?: boolean; // Only available for authenticated users
  user_post_interactions?: {
    has_liked: boolean | null;
    has_viewed: boolean | null;
  } | null;
};

interface FeedOptions {
  limit?: number;
  offset?: number;
  currentUserId?: string;
}

interface FeedResponse {
  posts: WolfpackPost[];
  hasMore: boolean;
}

interface LikePostResponse {
  success: boolean;
  error?: string;
}

interface SharePostResponse {
  success: boolean;
  shareUrl: string;
}

interface FollowResponse {
  success: boolean;
  isFollowing: boolean;
  error?: string;
}

interface UserPreferences {
  showFollowingOnly: boolean;
  contentFilters: string[];
}

export class WolfpackFeedServiceEnhanced {
  /**
   * Fetch public feed - accessible without authentication
   * Returns posts without user-specific data like "is_liked"
   */
  static async fetchPublicFeed(
    options: FeedOptions = {},
  ): Promise<FeedResponse> {
    const { limit = 10, offset = 0 } = options;

    try {
      // Fetch posts with public data only
      const { data: posts, error } = await supabase
        .from("content_posts")
        .select(`
          *,
          users!content_posts_user_id_fkey(
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching public feed:", error);
        throw error;
      }

      // Transform data for public consumption
      const transformedPosts: WolfpackPost[] = (posts || []).map((post) => {
        const user = Array.isArray(post.users) ? post.users[0] : post.users;
        return {
          ...post,
          username: user?.display_name || user?.username || "Anonymous",
          avatar_url: user?.avatar_url,
          is_liked: undefined, // Not available for anonymous users
        };
      });

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
  ): Promise<FeedResponse> {
    const { limit = 10, offset = 0, currentUserId } = options;

    try {
      // Fetch posts with user-specific data
      const { data: posts, error } = await supabase
        .from("content_posts")
        .select(`
          *,
          users!content_posts_user_id_fkey(
            username,
            display_name,
            avatar_url
          ),
          user_post_interactions!left(
            has_liked,
            has_viewed
          )
        `)
        .eq("is_active", true)
        .eq("user_post_interactions.user_id", currentUserId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching authenticated feed:", error);
        throw error;
      }

      // Transform data for authenticated users
      const transformedPosts: WolfpackPost[] = (posts || []).map((post) => {
        const user = Array.isArray(post.users) ? post.users[0] : post.users;
        const interactions = Array.isArray(post.user_post_interactions)
          ? post.user_post_interactions[0]
          : post.user_post_interactions;

        return {
          ...post,
          username: user?.display_name || user?.username || "Anonymous",
          avatar_url: user?.avatar_url,
          is_liked: interactions?.has_liked || false,
          user_post_interactions: interactions,
        };
      });

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
  static async fetchFeed(options: FeedOptions = {}): Promise<FeedResponse> {
    const { currentUserId } = options;

    if (currentUserId) {
      return this.fetchAuthenticatedFeed({ ...options, currentUserId });
    } else {
      return this.fetchPublicFeed(options);
    }
  }

  /**
   * Like a post - requires authentication
   * Uses the correct table name from your schema: content_interactions
   */
  static async likePost(
    postId: string,
    userId: string,
  ): Promise<LikePostResponse> {
    try {
      // Check if already liked using content_interactions table
      const { data: existingInteraction } = await supabase
        .from("content_interactions")
        .select("id")
        .eq("content_id", postId)
        .eq("user_id", userId)
        .eq("interaction_type", "like")
        .single();

      if (existingInteraction) {
        // Unlike - remove the interaction
        const { error } = await supabase
          .from("content_interactions")
          .delete()
          .eq("content_id", postId)
          .eq("user_id", userId)
          .eq("interaction_type", "like");

        if (error) throw error;

        // Update user_post_interactions
        const { error: updateError } = await supabase
          .from("user_post_interactions")
          .update({
            has_liked: false,
            updated_at: new Date().toISOString(),
          })
          .eq("post_id", postId)
          .eq("user_id", userId);

        if (updateError) {
          console.warn("Failed to update user_post_interactions:", updateError);
        }

        return { success: true };
      } else {
        // Like - create new interaction
        const { error } = await supabase
          .from("content_interactions")
          .insert({
            content_id: postId,
            user_id: userId,
            interaction_type: "like",
            created_at: new Date().toISOString(),
          });

        if (error) throw error;

        // Update or create user_post_interactions
        const { error: upsertError } = await supabase
          .from("user_post_interactions")
          .upsert({
            post_id: postId,
            user_id: userId,
            has_liked: true,
            liked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (upsertError) {
          console.warn("Failed to update user_post_interactions:", upsertError);
        }

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
  ): Promise<SharePostResponse> {
    try {
      const shareUrl = `${window.location.origin}/wolfpack/video/${postId}`;

      // Track share if user is authenticated
      if (userId) {
        const { error } = await supabase
          .from("content_interactions")
          .insert({
            content_id: postId,
            user_id: userId,
            interaction_type: "share",
            created_at: new Date().toISOString(),
          });

        if (error) {
          console.warn("Failed to track share:", error);
        }
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
  static async getUserFeedPreferences(): Promise<UserPreferences> {
    try {
      // This would fetch from user settings in your users table
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
   * Uses the correct table name: social_follows
   */
  static async toggleFollow(
    targetUserId: string,
    currentUserId: string,
  ): Promise<FollowResponse> {
    try {
      // Check if already following
      const { data: existingFollow } = await supabase
        .from("social_follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId)
        .single();

      if (existingFollow) {
        // Unfollow
        const { error } = await supabase
          .from("social_follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetUserId);

        if (error) throw error;
        return { success: true, isFollowing: false };
      } else {
        // Follow
        const { error } = await supabase
          .from("social_follows")
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

  /**
   * Add a comment to a post
   */
  static async addComment(
    postId: string,
    userId: string,
    content: string,
    parentCommentId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("content_comments")
        .insert({
          video_id: postId, // Note: your schema uses video_id for post references
          user_id: userId,
          content: content.trim(),
          parent_comment_id: parentCommentId || null,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Failed to add comment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add comment",
      };
    }
  }

  /**
   * Get comments for a post
   */
  static async getComments(
    postId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{
    comments:
      (ContentComment & { username: string; avatar_url?: string | null })[];
    hasMore: boolean;
  }> {
    try {
      const { data: comments, error } = await supabase
        .from("content_comments")
        .select(`
          *,
          users!content_comments_user_id_fkey(
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("video_id", postId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const transformedComments = (comments || []).map((comment) => {
        const user = Array.isArray(comment.users)
          ? comment.users[0]
          : comment.users;
        return {
          ...comment,
          username: user?.display_name || user?.username || "Anonymous",
          avatar_url: user?.avatar_url,
        };
      });

      return {
        comments: transformedComments,
        hasMore: comments?.length === limit,
      };
    } catch (error) {
      console.error("Failed to get comments:", error);
      return {
        comments: [],
        hasMore: false,
      };
    }
  }
}
