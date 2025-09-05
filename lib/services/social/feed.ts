import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Database } from "@/lib/supabase/types";

// Type aliases from your actual database schema
type Tables = Database["public"]["Tables"];
type ContentPost = Tables["content_posts"]["Row"];
type ContentComment = Tables["content_comments"]["Row"];
type UserPostInteraction = Tables["user_post_interactions"]["Row"];
type User = Tables["users"]["Row"];

// Enhanced post type with joined user data
interface EnhancedPost extends ContentPost {
  // User data joined from the users table
  user?: Pick<
    User,
    "id" | "username" | "display_name" | "avatar_url" | "profile_image_url"
  >;
  // Interaction data for authenticated users
  user_interactions?: Pick<
    UserPostInteraction,
    "has_liked" | "has_viewed" | "view_count" | "liked_at"
  >;
  // Computed field for UI
  is_liked?: boolean;
  // Display fields
  author_username?: string;
  author_avatar?: string;
  author_display_name?: string;
}

// Enhanced comment with user data
interface EnhancedComment extends ContentComment {
  user?: Pick<User, "id" | "username" | "display_name" | "avatar_url">;
  author_username?: string;
  author_avatar?: string;
  replies?: EnhancedComment[];
}

interface FeedOptions {
  limit?: number;
  offset?: number;
  userId?: string;
  visibility?: "public" | "followers" | "private";
  postType?: "video" | "image" | "text" | "carousel";
  tags?: string[];
}

interface FeedResponse {
  posts: EnhancedPost[];
  hasMore: boolean;
  error?: string;
}

interface InteractionResponse {
  success: boolean;
  error?: string;
  data?: unknown;
}

interface CommentResponse {
  comments: EnhancedComment[];
  hasMore: boolean;
  error?: string;
}

export class FeedService {
  private static supabase = getSupabaseBrowserClient();

