// Primary Wolfpack Feed Component
// This is the main feed wrapper that handles data fetching and state management

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import TikTokStyleFeed from './TikTokStyleFeed';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { FeedVideoItem } from '@/types/wolfpack-feed';
interface WolfpackFeedProps {
  initialVideoId?: string;
  className?: string;
}

export default function WolfpackFeed({ initialVideoId, className }: WolfpackFeedProps) {
  const { currentUser } = useAuth();
  const [videos, setVideos] = useState<FeedVideoItem[]>([]);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(0);

  const loadVideos = useCallback(async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setError(null);
      }
      
      const currentPage = loadMore ? pageRef.current + 1 : 0;
      const offset = currentPage * 20;
      
      // Use the new standardized wolfpack_feed_api view
      const { data: feedItems, error: feedError } = await supabase
        .from('wolfpack_feed_api')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + 19);

      if (feedError) {
        throw new Error(feedError.message || 'Failed to load feed');
      }

      // Transform to FeedVideoItem interface - backend now provides both naming conventions
      const transformedVideos: FeedVideoItem[] = (feedItems || []).map(item => ({
        // Core identifiers  
        id: item.id,
        user_id: item.user_id || '',
        
        // User information (already joined in the view)
        username: item.username || 'user',
        display_name: item.display_name,
        avatar_url: item.avatar_url || item.profile_image_url || '/icons/wolf-icon.png',
        profile_image_url: item.profile_image_url || item.avatar_url,
        wolfpack_status: item.wolfpack_status || 'inactive',
        
        // Video content
        video_url: item.video_url,
        thumbnail_url: item.thumbnail_url,
        caption: item.caption || '',
        description: item.description,
        
        // Engagement metrics - backend provides both naming conventions
        likes_count: item.likes_count || item.like_count || 0,
        comments_count: item.comments_count || item.comment_count || 0, 
        shares_count: item.shares_count || item.share_count || 0,
        views_count: item.views_count || item.view_count || 0,
        
        // User interaction states
        user_liked: item.user_liked || false,
        user_following: item.user_following || false,
        has_viewed: item.has_viewed || false,
        
        // Metadata
        hashtags: item.hashtags || [],
        music_name: item.music_name || null,
        duration_seconds: item.duration_seconds || item.duration,
        location_tag: item.location_tag || null,
        
        // Status flags
        is_featured: item.is_featured || false,
        visibility: item.visibility || 'public',
        allow_comments: item.allow_comments !== false,
        is_active: item.is_active !== false,
        
        // Timestamps
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      if (loadMore) {
        setVideos(prev => {
          // Prevent duplicates
          const existingIds = new Set(prev.map(v => v.id));
          const newVideos = transformedVideos.filter(v => !existingIds.has(v.id));
          return [...prev, ...newVideos];
        });
        pageRef.current = currentPage;
      } else {
        setVideos(transformedVideos);
        pageRef.current = 0;
      }

      setHasMore(feedItems.length === 20); // Has more if we got full page

      return transformedVideos;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load feed';
      console.error('Error loading videos:', error);
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserLikes = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      // Use the new content_interactions table
      const { data: interactions } = await supabase
        .from('content_interactions')
        .select('content_id')
        .eq('user_id', currentUser.id)
        .eq('interaction_type', 'like');

      if (interactions) {
        setUserLikes(new Set(interactions.map(i => i.content_id)));
      }
    } catch (error) {
      console.error('Error loading user likes:', error);
    }
  }, [currentUser]);

  // Load initial videos using the service - loadVideos is stable (no dependencies)
  useEffect(() => {
    const loadInitialData = async () => {
      await loadVideos();
      if (currentUser?.id) {
        await loadUserLikes();
      }
    };
    loadInitialData();
  }, [currentUser, loadVideos, loadUserLikes]);

  const handleLike = async (videoId: string) => {
    if (!currentUser) {
      toast.error('Please sign in to like videos');
      return;
    }

    try {
      const isLiked = userLikes.has(videoId);

      if (isLiked) {
        // Unlike: Remove the interaction
        await supabase
          .from('content_interactions')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('content_id', videoId)
          .eq('interaction_type', 'like');

        // Update likes_count in content_posts
        const video = videos.find(v => v.id === videoId);
        if (video && video.likes_count > 0) {
          await supabase
            .from('content_posts')
            .update({ likes_count: video.likes_count - 1 })
            .eq('id', videoId);
        }

        // Update local state
        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });

        setVideos(prev => prev.map(v => 
          v.id === videoId 
            ? { ...v, likes_count: Math.max(0, v.likes_count - 1), user_liked: false }
            : v
        ));

        toast.success('Removed like');
      } else {
        // Like: Add interaction
        await supabase
          .from('content_interactions')
          .upsert({
            user_id: currentUser.id,
            content_id: videoId,
            interaction_type: 'like'
          }, {
            onConflict: 'user_id,content_id,interaction_type'
          });

        // Update likes_count in content_posts  
        const video = videos.find(v => v.id === videoId);
        if (video) {
          await supabase
            .from('content_posts')
            .update({ likes_count: video.likes_count + 1 })
            .eq('id', videoId);
        }

        // Update local state
        setUserLikes(prev => new Set(prev).add(videoId));

        setVideos(prev => prev.map(v => 
          v.id === videoId 
            ? { ...v, likes_count: v.likes_count + 1, user_liked: true }
            : v
        ));

        toast.success('Liked!');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleComment = async (videoId: string) => {
    // This just opens the comment modal in TikTokStyleFeed
    console.log('Comment on video:', videoId);
  };

  const handleShare = async (videoId: string) => {
    try {
      // Track share interaction
      if (currentUser) {
        await supabase
          .from('content_interactions')
          .upsert({
            user_id: currentUser.id,
            content_id: videoId,
            interaction_type: 'share'
          }, {
            onConflict: 'user_id,content_id,interaction_type'
          });
      }

      // Increment share count
      const video = videos.find(v => v.id === videoId);
      if (!video) return;

      await supabase
        .from('content_posts')
        .update({ shares_count: (video.shares_count || 0) + 1 })
        .eq('id', videoId);

      // Update local state
      setVideos(prev => prev.map(v => 
        v.id === videoId 
          ? { ...v, shares_count: v.shares_count + 1 }
          : v
      ));

      // Copy link to clipboard
      const url = `${window.location.origin}/wolfpack/video/${videoId}`;
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share');
    }
  };

  const handleFollow = async (userId: string) => {
    if (!currentUser) {
      toast.error('Please sign in to follow users');
      return;
    }

    try {
      // Check if already following
      const { data: existing } = await supabase
        .from('social_follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId)
        .single();

      if (existing) {
        // Unfollow
        await supabase
          .from('social_follows')
          .delete()
          .eq('id', existing.id);
        
        // Update local state
        setVideos(prev => prev.map(v => 
          v.user_id === userId 
            ? { ...v, user_following: false }
            : v
        ));
        
        toast.success('Unfollowed');
      } else {
        // Follow
        await supabase
          .from('social_follows')
          .insert({
            follower_id: currentUser.id,
            following_id: userId
          });
        
        // Update local state
        setVideos(prev => prev.map(v => 
          v.user_id === userId 
            ? { ...v, user_following: true }
            : v
        ));
        
        toast.success('Following!');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!currentUser) return;

    try {
      // Soft delete the video by setting is_active to false
      await supabase
        .from('content_posts')
        .update({ is_active: false })
        .eq('id', videoId)
        .eq('user_id', currentUser.id);

      // Remove from local state
      setVideos(prev => prev.filter(v => v.id !== videoId));
      
      toast.success('Video deleted');
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    }
  };

  const handleCreatePost = () => {
    window.location.href = '/wolfpack/create';
  };

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loading) return [];
    
    try {
      setLoading(true);
      const currentPage = pageRef.current + 1;
      const offset = currentPage * 20;
      
      const { data: feedItems, error: feedError } = await supabase
        .from('wolfpack_feed_api')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + 19);

      if (feedError) {
        throw new Error(feedError.message || 'Failed to load more');
      }

      const transformedVideos: FeedVideoItem[] = (feedItems || []).map(item => ({
        id: item.id,
        user_id: item.user_id || '',
        username: item.username || 'user',
        display_name: item.display_name,
        avatar_url: item.avatar_url || item.profile_image_url || '/icons/wolf-icon.png',
        profile_image_url: item.profile_image_url || item.avatar_url,
        wolfpack_status: item.wolfpack_status || 'inactive',
        video_url: item.video_url,
        thumbnail_url: item.thumbnail_url,
        caption: item.caption || '',
        description: item.description,
        likes_count: item.likes_count || item.like_count || 0,
        comments_count: item.comments_count || item.comment_count || 0,
        shares_count: item.shares_count || item.share_count || 0,
        views_count: item.views_count || item.view_count || 0,
        user_liked: item.user_liked || false,
        user_following: item.user_following || false,
        has_viewed: item.has_viewed || false,
        hashtags: item.hashtags || [],
        music_name: item.music_name || null,
        duration_seconds: item.duration_seconds || item.duration,
        location_tag: item.location_tag || null,
        is_featured: item.is_featured || false,
        visibility: item.visibility || 'public',
        allow_comments: item.allow_comments !== false,
        is_active: item.is_active !== false,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      setVideos(prev => {
        const existingIds = new Set(prev.map(v => v.id));
        const newVideos = transformedVideos.filter(v => !existingIds.has(v.id));
        return [...prev, ...newVideos];
      });
      
      pageRef.current = currentPage;
      setHasMore(feedItems.length === 20);
      
      return transformedVideos;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load more';
      console.error('Error loading more videos:', error);
      toast.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading]);

  // Track video views
  const trackView = useCallback(async (videoId: string, viewsCount: number) => {
    if (!currentUser) return;

    try {
      // Track view interaction
      await supabase
        .from('content_interactions')
        .upsert({
          user_id: currentUser.id,
          content_id: videoId,
          interaction_type: 'view'
        }, {
          onConflict: 'user_id,content_id,interaction_type'
        });

      // Increment view count
      await supabase
        .from('content_posts')
        .update({ views_count: viewsCount + 1 })
        .eq('id', videoId);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }, [currentUser]);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('wolfpack_feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'content_posts'
        },
        (payload) => {
          console.log('New video added:', payload);
          // Reload videos to get the new one with proper joins
          loadVideos();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'content_posts',
          filter: 'is_active=eq.true'
        },
        (payload) => {
          // Update the video in local state
          if ('new' in payload && payload.new) {
            const updatedVideo = payload.new as {
              id: string;
              likes_count?: number;
              comments_count?: number;
              shares_count?: number;
              views_count?: number;
            };
            
            setVideos(prev => prev.map(v => 
              v.id === updatedVideo.id 
                ? { 
                    ...v, 
                    likes_count: updatedVideo.likes_count ?? v.likes_count,
                    comments_count: updatedVideo.comments_count ?? v.comments_count,
                    shares_count: updatedVideo.shares_count ?? v.shares_count,
                    views_count: updatedVideo.views_count ?? v.views_count,
                  }
                : v
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadVideos]);

  // Track view when video changes (in TikTokStyleFeed)
  useEffect(() => {
    const firstVideo = videos[0];
    if (firstVideo && currentUser) {
      // Track view for the first video
      trackView(firstVideo.id, firstVideo.views_count);
    }
  }, [videos, currentUser, trackView]);

  // Show loading state
  if (loading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading feed...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white text-center">
          <p className="text-red-500 mb-4">Failed to load feed</p>
          <button 
            onClick={() => loadVideos()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!loading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white text-center">
          <div className="mb-6">
            <span className="text-6xl">🐺</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">No videos yet</h2>
          <p className="text-gray-400 mb-6">Be the first to share with the pack!</p>
          <button 
            onClick={handleCreatePost}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            Create First Post
          </button>
        </div>
      </div>
    );
  }

  // Pass the correct prop names to TikTokStyleFeed
  // Transform currentUser to match expected type
  const feedUser = currentUser ? {
    id: currentUser.id,
    username: currentUser.username || currentUser.email?.split('@')[0] || 'user'
  } : null;

  return (
    <div className={className}>
      <TikTokStyleFeed
        content_posts={videos}
        currentUser={feedUser}
        onLikeAction={handleLike}
        onCommentAction={handleComment}
        onShareAction={handleShare}
        onFollowAction={handleFollow}
        onDelete={handleDelete}
        onCreatePost={handleCreatePost}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        isLoading={loading}
        userLikes={userLikes}
        initialVideoId={initialVideoId}
      />
    </div>
  );
}