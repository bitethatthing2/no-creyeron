import { useIntersectionObserver } from 'usehooks-ts';
import { RefObject, useMemo, useEffect } from 'react';

interface UseVideoInViewOptions {
  threshold?: number;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
  autoPlay?: boolean;
  autoPause?: boolean;
}

export function useVideoInView(
  videoRef: RefObject<HTMLVideoElement>,
  options: UseVideoInViewOptions = {}
) {
  const {
    threshold = 0.5,
    rootMargin = '0px',
    freezeOnceVisible = false,
    autoPlay = true,
    autoPause = true
  } = options;

  const entry = useIntersectionObserver(videoRef, {
    threshold,
    rootMargin,
    freezeOnceVisible
  });

  const isInView = !!entry?.isIntersecting;

  // Auto play/pause video based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInView && autoPlay) {
      video.play().catch(console.error);
    } else if (!isInView && autoPause) {
      video.pause();
    }
  }, [isInView, autoPlay, autoPause, videoRef]);

  return {
    isInView,
    entry,
    // Utility values for video components
    shouldLoad: isInView,
    shouldPlay: isInView && autoPlay,
    visibility: isInView ? 'visible' : 'hidden' as const
  };
}