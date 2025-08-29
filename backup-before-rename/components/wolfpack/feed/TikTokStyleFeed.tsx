'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Share2, Music, Play, Volume2, VolumeX, Search, Plus, Home, ShoppingBag, User, Trash2, Loader2, Send } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import VideoComments from '@/components/wolfpack/VideoCommentsOptimized';
import FindFriends from '@/components/wolfpack/FindFriends';
import { WolfpackService } from '@/lib/services/wolfpack';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import styles from './TikTokStyleFeed.module.css';

// Import types from centralized location
import type { FeedVideoItem, WolfpackVideoItem } from '@/types/wolfpack-feed';

// Re-export for components that import from here
export type { WolfpackVideoItem };

interface TikTokStyleFeedProps {
  content_posts: FeedVideoItem[];
  currentUser: { id: string; username: string } | null;
  onLikeAction: (videoId: string) => void;
  onCommentAction: (videoId: string) => void;
  onShareAction: (videoId: string) => void;
  onFollowAction: (userId: string) => void;
  onDelete?: (videoId: string) => void;
  onCreatePost?: () => void;
  onLoadMore?: () => Promise<WolfpackVideoItem[]>;
  hasMore?: boolean;
  isLoading?: boolean;
  userLikes?: Set<string>;
  initialVideoId?: string;
}

