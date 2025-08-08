'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Share2, Music, Play, Volume2, VolumeX, Search, Plus, UserPlus, Users, Home, ShoppingBag, Mail, User, MoreHorizontal, Trash2, Loader2, Send } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import VideoComments from '@/components/wolfpack/VideoCommentsOptimized';
import FindFriends from '@/components/wolfpack/FindFriends';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

// Import media optimization utilities
import {
  optimizeImageUrl,
  optimizeVideoUrl,
  getAdaptiveImageSize,
  getAdaptiveVideoQuality,
  createResponsiveSrcSet,
  preloadImage,
  preloadVideo,
  getBestImageFormat,
  LAZY_LOADING_OPTIONS,
  VIDEO_LAZY_LOADING_OPTIONS,
  isOptimizableUrl
} from '@/lib/utils/media-optimization';

interface VideoItem {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  caption: string;
  video_url: string | null;
  thumbnail_url?: string;
  likes_count: number;
  wolfpack_comments_count: number;
  shares_count: number;
  music_name?: string;
  hashtags?: string[];
  created_at: string;
  user_liked?: boolean; // For React Query optimistic updates
}

interface OptimizedTikTokStyleFeedProps {
  videos: VideoItem[];
  currentUser: any;
  onLike: (videoId: string) => void;
  onComment: (videoId: string) => void;
  onShare: (videoId: string) => void;
  onDelete?: (videoId: string) => void;
  onVideoView?: (videoId: string) => void;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isLoadingMore?: boolean;
  likingVideo?: string | null; // For loading states
}

// Individual video component with optimizations
function OptimizedVideoItem({
  video,
  isActive,
  onLike,
  onComment,
  onShare,
  onDelete,
  onVideoView,
  currentUser,
  likingVideo
}: {
  video: VideoItem;
  isActive: boolean;
  onLike: (videoId: string) => void;
  onComment: (videoId: string) => void;
  onShare: (videoId: string) => void;
  onDelete?: (videoId: string) => void;
  onVideoView?: (videoId: string) => void;
  currentUser: any;
  likingVideo?: string | null;
}) {
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize optimized URLs
  const optimizedAvatarUrl = useMemo(() => {
    if (!video.avatar_url) return undefined;
    return optimizeImageUrl(video.avatar_url, 'avatar', getBestImageFormat());
  }, [video.avatar_url]);

  const optimizedThumbnailUrl = useMemo(() => {
    if (!video.thumbnail_url) return undefined;
    return optimizeImageUrl(video.thumbnail_url, getAdaptiveImageSize(), getBestImageFormat());
  }, [video.thumbnail_url]);

  const optimizedVideoUrl = useMemo(() => {
    if (!video.video_url) return undefined;
    return optimizeVideoUrl(video.video_url, getAdaptiveVideoQuality());
  }, [video.video_url]);

  // Responsive srcSet for thumbnails
  const thumbnailSrcSet = useMemo(() => {
    if (!video.thumbnail_url) return undefined;
    return createResponsiveSrcSet(video.thumbnail_url);
  }, [video.thumbnail_url]);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Preload video when approaching viewport
            if (video.video_url && !isVideoLoaded) {
              preloadVideo(optimizedVideoUrl || video.video_url)
                .then(() => setIsVideoLoaded(true))
                .catch(console.warn);
            }
            
            // Track video view
            if (onVideoView && entry.intersectionRatio > 0.5) {
              onVideoView(video.id);
            }
          }
        });
      },
      VIDEO_LAZY_LOADING_OPTIONS
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [video.id, video.video_url, optimizedVideoUrl, isVideoLoaded, onVideoView]);

  // Video playback control
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isActive && isVideoLoaded) {
      videoElement.play().catch(console.warn);
      setIsPlaying(true);
    } else {
      videoElement.pause();
      setIsPlaying(false);
    }
  }, [isActive, isVideoLoaded]);

  // Format numbers (1000 -> 1K)
  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // Handle video click to toggle play/pause
  const handleVideoClick = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
      setIsPlaying(false);
    } else {
      videoElement.play().catch(console.warn);
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Handle like with loading state
  const handleLike = useCallback(() => {
    if (likingVideo === video.id) return; // Prevent double clicks
    onLike(video.id);
  }, [video.id, onLike, likingVideo]);

  const isCurrentUserVideo = currentUser?.id === video.user_id;
  const isLiked = video.user_liked || false;
  const isLiking = likingVideo === video.id;

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black snap-start">
      {/* Video or Image Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {video.video_url ? (
          <>
            {/* Video element */}
            <video
              ref={videoRef}
              src={optimizedVideoUrl || video.video_url}
              className="w-full h-full object-cover"
              loop
              muted={muted}
              playsInline
              preload="metadata"
              onClick={handleVideoClick}
              onLoadedMetadata={() => setIsVideoLoaded(true)}
              poster={optimizedThumbnailUrl}
            />
            
            {/* Play/Pause overlay */}
            {!isPlaying && isVideoLoaded && (
              <div 
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                onClick={handleVideoClick}
              >
                <Play className="w-16 h-16 text-white opacity-80" />
              </div>
            )}
          </>
        ) : (
          /* Image fallback */
          <div className="w-full h-full relative">
            {optimizedThumbnailUrl && !imageError ? (
              <Image
                src={optimizedThumbnailUrl}
                alt={video.caption || 'Wolfpack post'}
                fill
                className="object-cover"
                srcSet={thumbnailSrcSet}
                sizes="100vw"
                priority={isActive}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <span className="text-white text-lg">Content unavailable</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Info and Caption */}
      <div className="absolute bottom-4 left-4 right-20 z-10">
        <div className="flex items-center mb-3">
          {/* Avatar with optimization */}
          {optimizedAvatarUrl ? (
            <Image
              src={optimizedAvatarUrl}
              alt={video.username}
              width={40}
              height={40}
              className="rounded-full border-2 border-white mr-3"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center mr-3">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
          <span className="text-white font-semibold text-lg">{video.username}</span>
        </div>
        
        {/* Caption */}
        {video.caption && (
          <p className="text-white text-sm leading-relaxed mb-2 max-w-xs">
            {video.caption}
          </p>
        )}
        
        {/* Hashtags */}
        {video.hashtags && video.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {video.hashtags.slice(0, 3).map((hashtag, index) => (
              <span key={index} className="text-blue-400 text-sm">
                #{hashtag}
              </span>
            ))}
          </div>
        )}
        
        {/* Music info */}
        <div className="flex items-center">
          <Music className="w-4 h-4 text-white mr-2" />
          <span className="text-white text-sm">{video.music_name || 'Original Sound'}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col items-center space-y-4">
        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={cn(
            "flex flex-col items-center transition-all duration-200",
            isLiked ? "text-red-500" : "text-white",
            isLiking && "opacity-50"
          )}
        >
          {isLiking ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <Heart className={cn("w-8 h-8", isLiked && "fill-current")} />
          )}
          <span className="text-xs mt-1">{formatCount(video.likes_count)}</span>
        </button>

        {/* Comment Button */}
        <button
          onClick={() => onComment(video.id)}
          className="flex flex-col items-center text-white transition-colors hover:text-gray-300"
        >
          <MessageCircle className="w-8 h-8" />
          <span className="text-xs mt-1">{formatCount(video.wolfpack_comments_count)}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={() => onShare(video.id)}
          className="flex flex-col items-center text-white transition-colors hover:text-gray-300"
        >
          <Share2 className="w-8 h-8" />
          <span className="text-xs mt-1">{formatCount(video.shares_count)}</span>
        </button>

        {/* Delete Button (only for own videos) */}
        {isCurrentUserVideo && onDelete && (
          <button
            onClick={() => onDelete(video.id)}
            className="flex flex-col items-center text-red-400 transition-colors hover:text-red-300"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Video Controls */}
      {video.video_url && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setMuted(!muted)}
            className="text-white bg-black bg-opacity-50 rounded-full p-2 transition-colors hover:bg-opacity-70"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      )}
    </div>
  );
}

