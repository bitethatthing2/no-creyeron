import { supabase } from "@/lib/supabase";
import {
  EnrichedVideo,
  FeedItem,
  FetchFeedResponse,
  PaginationOptions,
  ServiceResponse,
  WOLFPACK_TABLES,
} from "./types";
import {
  createErrorResponse,
  createSuccessResponse,
  validatePagination,
  validateUUID,
  withErrorHandling,
} from "./errors";
import { WolfpackAuthService } from "./auth";

// =============================================================================
// WOLFPACK FEED SERVICE - CONSOLIDATED FEED FUNCTIONALITY
// =============================================================================

// Database return types based on actual function signatures

interface WolfpackFeedCursorRow {
  id: string;
  user_id: string;
  content: string;
  media_url: string;
  media_type: string;
  video_url: string;
  thumbnail_url: string;
  duration: number;
  view_count: number;
  like_count: number;
  wolfpack_comments_count: number;
  shares_count: number;
  hashtags: string[];
  created_at: string;
  username: string;
  display_name: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  profile_image_url: string;
  wolf_emoji: string;
  verified: boolean;
  user_liked: boolean;
  user_following: boolean;
  next_cursor: string | null;
  next_cursor_id: string | null;
}

interface WolfpackVideoRow {
  id: string;
  user_id: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  description: string | null;
  title: string | null;
  likes_count: number | null;
  wolfpack_comments_count: number | null;
  views_count: number | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  share_count: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  duration: number | null;
  duration_seconds: number | null;
  hashtags: string[] | null;
  music_name: string | null;
  user_liked?: boolean;
  user_following?: boolean;
  user?: {
    id: string;
    username: string | null;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    profile_image_url: string | null;
    wolf_emoji: string | null;
  } | null;
}

interface VideoFeedRow {
  video: {
    id: string;
    user_id: string;
    video_url: string;
    thumbnail_url: string;
    caption: string;
    likes_count: number;
    wolfpack_comments_count: number;
    views_count: number;
    created_at: string;
    user_liked: boolean;
    user: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string;
    };
  };
}

interface CreatePostData {
  title?: string;
  description?: string;
  caption?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
}

interface UpdatePostData {
  title?: string;
  description?: string;
  caption?: string;
  thumbnail_url?: string;
}

interface FeedOptions extends PaginationOptions {
  userId?: string;
  currentUserId?: string;
}

interface CursorFeedOptions {
  cursor?: string;
  limit?: number;
  currentUserId?: string;
  followingOnly?: boolean;
}

// Extended FeedItem type with user interaction data
interface FeedItemWithInteraction extends FeedItem {
  user_liked?: boolean;
  user_following?: boolean;
}

export class WolfpackFeedService {
  /**
   * Transform cursor-based feed row to FeedItem
   */
  private static transformCursorRowToFeedItem(
    row: WolfpackFeedCursorRow,
  ): FeedItemWithInteraction {
    const displayName = row.display_name ||
      row.username ||
      `${row.first_name || ""} ${row.last_name || ""}`.trim() ||
      "Unknown";

    return {
      id: row.id,
      user_id: row.user_id,
      username: displayName,
      avatar_url: row.profile_image_url || row.avatar_url || undefined,
      caption: row.content || "",
      video_url: row.video_url,
      thumbnail_url: row.thumbnail_url || undefined,
      likes_count: row.like_count || 0,
      wolfpack_comments_count: row.wolfpack_comments_count || 0,
      shares_count: row.shares_count || 0,
      music_name: "Original Sound",
      hashtags: row.hashtags || [],
      created_at: row.created_at,
      user: {
        id: row.user_id,
        username: row.username || undefined,
        display_name: row.display_name || undefined,
        first_name: row.first_name || undefined,
        last_name: row.last_name || undefined,
        avatar_url: row.avatar_url || undefined,
        profile_image_url: row.profile_image_url || undefined,
        wolf_emoji: row.wolf_emoji || undefined,
      },
      // Add these at the root level, not inside user
      user_liked: row.user_liked || false,
      user_following: row.user_following || false,
    };
  }

