"use server";

import { WolfpackService } from "@/lib/services/wolfpack";
import type { FeedItem } from "@/lib/services/wolfpack/types";

// Re-export the service types to maintain consistency
export type { FeedItem } from "@/lib/services/wolfpack/types";

export interface FetchFeedResponse {
  items: FeedItem[];
  totalItems: number;
  hasMore: boolean;
}

/**
 * Fetches feed items from wolfpack_videos table
 * @param conversationid - Optional user ID to filter posts by specific user
 */
export async function fetchFeedItems(
  page: number = 1,
  limit: number = 10,
  conversationid?: string,
  currentUserId?: string,
): Promise<FetchFeedResponse> {
  try {
    // WolfpackService.feed.fetchFeedItems returns ServiceResponse<FeedItem[]>
    const response = await WolfpackService.feed.fetchFeedItems({
      page,
      limit,
      conversationid,
      currentUserId,
    });

    // Check if response was successful
    if (response.success && response.data) {
      return {
        items: response.data,
        totalItems: response.data.length,
        hasMore: response.data.length === limit,
      };
    } else {
      console.error("WolfpackService error:", response.error);
      return {
        items: [],
        totalItems: 0,
        hasMore: false,
      };
    }
  } catch (error) {
    console.error("Failed to fetch feed items:", error);
    return {
      items: [],
      totalItems: 0,
      hasMore: false,
    };
  }
}

/**
 * Fetches feed items from users that the current user follows
 */
export async function fetchFollowingFeed(
  page: number = 1,
  limit: number = 10,
  currentUserId: string,
): Promise<FetchFeedResponse> {
  try {
    // WolfpackService.feed.fetchFollowingFeed returns FetchFeedResponse directly
    const response = await WolfpackService.feed.fetchFollowingFeed(
      currentUserId,
      {
        page,
        limit,
      },
    );

    // The response is already a FetchFeedResponse, just return it
    return response;
  } catch (error) {
    console.error("Failed to fetch following feed:", error);
    return {
      items: [],
      totalItems: 0,
      hasMore: false,
    };
  }
}