  /**
   * Fetch public feed - no authentication required
   */
  static async fetchPublicFeed(
    options: FeedOptions = {},
  ): Promise<FeedResponse> {
    const { limit = 10, offset = 0, postType, tags } = options;

    try {
      let query = this.supabase
        .from("content_posts")
        .select(`
          *,
          user:users!content_posts_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            profile_image_url
          )
        `)
        .eq("is_active", true)
        .eq("visibility", "public");

      // Apply filters
      if (postType) {
        query = query.eq("post_type", postType);
      }

      if (tags && tags.length > 0) {
        query = query.contains("tags", tags);
      }

      // Order and pagination
      query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: posts, error } = await query;

      if (error) throw error;

      // Transform posts for public consumption
      const enhancedPosts: EnhancedPost[] = (posts || []).map((post) => {
        const userData = Array.isArray(post.user) ? post.user[0] : post.user;

        return {
          ...post,
          user: userData,
          author_username: userData?.username || "anonymous",
          author_display_name: userData?.display_name || userData?.username ||
            "Anonymous",
          author_avatar: userData?.avatar_url || userData?.profile_image_url ||
            null,
          is_liked: false, // Not available for unauthenticated users
        };
      });

      return {
        posts: enhancedPosts,
        hasMore: posts?.length === limit,
      };
    } catch (error) {
      console.error("Failed to fetch public feed:", error);
      return {
        posts: [],
        hasMore: false,
        error: error instanceof Error ? error.message : "Failed to fetch feed",
      };
    }
  }

  /**
   * Fetch authenticated feed with user interactions
   */
  static async fetchAuthenticatedFeed(
    userId: string,
    options: FeedOptions = {},
  ): Promise<FeedResponse> {
    const { limit = 10, offset = 0, visibility, postType, tags } = options;

    try {
      let query = this.supabase
        .from("content_posts")
        .select(`
          *,
          user:users!content_posts_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            profile_image_url
          ),
          user_post_interactions!left(
            has_liked,
            has_viewed,
            view_count,
            liked_at
          )
        `)
        .eq("is_active", true);

      // Add user interaction filter
      query = query.or(
        `user_post_interactions.user_id.eq.${userId},user_post_interactions.user_id.is.null`,
      );

      // Visibility filter for authenticated users
      if (visibility) {
        query = query.eq("visibility", visibility);
      } else {
        // Show public and follower content for authenticated users
        query = query.in("visibility", ["public", "followers"]);
      }

      // Apply other filters
      if (postType) {
        query = query.eq("post_type", postType);
      }

      if (tags && tags.length > 0) {
        query = query.contains("tags", tags);
      }

      // Order and pagination
      query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: posts, error } = await query;

      if (error) throw error;

      // Transform posts with interaction data
      const enhancedPosts: EnhancedPost[] = (posts || []).map((post) => {
        const userData = Array.isArray(post.user) ? post.user[0] : post.user;
        const interactions = Array.isArray(post.user_post_interactions)
          ? post.user_post_interactions.find((i: any) => i.user_id === userId)
          : post.user_post_interactions;

        return {
          ...post,
          user: userData,
          user_interactions: interactions,
          author_username: userData?.username || "anonymous",
          author_display_name: userData?.display_name || userData?.username ||
            "Anonymous",
          author_avatar: userData?.avatar_url || userData?.profile_image_url ||
            null,
          is_liked: interactions?.has_liked || false,
        };
      });

      // Track views for posts not yet viewed
      const unviewedPostIds = enhancedPosts
        .filter((post) => !post.user_interactions?.has_viewed)
        .map((post) => post.id);

      if (unviewedPostIds.length > 0) {
        this.trackViews(unviewedPostIds, userId);
      }

      return {
        posts: enhancedPosts,
        hasMore: posts?.length === limit,
      };
    } catch (error) {
      console.error("Failed to fetch authenticated feed:", error);
      // Fallback to public feed
      return this.fetchPublicFeed(options);
    }
  }

  /**
   * Smart feed fetcher - automatically chooses based on authentication
   */
  static async fetchFeed(options: FeedOptions = {}): Promise<FeedResponse> {
    const { userId } = options;

    if (userId) {
      return this.fetchAuthenticatedFeed(userId, options);
    } else {
      return this.fetchPublicFeed(options);
    }
  }

  /**
   * Toggle like on a post
   */
  static async toggleLike(
    postId: string,
    userId: string,
  ): Promise<InteractionResponse> {
    try {
      // Check current like status from user_post_interactions
      const { data: currentInteraction } = await this.supabase
        .from("user_post_interactions")
        .select("has_liked")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .single();

      const isCurrentlyLiked = currentInteraction?.has_liked || false;

      if (isCurrentlyLiked) {
        // Unlike: Remove from content_interactions and update user_post_interactions
        await this.supabase
          .from("content_interactions")
          .delete()
          .eq("content_id", postId)
          .eq("user_id", userId)
          .eq("interaction_type", "like");

        await this.supabase
          .from("user_post_interactions")
          .update({
            has_liked: false,
            liked_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("post_id", postId)
          .eq("user_id", userId);

        // Decrement likes_count
        try {
          await this.supabase.rpc("increment", {
            table_name: "content_posts",
            column_name: "likes_count",
            row_id: postId,
            increment_value: -1,
          });
        } catch {
          // If RPC doesn't exist, update directly
          const { data } = await this.supabase
            .from("content_posts")
            .select("likes_count")
            .eq("id", postId)
            .single();
          
          if (data) {
            await this.supabase
              .from("content_posts")
              .update({
                likes_count: Math.max(0, (data.likes_count || 0) - 1),
              })
              .eq("id", postId);
          }
        }

        return { success: true, data: { liked: false } };
      } else {
        // Like: Add to content_interactions and update user_post_interactions
        await this.supabase
          .from("content_interactions")
          .insert({
            content_id: postId,
            user_id: userId,
            interaction_type: "like",
          });

        await this.supabase
          .from("user_post_interactions")
          .upsert({
            post_id: postId,
            user_id: userId,
            has_liked: true,
            liked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "post_id,user_id",
          });

        // Increment likes_count
        try {
          await this.supabase.rpc("increment", {
            table_name: "content_posts",
            column_name: "likes_count",
            row_id: postId,
            increment_value: 1,
          });
        } catch {
          // If RPC doesn't exist, update directly
          const { data } = await this.supabase
            .from("content_posts")
            .select("likes_count")
            .eq("id", postId)
            .single();
          
          if (data) {
            await this.supabase
              .from("content_posts")
              .update({ likes_count: (data.likes_count || 0) + 1 })
              .eq("id", postId);
          }
        }

        return { success: true, data: { liked: true } };
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to toggle like",
      };
    }
  }

  /**
   * Track post views
   */
  static async trackViews(postIds: string[], userId: string): Promise<void> {
    try {
      const interactions = postIds.map((postId) => ({
        post_id: postId,
        user_id: userId,
        has_viewed: true,
        view_count: 1,
        last_viewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      await this.supabase
        .from("user_post_interactions")
        .upsert(interactions, {
          onConflict: "post_id,user_id",
          ignoreDuplicates: false,
        });

      // Track in content_interactions
      const viewInteractions = postIds.map((postId) => ({
        content_id: postId,
        user_id: userId,
        interaction_type: "view" as const,
      }));

      await this.supabase
        .from("content_interactions")
        .insert(viewInteractions)
        .select(); // Ignore duplicates

      // Update view counts on posts
      for (const postId of postIds) {
        try {
          await this.supabase.rpc("increment", {
            table_name: "content_posts",
            column_name: "views_count",
            row_id: postId,
            increment_value: 1,
          });
        } catch {
          // Fallback if RPC doesn't exist
          const { data } = await this.supabase
            .from("content_posts")
            .select("views_count")
            .eq("id", postId)
            .single();
          
          if (data) {
            await this.supabase
              .from("content_posts")
              .update({ views_count: (data.views_count || 0) + 1 })
              .eq("id", postId);
          }
        }
      }
    } catch (error) {
      console.error("Failed to track views:", error);
    }
  }

  /**
   * Share a post
   */
  static async sharePost(
    postId: string,
    userId?: string,
  ): Promise<InteractionResponse> {
    try {
      const shareUrl = typeof window !== "undefined"
        ? `${window.location.origin}/post/${postId}`
        : `/post/${postId}`;

      // Track share if user is authenticated
      if (userId) {
        await this.supabase
          .from("content_interactions")
          .insert({
            content_id: postId,
            user_id: userId,
            interaction_type: "share",
          });

        // Update share count
        await this.supabase
          .from("content_posts")
          .select("shares_count")
          .eq("id", postId)
          .single()
          .then(({ data }) => {
            if (data) {
              this.supabase
                .from("content_posts")
                .update({ shares_count: (data.shares_count || 0) + 1 })
                .eq("id", postId);
            }
          });
      }

      // Copy to clipboard if available
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }

      return {
        success: true,
        data: { shareUrl },
      };
    } catch (error) {
      console.error("Failed to share post:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to share post",
      };
    }
  }

  /**
   * Save/bookmark a post
   */
  static async toggleSave(
    postId: string,
    userId: string,
  ): Promise<InteractionResponse> {
    try {
      // Check if already saved
      const { data: existing } = await this.supabase
        .from("content_interactions")
        .select("id")
        .eq("content_id", postId)
        .eq("user_id", userId)
        .eq("interaction_type", "save")
        .single();

      if (existing) {
        // Unsave
        await this.supabase
          .from("content_interactions")
          .delete()
          .eq("id", existing.id);

        return { success: true, data: { saved: false } };
      } else {
        // Save
        await this.supabase
          .from("content_interactions")
          .insert({
            content_id: postId,
            user_id: userId,
            interaction_type: "save",
          });

        return { success: true, data: { saved: true } };
      }
    } catch (error) {
      console.error("Failed to toggle save:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save post",
      };
    }
  }

  /**
   * Follow/unfollow a user
   */
  static async toggleFollow(
    targetUserId: string,
    currentUserId: string,
  ): Promise<InteractionResponse> {
    try {
      // Check if already following
      const { data: existing } = await this.supabase
        .from("social_follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId)
        .single();

      if (existing) {
        // Unfollow
        await this.supabase
          .from("social_follows")
          .delete()
          .eq("id", existing.id);

        return { success: true, data: { following: false } };
      } else {
        // Follow
        await this.supabase
          .from("social_follows")
          .insert({
            follower_id: currentUserId,
            following_id: targetUserId,
          });

        // Create notification
        await this.supabase
          .from("notifications")
          .insert({
            recipient_id: targetUserId,
            related_user_id: currentUserId,
            type: "follow",
            message: "started following you",
            content_type: "user",
            content_id: currentUserId,
          });

        return { success: true, data: { following: true } };
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to follow user",
      };
    }
  }

  /**
   * Add a comment to a post
   * Note: content_comments uses 'video_id' for the post reference
   */
  static async addComment(
    postId: string,
    userId: string,
    content: string,
    parentCommentId?: string,
  ): Promise<InteractionResponse> {
    try {
      const { data, error } = await this.supabase
        .from("content_comments")
        .insert({
          video_id: postId, // Schema uses video_id for post reference
          user_id: userId,
          content: content.trim(),
          parent_comment_id: parentCommentId,
        })
        .select()
        .single();

      if (error) throw error;

      // Update comment count
      await this.supabase
        .from("content_posts")
        .select("comments_count")
        .eq("id", postId)
        .single()
        .then(({ data: post }) => {
          if (post) {
            this.supabase
              .from("content_posts")
              .update({ comments_count: (post.comments_count || 0) + 1 })
              .eq("id", postId);
          }
        });

      return { success: true, data };
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
    options: { limit?: number; offset?: number } = {},
  ): Promise<CommentResponse> {
    const { limit = 20, offset = 0 } = options;

    try {
      const { data: comments, error } = await this.supabase
        .from("content_comments")
        .select(`
          *,
          user:users!content_comments_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("video_id", postId)
        .eq("is_deleted", false)
        .is("parent_comment_id", null) // Get top-level comments only
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Transform comments
      const enhancedComments: EnhancedComment[] = (comments || []).map(
        (comment) => {
          const userData = Array.isArray(comment.user)
            ? comment.user[0]
            : comment.user;

          return {
            ...comment,
            user: userData,
            author_username: userData?.username || "anonymous",
            author_avatar: userData?.avatar_url || null,
          };
        },
      );

      // Fetch replies for each comment
      for (const comment of enhancedComments) {
        const { data: replies } = await this.supabase
          .from("content_comments")
          .select(`
            *,
            user:users!content_comments_user_id_fkey(
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq("parent_comment_id", comment.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: true });

        if (replies) {
          comment.replies = replies.map((reply) => {
            const userData = Array.isArray(reply.user)
              ? reply.user[0]
              : reply.user;
            return {
              ...reply,
              user: userData,
              author_username: userData?.username || "anonymous",
              author_avatar: userData?.avatar_url || null,
            };
          });
        }
      }

      return {
        comments: enhancedComments,
        hasMore: comments?.length === limit,
      };
    } catch (error) {
      console.error("Failed to get comments:", error);
      return {
        comments: [],
        hasMore: false,
        error: error instanceof Error
          ? error.message
          : "Failed to get comments",
      };
    }
  }

  /**
   * Get user's saved posts
   */
  static async getSavedPosts(
    userId: string,
    options: FeedOptions = {},
  ): Promise<FeedResponse> {
    const { limit = 10, offset = 0 } = options;

    try {
      // Get saved post IDs
      const { data: savedInteractions, error: savedError } = await this.supabase
        .from("content_interactions")
        .select("content_id")
        .eq("user_id", userId)
        .eq("interaction_type", "save")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (savedError) throw savedError;

      const postIds = savedInteractions?.map((i) => i.content_id) || [];

      if (postIds.length === 0) {
        return { posts: [], hasMore: false };
      }

      // Fetch full post data
      const { data: posts, error: postsError } = await this.supabase
        .from("content_posts")
        .select(`
          *,
          user:users!content_posts_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            profile_image_url
          ),
          user_post_interactions!left(
            has_liked,
            has_viewed,
            view_count,
            liked_at
          )
        `)
        .in("id", postIds)
        .eq("is_active", true);

      if (postsError) throw postsError;

      // Transform posts
      const enhancedPosts: EnhancedPost[] = (posts || []).map((post) => {
        const userData = Array.isArray(post.user) ? post.user[0] : post.user;
        const interactions:
          | Pick<
            UserPostInteraction,
            "has_liked" | "has_viewed" | "view_count" | "liked_at"
          >
          | undefined = Array.isArray(post.user_post_interactions)
            ? post.user_post_interactions.find((i: UserPostInteraction) =>
              i.user_id === userId
            )
            : post.user_post_interactions as
              | Pick<
                UserPostInteraction,
                "has_liked" | "has_viewed" | "view_count" | "liked_at"
              >
              | undefined;

        return {
          ...post,
          user: userData,
          user_interactions: interactions,
          author_username: userData?.username || "anonymous",
          author_display_name: userData?.display_name || userData?.username ||
            "Anonymous",
          author_avatar: userData?.avatar_url || userData?.profile_image_url ||
            null,
          is_liked: interactions?.has_liked || false,
        };
      });

      return {
        posts: enhancedPosts,
        hasMore: savedInteractions?.length === limit,
      };
    } catch (error) {
      console.error("Failed to get saved posts:", error);
      return {
        posts: [],
        hasMore: false,
        error: error instanceof Error
          ? error.message
          : "Failed to get saved posts",
      };
    }
  }
}
