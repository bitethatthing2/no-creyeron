'use client';

import * as React from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface VideoPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
  showControls?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src, poster, showControls = true, onPlay, onPause, onEnded, className = '', ...props }, ref) => {
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [hasInteracted, setHasInteracted] = React.useState(false);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [isMuted, setIsMuted] = React.useState(true);
    const [showPlayButton, setShowPlayButton] = React.useState(true);

    // Merge refs
    const mergedRef = (element: HTMLVideoElement | null) => {
      // Update internal ref
      (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = element;
      
      // Update forwarded ref
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLVideoElement | null>).current = element;
      }
    };

    React.useEffect(() => {
      const handleInteraction = () => {
        setHasInteracted(true);
        // Try to play video after user interaction
        if (videoRef.current && showPlayButton) {
          // Ensure normal playback speed
          videoRef.current.playbackRate = 1.0;
          videoRef.current.play().catch(err => {
            console.log('Video play failed:', err);
          });
        }
      };

      // Listen for any user interaction
      document.addEventListener('click', handleInteraction, { once: true });
      document.addEventListener('touchstart', handleInteraction, { once: true });
      document.addEventListener('keydown', handleInteraction, { once: true });

      return () => {
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('touchstart', handleInteraction);
        document.removeEventListener('keydown', handleInteraction);
      };
    }, [showPlayButton]);

    const handleVideoClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!videoRef.current) return;

      try {
        if (videoRef.current.paused) {
          // Ensure normal playback speed before playing
          videoRef.current.playbackRate = 1.0;
          await videoRef.current.play();
          setIsPlaying(true);
          setShowPlayButton(false);
          onPlay?.();
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
          setShowPlayButton(true);
          onPause?.();
        }
      } catch (error) {
        console.error('Video play/pause failed:', error);
      }
    };

    const handleMuteToggle = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!videoRef.current) return;
      
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    };

    const handleVideoPlay = () => {
      setIsPlaying(true);
      setShowPlayButton(false);
      onPlay?.();
    };

    const handleVideoPause = () => {
      setIsPlaying(false);
      setShowPlayButton(true);
      onPause?.();
    };

    const handleVideoEnded = () => {
      setIsPlaying(false);
      setShowPlayButton(true);
      onEnded?.();
    };

    return (
      <div className={`relative group ${className}`}>
        <video
          ref={mergedRef}
          src={src}
          poster={poster}
          onClick={handleVideoClick}
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
          onEnded={handleVideoEnded}
          muted={isMuted} // content_posts with sound require user interaction
          playsInline
          preload="metadata"
          className="w-full h-full object-cover cursor-pointer"
          {...props}
        />
        
        {showControls && (
          <>
            {/* Play/Pause Overlay */}
            {showPlayButton && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer transition-opacity duration-200"
                onClick={handleVideoClick}
              >
                <div className="bg-white/90 rounded-full p-3 md:p-4 shadow-lg hover:bg-white transition-colors">
                  <Play className="w-6 h-6 md:w-8 md:h-8 text-black ml-1" fill="currentColor" />
                </div>
              </div>
            )}

            {/* Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 md:p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleVideoClick}
                  className="text-white hover:text-gray-300 transition-colors"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
                  ) : (
                    <Play className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
                  )}
                </button>

                <button
                  onClick={handleMuteToggle}
                  className="text-white hover:text-gray-300 transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 md:w-6 md:h-6" />
                  ) : (
                    <Volume2 className="w-5 h-5 md:w-6 md:h-6" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Loading indicator */}
        {!hasInteracted && (
          <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded">
            Tap to play
          </div>
        )}
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

/**
 * Simple video player without controls for inline use
 */
export const SimpleVideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src, className = '', ...props }, ref) => {
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [hasInteracted, setHasInteracted] = React.useState(false);

    // Merge refs
    const mergedRef = (element: HTMLVideoElement | null) => {
      // Update internal ref
      (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = element;
      
      // Update forwarded ref
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLVideoElement | null>).current = element;
      }
    };

    React.useEffect(() => {
      const handleInteraction = () => {
        setHasInteracted(true);
        // Try to play video after user interaction
        if (videoRef.current) {
          // Ensure normal playback speed
          videoRef.current.playbackRate = 1.0;
          videoRef.current.play().catch(err => {
            console.log('Video play failed:', err);
          });
        }
      };

      // Listen for any user interaction
      document.addEventListener('click', handleInteraction, { once: true });
      document.addEventListener('touchstart', handleInteraction, { once: true });

      return () => {
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('touchstart', handleInteraction);
      };
    }, []);

    const handleVideoClick = () => {
      if (videoRef.current) {
        if (videoRef.current.paused) {
          // Ensure normal playback speed before playing
          videoRef.current.playbackRate = 1.0;
          videoRef.current.play().catch(err => {
            console.log('Video play failed:', err);
          });
        } else {
          videoRef.current.pause();
        }
      }
    };

    return (
      <video
        ref={mergedRef}
        src={src}
        onClick={handleVideoClick}
        muted // content_posts with sound require user interaction
        playsInline
        preload="metadata"
        className={`cursor-pointer ${className}`}
        {...props}
      />
    );
  }
);

SimpleVideoPlayer.displayName = 'SimpleVideoPlayer';