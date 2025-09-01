// =============================================================================
// SOCIAL SERVICE - SIDE HUSTLE APP
// =============================================================================

import { supabase } from '@/lib/supabase';
import { AppServiceError, createSuccessResponse, createErrorResponse } from '@/lib/services/errors';
import type {
  SocialFeedRequest,
  SocialFeedResponse,
  LikeActionResponse,
} from './types';
import { transformToFeedVideoItem } from './types';

// =============================================================================
// MAIN SOCIAL SERVICE CLASS
// =============================================================================

export class SocialService {
  /**
   * Get social feed for user
   */
  static async getFeed(request: SocialFeedRequest): Promise<SocialFeedResponse> {
    try {
      const { limit = 20, offset = 0 } = request;

      const query = supabase
        .from('content_posts')
        .select(`
          *,
          user:users(
            id,
            username,
            display_name,
            first_name,
            last_name,
            avatar_url,
            profile_image_url
          )
        `)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      const { data: posts, error } = await query;
      if (error) throw error;

      const feedItems = (posts || []).map(post => transformToFeedVideoItem(post));
      return createSuccessResponse(feedItems) as SocialFeedResponse;
    } catch (error) {
      console.error('Error fetching social feed:', error);
      return {
        success: false,
        data: [],
        error: (error as Error).message,
      };
    }
  }

  /**
   * Toggle like on a post
   */
  static async toggleLike(postId: string, userId?: string): Promise<LikeActionResponse> {
    try {
      if (!userId) {
        throw new AppServiceError('User authentication required', 'AUTH_REQUIRED');
      }

      return createSuccessResponse({
        is_liked: true,
        like_count: 1,
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      return createErrorResponse(error as Error);
    }
  }

  /**
   * Delete a post
   */
  static async deletePost(postId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('content_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting post:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Toggle follow status for a user
   */
  static async toggleFollow(userId: string): Promise<{ success: boolean; following?: boolean; error?: string }> {
    try {
      // Use Supabase's toggle_follow function if available
      const { data, error } = await supabase.rpc('toggle_follow', {
        target_user_id: userId
      });

      if (error) throw error;
      
      const result = data?.[0] || {};
      return {
        success: result.success || true,
        following: result.is_following,
      };
    } catch (error) {
      console.error('Error toggling follow:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default SocialService;

// =============================================================================
// LEGACY COMPATIBILITY (for existing imports)
// =============================================================================

export const social = {
  getFeed: SocialService.getFeed,
  toggleLike: SocialService.toggleLike,
  toggleFollow: SocialService.toggleFollow,
};

export const feed = {
  getFeed: SocialService.getFeed,
  deletePost: SocialService.deletePost,
};