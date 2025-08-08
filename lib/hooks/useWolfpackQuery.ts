/**
 * React Query hooks for Wolfpack Feed operations
 * Provides caching, background refetching, and optimistic updates
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  useInfiniteQuery,
  UseQueryResult,
  UseMutationResult,
  UseInfiniteQueryResult
} from '@tanstack/react-query';
import { WolfpackFeedService } from '@/lib/services/wolfpack/feed';
import { WolfpackService } from '@/lib/services/unified-wolfpack.service';
import { 
  FeedItem, 
  ServiceResponse, 
  FetchFeedResponse, 
  PaginationOptions,
  EnrichedVideo 
} from '@/lib/services/wolfpack/types';

// Query Keys - centralized for better cache management
export const WOLFPACK_QUERY_KEYS = {
  // Feed queries
  feedItems: (options?: PaginationOptions) => ['wolfpack', 'feed', 'items', options],
  feedWithCursor: (cursor?: string, limit?: number) => ['wolfpack', 'feed', 'cursor', cursor, limit],
  followingFeed: (userId: string, options?: PaginationOptions) => ['wolfpack', 'feed', 'following', userId, options],
  userPosts: (userId: string, options?: PaginationOptions) => ['wolfpack', 'posts', 'user', userId, options],
  searchPosts: (query: string, options?: PaginationOptions) => ['wolfpack', 'posts', 'search', query, options],
  
  // Individual post queries
  post: (postId: string) => ['wolfpack', 'post', postId],
  postStats: (postId: string) => ['wolfpack', 'post', 'stats', postId],
  
  // Social queries
  userLikes: (userId: string, videoId: string) => ['wolfpack', 'likes', userId, videoId],
  isLiked: (videoId: string, userId: string) => ['wolfpack', 'liked', videoId, userId],
  
  // User queries
  userProfile: (userId: string) => ['wolfpack', 'user', userId],
} as const;

// ============================================================================
// FEED QUERIES
// ============================================================================

/**
 * Fetch feed items with caching and pagination
 */
export function useFeedItems(options: PaginationOptions = {}) {
  return useQuery({
    queryKey: WOLFPACK_QUERY_KEYS.feedItems(options),
    queryFn: () => WolfpackFeedService.fetchFeedItems(options),
    staleTime: 2 * 60 * 1000, // 2 minutes - feed data can get stale quickly
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refresh feed when user comes back
    keepPreviousData: true, // Keep previous data while loading new page
  });
}

/**
 * Infinite query for cursor-based feed pagination
 */