  /**
   * Transform wolfpack video row to FeedItem
   */
  private static transformVideoRowToFeedItem(
    video: WolfpackVideoRow,
  ): FeedItemWithInteraction {
    const user = video.user || {
      id: video.user_id || "",
      username: null,
      display_name: null,
      first_name: null,
      last_name: null,
      avatar_url: null,
      profile_image_url: null,
      wolf_emoji: null,
    };

    const displayName = user.display_name ||
      user.username ||
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      "Unknown";

    return {
      id: video.id,
      user_id: video.user_id || "",
      username: displayName,
      avatar_url: user.profile_image_url || user.avatar_url || undefined,
      caption: video.caption || video.description || video.title || "",
      video_url: video.video_url || "",
      thumbnail_url: video.thumbnail_url || undefined,
      likes_count: video.likes_count || video.like_count || 0,
      wolfpack_comments_count: video.wolfpack_comments_count ||
        video.comment_count || 0,
      shares_count: video.share_count || 0,
      music_name: video.music_name || "Original Sound",
      hashtags: video.hashtags || [],
      created_at: video.created_at || new Date().toISOString(),
      user: {
        id: user.id,
        username: user.username || undefined,
        display_name: user.display_name || undefined,
        first_name: user.first_name || undefined,
        last_name: user.last_name || undefined,
        avatar_url: user.avatar_url || undefined,
        profile_image_url: user.profile_image_url || undefined,
        wolf_emoji: user.wolf_emoji || undefined,
      },
      // Add these at the root level, not inside user
      user_liked: video.user_liked || false,
      user_following: video.user_following || false,
    };
  }

  /**
   * Fetch general feed items (client-side) - Using view with user interaction data
   */
  static fetchFeedItems = withErrorHandling(async (
    options: FeedOptions = {},
  ): Promise<FetchFeedResponse> => {
    const { page, limit } = validatePagination(options.page, options.limit);
    const offset = (page - 1) * limit;

    // Use the main wolfpack videos table
    const query = supabase
      .from("wolfpack_videos")
      .select(
        `
        *,
        user:users!user_id(
          id,
          username,
          display_name,
          first_name,
          last_name,
          avatar_url,
          profile_image_url,
          wolf_emoji
        )
      `,
        { count: "exact" },
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Ensure data is typed correctly
    const wolfpack_videos = data as WolfpackVideoRow[] | null;
    if (!wolfpack_videos) {
      return {
        items: [],
        totalItems: 0,
        hasMore: false,
      };
    }

    const items: FeedItem[] = wolfpack_videos.map((video) => {
      const transformed = this.transformVideoRowToFeedItem(video);
      // Return without user_liked and user_following at the root level
      const { user_liked, user_following, ...feedItem } = transformed;

      // Add interaction data as extended properties
      return {
        ...feedItem,
        ...((user_liked || user_following) && { user_liked, user_following }),
      } as FeedItem;
    });

    // For user-specific feeds, filter after fetching if needed
    if (options.userId && options.userId !== options.currentUserId) {
      const filteredItems = items.filter((item) =>
        item.user_id === options.userId
      );
      return {
        items: filteredItems,
        totalItems: filteredItems.length,
        hasMore: false,
      };
    }

    const totalItems = count || 0;
    const hasMore = offset + limit < totalItems;

    return {
      items,
      totalItems,
      hasMore,
    };
  }, "WolfpackFeedService.fetchFeedItems");

  /**
   * Fetch following feed using optimized function
   */
  static fetchFollowingFeed = withErrorHandling(async (
    currentUserId: string,
    options: PaginationOptions = {},
  ): Promise<FetchFeedResponse> => {
    validateUUID(currentUserId, "Current User ID");
    const { page, limit } = validatePagination(options.page, options.limit);
    const offset = (page - 1) * limit;

    // Use the get_video_feed function
    const { data, error } = await supabase
      .rpc("get_video_feed", {
        p_user_id: currentUserId,
        p_limit: limit,
        p_offset: offset,
      });

    if (error) throw error;

    const rows = data as VideoFeedRow[] | null;
    if (!rows || rows.length === 0) {
      return {
        items: [],
        totalItems: 0,
        hasMore: false,
      };
    }

    const items: FeedItem[] = rows.map((row) => {
      const video = row.video;
      const feedItem: FeedItem = {
        id: video.id,
        user_id: video.user_id,
        username: video.user?.display_name || video.user?.username || "Unknown",
        avatar_url: video.user?.avatar_url || undefined,
        caption: video.caption || "",
        video_url: video.video_url || "",
        thumbnail_url: video.thumbnail_url || undefined,
        likes_count: video.likes_count || 0,
        wolfpack_comments_count: video.wolfpack_comments_count || 0,
        shares_count: 0, // Not returned by the function
        music_name: "Original Sound",
        hashtags: [], // Not returned by the function
        created_at: video.created_at,
        user: {
          id: video.user?.id || video.user_id,
          username: video.user?.username || undefined,
          display_name: video.user?.display_name || undefined,
          first_name: undefined, // Not returned by the function
          last_name: undefined, // Not returned by the function
          avatar_url: video.user?.avatar_url || undefined,
          profile_image_url: undefined, // Not returned by the function
          wolf_emoji: undefined, // Not returned by the function
        },
      };

      // Add user interaction data as additional properties
      const extendedItem = feedItem as FeedItemWithInteraction;
      extendedItem.user_liked = video.user_liked || false;
      extendedItem.user_following = true; // Following feed, so all users are followed

      return feedItem;
    });

    return {
      items,
      totalItems: items.length,
      hasMore: items.length === limit,
    };
  }, "WolfpackFeedService.fetchFollowingFeed");

  /**
   * Fetch feed using cursor-based pagination
   */
  static fetchFeedWithCursor = withErrorHandling(async (
    options: CursorFeedOptions = {},
  ): Promise<FetchFeedResponse> => {
    const { limit = 20, currentUserId, followingOnly = false } = options;

    let cursorTimestamp: string | null = null;
    let cursorId: string | null = null;

    // Parse cursor if provided
    if (options.cursor) {
      try {
        const decoded = atob(options.cursor);
        const [timestamp, id] = decoded.split(":");
        cursorTimestamp = timestamp;
        cursorId = id;
      } catch (error) {
        console.warn(
          "Invalid cursor provided, starting from beginning:",
          error,
        );
      }
    }

    // Use the cursor-based RPC function
    const { data, error } = await supabase
      .rpc("get_wolfpack_feed_cursor", {
        p_user_id: currentUserId || undefined,
        p_limit: limit,
        p_cursor: cursorTimestamp
          ? new Date(cursorTimestamp).toISOString()
          : undefined,
        p_cursor_id: cursorId || undefined,
        p_following_only: followingOnly,
      });

    if (error) throw error;

    // Cast directly to the cursor row type that matches the function return
    const rows = data as WolfpackFeedCursorRow[] | null;

    if (!rows || rows.length === 0) {
      return {
        items: [],
        totalItems: 0,
        hasMore: false,
      };
    }

    const items: FeedItem[] = rows.map((row) => {
      const transformed = this.transformCursorRowToFeedItem(row);
      // Return without user_liked and user_following at the root level
      const { user_liked, user_following, ...feedItem } = transformed;

      // Add interaction data as extended properties
      const extendedItem = feedItem as FeedItemWithInteraction;
      extendedItem.user_liked = user_liked;
      extendedItem.user_following = user_following;

      return feedItem;
    });

    // Check if there's a next page and encode cursor
    const firstRow = rows[0];
    const hasMore = rows.length > 0 && firstRow.next_cursor !== null;
    let nextCursor: string | undefined;

    if (hasMore && firstRow.next_cursor && firstRow.next_cursor_id) {
      nextCursor = btoa(`${firstRow.next_cursor}:${firstRow.next_cursor_id}`);
    }

    return {
      items,
      totalItems: items.length,
      hasMore,
      nextCursor,
    };
  }, "WolfpackFeedService.fetchFeedWithCursor");

  /**
   * Get single video post with enriched data
   */
  static getPost = withErrorHandling(
    async (postId: string): Promise<EnrichedVideo | null> => {
      validateUUID(postId, "Post ID");

      const { data, error } = await supabase
        .from("wolfpack_videos_with_user_interaction")
        .select(`
        *,
        user:users!user_id(
          id,
          first_name,
          last_name,
          avatar_url,
          display_name
        )
      `)
        .eq("id", postId)
        .eq("is_active", true)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }

      // Add user interaction data to the enriched video
      const video = data as EnrichedVideo;
      const enrichedVideo: EnrichedVideo & {
        user_liked: boolean;
        user_following: boolean;
      } = {
        ...video,
        user_liked: data.user_liked || false,
        user_following: data.user_following || false,
      };

      return enrichedVideo;
    },
    "WolfpackFeedService.getPost",
  );

