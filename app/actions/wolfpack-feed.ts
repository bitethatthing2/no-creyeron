"use server";

import { createServerClient } from "@/lib/supabase/server";
import { WolfpackService } from "@/lib/services/wolfpack";

export interface FeedItem {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  caption: string;
  video_url: string | null;
  thumbnail_url?: string;
  likes_count: number;
  wolfpack_comments_count: number;
  shares_count: number;
  music_name?: string;
  hashtags?: string[];
  created_at: string;
  // Additional user fields now available
  user?: {
    id: string;
    username?: string;
    display_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    profile_image_url?: string;
    wolf_emoji?: string;
  };
}

export interface FetchFeedResponse {
  items: FeedItem[];
  totalItems: number;
  hasMore: boolean;
}

export async function fetchFeedItems(
  page: number = 1,
  limit: number = 10,
  userId?: string,
  currentUserId?: string,
): Promise<FetchFeedResponse> {
  try {
    // Use the optimized WolfpackFeedService
    return await WolfpackService.feed.fetchFeedItems({
      page,
      limit,
      userId,
      currentUserId,
    });
  } catch (error) {
    console.error("Failed to fetch feed items:", error);
    return {
      items: [],
      totalItems: 0,
      hasMore: false,
    };
  }
}

export async function fetchFollowingFeed(
  page: number = 1,
  limit: number = 10,
  currentUserId: string,
): Promise<FetchFeedResponse> {
  try {
    // Use the optimized WolfpackFeedService
    return await WolfpackService.feed.fetchFollowingFeed(currentUserId, {
      page,
      limit,
    });
  } catch (error) {
    console.error("Failed to fetch following feed:", error);
    return {
      items: [],
      totalItems: 0,
      hasMore: false,
    };
  }
}