export default function OptimizedTikTokStyleFeed({
  videos,
  currentUser,
  onLike,
  onComment,
  onShare,
  onDelete,
  onVideoView,
  onLoadMore,
  hasNextPage,
  isLoadingMore,
  likingVideo
}: OptimizedTikTokStyleFeedProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Handle scroll with intersection observer for better performance
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const index = parseInt((entry.target as HTMLElement).dataset.index || '0');
            setCurrentVideoIndex(index);
            
            // Load more when approaching end
            if (hasNextPage && !isLoadingMore && index >= videos.length - 3) {
              onLoadMore?.();
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const videoElements = container.querySelectorAll('[data-index]');
    videoElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [videos.length, hasNextPage, isLoadingMore, onLoadMore]);

  // Preload adjacent videos for smoother scrolling
  useEffect(() => {
    const preloadAdjacent = async () => {
      const preloadPromises = [];
      
      // Preload next video
      if (currentVideoIndex + 1 < videos.length) {
        const nextVideo = videos[currentVideoIndex + 1];
        if (nextVideo.video_url) {
          preloadPromises.push(preloadVideo(nextVideo.video_url).catch(() => {}));
        }
        if (nextVideo.thumbnail_url) {
          preloadPromises.push(preloadImage(nextVideo.thumbnail_url).catch(() => {}));
        }
      }
      
      // Preload previous video
      if (currentVideoIndex - 1 >= 0) {
        const prevVideo = videos[currentVideoIndex - 1];
        if (prevVideo.video_url) {
          preloadPromises.push(preloadVideo(prevVideo.video_url).catch(() => {}));
        }
        if (prevVideo.thumbnail_url) {
          preloadPromises.push(preloadImage(prevVideo.thumbnail_url).catch(() => {}));
        }
      }
      
      await Promise.allSettled(preloadPromises);
    };

    preloadAdjacent();
  }, [currentVideoIndex, videos]);

  if (videos.length === 0) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl mb-4">No videos available</p>
          <p className="text-gray-400">Check back later for more content!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      style={{ scrollBehavior: 'smooth' }}
    >
      {videos.map((video, index) => (
        <div key={video.id} data-index={index}>
          <OptimizedVideoItem
            video={video}
            isActive={index === currentVideoIndex}
            onLike={onLike}
            onComment={onComment}
            onShare={onShare}
            onDelete={onDelete}
            onVideoView={onVideoView}
            currentUser={currentUser}
            likingVideo={likingVideo}
          />
        </div>
      ))}

      {/* Loading indicator */}
      {isLoadingMore && (
        <div className="h-screen bg-black flex items-center justify-center">
          <div className="text-center text-white">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading more videos...</p>
          </div>
        </div>
      )}
    </div>
  );
}