export default function TikTokStyleFeed({
  content_posts,
  currentUser,
  onLikeAction,
  onCommentAction,
  onShareAction,
  onFollowAction,
  onDelete,
  onCreatePost,
  onLoadMore,
  hasMore = false,
  userLikes,
  initialVideoId
}: TikTokStyleFeedProps) {
  const router = useRouter();
  const { currentUser: loggedInUser } = useAuth();
  
  const [currentIndex, setCurrentIndex] = React.useState(() => {
    if (initialVideoId) {
      const index = content_posts.findIndex(video => video.id === initialVideoId);
      return index >= 0 ? index : 0;
    }
    return 0;
  });
  
  const [muted, setMuted] = React.useState(false);
  const [userInteracted, setUserInteracted] = React.useState(false);
  const [showComments, setShowComments] = React.useState(false);
  const [followingStatus, setFollowingStatus] = React.useState<Map<string, boolean>>(new Map());
  const [currentCommentVideo, setCurrentCommentVideo] = React.useState<string | null>(null);
  const [activeCategory, setActiveCategory] = React.useState('For You');
  const [showFriendSearch, setShowFriendSearch] = React.useState(false);
  const [videoErrors, setVideoErrors] = React.useState<Set<string>>(new Set());
  const [loadedVideos, setLoadedVideos] = React.useState<WolfpackVideoItem[]>(content_posts);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  
  // Video stats state with correct property names
  const [videoStats, setVideoStats] = React.useState<Map<string, { 
    likes_count: number; 
    comments_count: number; 
    user_liked: boolean 
  }>>(new Map());
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  const videoRefs = React.useRef<(HTMLVideoElement | null)[]>([]);
  const touchStartY = React.useRef(0);
  const isScrolling = React.useRef(false);
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // Enable user interaction on first document interaction
  React.useEffect(() => {
    const enableInteraction = () => {
      setUserInteracted(true);
      document.removeEventListener('click', enableInteraction);
      document.removeEventListener('touchstart', enableInteraction);
      document.removeEventListener('keydown', enableInteraction);
    };

    if (!userInteracted) {
      document.addEventListener('click', enableInteraction);
      document.addEventListener('touchstart', enableInteraction);
      document.addEventListener('keydown', enableInteraction);
    }

    return () => {
      document.removeEventListener('click', enableInteraction);
      document.removeEventListener('touchstart', enableInteraction);
      document.removeEventListener('keydown', enableInteraction);
    };
  }, [userInteracted]);

  // Update loaded videos when prop changes
  React.useEffect(() => {
    setLoadedVideos(content_posts);
  }, [content_posts]);

  // Initialize video stats
  React.useEffect(() => {
    if (!loadedVideos?.length) return;
    
    const initialStats = new Map();
    loadedVideos.forEach(video => {
      initialStats.set(video.id, {
        likes_count: video.likes_count || 0,
        comments_count: video.comments_count || 0,
        user_liked: userLikes?.has(video.id) || false
      });
    });
    setVideoStats(initialStats);
  }, [loadedVideos, userLikes]);

  // Set up Intersection Observer for infinite loading
  React.useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoadingMore) {
        setIsLoadingMore(true);
        onLoadMore()
          .then((newVideos) => {
            setLoadedVideos(prev => [...prev, ...newVideos]);
            setIsLoadingMore(false);
          })
          .catch((error) => {
            console.error('Error loading more videos:', error);
            setIsLoadingMore(false);
          });
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: containerRef.current,
      rootMargin: '100px',
      threshold: 0.1
    });

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onLoadMore, hasMore, isLoadingMore]);

  // Auto-play current video and load adjacent videos lazily
  React.useEffect(() => {
    const currentVideo = videoRefs.current[currentIndex];
    
    // Load video sources for current and adjacent videos
    videoRefs.current.forEach((video, index) => {
      if (video && Math.abs(index - currentIndex) <= 1) {
        const videoData = loadedVideos[index];
        if (videoData?.video_url && !video.src) {
          video.src = videoData.video_url;
          video.load();
        }
      }
    });
    
    // Play current video
    if (currentVideo && userInteracted) {
      currentVideo.play().catch((error) => {
        if (error.name === 'NotAllowedError') {
          console.info('Video autoplay blocked by browser policy - user interaction required');
          return;
        }
        console.warn('Video playback failed:', error);
      });
    }

    // Pause all other videos
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentIndex) {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentIndex, userInteracted, loadedVideos]);

  // Handle scroll with snap behavior
  const handleScroll = React.useCallback(() => {
    if (!containerRef.current || isScrolling.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / containerHeight);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < loadedVideos.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, loadedVideos.length]);

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setUserInteracted(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    setUserInteracted(true);

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < loadedVideos.length - 1) {
        scrollToIndex(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        scrollToIndex(currentIndex - 1);
      }
    }
  };

  const scrollToIndex = (index: number) => {
    if (!containerRef.current) return;
    
    isScrolling.current = true;
    const container = containerRef.current;
    const targetScroll = index * container.clientHeight;
    
    container.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });

    setTimeout(() => {
      isScrolling.current = false;
      setCurrentIndex(index);
    }, 300);
  };

  const handleLike = async (videoId: string) => {
    if (!currentUser) {
      const currentPath = window.location.pathname + window.location.search;
      localStorage.setItem('redirectAfterLogin', currentPath);
      window.location.href = '/login';
      return;
    }

    onLikeAction(videoId);
  };

  const handleVideoClick = () => {
    setUserInteracted(true);
  };

  const toggleMute = () => {
    setMuted(!muted);
    videoRefs.current.forEach(video => {
      if (video) video.muted = !muted;
    });
  };

  const handleCommentClick = (videoId: string) => {
    if (!currentUser) {
      const currentPath = window.location.pathname + window.location.search;
      localStorage.setItem('redirectAfterLogin', currentPath);
      window.location.href = '/login';
      return;
    }
    
    setCurrentCommentVideo(videoId);
    setShowComments(true);
    onCommentAction(videoId);
  };

  const handleFollowClick = async (userId: string) => {
    if (!currentUser) {
      const currentPath = window.location.pathname + window.location.search;
      localStorage.setItem('redirectAfterLogin', currentPath);
      window.location.href = '/login';
      return;
    }

    if (userId === currentUser.id) {
      return;
    }

    const currentlyFollowing = followingStatus.get(userId) || false;
    setFollowingStatus(prev => {
      const newMap = new Map(prev);
      newMap.set(userId, !currentlyFollowing);
      return newMap;
    });

    const result = await WolfpackService.social.toggleFollow(userId);
    
    if (!result.success) {
      setFollowingStatus(prev => {
        const newMap = new Map(prev);
        newMap.set(userId, currentlyFollowing);
        return newMap;
      });
      
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive'
      });
    } else {
      toast({
        title: result.following ? 'Following' : 'Unfollowed',
        description: result.following ? 'You are now following this user' : 'You have unfollowed this user'
      });
    }
    
    onFollowAction(userId);
  };

  const handleCommentCountChange = React.useCallback((count: number) => {
    if (currentCommentVideo) {
      setVideoStats(prev => {
        const newMap = new Map(prev);
        const currentStats = newMap.get(currentCommentVideo) || { 
          likes_count: 0, 
          comments_count: 0, 
          user_liked: false 
        };
        newMap.set(currentCommentVideo, { ...currentStats, comments_count: count });
        return newMap;
      });
    }
  }, [currentCommentVideo]);

  // Show loading state if no videos yet
  if (!loadedVideos || loadedVideos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-900/50">
            <Play className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-white">Wolf Pack Feed</h2>
          <p className="text-gray-300 mb-6 leading-relaxed">
            Loading the latest from the pack...
          </p>
          {onCreatePost && (
            <button 
              type="button"
              onClick={onCreatePost}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105"
            >
              🎬 Create Post
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Top Navigation */}
      <div className={cn("absolute top-0 left-0 right-0 z-50 pt-2 pb-1 bg-gradient-to-b from-black/60 to-transparent", styles.tiktokFeedTopnav)}>
        <div className="flex items-center justify-center px-4 relative">
          <div className="absolute left-4 top-0">
            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              LIVE
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {['For You', 'Following'].map((category) => (
              <button
                type="button"
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "text-lg font-semibold transition-all duration-200 relative",
                  activeCategory === category
                    ? "text-white"
                    : "text-white/70"
                )}
              >
                {category}
                {activeCategory === category && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
                )}
              </button>
            ))}
          </div>
          
          <button 
            type="button"
            onClick={() => setShowFriendSearch(true)}
            className="absolute right-4 top-0"
            title="Search for friends"
          >
            <Search className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={cn("h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide", styles.tiktokFeedScrollContainer)}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {loadedVideos.map((video, index) => (
          <div
            key={video.id}
            className={cn("relative w-full snap-start snap-always flex items-center justify-center", styles.videoContainer, styles.videoContainerFull)}
          >
            {/* Video or Fallback Image */}
            {!videoErrors.has(video.id) && 
             video.video_url && 
             video.video_url.trim() !== '' && 
             !video.video_url.includes('placeholder') && 
             !video.video_url.includes('sample') && 
             !video.video_url.includes('test') ? (
              <video
                ref={el => { videoRefs.current[index] = el; }}
                src={Math.abs(index - currentIndex) <= 1 ? video.video_url : undefined}
                poster={video.thumbnail_url}
                className={cn("absolute inset-0 w-full h-full object-cover", styles.videoElement)}
                loop
                muted={muted}
                playsInline
                preload={Math.abs(index - currentIndex) <= 1 ? "metadata" : "none"}
                crossOrigin="anonymous"
                onClick={handleVideoClick}
                onError={() => {
                  setVideoErrors(prev => new Set(prev).add(video.id));
                }}
                onLoadedData={() => {
                  setVideoErrors(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(video.id);
                    return newSet;
                  });
                }}
              />
            ) : (
              <div className="absolute inset-0 w-full h-full">
                <Image
                  src={video.thumbnail_url || '/images/entertainment-hero.jpg'}
                  alt={video.caption}
                  fill
                  className="object-cover"
                  onClick={handleVideoClick}
                  priority={index === currentIndex}
                  loading={Math.abs(index - currentIndex) <= 1 ? "eager" : "lazy"}
                  quality={75}
                />
                {video.video_url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                      <Play className="w-12 h-12 text-white fill-white" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            
            {!userInteracted && index === currentIndex && video.video_url && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/50 backdrop-blur-sm rounded-full p-8 animate-pulse">
                  <Play className="w-16 h-16 text-white fill-white drop-shadow-lg" />
                </div>
              </div>
            )}

            {/* Content Overlay */}
            <div className="absolute inset-x-0 bottom-0 pb-20 px-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => router.push(`/profile/${video.user_id}`)}
                    className="text-white font-bold text-base drop-shadow-lg hover:text-red-400 transition-colors"
                  >
                    @{video.username}
                  </button>
                  {video.wolfpack_status === 'active' && (
                    <span className="bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                      <span className="text-xs">🐺</span> Pack
                    </span>
                  )}
                </div>
                {video.user_id !== loggedInUser?.id && (
                  <button
                    type="button"
                    onClick={() => handleFollowClick(video.user_id)}
                    className={cn(
                      "text-white text-sm border px-4 py-1 rounded-md font-medium transition-all",
                      followingStatus.get(video.user_id)
                        ? "border-gray-500 bg-gray-800/50"
                        : "border-white hover:bg-white/20"
                    )}
                  >
                    {followingStatus.get(video.user_id) ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>

              <div className="mb-3 max-w-xs">
                <p className="text-white text-sm leading-relaxed drop-shadow-lg">
                  {video.caption}
                  {video.hashtags && video.hashtags.map((tag, index) => (
                    <span key={tag} className="text-white font-bold">
                      {index === 0 ? ' ' : ' '}#{tag}
                    </span>
                  ))}
                </p>
              </div>

              {video.music_name && (
                <div className="flex items-center gap-2 text-white text-sm mb-2 drop-shadow-lg">
                  <Music className="w-4 h-4 drop-shadow-lg" />
                  <span className="font-medium drop-shadow-lg">Original Sound</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="absolute right-3 bottom-20 flex flex-col gap-4">
              <button
                type="button"
                onClick={() => handleLike(video.id)}
                className={cn("flex flex-col items-center group", styles.actionButton)}
                aria-label={userLikes?.has(video.id) ? "Unlike video" : "Like video"}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-active:scale-95">
                  <Heart
                    className={cn(
                      "w-8 h-8 transition-all duration-300",
                      userLikes?.has(video.id) ? "fill-red-500 text-red-500 animate-pulse" : "text-white"
                    )}
                  />
                </div>
                <span className="text-white text-xs mt-1 font-bold">
                  {(() => {
                    const stats = videoStats.get(video.id);
                    const likeCount = stats?.likes_count ?? video.likes_count;
                    return likeCount > 999 
                      ? `${Math.floor(likeCount/1000)}K` 
                      : likeCount;
                  })()}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCommentClick(video.id)}
                className={cn("flex flex-col items-center group", styles.actionButton)}
                aria-label="Comment on video"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-active:scale-95">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <span className="text-white text-xs mt-1 font-bold">
                  {(() => {
                    const stats = videoStats.get(video.id);
                    const commentCount = stats?.comments_count ?? video.comments_count;
                    return commentCount > 999 
                      ? `${Math.floor(commentCount/1000)}K` 
                      : commentCount;
                  })()}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onShareAction(video.id)}
                className={cn("flex flex-col items-center group", styles.actionButton)}
                aria-label="Share video"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-active:scale-95">
                  <Share2 className="w-8 h-8 text-white" />
                </div>
                <span className="text-white text-xs mt-1 font-bold">
                  {video.shares_count > 999 
                    ? `${Math.floor(video.shares_count/1000)}K` 
                    : video.shares_count}
                </span>
              </button>

              {loggedInUser && video.user_id === loggedInUser.id && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(video.id)}
                  className={cn("flex flex-col items-center group", styles.actionButton)}
                  aria-label="Delete video"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-active:scale-95 bg-red-500/20">
                    <Trash2 className="w-6 h-6 text-red-400" />
                  </div>
                  <span className="text-red-400 text-xs mt-1 font-bold">Delete</span>
                </button>
              )}

              <button
                type="button"
                onClick={toggleMute}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 mt-2"
                aria-label={muted ? "Unmute video" : "Mute video"}
              >
                {muted ? (
                  <VolumeX className="w-7 h-7 text-white" />
                ) : (
                  <Volume2 className="w-7 h-7 text-white" />
                )}
              </button>
            </div>
          </div>
        ))}
        
        {onLoadMore && hasMore && (
          <div ref={sentinelRef} className="h-20 flex items-center justify-center">
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-white">
                <Loader2 className={cn("w-6 h-6 animate-spin", styles.loadingSpinner)} />
                <span className="text-sm">Loading more...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className={cn("absolute bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm", styles.tiktokFeedBottomnav, styles.bottomNavWithSafeArea)}>
        <div className="flex justify-around items-center py-3 px-4">
          <button 
            type="button"
            onClick={() => window.location.href = '/'}
            className="flex flex-col items-center space-y-1"
          >
            <Home className="w-6 h-6 text-white" />
            <span className="text-xs text-white font-medium">Home</span>
          </button>
          
          <button type="button" className="flex flex-col items-center space-y-1" aria-label="Shop">
            <ShoppingBag className="w-6 h-6 text-white/70" />
            <span className="text-xs text-white/70">Shop</span>
          </button>
          
          <button 
            type="button"
            className="flex flex-col items-center space-y-1"
            onClick={onCreatePost}
            aria-label="Create new post"
          >
            <div className="w-12 h-8 bg-white rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-black" />
            </div>
          </button>
          
          <button 
            type="button"
            onClick={() => router.push('/messages')}
            className="flex flex-col items-center space-y-1 relative"
          >
            <Send className="w-6 h-6 text-white" />
            <span className="text-xs text-white">DM</span>
          </button>
          
          <button 
            type="button"
            onClick={() => router.push('/profile')}
            className="flex flex-col items-center space-y-1"
          >
            <User className="w-6 h-6 text-white/70" />
            <span className="text-xs text-white/70">Profile</span>
          </button>
        </div>
      </div>

      {/* Comment Overlay */}
      {showComments && currentCommentVideo && (
        <VideoComments
          postId={currentCommentVideo}
          isOpen={showComments}
          onClose={() => {
            setShowComments(false);
            setCurrentCommentVideo(null);
          }}
          initialCommentCount={loadedVideos.find(v => v.id === currentCommentVideo)?.comments_count || 0}
          onCommentCountChange={handleCommentCountChange}
        />
      )}

      {/* Friend Search Overlay */}
      {showFriendSearch && (
        <FindFriends onClose={() => setShowFriendSearch(false)} />
      )}
    </div>
  );
}