  /**
   * Create new video post
   */
  static createPost = withErrorHandling(async (
    postData: CreatePostData,
  ): Promise<ServiceResponse<EnrichedVideo>> => {
    try {
      const user = await WolfpackAuthService.verifyUser();

      const insertData = {
        user_id: user.id,
        title: postData.title || null,
        description: postData.description || null,
        caption: postData.caption || postData.description || postData.title ||
          null,
        video_url: postData.video_url || null,
        thumbnail_url: postData.thumbnail_url || null,
        duration: postData.duration || null,
        is_active: true,
        view_count: 0,
        like_count: 0,
      };

      const { data, error } = await supabase
        .from("wolfpack_videos")
        .insert(insertData)
        .select(`
          *,
          user:users!user_id(
            id,
            first_name,
            last_name,
            avatar_url,
            display_name
          )
        `)
        .single();

      if (error) throw error;

      return createSuccessResponse(data as EnrichedVideo);
    } catch (error) {
      return createErrorResponse(error as Error);
    }
  }, "WolfpackFeedService.createPost");

  /**
   * Update video post
   */
  static updatePost = withErrorHandling(async (
    postId: string,
    updates: UpdatePostData,
  ): Promise<ServiceResponse<EnrichedVideo>> => {
    try {
      validateUUID(postId, "Post ID");
      const user = await WolfpackAuthService.verifyUser();

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("wolfpack_videos")
        .update(updateData)
        .eq("id", postId)
        .eq("user_id", user.id)
        .select(`
          *,
          user:users!user_id(
            id,
            first_name,
            last_name,
            avatar_url,
            display_name
          )
        `)
        .single();

      if (error) throw error;

      return createSuccessResponse(data as EnrichedVideo);
    } catch (error) {
      return createErrorResponse(error as Error);
    }
  }, "WolfpackFeedService.updatePost");