export function useInfiniteFeedWithCursor(
  currentUserId?: string,
  limit: number = 20,
  followingOnly: boolean = false
) {
  return useInfiniteQuery({
    queryKey: ['wolfpack', 'feed', 'infinite', currentUserId, limit, followingOnly],
    queryFn: ({ pageParam }) => 
      WolfpackFeedService.fetchFeedWithCursor({
        cursor: pageParam,
        limit,
        currentUserId,
        followingOnly,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep more pages cached
    refetchOnWindowFocus: false, // Don't refetch on focus for infinite scroll
    keepPreviousData: true,
  });
}

/**
 * Following feed with optimistic updates
 */
export function useFollowingFeed(currentUserId: string, options: PaginationOptions = {}) {
  return useQuery({
    queryKey: WOLFPACK_QUERY_KEYS.followingFeed(currentUserId, options),
    queryFn: () => WolfpackFeedService.fetchFollowingFeed(currentUserId, options),
    enabled: !!currentUserId, // Only run if we have a user ID
    staleTime: 3 * 60 * 1000, // 3 minutes - following feed can be slightly more stable
    gcTime: 10 * 60 * 1000,
    keepPreviousData: true,
  });
}

/**
 * Search posts with debounced queries
 */
export function useSearchPosts(query: string, options: PaginationOptions = {}) {
  return useQuery({
    queryKey: WOLFPACK_QUERY_KEYS.searchPosts(query, options),
    queryFn: () => WolfpackFeedService.searchPosts(query, options),
    enabled: query.trim().length > 2, // Only search if query is longer than 2 chars
    staleTime: 5 * 60 * 1000, // 5 minutes - search results can be cached longer
    gcTime: 10 * 60 * 1000,
    keepPreviousData: true,
  });
}

// ============================================================================
// INDIVIDUAL POST QUERIES
// ============================================================================

/**
 * Get single post with enriched data
 */
export function usePost(postId: string) {
  return useQuery({
    queryKey: WOLFPACK_QUERY_KEYS.post(postId),
    queryFn: () => WolfpackFeedService.getPost(postId),
    enabled: !!postId,
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000,
  });
}

/**
 * Get post statistics
 */
export function usePostStats(postId: string) {
  return useQuery({
    queryKey: WOLFPACK_QUERY_KEYS.postStats(postId),
    queryFn: () => WolfpackFeedService.getPostStats(postId),
    enabled: !!postId,
    staleTime: 30 * 1000, // 30 seconds - stats change frequently
    gcTime: 2 * 60 * 1000,
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds if active
  });
}

/**
 * Get user's posts
 */
export function useUserPosts(userId: string, options: PaginationOptions = {}) {
  return useQuery({
    queryKey: WOLFPACK_QUERY_KEYS.userPosts(userId, options),
    queryFn: () => WolfpackFeedService.getUserPosts(userId, options),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    keepPreviousData: true,
  });
}

// ============================================================================
// MUTATIONS - POST OPERATIONS
// ============================================================================

/**
 * Create new post with optimistic updates
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: WolfpackFeedService.createPost,
    onSuccess: (response) => {
      if (response.success && response.data) {
        // Invalidate and refetch feed queries
        queryClient.invalidateQueries({ queryKey: ['wolfpack', 'feed'] });
        
        // Add the new post to the cache
        queryClient.setQueryData(
          WOLFPACK_QUERY_KEYS.post(response.data.id),
          response.data
        );
      }
    },
    onError: (error) => {
      console.error('Failed to create post:', error);
    },
  });
}

/**
 * Update post with optimistic updates
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, updates }: { postId: string; updates: any }) =>
      WolfpackFeedService.updatePost(postId, updates),
    onMutate: async ({ postId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: WOLFPACK_QUERY_KEYS.post(postId) });

      // Snapshot the previous value
      const previousPost = queryClient.getQueryData(WOLFPACK_QUERY_KEYS.post(postId));

      // Optimistically update the post
      if (previousPost) {
        queryClient.setQueryData(WOLFPACK_QUERY_KEYS.post(postId), {
          ...previousPost,
          ...updates,
        });
      }

      return { previousPost };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(
          WOLFPACK_QUERY_KEYS.post(variables.postId),
          context.previousPost
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Refetch the post after mutation
      queryClient.invalidateQueries({ queryKey: WOLFPACK_QUERY_KEYS.post(variables.postId) });
    },
  });
}

/**
 * Delete post with optimistic updates
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: WolfpackFeedService.deletePost,
    onMutate: async (postId) => {
      // Remove from all feed caches
      queryClient.setQueriesData(
        { queryKey: ['wolfpack', 'feed'] },
        (oldData: any) => {
          if (!oldData) return oldData;
          
          if (oldData.items) {
            return {
              ...oldData,
              items: oldData.items.filter((item: FeedItem) => item.id !== postId),
            };
          }
          
          return oldData;
        }
      );
    },
    onSuccess: () => {
      // Invalidate feed queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['wolfpack', 'feed'] });
    },
  });
}

// ============================================================================
// MUTATIONS - SOCIAL INTERACTIONS
// ============================================================================

/**
 * Toggle like with immediate UI feedback
 */
export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ videoId, userId }: { videoId: string; userId: string }) =>
      WolfpackService.toggleLike(videoId, userId),
    onMutate: async ({ videoId, userId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['wolfpack'] });

      // Update all feed queries optimistically
      queryClient.setQueriesData(
        { queryKey: ['wolfpack', 'feed'] },
        (oldData: any) => {
          if (!oldData) return oldData;
          
          if (oldData.items) {
            return {
              ...oldData,
              items: oldData.items.map((item: FeedItem) => {
                if (item.id === videoId) {
                  const currentLiked = (item as any).user_liked || false;
                  return {
                    ...item,
                    likes_count: currentLiked 
                      ? (item.likes_count || 0) - 1 
                      : (item.likes_count || 0) + 1,
                    user_liked: !currentLiked,
                  };
                }
                return item;
              }),
            };
          }
          
          return oldData;
        }
      );

      // Update individual post cache
      const postKey = WOLFPACK_QUERY_KEYS.post(videoId);
      const previousPost = queryClient.getQueryData(postKey);
      if (previousPost) {
        queryClient.setQueryData(postKey, (old: any) => {
          if (!old) return old;
          const currentLiked = old.user_liked || false;
          return {
            ...old,
            likes_count: currentLiked 
              ? (old.likes_count || 0) - 1 
              : (old.likes_count || 0) + 1,
            user_liked: !currentLiked,
          };
        });
      }

      return { previousPost };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates on error
      queryClient.invalidateQueries({ queryKey: ['wolfpack'] });
      console.error('Failed to toggle like:', err);
    },
    onSettled: (data, error, variables) => {
      // Refetch post stats to ensure accuracy
      queryClient.invalidateQueries({ 
        queryKey: WOLFPACK_QUERY_KEYS.postStats(variables.videoId) 
      });
    },
  });
}

/**
 * Increment view count (fire-and-forget)
 */
export function useIncrementViewCount() {
  return useMutation({
    mutationFn: WolfpackFeedService.incrementViewCount,
    // Don't show errors to user for view counts
    onError: () => {
      // Silent fail - view counts are not critical
    },
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Check if video is liked by current user
 */
export function useIsVideoLiked(videoId: string, userId: string) {
  return useQuery({
    queryKey: WOLFPACK_QUERY_KEYS.isLiked(videoId, userId),
    queryFn: async () => {
      const response = await WolfpackService.checkIfUserLikedVideo(videoId, userId);
      return response.success ? response.data : false;
    },
    enabled: !!(videoId && userId),
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000,
  });
}

/**
 * Prefetch next page of feed for better UX
 */
export function usePrefetchNextFeedPage(currentPage: number, options: PaginationOptions = {}) {
  const queryClient = useQueryClient();

  const prefetchNext = () => {
    const nextPageOptions = { ...options, page: currentPage + 1 };
    queryClient.prefetchQuery({
      queryKey: WOLFPACK_QUERY_KEYS.feedItems(nextPageOptions),
      queryFn: () => WolfpackFeedService.fetchFeedItems(nextPageOptions),
      staleTime: 2 * 60 * 1000,
    });
  };

  return prefetchNext;
}