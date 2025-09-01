'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { FeedVideoItem } from '@/lib/services/social/types';
import { transformToFeedVideoItem } from '@/lib/services/social/types';
import TikTokStyleFeed from '@/components/social/feed/TikTokStyleFeed';
import { PostCreator } from '@/components/social/PostCreator';
import ShareModal from '@/components/social/ShareModal';
import VideoComments from '@/components/social/VideoCommentsOptimized';
import CameraTest from '@/components/CameraTest';
import { Loader2, Sparkles } from 'lucide-react';
import type { SocialVideoItem as TikTokVideoItem } from '@/components/social/feed/TikTokStyleFeed';

// Type definitions for API responses
interface RawFeedItem {
  id: string;
  [key: string]: unknown;
}

interface FeedProcessorResponse {
  success: boolean;
  data?: RawFeedItem[];
  error?: string;
}

interface CommentPayload {
  video_id: string;
}

interface PostUpdatePayload {
  id: string;
  likes_count?: number | null;
  like_count?: number | null;
  comments_count?: number | null;
  comment_count?: number | null;
  views_count?: number | null;
  view_count?: number | null;
  shares_count?: number | null;
  share_count?: number | null;
}

function SocialFeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  
  // State management
  const [videos, setVideos] = useState<FeedVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLikes, setUserLikes] = useState(new Set<string>());
  const [hasMore, setHasMore] = useState(true);
  const [lastCreatedAt, setLastCreatedAt] = useState<string | null>(null);

  // Modal states
  const [showPostCreator, setShowPostCreator] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareVideoData, setShareVideoData] = useState<{ 
    id: string; 
    caption?: string; 
    username?: string 
  } | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [showCameraTest, setShowCameraTest] = useState(false);

  // Debug showPostCreator state changes
  useEffect(() => {
    console.log('[FEED] showPostCreator state changed to:', showPostCreator);
  }, [showPostCreator]);

  // Load feed from service
  const loadFeed = useCallback(async (loadMore = false) => {
    if (authLoading || !isAuthenticated) {
      return;
    }

    try {
      if (!loadMore) {
        setLoading(true);
      }
      setError(null);

      // Query content_posts directly with only needed fields
      let query = supabase
        .from('content_posts')
        .select(`
          id,
          user_id,
          caption,
          video_url,
          thumbnail_url,
          content_type,
          likes_count,
          comments_count,
          shares_count,
          views_count,
          created_at,
          is_active,
          user:users!user_id(
            id,
            username,
            display_name,
            first_name,
            last_name,
            avatar_url,
            profile_image_url
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      // Add pagination for load more
      if (loadMore && lastCreatedAt) {
        query = query.lt('created_at', lastCreatedAt);
      }

      const { data: posts, error: postsError } = await query;

      if (postsError) {
        throw new Error(`Database query failed: ${postsError.message}`);
      }

      // Transform the posts data using the existing transform function
      const transformedVideos: FeedVideoItem[] = (posts || []).map((post) => 
        transformToFeedVideoItem(post)
      );
      
      // Update hasMore based on returned count
      setHasMore(transformedVideos.length === 10);
      
      // Update lastCreatedAt for pagination
      if (transformedVideos.length > 0) {
        const lastPost = transformedVideos[transformedVideos.length - 1];
        setLastCreatedAt(lastPost.created_at);
      }
      
      if (loadMore) {
        // Add new videos to existing ones
        const existingIds = new Set(videos.map(v => v.id));
        const newVideos = transformedVideos.filter(v => !existingIds.has(v.id));
        setVideos(prev => [...prev, ...newVideos]);
      } else {
        // Replace videos for fresh load
        setVideos(transformedVideos);
      }
      
    } catch (err) {
      console.error('[FEED] Error loading videos:', err);
      setError(`Failed to load videos: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  // Auth redirect and initial load
  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Load feed immediately when authenticated
    loadFeed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading, router]);

  // Handle pagination
  const handleLoadMore = useCallback(async (): Promise<TikTokVideoItem[]> => {
    if (!hasMore) return [];
    
    try {
      await loadFeed(true);
      return []; // Return empty since loadFeed handles the state
    } catch (error) {
      console.error('Error loading more videos:', error);
      return [];
    }
  }, [hasMore, loadFeed]);

  // Set up real-time subscriptions (only for first 5 videos to reduce load)
  useEffect(() => {
    const videoIds = videos.slice(0, 5).map(v => v.id);
    if (videoIds.length === 0) return;
    
    // Subscribe to comment count updates for visible posts only
    const channel = supabase
      .channel('feed-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'content_comments',
          filter: `video_id=in.(${videoIds.join(',')})`
        },
        (payload) => {
          if (payload.new) {
            const newComment = payload.new as CommentPayload;
            setVideos(prev => prev.map(video => 
              video.id === newComment.video_id 
                ? { ...video, comments_count: video.comments_count + 1 }
                : video
            ));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos.length]); // Only re-subscribe when number of videos changes

  // Check for camera param
  useEffect(() => {
    const shouldOpenCamera = searchParams.get('camera') === 'true';
    if (shouldOpenCamera) {
      setShowPostCreator(true);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('camera');
      const newUrl = `${window.location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  // Action handlers
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

  const handleLike = useCallback(async (videoId: string) => {
    // Optimistic update
    const isCurrentlyLiked = userLikes.has(videoId);
    
    setUserLikes(prev => {
      const newLikes = new Set(prev);
      if (isCurrentlyLiked) {
        newLikes.delete(videoId);
      } else {
        newLikes.add(videoId);
      }
      return newLikes;
    });

    setVideos(prev => prev.map(video => 
      video.id === videoId 
        ? { 
            ...video, 
            likes_count: isCurrentlyLiked 
              ? Math.max(0, video.likes_count - 1)
              : video.likes_count + 1
          }
        : video
    ));

    // Make the actual request to toggle like via Supabase Edge Function or direct DB call
    try {
      // Call your edge function or Supabase function here
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const { error: toggleError } = await supabase.rpc('toggle_post_like', {
        p_post_id: videoId,
        p_user_id: session.user.id
      });
      
      if (toggleError) throw toggleError;
      
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      setUserLikes(prev => {
        const newLikes = new Set(prev);
        if (isCurrentlyLiked) {
          newLikes.add(videoId);
        } else {
          newLikes.delete(videoId);
        }
        return newLikes;
      });

      setVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { 
              ...video, 
              likes_count: isCurrentlyLiked 
                ? video.likes_count + 1
                : Math.max(0, video.likes_count - 1)
            }
          : video
      ));
    }
  }, [userLikes]);

  const handleComment = useCallback((videoId: string) => {
    setActiveVideoId(videoId);
    setShowComments(true);
  }, []);

  const handleDelete = useCallback(async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete the post via Supabase
      const { error: deleteError } = await supabase
        .from('content_posts')
        .update({ is_active: false })
        .eq('id', videoId);
      
      if (deleteError) throw deleteError;
      
      setVideos(prevVideos => prevVideos.filter(v => v.id !== videoId));
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video');
    }
  }, []);

  const handleFollow = useCallback(async (userId: string) => {
    console.log('Follow user:', userId);
    try {
      const { error: followError } = await supabase.rpc('toggle_follow', {
        target_user_id: userId
      });
      
      if (followError) throw followError;
      
      // You might want to update UI to reflect the follow status
    } catch (error) {
      console.error('Error following user:', error);
    }
  }, []);

  const handlePostSuccess = useCallback(() => {
    setShowPostCreator(false);
    // Reload the feed to get the new post
    loadFeed(false);
  }, [loadFeed]);

  // Memoized values
  const initialVideoId = useMemo(() => 
    searchParams.get('videoId') || undefined,
    [searchParams]
  );

  const activeVideoCommentCount = useMemo(() => 
    videos.find(v => v.id === activeVideoId)?.comments_count || 0,
    [videos, activeVideoId]
  );

  // Loading state
  if ((authLoading || loading) && videos.length === 0) {
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

  // Error state
  if (error && videos.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => loadFeed(false)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (videos.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-900/50">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-white">Welcome to Side Hustle Social!</h2>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 mb-4 p-2 bg-gray-800 rounded">
              <p>Debug Info:</p>
              <p>Videos: {videos.length}</p>
              <p>Loading: {loading.toString()}</p>
              <p>Error: {error || 'None'}</p>
              <p>Authenticated: {isAuthenticated.toString()}</p>
            </div>
          )}
          
          <p className="text-gray-300 mb-6 leading-relaxed">
            No videos found in the Social feed yet. Be the first to share!
          </p>
          
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => setShowPostCreator(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm transition-colors"
            >
              📹 Create First Post
            </button>
            <button 
              onClick={() => loadFeed(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg text-sm transition-colors"
            >
              🔄 Refresh Feed
            </button>
            <button 
              onClick={() => setShowCameraTest(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm transition-colors"
            >
              🎥 Test Camera
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <TikTokStyleFeed
        content_posts={videos}
        currentUser={currentUser ? {
          id: currentUser.id,
          username: currentUser.username || currentUser.email?.split('@')[0] || 'user'
        } : null}
        onLikeAction={handleLike}
        onCommentAction={handleComment}
        onShareAction={handleShare}
        onFollowAction={handleFollow}
        onDelete={handleDelete}
        onCreatePost={() => {
          console.log('[FEED] Create post button clicked, setting showPostCreator to true');
          setShowPostCreator(true);
        }}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        isLoading={loading}
        userLikes={userLikes}
        initialVideoId={initialVideoId}
      />
      
      <PostCreator
        isOpen={showPostCreator}
        onCloseAction={() => setShowPostCreator(false)}
        onSuccessAction={handlePostSuccess}
      />
      
      <ShareModal
        isOpen={showShareModal}
        onCloseAction={() => {
          setShowShareModal(false);
          setShareVideoData(null);
        }}
        contentId={shareVideoData?.id || ''}
        contentType="video"
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
          initialCommentCount={activeVideoCommentCount}
          onCommentCountChange={(count: number) => {
            setVideos(prev => prev.map(video => 
              video.id === activeVideoId 
                ? { ...video, comments_count: count }
                : video
            ));
          }}
        />
      )}

      {showCameraTest && <CameraTest />}
    </>
  );
}

export default function OptimizedSocialFeedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
          <p className="text-gray-300 text-sm">Loading feed...</p>
        </div>
      </div>
    }>
      <SocialFeedContent />
    </Suspense>
  );
}