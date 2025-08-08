/**
 * Optimized Video Card Component
 * High-performance video card with lazy loading, intersection observer,
 * and optimized rendering for virtual scrolling
 */

'use client';

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Share, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { OptimizedVideoItem } from '@/lib/hooks/useOptimizedFeed';

interface VideoCardProps {
  video: OptimizedVideoItem;
  onLike: (videoId: string, isLiked: boolean) => void;
  onComment: (videoId: string) => void;
  onShare?: (videoId: string) => void;
  lazy?: boolean;
  priority?: boolean;
  className?: string;
}

// Memoized component to prevent unnecessary re-renders
export const VideoCard = memo(function VideoCard({
  video,
  onLike,
  onComment,
  onShare,
  lazy = true,
  priority = false,
  className = ''
}: VideoCardProps) {
  
  const [isVisible, setIsVisible] = useState(!lazy || priority);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px 0px' // Start loading 50px before entering viewport
      }
    );

    if (cardRef.current) {
      observerRef.current.observe(cardRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, priority]);

  // Video play/pause handling
  const handleVideoToggle = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        await videoRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Video play error:', error);
    }
  }, [isPlaying]);

  // Mute/unmute handling
  const handleMuteToggle = useCallback(() => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Like handling with optimistic updates
  const handleLike = useCallback(async () => {
    const newLikedState = !video.is_liked;
    onLike(video.id, newLikedState);
  }, [video.id, video.is_liked, onLike]);

  // Comment handling
  const handleComment = useCallback(() => {
    onComment(video.id);
  }, [video.id, onComment]);

  // Share handling
  const handleShare = useCallback(() => {
    if (onShare) {
      onShare(video.id);
    } else {
      // Default share behavior
      if (navigator.share) {
        navigator.share({
          title: video.title || 'Check out this Wolf Pack video!',
          text: video.caption,
          url: window.location.href
        });
      } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
    }
  }, [video.id, video.title, video.caption, onShare]);

  // Format numbers (1234 -> 1.2K)
  const formatCount = (count: number): string => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  return (
    <div
      ref={cardRef}
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video/Thumbnail Container */}
      <div className="relative aspect-[9/16] bg-gray-900">
        {isVisible ? (
          <>
            {/* Video */}
            {video.video_url && (
              <video
                ref={videoRef}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  videoLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                src={video.video_url}
                poster={video.thumbnail_url}
                muted={isMuted}
                loop
                playsInline
                preload={priority ? 'auto' : 'none'}
                onLoadedData={() => setVideoLoaded(true)}
                onEnded={() => setIsPlaying(false)}
              />
            )}

            {/* Thumbnail fallback */}
            {video.thumbnail_url && (
              <Image
                src={video.thumbnail_url}
                alt={video.title || 'Video thumbnail'}
                fill
                className={`object-cover transition-opacity duration-300 ${
                  videoLoaded && video.video_url ? 'opacity-0' : 'opacity-100'
                } ${imageLoaded ? '' : 'bg-gray-800'}`}
                onLoad={() => setImageLoaded(true)}
                priority={priority}
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            )}

            {/* Loading skeleton */}
            {!imageLoaded && !videoLoaded && (
              <div className="absolute inset-0 bg-gray-800 animate-pulse" />
            )}

            {/* Play/Pause Button */}
            <button
              onClick={handleVideoToggle}
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </div>
            </button>

            {/* Mute/Unmute Button */}
            {video.video_url && (
              <button
                onClick={handleMuteToggle}
                className={`absolute top-4 right-4 bg-black/50 rounded-full p-2 backdrop-blur-sm transition-opacity duration-200 ${
                  showControls ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-white" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white" />
                )}
              </button>
            )}

            {/* Video Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
              {/* User Info */}
              <div className="flex items-center mb-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-700 mr-3">
                  {video.avatar_url ? (
                    <Image
                      src={video.avatar_url}
                      alt={video.username}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-lg">
                      {video.user?.wolf_emoji || '🐺'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{video.username}</p>
                  <p className="text-gray-300 text-sm">{formatTimeAgo(video.created_at)}</p>
                </div>
              </div>

              {/* Caption */}
              {video.caption && (
                <p className="text-white text-sm mb-3 line-clamp-2">{video.caption}</p>
              )}
            </div>
          </>
        ) : (
          // Placeholder while not visible
          <div className="w-full h-full bg-gray-800 animate-pulse flex items-center justify-center">
            <div className="text-gray-600">🐺</div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between p-4 bg-black/90">
        <div className="flex items-center space-x-6">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className="flex items-center space-x-2 text-gray-300 hover:text-red-400 transition-colors"
          >
            <Heart
              className={`w-6 h-6 ${
                video.is_liked ? 'fill-red-500 text-red-500' : ''
              }`}
            />
            <span className="text-sm font-medium">
              {formatCount(video.likes_count)}
            </span>
          </button>

          {/* Comment Button */}
          <button
            onClick={handleComment}
            className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-sm font-medium">
              {formatCount(video.wolfpack_comments_count)}
            </span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center space-x-2 text-gray-300 hover:text-green-400 transition-colors"
          >
            <Share className="w-6 h-6" />
          </button>
        </div>

        {/* View Count */}
        <div className="text-gray-400 text-sm">
          {formatCount(video.view_count)} views
        </div>
      </div>
    </div>
  );
});