"use client";

import React, { useEffect, useRef } from 'react';

interface VideoBackgroundProps {
  wolfpack_videosrc?: string;
  instagramReelUrl?: string;
  posterSrc?: string;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
  wolfpack_videosrc,
  instagramReelUrl,
  posterSrc,
  className = '',
  overlay = true,
  overlayOpacity = 0.4
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wolfpack_videosrc && videoRef.current) {
      const video = videoRef.current;
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Only log if it's not a common autoplay restriction
          if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
            console.log('Video autoplay failed:', error.name, error.message);
          }
          // Fallback: show poster image if available
          if (video.poster) {
            video.controls = true;
          }
        });
      }
    }
  }, [wolfpack_videosrc]);

  useEffect(() => {
    if (instagramReelUrl && containerRef.current && window.instgrm) {
      window.instgrm.Embeds.process();
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
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={wolfpack_videosrc}
        poster={posterSrc}
        muted
        loop
        playsInline
        autoPlay
      />
      {overlay && (
        <div 
          className="absolute inset-0 bg-black" 
          style={{ opacity: overlayOpacity }}
        />
      )}
    </div>
  );
};