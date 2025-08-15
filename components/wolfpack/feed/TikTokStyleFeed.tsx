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
import { WolfpackVideoItem } from '@/types/wolfpack-feed';

interface TikTokStyleFeedProps {
  wolfpack_videos: WolfpackVideoItem[];
  currentUser: any;
  onLike: (videoId: string) => void;
  onComment: (videoId: string) => void;
  onShare: (videoId: string) => void;
  onFollow: (userId: string) => void;
  onDelete?: (videoId: string) => void;
  onCreatePost?: () => void;
  onLoadMore?: () => Promise<WolfpackVideoItem[]>;
  hasMore?: boolean;
  isLoading?: boolean;
  userLikes?: Set<string>;
  initialVideoId?: string;
}

export default function TikTokStyleFeed({
  wolfpack_videos,
  currentUser,
  onLike,
  onComment,
  onShare,
  onFollow,
  onDelete,
  onCreatePost,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  userLikes,
  initialVideoId
}: TikTokStyleFeedProps) {
  const router = useRouter();
  const { currentUser: loggedInUser, user: authUser, isAuthenticated } = useAuth()
  const [currentIndex, setCurrentIndex] = React.useState(() => {
    if (initialVideoId) {
      const index = wolfpack_videos.findIndex(video => video.id === initialVideoId);
      return index >= 0 ? index : 0;
    }
    return 0;
  });
  const [muted, setMuted] = React.useState(false);
  const [userInteracted, setUserInteracted] = React.useState(false);

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
  const [liked, setLiked] = React.useState<Set<string>>(new Set());
  const [showwolfpack_comments, setShowwolfpack_comments] = React.useState(false);
  const [wolfpack_videostats, setwolfpack_videostats] = React.useState<Map<string, { likes_count: number; wolfpack_comments_count: number; user_liked: boolean }>>(new Map());
  const [followingStatus, setFollowingStatus] = React.useState<Map<string, boolean>>(new Map());
  const [currentCommentVideo, setCurrentCommentVideo] = React.useState<string | null>(null);
  const [activeCategory, setActiveCategory] = React.useState('For You');
  const [showFriendSearch, setShowFriendSearch] = React.useState(false);
  const [videoErrors, setVideoErrors] = React.useState<Set<string>>(new Set());
  const [loadedwolfpack_videos, setLoadedwolfpack_videos] = React.useState<FeedContentItem[]>(wolfpack_videos);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const videoRefs = React.useRef<(HTMLVideoElement | null)[]>([]);
  const touchStartY = React.useRef(0);
  const isScrolling = React.useRef(false);
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // Update loaded wolfpack_videos when prop changes
  React.useEffect(() => {
    setLoadedwolfpack_videos(wolfpack_videos);
  }, [wolfpack_videos]);

  // Use video data directly for fast rendering - skip additional stats loading
  React.useEffect(() => {
    if (!loadedwolfpack_videos?.length) return;
    
    // Initialize stats directly from video data for immediate rendering
    const initialStats = new Map();
    loadedwolfpack_videos.forEach(video => {
      initialStats.set(video.id, {
        likes_count: video.likes_count || 0,
        wolfpack_comments_count: video.wolfpack_comments_count || 0,
        user_liked: userLikes?.has(video.id) || false
      });
    });
    setwolfpack_videostats(initialStats);
  }, [loadedwolfpack_videos, userLikes]);

  // Real-time subscriptions disabled for faster loading
  // TODO: Re-enable after optimizing performance

  // Set up Intersection Observer for infinite loading
  React.useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoadingMore) {
        setIsLoadingMore(true);
        onLoadMore()
          .then((newwolfpack_videos) => {
            setLoadedwolfpack_videos(prev => [...prev, ...newwolfpack_videos]);
            setIsLoadingMore(false);
          })
          .catch((error) => {
            console.error('Error loading more wolfpack_videos:', error);
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
        const videoData = loadedwolfpack_videos[index];
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
  }, [currentIndex, userInteracted, loadedwolfpack_videos]);

  // Handle scroll with snap behavior
  const handleScroll = React.useCallback(() => {
    if (!containerRef.current || isScrolling.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / containerHeight);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < loadedwolfpack_videos.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, loadedwolfpack_videos.length]);

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setUserInteracted(true); // Enable user interaction on touch
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    setUserInteracted(true); // Enable user interaction on touch

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < loadedwolfpack_videos.length - 1) {
        // Swipe up
        scrollToIndex(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe down
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
      // Store current path for redirect after login
      const currentPath = window.location.pathname + window.location.search;
      localStorage.setItem('redirectAfterLogin', currentPath);
      
      // Redirect to login page
      window.location.href = '/login';
      return;
    }

    // Call the parent's onLike handler - it handles all the logic
    onLike(videoId);
  };

  const handleVideoClick = () => {
    setUserInteracted(true); // Enable user interaction and start autoplay
  };

  const toggleMute = () => {
    setMuted(!muted);
    videoRefs.current.forEach(video => {
      if (video) video.muted = !muted;
    });
  };

  const handleCommentClick = (videoId: string) => {
    if (!currentUser) {
      // Store current path for redirect after login
      const currentPath = window.location.pathname + window.location.search;
      localStorage.setItem('redirectAfterLogin', currentPath);
      
      // Redirect to login page
      window.location.href = '/login';
      return;
    }
    
    // Call the parent's onComment handler - it handles navigation
    onComment(videoId);
  };

  const handleFollowClick = async (userId: string) => {
    if (!currentUser) {
      // Store current path for redirect after login
      const currentPath = window.location.pathname + window.location.search;
      localStorage.setItem('redirectAfterLogin', currentPath);
      
      // Redirect to login page
      window.location.href = '/login';
      return;
    }

    if (userId === currentUser.id) {
      return; // Can't follow yourself
    }

    // Optimistic update
    const currentlyFollowing = followingStatus.get(userId) || false;
    setFollowingStatus(prev => {
      const newMap = new Map(prev);
      newMap.set(userId, !currentlyFollowing);
      return newMap;
    });

    // Update server
    const result = await WolfpackService.social.toggleFollow(userId);
    
    if (!result.success) {
      // Revert on error
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
    
    onFollow(userId);
  };

  // Memoize the comment count change callback to prevent infinite re-renders
  const handleCommentCountChange = React.useCallback((count: number) => {
    if (currentCommentVideo) {
      setwolfpack_videostats(prev => {
        const newMap = new Map(prev);
        const currentStats = newMap.get(currentCommentVideo) || { likes_count: 0, wolfpack_comments_count: 0, user_liked: false };
        newMap.set(currentCommentVideo, { ...currentStats, wolfpack_comments_count: count });
        return newMap;
      });
    }
  }, [currentCommentVideo]);

  // Show loading state if no wolfpack_videos yet
  if (!loadedwolfpack_videos || loadedwolfpack_videos.length === 0) {
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
      {/* Authentic TikTok Top Navigation */}
      <div className="absolute top-0 left-0 right-0 z-50 pt-2 pb-1 bg-gradient-to-b from-black/60 to-transparent" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
        {/* Top Navigation Tabs */}
        <div className="flex items-center justify-center px-4 relative">
          {/* Live Badge */}
          <div className="absolute left-4 top-0">
            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              LIVE
            </div>
          </div>
          
          {/* Center Categories */}
          <div className="flex items-center space-x-6">
            {['For You', 'Following'].map((category) => (
              <button
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
          
          {/* Search Icon */}
          <button 
            onClick={() => setShowFriendSearch(true)}
            className="absolute right-4 top-0"
          >
            <Search className="w-6 h-6 text-white" />
          </button>
        </div>
        
        {/* Additional Categories Row */}
        <div className="flex justify-center items-center mt-2 px-4">
          <div className="flex space-x-6 overflow-x-auto scrollbar-hide">
            {['Festivals', 'Trending', 'Music'].map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "text-sm font-medium whitespace-nowrap transition-all duration-200",
                  activeCategory === category
                    ? "text-white"
                    : "text-white/70 hover:text-white"
                )}
              >
                {category}
                {category === 'Festivals' && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ 
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {loadedwolfpack_videos.map((video, index) => (
          <div
            key={video.id}
            className="relative h-screen w-full snap-start snap-always flex items-center justify-center"
            style={{
              height: '100vh',
              minHeight: '100vh',
              maxHeight: '100vh',
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always'
            }}
          >
            {/* Video or Fallback Image */}
            {!videoErrors.has(video.id) && 
             video.video_url && 
             video.video_url.trim() !== '' && 
             !video.video_url.includes('placeholder') && 
             !video.video_url.includes('sample') && 
             !video.video_url.includes('test') ? (
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={Math.abs(index - currentIndex) <= 1 ? video.video_url : undefined}
                poster={video.thumbnail_url}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                muted={muted}
                playsInline
                preload={Math.abs(index - currentIndex) <= 1 ? "metadata" : "none"}
                crossOrigin="anonymous"
                style={{ objectFit: 'cover' }}
                onClick={handleVideoClick}
                onError={(e) => {
                  // Only log errors for non-placeholder URLs
                  if (video.video_url && !video.video_url.includes('placeholder') && !video.video_url.includes('sample')) {
                    console.warn('Video load error for:', video.video_url);
                  }
                  setVideoErrors(prev => new Set(prev).add(video.id));
                }}
                onLoadedData={(e) => {
                  // Remove successful wolfpack_videos from error set
                  setVideoErrors(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(video.id);
                    return newSet;
                  });
                }}
                onCanPlay={(e) => {
                  // Ensure quality matches viewport
                  const video = e.target as HTMLVideoElement;
                  if (video.videoWidth > window.innerWidth * 2) {
                    console.info('High resolution video detected, consider using adaptive streaming');
                  }
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
                {/* Only show play icon if this is actually a video (has video_url) */}
                {video.video_url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                      <Play className="w-12 h-12 text-white fill-white" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            
            {/* Initial tap to start message - only for wolfpack_videos */}
            {!userInteracted && index === currentIndex && video.video_url && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/50 backdrop-blur-sm rounded-full p-8 animate-pulse">
                  <Play className="w-16 h-16 text-white fill-white drop-shadow-lg" />
                </div>
              </div>
            )}

            {/* TikTok-style Content Overlay */}
            <div className="absolute inset-x-0 bottom-0 pb-20 px-4">
              {/* User Info - simplified TikTok style */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <button 
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

              {/* Caption with hashtags inline */}
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

              {/* Music info - TikTok style */}
              {video.music_name && (
                <div className="flex items-center gap-2 text-white text-sm mb-2 drop-shadow-lg">
                  <Music className="w-4 h-4 drop-shadow-lg" />
                  <span className="font-medium drop-shadow-lg">Original Sound</span>
                </div>
              )}
            </div>

            {/* TikTok-style Action Buttons */}
            <div className="absolute right-3 bottom-20 flex flex-col gap-4">
              {/* Like */}
              <button
                onClick={() => handleLike(video.id)}
                className="flex flex-col items-center group"
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-active:scale-95",
                  liked.has(video.id) ? "bg-transparent" : "bg-transparent"
                )}>
                  <Heart
                    className={cn(
                      "w-8 h-8 transition-all duration-300",
                      userLikes?.has(video.id) ? "fill-red-500 text-red-500 animate-pulse" : "text-white"
                    )}
                  />
                </div>
                <span className="text-white text-xs mt-1 font-bold">
                  {(() => {
                    const stats = wolfpack_videostats.get(video.id);
                    const likeCount = stats?.likes_count ?? video.likes_count;
                    return likeCount > 999 
                      ? `${Math.floor(likeCount/1000)}K` 
                      : likeCount;
                  })()}
                </span>
              </button>

              {/* Comment */}
              <button
                onClick={() => handleCommentClick(video.id)}
                className="flex flex-col items-center group"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-active:scale-95">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <span className="text-white text-xs mt-1 font-bold">
                  {(() => {
                    const stats = wolfpack_videostats.get(video.id);
                    const commentCount = stats?.wolfpack_comments_count ?? video.wolfpack_comments_count;
                    return commentCount > 999 
                      ? `${Math.floor(commentCount/1000)}K` 
                      : commentCount;
                  })()}
                </span>
              </button>

              {/* Share */}
              <button
                onClick={() => onShare(video.id)}
                className="flex flex-col items-center group"
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

              {/* Message Button - only for other users' videos */}
              {loggedInUser && video.user_id !== loggedInUser.id && (
                <button
                  onClick={() => router.push(`/messages/${video.user_id}`)}
                  className="flex flex-col items-center group"
                  title="Send a message"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-active:scale-95 bg-white/10">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white text-xs mt-1 font-bold">Message</span>
                </button>
              )}

              {/* Delete Button - only for current user's wolfpack_posts */}
              {loggedInUser && video.user_id === loggedInUser.id && onDelete && (
                <button
                  onClick={() => onDelete(video.id)}
                  className="flex flex-col items-center group"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-active:scale-95 bg-red-500/20">
                    <Trash2 className="w-6 h-6 text-red-400" />
                  </div>
                  <span className="text-red-400 text-xs mt-1 font-bold">Delete</span>
                </button>
              )}

              {/* Profile Picture */}
              <div className="mt-2">
                <button
                  onClick={() => handleFollowClick(video.user_id)}
                  className="relative"
                >
                  <div className="relative w-12 h-12 rounded-full border-2 border-white overflow-hidden">
                    <Image
                      src={video.avatar_url || '/icons/wolf-icon.png'}
                      alt={video.username}
                      fill
                      sizes="48px"
                      className="object-cover"
                      quality={95}
                    />
                  </div>
                  {video.user_id !== loggedInUser?.id && !followingStatus.get(video.user_id) && (
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                      <Plus className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              </div>

              {/* Mute Toggle */}
              <button
                onClick={toggleMute}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 mt-2"
              >
                {muted ? (
                  <VolumeX className="w-7 h-7 text-white" />
                ) : (
                  <Volume2 className="w-7 h-7 text-white" />
                )}
              </button>
            </div>

            {/* Minimal Progress Indicators - TikTok style */}
            <div className="absolute right-4 flex flex-col gap-1" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 80px)' }}>
              {loadedwolfpack_videos.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-0.5 h-3 bg-white/30 rounded-full transition-all duration-300",
                    idx === currentIndex && "bg-white h-4"
                  )}
                />
              ))}
            </div>
          </div>
        ))}
        
        {/* Sentinel element for infinite scroll */}
        {onLoadMore && hasMore && (
          <div ref={sentinelRef} className="h-20 flex items-center justify-center">
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-white">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm">Loading more...</span>
              </div>
            )}
          </div>
        )}
      </div>


      {/* TikTok Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex justify-around items-center py-3 px-4">
          <button 
            onClick={() => window.location.href = '/'}
            className="flex flex-col items-center space-y-1"
          >
            <Home className="w-6 h-6 text-white" />
            <span className="text-xs text-white font-medium">Home</span>
          </button>
          
          <button className="flex flex-col items-center space-y-1">
            <ShoppingBag className="w-6 h-6 text-white/70" />
            <span className="text-xs text-white/70">Shop</span>
          </button>
          
          <button 
            className="flex flex-col items-center space-y-1"
            onClick={onCreatePost}
          >
            <div className="w-12 h-8 bg-white rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-black" />
            </div>
          </button>
          
          <button 
            onClick={() => router.push('/messages')}
            className="flex flex-col items-center space-y-1 relative"
          >
            <Send className="w-6 h-6 text-white" />
            <span className="text-xs text-white">DM</span>
          </button>
          
          <button 
            onClick={() => router.push('/profile')}
            className="flex flex-col items-center space-y-1"
          >
            <User className="w-6 h-6 text-white/70" />
            <span className="text-xs text-white/70">Profile</span>
          </button>
        </div>
      </div>

      {/* TikTok-style Comment Overlay */}
      {showwolfpack_comments && currentCommentVideo && (
        <VideoComments
          postId={currentCommentVideo}
          isOpen={showwolfpack_comments}
          onClose={() => {
            setShowwolfpack_comments(false);
            setCurrentCommentVideo(null);
          }}
          initialCommentCount={loadedwolfpack_videos.find(v => v.id === currentCommentVideo)?.wolfpack_comments_count || 0}
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