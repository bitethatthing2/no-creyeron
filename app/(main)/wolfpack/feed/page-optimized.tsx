'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import TikTokStyleFeed from '@/components/wolfpack/feed/TikTokStyleFeed';
import { PostCreator } from '@/components/wolfpack/PostCreator';
import ShareModal from '@/components/wolfpack/ShareModal';
import VideoComments from '@/components/wolfpack/VideoCommentsOptimized';
import { Loader2, Shield, Sparkles, MapPin } from 'lucide-react';

// Import React Query hooks
import { 
  useInfiniteFeedWithCursor, 
  useToggleLike, 
  useDeletePost,
  useIncrementViewCount,
  usePrefetchNextFeedPage
} from '@/lib/hooks/useWolfpackQuery';
import { FeedItem } from '@/lib/services/wolfpack/types';

export default function OptimizedWolfpackFeedPageWithReactQuery() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  
  // React Query hooks for data fetching
  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteFeedWithCursor(currentUser?.id, 15, false);

  // Mutations
  const toggleLikeMutation = useToggleLike();
  const deletePostMutation = useDeletePost();
  const incrementViewMutation = useIncrementViewCount();

  // Local state for UI components
  const [showPostCreator, setShowPostCreator] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareVideoData, setShareVideoData] = useState<{ id: string; caption?: string; username?: string } | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  // Flatten the infinite query data
  const videos = feedData?.pages.flatMap(page => page.items) || [];

  // Debug user info
  useEffect(() => {
    console.log('🔍 OPTIMIZED FEED DEBUG - User Info:', {
      currentUser: currentUser ? {
        id: currentUser.id,
        email: currentUser.email,
        displayName: currentUser.displayName,
        username: currentUser.username
      } : null,
      isAuthenticated,
      authLoading,
      videosCount: videos.length,
      isLoading,
      isError: isError ? error?.message : null
    });
  }, [currentUser, isAuthenticated, authLoading, videos.length, isLoading, isError, error]);

  // Check if camera should be opened on mount
  useEffect(() => {
    const shouldOpenCamera = searchParams.get('camera') === 'true';
    if (shouldOpenCamera) {
      setShowPostCreator(true);
      // Clean URL without reload
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('camera');
      const newUrl = `${window.location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  // Handle share
  const handleShare = useCallback((videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (video) {
      setShareVideoData({
        id: videoId,
        caption: video.caption,
        username: video.username
      });
      setShowShareModal(true);
    }
  }, [videos]);

  // Handle like/unlike with React Query optimistic updates
  const handleLike = useCallback(async (videoId: string) => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    try {
      await toggleLikeMutation.mutateAsync({ 
        videoId, 
        userId: currentUser.id 
      });
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Error handling is managed by the mutation hook
    }
  }, [currentUser, router, toggleLikeMutation]);

  // Handle comments - open modal instead of navigating
  const handleComment = useCallback((videoId: string) => {
    setActiveVideoId(videoId);
    setShowComments(true);
  }, []);

  // Handle video deletion with React Query
  const handleDelete = useCallback(async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.') || !currentUser) {
      return;
    }

    try {
      await deletePostMutation.mutateAsync(videoId);
      alert('Video deleted successfully');
    } catch (error) {
      console.error('Failed to delete video:', error);
      alert('Failed to delete video');
    }
  }, [currentUser, deletePostMutation]);

  // Handle video view count increment
  const handleVideoView = useCallback((videoId: string) => {
    // Fire and forget - don't wait for response
    incrementViewMutation.mutate(videoId);
  }, [incrementViewMutation]);

  // Handle infinite scroll
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Transform data for component compatibility
  const transformedVideos = videos.map(video => ({
    id: video.id,
    user_id: video.user_id,
    username: video.username,
    avatar_url: video.avatar_url,
    caption: video.caption || '',
    video_url: video.video_url || '',
    thumbnail_url: video.thumbnail_url,
    likes_count: video.likes_count || 0,
    wolfpack_comments_count: video.wolfpack_comments_count || 0,
    shares_count: video.shares_count || 0,
    created_at: video.created_at,
    music_name: video.music_name || 'Original Sound',
    hashtags: video.hashtags || [],
    view_count: 0,
    location_tag: undefined,
    // Add user interaction data if available
    user_liked: (video as any).user_liked || false,
  }));

  // Show minimal loading for faster perceived performance
  if (isLoading && videos.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your feed...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError && videos.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white p-6">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Unable to Load Feed</h2>
          <p className="text-gray-400 mb-4">
            {error?.message || 'Something went wrong while loading your feed.'}
          </p>
          <button
            onClick={() => refetch()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show authentication required state
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white p-6">
          <MapPin className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Join the Wolfpack!</h2>
          <p className="text-gray-400 mb-4">
            Sign in to see videos from your pack and share your own moments.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full transition-colors flex items-center gap-2 mx-auto"
          >
            <Sparkles className="w-4 h-4" />
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Show empty state if no videos
  if (!isLoading && transformedVideos.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white p-6">
          <Sparkles className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Your Feed is Empty</h2>
          <p className="text-gray-400 mb-4">
            Start following other users or create your first video to see content here.
          </p>
          <button
            onClick={() => setShowPostCreator(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full transition-colors"
          >
            Create Your First Video
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main Feed */}
      <TikTokStyleFeed
        videos={transformedVideos}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        onDelete={handleDelete}
        onVideoView={handleVideoView}
        onLoadMore={handleLoadMore}
        hasNextPage={hasNextPage}
        isLoadingMore={isFetchingNextPage}
        currentUser={currentUser}
        likingVideo={toggleLikeMutation.variables?.videoId || null}
      />

      {/* Post Creator Modal */}
      {showPostCreator && (
        <PostCreator
          onClose={() => setShowPostCreator(false)}
          onVideoCreated={() => {
            setShowPostCreator(false);
            // Refetch the feed to include the new video
            refetch();
          }}
        />
      )}

      {/* Share Modal */}
      {showShareModal && shareVideoData && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setShareVideoData(null);
          }}
          videoId={shareVideoData.id}
          caption={shareVideoData.caption}
          username={shareVideoData.username}
        />
      )}

      {/* Comments Modal */}
      {showComments && activeVideoId && (
        <VideoComments
          videoId={activeVideoId}
          onClose={() => {
            setShowComments(false);
            setActiveVideoId(null);
          }}
        />
      )}

      {/* Loading indicator for pagination */}
      {isFetchingNextPage && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-black bg-opacity-80 text-white px-4 py-2 rounded-full flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading more videos...</span>
          </div>
        </div>
      )}
    </div>
  );
}