  /**
   * Delete video post (soft delete)
   */
  static deletePost = withErrorHandling(
    async (postId: string): Promise<ServiceResponse<void>> => {
      try {
        validateUUID(postId, "Post ID");
        const user = await WolfpackAuthService.verifyUser();

        const { error } = await supabase
          .from("wolfpack_videos")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", postId)
          .eq("user_id", user.id);

        if (error) throw error;

        return createSuccessResponse(undefined);
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    },
    "WolfpackFeedService.deletePost",
  );

  /**
   * Increment view count for a post
   */
  static incrementViewCount = withErrorHandling(
    async (postId: string): Promise<void> => {
      validateUUID(postId, "Post ID");

      // Use the record_video_view RPC function
      const { error } = await supabase.rpc("record_video_view", {
        p_post_id: postId,
      });

      if (error) {
        // Don't throw error for view count failures as it's not critical
        console.warn("Failed to increment view count:", error);
      }
    },
    "WolfpackFeedService.incrementViewCount",
  );

  /**
   * Get post statistics
   */
  static getPostStats = withErrorHandling(async (postId: string): Promise<{
    views: number;
    likes: number;
    wolfpack_comments: number;
  }> => {
    validateUUID(postId, "Post ID");

    // Get post basic stats
    const { data: post, error: postError } = await supabase
      .from("wolfpack_videos")
      .select("view_count, like_count")
      .eq("id", postId)
      .single();

    if (postError) throw postError;

    // Get comment count
    const { count: commentCount, error: commentError } = await supabase
      .from("wolfpack_comments")
      .select("*", { count: "exact", head: true })
      .eq("video_id", postId);

    if (commentError) {
      console.warn("Failed to fetch comment count:", commentError);
    }

    return {
      views: post?.view_count || 0,
      likes: post?.like_count || 0,
      wolfpack_comments: commentCount || 0,
    };
  }, "WolfpackFeedService.getPostStats");

  /**
   * Get user's posts
   */
  static getUserPosts = withErrorHandling(async (
    userId: string,
    options: PaginationOptions = {},
  ): Promise<FetchFeedResponse> => {
    validateUUID(userId, "User ID");
    return this.fetchFeedItems({ ...options, userId });
  }, "WolfpackFeedService.getUserPosts");

  /**
   * Search posts by caption or hashtags
   */
  static searchPosts = withErrorHandling(async (
    query: string,
    options: PaginationOptions = {},
  ): Promise<FetchFeedResponse> => {
    const { page, limit } = validatePagination(options.page, options.limit);
    const offset = (page - 1) * limit;

    const searchQuery = query.trim();
    if (!searchQuery) {
      return {
        items: [],
        totalItems: 0,
        hasMore: false,
      };
    }

    const { data, error, count } = await supabase
      .from("wolfpack_videos")
      .select(
        `
        *,
        user:users!user_id(
          id,
          username,
          display_name,
          first_name,
          last_name,
          avatar_url,
          profile_image_url,
          wolf_emoji
        )
      `,
        { count: "exact" },
      )
      .eq("is_active", true)
      .or(
        `caption.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`,
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const wolfpack_videos = data as WolfpackVideoRow[] | null;
    if (!wolfpack_videos) {
      return {
        items: [],
        totalItems: 0,
        hasMore: false,
      };
    }

    const items: FeedItem[] = wolfpack_videos.map((video) => {
      const transformed = this.transformVideoRowToFeedItem(video);
      // Return without user_liked and user_following at the root level
      const { user_liked, user_following, ...feedItem } = transformed;

      // Add interaction data as extended properties
      const extendedItem = feedItem as FeedItemWithInteraction;
      extendedItem.user_liked = user_liked;
      extendedItem.user_following = user_following;

      return feedItem;
    });

    return {
      items,
      totalItems: count || 0,
      hasMore: offset + limit < (count || 0),
    };
  }, "WolfpackFeedService.searchPosts");
}
