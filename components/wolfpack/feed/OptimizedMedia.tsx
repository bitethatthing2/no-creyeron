'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { mediaOptimizer } from '@/lib/services/media-optimization.service';

interface OptimizedMediaProps {
  url: string;
  type: 'image' | 'video';
  alt?: string;
  className?: string;
  priority?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  width?: number;
  height?: number;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
}

export default function OptimizedMedia({
  url,
  type,
  alt = '',
  className = '',
  priority = false,
  autoPlay = false,
  muted = true,
  loop = false,
  controls = false,
  width = 800,
  height = 600,
  quality = 95,
  onLoad,
  onError,
  onClick
}: OptimizedMediaProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [optimizedMedia, setOptimizedMedia] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [isIntersecting, setIsIntersecting] = useState(false);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const element = document.querySelector(`[data-media-id="${url}"]`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [url]);

  useEffect(() => {
    const optimizeMedia = async () => {
      // Only optimize when in viewport or priority is set
      if (!isIntersecting && !priority) return;
      
      try {
        setIsLoading(true);
        
        if (type === 'image') {
          const optimized = mediaOptimizer.optimizeImage(url, {
            width,
            height,
            quality,
            format: 'auto',
            devicePixelRatio: window.devicePixelRatio || 1,
            progressive: true
          });
          setOptimizedMedia(optimized);
        } else {
          const optimized = mediaOptimizer.optimizeVideo(url, {
            quality: currentQuality,
            format: 'auto',
            thumbnail: true,
            adaptive: true,
            fps: 30
          });
          setOptimizedMedia(optimized);
        }
      } catch (error) {
        console.error('Error optimizing media:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    optimizeMedia();
  }, [url, type, width, height, quality, isIntersecting, priority, currentQuality]);

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleVideoError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-800 text-gray-400 ${className}`}>
        <div className="text-center">
          <p className="text-sm">Failed to load media</p>
          <p className="text-xs mt-1">Click to retry</p>
        </div>
      </div>
    );
  }

  if (isLoading || !optimizedMedia) {
    return (
      <div className={`flex items-center justify-center bg-gray-800 ${className}`}>
        <div className="animate-pulse">
          <div className="bg-gray-700 rounded-lg w-full h-full"></div>
        </div>
      </div>
    );
  }

  if (type === 'image') {
    return (
      <div className={`relative overflow-hidden ${className}`} onClick={onClick} data-media-id={url}>
        {optimizedMedia?.sources && optimizedMedia.sources.length > 1 ? (
          <picture>
            {optimizedMedia.sources.map((source: any, index: number) => (
              <source
                key={index}
                srcSet={source.url}
                type={`image/${source.format}`}
                media={index === 0 ? '(min-width: 768px)' : undefined}
              />
            ))}
            <Image
              src={optimizedMedia.url}
              alt={alt}
              fill
              className="object-cover"
              priority={priority}
              quality={quality}
              placeholder="blur"
              blurDataURL={optimizedMedia.placeholder}
              onLoad={handleImageLoad}
              onError={handleImageError}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </picture>
        ) : (
          <Image
            src={optimizedMedia?.url || url}
            alt={alt}
            fill
            className="object-cover"
            priority={priority}
            quality={quality}
            placeholder="blur"
            blurDataURL={optimizedMedia?.placeholder}
            onLoad={handleImageLoad}
            onError={handleImageError}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
        
        {/* Image overlay for interaction */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div className={`relative overflow-hidden ${className}`} onClick={onClick} data-media-id={url}>
        {optimizedMedia?.sources && optimizedMedia.sources.length > 1 ? (
          <video
            className="object-cover w-full h-full"
            autoPlay={autoPlay}
            muted={isMuted}
            loop={loop}
            controls={controls}
            playsInline
            preload="metadata"
            poster={optimizedMedia.thumbnail}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
          >
            {optimizedMedia.sources.map((source: any, index: number) => (
              <source
                key={index}
                src={source.url}
                type={`video/${source.format}`}
                data-quality={source.quality}
                data-bitrate={source.bitrate}
              />
            ))}
          </video>
        ) : (
          <video
            src={optimizedMedia?.url || url}
            className="object-cover w-full h-full"
            autoPlay={autoPlay}
            muted={isMuted}
            loop={loop}
            controls={controls}
            playsInline
            preload="metadata"
            poster={optimizedMedia?.thumbnail}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
          />
        )}

        {/* Quality selector overlay */}
        {optimizedMedia?.qualities && optimizedMedia.qualities.length > 1 && (
          <div className="absolute top-4 right-4 z-10">
            <select
              value={currentQuality}
              onChange={(e) => setCurrentQuality(e.target.value)}
              className="bg-black/70 text-white text-sm rounded px-2 py-1 border-none outline-none"
            >
              {optimizedMedia.qualities.map((quality: any) => (
                <option key={quality.value} value={quality.value}>
                  {quality.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Video controls overlay */}
        {!controls && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const video = e.currentTarget.parentElement?.parentElement?.parentElement?.querySelector('video');
                    if (video) {
                      if (isPlaying) {
                        video.pause();
                      } else {
                        video.play();
                      }
                    }
                  }}
                  className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const video = e.currentTarget.parentElement?.parentElement?.parentElement?.querySelector('video');
                    if (video) {
                      video.muted = !isMuted;
                      setIsMuted(!isMuted);
                    }
                  }}
                  className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    );
  }

  return null;
}