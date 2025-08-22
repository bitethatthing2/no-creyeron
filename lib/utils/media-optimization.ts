/**
 * Media Optimization Utilities for Wolfpack Feed
 * Handles image/video optimization, CDN integration, and format conversion
 */

// Configuration for different image sizes and formats
export const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, quality: 80 },
  small: { width: 300, height: 300, quality: 85 },
  medium: { width: 600, height: 600, quality: 90 },
  large: { width: 1200, height: 1200, quality: 95 },
  avatar: { width: 96, height: 96, quality: 85 },
  cover: { width: 1200, height: 400, quality: 90 },
} as const;

export const VIDEO_QUALITIES = {
  low: { width: 480, height: 854, bitrate: '500k' },
  medium: { width: 720, height: 1280, bitrate: '1500k' },
  high: { width: 1080, height: 1920, bitrate: '3000k' },
} as const;

// Device detection for optimal format selection
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// Network quality detection
export const getNetworkQuality = (): 'slow' | 'medium' | 'fast' => {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return 'medium';
  }

  const connection = (navigator as any).connection;
  if (!connection) return 'medium';

  // Based on effective connection type
  switch (connection.effectiveType) {
    case 'slow-2g':
    case '2g':
      return 'slow';
    case '3g':
      return 'medium';
    case '4g':
    default:
      return 'fast';
  }
};

// Image optimization URL builder
export const optimizeImageUrl = (
  originalUrl: string,
  size: keyof typeof IMAGE_SIZES = 'medium',
  format: 'webp' | 'avif' | 'jpg' | 'auto' = 'auto'
): string => {
  if (!originalUrl) return '';

  // If it's already a Supabase storage URL, add transformation parameters
  if (originalUrl.includes('supabase.co/storage')) {
    const { width, height, quality } = IMAGE_SIZES[size];
    const params = new URLSearchParams({
      width: width.toString(),
      height: height.toString(),
      quality: quality.toString(),
      resize: 'cover',
    });

    // Add format parameter if not auto
    if (format !== 'auto') {
      params.set('format', format);
    }

    return `${originalUrl}?${params.toString()}`;
  }

  // For external URLs, return as-is (Next.js Image component will handle optimization)
  return originalUrl;
};

// Video optimization URL builder
export const optimizeVideoUrl = (
  originalUrl: string,
  quality: keyof typeof VIDEO_QUALITIES = 'medium'
): string => {
  if (!originalUrl) return '';

  // For Supabase videos, we can add quality parameters
  if (originalUrl.includes('supabase.co/storage')) {
    const { width, height, bitrate } = VIDEO_QUALITIES[quality];
    const params = new URLSearchParams({
      width: width.toString(),
      height: height.toString(),
      bitrate,
    });

    return `${originalUrl}?${params.toString()}`;
  }

  return originalUrl;
};

// Smart format selection based on browser support
export const getBestImageFormat = (): 'avif' | 'webp' | 'jpg' => {
  if (typeof window === 'undefined') return 'webp';

  // Check for AVIF support
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  try {
    const avifSupport = canvas.toDataURL('image/avif').startsWith('data:image/avif');
    if (avifSupport) return 'avif';
  } catch {
    // AVIF not supported
  }

  // Check for WebP support
  try {
    const webpSupport = canvas.toDataURL('image/webp').startsWith('data:image/webp');
    if (webpSupport) return 'webp';
  } catch {
    // WebP not supported
  }

  return 'jpg';
};

// Adaptive image size based on device and network
export const getAdaptiveImageSize = (): keyof typeof IMAGE_SIZES => {
  const device = getDeviceType();
  const network = getNetworkQuality();

  if (network === 'slow') {
    return device === 'mobile' ? 'thumbnail' : 'small';
  }

  if (network === 'medium') {
    return device === 'mobile' ? 'small' : 'medium';
  }

  // Fast network
  return device === 'mobile' ? 'medium' : 'large';
};

// Adaptive video quality based on device and network
export const getAdaptiveVideoQuality = (): keyof typeof VIDEO_QUALITIES => {
  const device = getDeviceType();
  const network = getNetworkQuality();

  if (network === 'slow') {
    return 'low';
  }

  if (network === 'medium') {
    return device === 'mobile' ? 'low' : 'medium';
  }

  // Fast network
  return device === 'mobile' ? 'medium' : 'high';
};

// Preload images for better performance
export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!url) {
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
    img.src = url;
  });
};

// Preload video metadata
export const preloadVideo = (url: string): Promise<HTMLVideoElement> => {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('No video URL provided'));
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => resolve(video);
    video.onerror = () => reject(new Error(`Failed to preload video: ${url}`));
    video.src = url;
  });
};

// Create responsive image srcSet
export const createResponsiveSrcSet = (baseUrl: string): string => {
  if (!baseUrl) return '';

  const sizes = [
    { size: 'small', width: 300 },
    { size: 'medium', width: 600 },
    { size: 'large', width: 1200 },
  ] as const;

  return sizes
    .map(({ size, width }) => {
      const optimizedUrl = optimizeImageUrl(baseUrl, size);
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
};

// Get optimal thumbnail for video
export const getVideoThumbnail = (videoUrl: string, timeOffset: number = 1): string => {
  if (!videoUrl) return '';

  // For Supabase videos, we can generate thumbnails
  if (videoUrl.includes('supabase.co/storage')) {
    const params = new URLSearchParams({
      width: IMAGE_SIZES.thumbnail.width.toString(),
      height: IMAGE_SIZES.thumbnail.height.toString(),
      quality: IMAGE_SIZES.thumbnail.quality.toString(),
      time: timeOffset.toString(),
      format: 'jpg',
    });

    return `${videoUrl.replace(/\.[^.]+$/, '')}_thumbnail.jpg?${params.toString()}`;
  }

  return videoUrl;
};

// Utility to check if URL is optimizable
export const isOptimizableUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Check if it's a Supabase URL or other CDN we can optimize
  return url.includes('supabase.co/storage') || 
         url.includes('images.unsplash.com') ||
         url.includes('cdn.pixabay.com');
};

// Get media cache headers for better caching
export const getMediaCacheHeaders = (mediaType: 'image' | 'video' = 'image') => {
  const maxAge = mediaType === 'video' ? 86400 : 2592000; // 1 day for videos, 30 days for images
  
  return {
    'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=86400`,
    'CDN-Cache-Control': `public, max-age=${maxAge}`,
  };
};

// Image lazy loading intersection observer options
export const LAZY_LOADING_OPTIONS: IntersectionObserverInit = {
  root: null,
  rootMargin: '100px', // Start loading 100px before entering viewport
  threshold: 0.1,
};

// Video lazy loading options (more conservative)
export const VIDEO_LAZY_LOADING_OPTIONS: IntersectionObserverInit = {
  root: null,
  rootMargin: '50px', // Start loading 50px before entering viewport
  threshold: 0.25, // Require 25% visibility
};