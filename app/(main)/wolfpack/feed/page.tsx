'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { wolfpackService } from '@/lib/services/unified-wolfpack.service';
import { supabase } from '@/lib/supabase';
import TikTokStyleFeed from '@/components/wolfpack/feed/TikTokStyleFeed';
import { PostCreator } from '@/components/wolfpack/PostCreator';
import ShareModal from '@/components/wolfpack/ShareModal';
import VideoComments from '@/components/wolfpack/VideoCommentsOptimized';
import { Loader2, Shield, Sparkles, MapPin } from 'lucide-react';

export default function OptimizedWolfpackFeedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, user: authUser, isAuthenticated, loading: authLoading } = useAuth();
  const [likingVideo, setLikingVideo] = useState<string | null>(null);
  
  // Debug user info
  useEffect(() => {
    console.log('🔍 FEED DEBUG - User Info:', {
      currentUser: currentUser ? {
        id: currentUser.id,
        email: currentUser.email,
        displayName: currentUser.displayName,
        username: currentUser.username
      } : null,
      authUser: authUser ? {
        id: authUser.id,
        email: authUser.email
      } : null,
      isAuthenticated,
      authLoading
    });
  }, [currentUser, authUser, isAuthenticated, authLoading]);
  
  // State management
  const [wolfpack_videos, setwolfpack_videos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLikes, setUserLikes] = useState(new Set<string>());

  // Clean, simple feed loading using unified service
  const loadFeed = useCallback(async () => {
    // Don't wait for auth loading to complete, but redirect if not authenticated
    if (authLoading) {
      console.log('[FEED] Auth still loading, waiting...');
      return;
    }
    
    if (!isAuthenticated) {
      console.log('[FEED] Not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    try {
      console.log('[FEED] Loading feed for authenticated user...');
      setLoading(true);
      setError(null);
      
      const response = await wolfpackService.getFeedVideos(15);
      
      if (!response.success) {
        setError(response.error || 'Failed to load feed');
        return;
      }

      const videos = response.data || [];
      console.log(`[FEED] Loaded ${videos.length} videos`);
      
      // Transform for component compatibility
      const transformedVideos = videos.map(video => ({
        id: video.id,
        user_id: video.user_id,
        username: wolfpackService.getDisplayName(video.users || {} as any),
        avatar_url: wolfpackService.getAvatarUrl(video.users || {} as any),
        caption: video.caption || '',
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url,
        likes_count: video.like_count || 0,
        wolfpack_comments_count: video.comment_count || 0,
        shares_count: 0,
        created_at: video.created_at,
        music_name: 'Original Sound',
        hashtags: [],
        view_count: 0,
        location_tag: video.location_tag
      }));
      
      setwolfpack_videos(transformedVideos);
      
    } catch (err) {
      console.error('[FEED] Unexpected error:', err);
      setError(`Failed to load videos: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentUser, authLoading, router]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Fetch real-time comment counts for visible videos
  useEffect(() => {
    const fetchCommentCounts = async () => {
      if (wolfpack_videos.length === 0) return;
      
      const videoIds = wolfpack_videos.map(v => v.id);
      const response = await wolfpackService.getBatchCommentCounts(videoIds);
      
      if (response.success && response.data) {
        // Update videos with real comment counts
        setwolfpack_videos(prev => prev.map(video => ({
          ...video,
          wolfpack_comments_count: response.data[video.id] || 0
        })));
      }
    };

    // Fetch counts initially
    fetchCommentCounts();

    // Set up interval to refresh counts every 30 seconds
    const interval = setInterval(fetchCommentCounts, 30000);

    // Set up real-time subscription for comment updates
    const videoIds = wolfpack_videos.map(v => v.id);
    const channels: any[] = [];
    
    if (videoIds.length > 0) {
      // Subscribe to comment changes for all visible videos
      const channel = supabase
        .channel('feed-comments')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wolfpack_comments',
            filter: `video_id=in.(${videoIds.join(',')})`
          },
          () => {
            // Refetch counts when any comment changes
            fetchCommentCounts();
          }
        )
        .subscribe();
      
      channels.push(channel);
    }

    return () => {
      clearInterval(interval);
      channels.forEach(channel => channel.unsubscribe());
    };
  }, [wolfpack_videos.length]);

  const [showPostCreator, setShowPostCreator] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareVideoData, setShareVideoData] = useState<{ id: string; caption?: string; username?: string } | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

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
    const video = wolfpack_videos.find(v => v.id === videoId);
    if (video) {
      setShareVideoData({
        id: videoId,
        caption: video.caption,
        username: video.username
      });
      setShowShareModal(true);
    }
  }, [wolfpack_videos]);

  // Handle like/unlike
  const handleLike = useCallback(async (videoId: string) => {
    const response = await wolfpackService.toggleLike(videoId);
    
    // If authentication required, redirect smoothly
    if (!response.success && response.error?.includes('Authentication required')) {
      router.push('/login');
      return;
    }
    
    if (response.success) {
      const isLiked = userLikes.has(videoId);
      
      // Update local state
      setUserLikes(prev => {
        const newLikes = new Set(prev);
        if (response.data?.liked) {
          newLikes.add(videoId);
        } else {
          newLikes.delete(videoId);
        }
        return newLikes;
      });

      // Update video like count in local state
      setwolfpack_videos(prev => prev.map(video => 
        video.id === videoId 
          ? { 
              ...video, 
              likes_count: response.data?.liked 
                ? (video.likes_count || 0) + 1
                : Math.max(0, (video.likes_count || 0) - 1)
            }
          : video
      ));
    }
  }, [router, userLikes]);

  // Handle comments - open modal instead of navigating
  const handleComment = useCallback((videoId: string) => {
    setActiveVideoId(videoId);
    setShowComments(true);
  }, []);

  // Handle video deletion
  const handleDelete = useCallback(async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.') || !currentUser) {
      return;
    }

    const response = await wolfpackService.deleteVideo(videoId);
    
    if (response.success) {
      setwolfpack_videos(prevVideos => prevVideos.filter(v => v.id !== videoId));
      alert('Video deleted successfully');
    } else {
      alert('Failed to delete video: ' + response.error);
    }
  }, [currentUser]);







  // Show minimal loading for faster perceived performance
  if ((authLoading || loading) && wolfpack_videos.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
          <p className="text-gray-300 text-sm">
            {authLoading ? 'Checking authentication...' : 'Loading feed...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={loadFeed}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show empty state if no wolfpack_videos
  if (wolfpack_videos.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-900/50">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-white">Welcome to the Pack!</h2>
          
          {/* Debug information */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 mb-4 p-2 bg-gray-800 rounded">
              <p>Debug Info:</p>
              <p>wolfpack_videos: {wolfpack_videos.length}</p>
              <p>Loading: {loading.toString()}</p>
              <p>Error: {error || 'None'}</p>
            </div>
          )}
          <p className="text-gray-300 mb-6 leading-relaxed">
            No wolfpack_videos found in the Wolf Pack feed.
          </p>
          <button 
            onClick={loadFeed}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg text-sm transition-colors"
          >
            🔄 Refresh Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <TikTokStyleFeed
        wolfpack_videos={wolfpack_videos}
        currentUser={currentUser}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        onFollow={() => {}}
        onDelete={handleDelete}
        onCreatePost={() => setShowPostCreator(true)}
        onLoadMore={() => {}}
        hasMore={false}
        isLoading={!!likingVideo}
        userLikes={userLikes}
        initialVideoId={searchParams.get('videoId') || undefined}
      />
      
      <PostCreator
        isOpen={showPostCreator}
        onClose={() => setShowPostCreator(false)}
        onSuccess={() => {
          setShowPostCreator(false);
          loadFeed(); // Reload feed after creating post
        }}
      />
      
      <ShareModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setShareVideoData(null);
        }}
        videoId={shareVideoData?.id || ''}
        caption={shareVideoData?.caption}
        username={shareVideoData?.username}
      />

      {activeVideoId && (
        <VideoComments
          postId={activeVideoId}
          isOpen={showComments}
          onClose={() => {
            setShowComments(false);
            setActiveVideoId(null);
          }}
          initialCommentCount={0}
          onCommentCountChange={(count) => {
            // Update comment count in local state
            setwolfpack_videos(prev => prev.map(video => 
              video.id === activeVideoId 
                ? { ...video, wolfpack_comments_count: count }
                : video
            ));
          }}
        />
      )}
    </>
  );
}