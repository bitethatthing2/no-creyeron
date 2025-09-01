import { supabase } from "@/lib/supabase";
import { 
  ServiceResponse,
  createSuccessResponse,
  createErrorResponse,
  validateUUID,
  withErrorHandling
} from "../errors";
// Auth functionality integrated directly

// =============================================================================
// SOCIAL SERVICE - SOCIAL INTERACTIONS
// =============================================================================

export class SocialService {
  /**
   * Toggle like on a post/video
   */
  static toggleLike = withErrorHandling(async (
    contentId: string
  ): Promise<ServiceResponse<{ liked: boolean; likesCount: number }>> => {
    try {
      validateUUID(contentId, "Content ID");
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      // Check if user has already liked this content
      const { data: existingLike, error: checkError } = await supabase
        .from('content_interactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .eq('interaction_type', 'like')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      let liked: boolean;
      let likesCount: number;

      if (existingLike) {
        // Unlike: Remove the interaction
        const { error: deleteError } = await supabase
          .from('content_interactions')
          .delete()
          .eq('id', existingLike.id);

        if (deleteError) throw deleteError;

        // Get current likes count and decrement
        const { data: currentPost } = await supabase
          .from('content_posts')
          .select('likes_count')
          .eq('id', contentId)
          .single();

        const currentLikes = currentPost?.likes_count || 0;
        
        // Decrement likes_count in content_posts
        const { data: updatedPost, error: updateError } = await supabase
          .from('content_posts')
          .update({ 
            likes_count: Math.max(0, currentLikes - 1)
          })
          .eq('id', contentId)
          .select('likes_count')
          .single();

        if (updateError) throw updateError;

        liked = false;
        likesCount = updatedPost.likes_count || 0;
      } else {
        // Like: Add interaction
        const { error: insertError } = await supabase
          .from('content_interactions')
          .insert({
            user_id: user.id,
            content_id: contentId,
            interaction_type: 'like'
          });

        if (insertError) throw insertError;

        // Get current likes count and increment
        const { data: currentPost } = await supabase
          .from('content_posts')
          .select('likes_count')
          .eq('id', contentId)
          .single();

        const currentLikes = currentPost?.likes_count || 0;
        
        // Increment likes_count in content_posts
        const { data: updatedPost, error: updateError } = await supabase
          .from('content_posts')
          .update({ 
            likes_count: currentLikes + 1
          })
          .eq('id', contentId)
          .select('likes_count')
          .single();

        if (updateError) throw updateError;

        liked = true;
        likesCount = updatedPost.likes_count || 1;
      }

      return createSuccessResponse({ liked, likesCount });
    } catch (error) {
      return createErrorResponse(error as Error);
    }
  }, "SocialService.toggleLike");

  /**
   * Get user's likes for multiple posts
   */
  static getUserLikes = withErrorHandling(async (
    contentIds: string[]
  ): Promise<ServiceResponse<Set<string>>> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      const { data: likes, error } = await supabase
        .from('content_interactions')
        .select('content_id')
        .eq('user_id', user.id)
        .eq('interaction_type', 'like')
        .in('content_id', contentIds);

      if (error) throw error;

      const likedContentIds = new Set((likes || []).map(like => like.content_id));
      return createSuccessResponse(likedContentIds);
    } catch (error) {
      return createErrorResponse(error as Error);
    }
  }, "SocialService.getUserLikes");

  /**
   * Toggle follow on a user
   */
  static toggleFollow = withErrorHandling(async (
    targetUserId: string
  ): Promise<ServiceResponse<{ following: boolean; followersCount: number }>> => {
    try {
      validateUUID(targetUserId, "Target User ID");
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      if (user.id === targetUserId) {
        throw new Error("Cannot follow yourself");
      }

      // Check if already following
      const { data: existingFollow, error: checkError } = await supabase
        .from('social_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      let following: boolean;

      if (existingFollow) {
        // Unfollow
        const { error: deleteError } = await supabase
          .from('social_follows')
          .delete()
          .eq('id', existingFollow.id);

        if (deleteError) throw deleteError;
        following = false;
      } else {
        // Follow
        const { error: insertError } = await supabase
          .from('social_follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          });

        if (insertError) throw insertError;
        following = true;
      }

      // Get updated followers count
      const { count: followersCount } = await supabase
        .from('social_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);

      return createSuccessResponse({ 
        following, 
        followersCount: followersCount || 0 
      });
    } catch (error) {
      return createErrorResponse(error as Error);
    }
  }, "SocialService.toggleFollow");

  /**
   * Get social stats for a user
   */
  static getUserSocialStats = withErrorHandling(async (
    userId: string
  ): Promise<ServiceResponse<{
    followers: number;
    following: number;
    likes: number;
    posts: number;
  }>> => {
    try {
      validateUUID(userId, "User ID");

      // Get counts in parallel
      const [
        { count: followersCount },
        { count: followingCount },
        { count: likesCount },
        { count: postsCount }
      ] = await Promise.all([
        supabase
          .from('social_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId),
        supabase
          .from('social_follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId),
        supabase
          .from('content_interactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('interaction_type', 'like'),
        supabase
          .from('content_posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_active', true)
      ]);

      return createSuccessResponse({
        followers: followersCount || 0,
        following: followingCount || 0,
        likes: likesCount || 0,
        posts: postsCount || 0
      });
    } catch (error) {
      return createErrorResponse(error as Error);
    }
  }, "SocialService.getUserSocialStats");
}