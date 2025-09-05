"use client";

import * as React from 'react';
import Image from 'next/image';

interface VideoBackgroundProps {
  content_postsrc?: string;
  instagramReelUrl?: string;
  posterSrc?: string;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
  content_postsrc,
  instagramReelUrl,
  posterSrc,
  className = '',
  overlay = true,
  overlayOpacity = 0.4
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  // Detect mobile device
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  React.useEffect(() => {
    if (content_postsrc && videoRef.current) {
      const video = videoRef.current;
      
      // Ensure normal playback speed
      video.playbackRate = 1.0;
      
      // Add event listeners for loading states
      video.addEventListener('loadstart', () => setIsLoading(true));
      video.addEventListener('canplay', () => setIsLoading(false));
      video.addEventListener('error', () => {
        setHasError(true);
        setIsLoading(false);
      });
      
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Only log if it's not a common autoplay restriction
          if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
            console.log('Video autoplay failed:', error.name, error.message);
          }
          // On mobile, videos might not autoplay
          setIsLoading(false);
        });
      }
    }
  }, [content_postsrc]);

  React.useEffect(() => {
    if (instagramReelUrl && containerRef.current && (window as any).instgrm) {
      (window as any).instgrm.Embeds.process();
    }
  }, [instagramReelUrl]);

  if (instagramReelUrl) {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`} ref={containerRef}>
          <div className="absolute inset-0 scale-150 translate-y-[-10%]">
            <blockquote 
              className="instagram-media" 
              data-instgrm-captioned 
              data-instgrm-permalink={instagramReelUrl}
              data-instgrm-version="14" 
              style={{ 
                background: '#000',
                border: '0',
                borderRadius: '0',
                boxShadow: 'none',
                margin: '0',
                width: '100%',
                height: '100vh',
                minWidth: '100%',
                maxWidth: '100%'
              }}
            />
          </div>
          {overlay && (
            <div 
              className="absolute inset-0 bg-black pointer-events-none" 
              style={{ opacity: overlayOpacity }}
            />
          )}
        </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Loading state with skeleton */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-zinc-900 animate-pulse flex items-center justify-center">
          <div className="text-white/50 text-sm">Loading video...</div>
        </div>
      )}
      
      {/* Error fallback */}
      {hasError && posterSrc && (
        <Image 
          src={posterSrc} 
          alt="Video poster"
          fill
          className="object-cover"
        />
      )}
      
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={content_postsrc}
        poster={posterSrc}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        webkit-playsinline="true"
        x5-playsinline="true"
        style={{
          // Mobile optimizations and responsive video scaling
          position: 'absolute',
          top: '50%',
          left: '50%',
          minWidth: '100%',
          minHeight: '100%',
          width: 'auto',
          height: 'auto',
          transform: 'translateX(-50%) translateY(-50%)',
          objectFit: 'cover',
          WebkitTransform: 'translateX(-50%) translateY(-50%)',
        }}
      />
      {overlay && (
        <div 
          className="absolute inset-0 bg-black pointer-events-none" 
          style={{ opacity: overlayOpacity }}
        />
      )}
    </div>
  );
};