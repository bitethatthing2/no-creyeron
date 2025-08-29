'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { WolfpackService } from '@/lib/services/wolfpack';
import { supabase } from '@/lib/supabase';
import type { FeedVideoItem } from '@/lib/services/wolfpack/types';
import { transformToFeedVideoItem } from '@/lib/services/wolfpack/types';
import TikTokStyleFeed from '@/components/wolfpack/feed/TikTokStyleFeed';
import { PostCreator } from '@/components/wolfpack/PostCreator';
import ShareModal from '@/components/wolfpack/ShareModal';
import VideoComments from '@/components/wolfpack/VideoCommentsOptimized';
import { Loader2, Sparkles } from 'lucide-react';
import type { WolfpackVideoItem as TikTokVideoItem } from '@/components/wolfpack/feed/TikTokStyleFeed';
import { FeatureFlagDebug } from '@/components/debug/FeatureFlagDebug';
export default function OptimizedWolfpackFeedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  
  // State management
  const [videos, setVideos] = useState<FeedVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLikes, setUserLikes] = useState(new Set<string>());
  const hasMore = false; // Pagination not currently supported

  // Modal states
  const [showPostCreator, setShowPostCreator] = useState(false);
  
  // Debug showPostCreator state changes
  useEffect(() => {
    console.log('[FEED] showPostCreator state changed to:', showPostCreator);
  }, [showPostCreator]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareVideoData, setShareVideoData] = useState<{ 
    id: string; 
    caption?: string; 
    username?: string 
  } | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);


  // Load feed from service - no extra parameters for initial load
  const loadFeed = useCallback(async (loadMore = false) => {
    console.log('[FEED] loadFeed called:', { authLoading, isAuthenticated, loadMore });
    
    if (authLoading) {
      console.log('[FEED] Auth still loading...');
      return;
    }
    
    if (!isAuthenticated) {
      console.log('[FEED] Not authenticated, skipping feed load');
      return;
    }

    try {
      if (!loadMore) {
        setLoading(true);
        console.log('[FEED] Starting fresh feed load...');
      }
      setError(null);
      
      console.log('[FEED] Using FEED_PROCESSOR Edge Function...');
      
      // Get current user session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[FEED] Session status:', session ? 'Found' : 'None', session?.user?.id || 'No user');
      
      if (!session) {
        console.warn('[FEED] No authenticated session, cannot access FEED_PROCESSOR');
        setError('Authentication required to load feed');
        return;
      }

      const edgeFunctionUrl = `https://tvnpgbjypnezoasbhbwx.supabase.co/functions/v1/FEED_PROCESSOR/get-feed`;
      const requestBody = {
        limit: 20,
        offset: 0,
        type: 'for-you'
      };
      
      console.log('[FEED] Calling FEED_PROCESSOR:', edgeFunctionUrl, requestBody);
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[FEED] FEED_PROCESSOR response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[FEED] FEED_PROCESSOR error response:', errorText);
        throw new Error(`FEED_PROCESSOR error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[FEED] FEED_PROCESSOR result:', result);
      
      if (!result.success) {
        console.error('[FEED] FEED_PROCESSOR returned failure:', result.error);
        setError(result.error || 'Feed processing failed');
        return;
      }

      // Transform the response data using the existing transform function
      const transformedVideos: FeedVideoItem[] = (result.data || []).map((item: any) => 
        transformToFeedVideoItem(item)
      );
      console.log('[FEED] Transformed videos from FEED_PROCESSOR:', transformedVideos);
      
      if (loadMore) {
        // If service doesn't support pagination, don't add duplicates
        const existingIds = new Set(videos.map(v => v.id));
        const newVideos = transformedVideos.filter(v => !existingIds.has(v.id));
        setVideos(prev => [...prev, ...newVideos]);
        console.log(`[FEED] Added ${newVideos.length} new videos (total: ${videos.length + newVideos.length})`);
      } else {
        setVideos(transformedVideos);
        console.log(`[FEED] Set ${transformedVideos.length} videos`);
      }
      
    } catch (err) {
      console.error('[FEED] Error loading videos:', err);
      console.error('[FEED] Error details:', err instanceof Error ? err.stack : err);
      setError(`Failed to load videos: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      console.log('[FEED] Loading finished');
    }
  }, [isAuthenticated, authLoading, router, transformPost, videos]);

  // Auth redirect check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('[FEED] User not authenticated, redirecting to login...');
      router.push('/login');
      return;
    }
  }, [authLoading, isAuthenticated, router]);

  // Initial load - fixed dependency
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      console.log('[FEED] User authenticated, loading feed...');
      loadFeed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  // Handle pagination
  const handleLoadMore = useCallback(async (): Promise<TikTokVideoItem[]> => {
    // Since pagination might not be supported, return empty array
    return [];
  }, []);

  // Set up real-time subscriptions - fixed dependency
  useEffect(() => {
    const videoIds = videos.map(v => v.id);
    if (videoIds.length === 0) return;
    
    // Subscribe to comment count updates
    const channel = supabase
      .channel('feed-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_comments',
          filter: `video_id=in.(${videoIds.join(',')})`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newComment = payload.new as { video_id: string };
            setVideos(prev => prev.map(video => 
              video.id === newComment.video_id 
                ? { ...video, comments_count: video.comments_count + 1 }
                : video
            ));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const oldComment = payload.old as { video_id: string };
            setVideos(prev => prev.map(video => 
              video.id === oldComment.video_id 
                ? { ...video, comments_count: Math.max(0, video.comments_count - 1) }
                : video
            ));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'content_posts',
          filter: `id=in.(${videoIds.join(',')})`
        },
        (payload) => {
          // Update video stats when content_posts is updated
          const updatedPost = payload.new as {
            id: string;
            likes_count?: number | null;
            like_count?: number | null;
            comments_count?: number | null;
            comment_count?: number | null;
            views_count?: number | null;
            view_count?: number | null;
            shares_count?: number | null;
            share_count?: number | null;
          };
          setVideos(prev => prev.map(video => 
            video.id === updatedPost.id 
              ? {
                  ...video,
                  likes_count: updatedPost.likes_count ?? updatedPost.like_count ?? video.likes_count,
                  comments_count: updatedPost.comments_count ?? updatedPost.comment_count ?? video.comments_count,
                  views_count: updatedPost.views_count ?? updatedPost.view_count ?? video.views_count,
                  shares_count: updatedPost.shares_count ?? updatedPost.share_count ?? video.shares_count,
                }
              : video
          ));
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

    // Make the actual request
    try {
      const response = await WolfpackService.social.toggleLike(videoId);
      
      // Revert if failed
      if (!response.success) {
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
      const response = await WolfpackService.feed.deletePost(videoId);
      
      if (response.success) {
        setVideos(prevVideos => prevVideos.filter(v => v.id !== videoId));
      } else {
        alert('Failed to delete video: ' + response.error);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video');
    }
  }, []);

  const handleFollow = useCallback(async (userId: string) => {
    console.log('Follow user:', userId);
    // TODO: Implement follow functionality when available in service
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
          <h2 className="text-2xl font-bold mb-4 text-white">Welcome to the Pack!</h2>
          
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
            No videos found in the Wolf Pack feed yet. Be the first to share!
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {process.env.NODE_ENV === 'development' && <FeatureFlagDebug />}
      
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
        onClose={() => setShowPostCreator(false)}
        onSuccess={handlePostSuccess}
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
          initialCommentCount={activeVideoCommentCount}
          onCommentCountChange={(count) => {
            setVideos(prev => prev.map(video => 
              video.id === activeVideoId 
                ? { ...video, comments_count: count }
                : video
            ));
          }}
        />
      )}
    </>
  );
}