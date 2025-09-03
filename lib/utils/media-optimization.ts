/**
 * Media Optimization Utilities
 * Handles image/video optimization for Supabase Storage and CDN integration
 * Aligned with content_posts media fields: video_url, thumbnail_url, images[], media_* fields
 */

import type { Database } from "@/lib/supabase/types";


// Media types from your chat_messages table
export type MediaType = "image" | "video" | "audio" | "file" | "gif";

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Image size configurations
 * Based on your actual usage: thumbnails, avatars, post images
 */
export const IMAGE_SIZES = {
  // For user avatars (users.avatar_url, profile_image_url)
  avatar_small: { width: 40, height: 40, quality: 85 },
  avatar_medium: { width: 96, height: 96, quality: 85 },
  avatar_large: { width: 200, height: 200, quality: 90 },

  // For post thumbnails (content_posts.thumbnail_url)
  thumbnail: { width: 200, height: 356, quality: 80 }, // 9:16 aspect
  thumbnail_square: { width: 200, height: 200, quality: 80 },

  // For feed display
  feed_small: { width: 400, height: 711, quality: 85 }, // 9:16 aspect
  feed_medium: { width: 600, height: 1067, quality: 90 }, // 9:16 aspect
  feed_large: { width: 1080, height: 1920, quality: 95 }, // 9:16 aspect

  // For carousel/gallery (content_posts.images)
  gallery_thumb: { width: 150, height: 150, quality: 80 },
  gallery_full: { width: 1200, height: 1200, quality: 95 },

  // For chat media (chat_messages.media_thumbnail_url)
  chat_preview: { width: 300, height: 300, quality: 85 },
  chat_full: { width: 800, height: 800, quality: 90 },
} as const;

/**
 * Video quality presets
 * Aligned with content_posts video fields and duration_seconds
 */
export const VIDEO_QUALITIES = {
  // For previews and thumbnails
  preview: {
    width: 480,
    height: 854,
    bitrate: "300k",
    fps: 15,
    duration: 10, // Preview duration in seconds
  },

  // Standard qualities for different devices
  low: {
    width: 480,
    height: 854,
    bitrate: "500k",
    fps: 24,
    maxDuration: 60,
  },
  medium: {
    width: 720,
    height: 1280,
    bitrate: "1500k",
    fps: 30,
    maxDuration: 180,
  },
  high: {
    width: 1080,
    height: 1920,
    bitrate: "3000k",
    fps: 30,
    maxDuration: 300,
  },

  // For TikTok-style vertical videos (9:16 aspect ratio)
  vertical_standard: {
    width: 720,
    height: 1280,
    bitrate: "2000k",
    fps: 30,
    maxDuration: 60,
  },
  vertical_hd: {
    width: 1080,
    height: 1920,
    bitrate: "4000k",
    fps: 60,
    maxDuration: 60,
  },
} as const;

/**
 * Aspect ratios from your content_posts table
 */
export const ASPECT_RATIOS = {
  "9:16": { width: 9, height: 16 }, // Default for vertical videos
  "16:9": { width: 16, height: 9 }, // Horizontal videos
  "1:1": { width: 1, height: 1 }, // Square posts
  "4:5": { width: 4, height: 5 }, // Instagram-style
} as const;

// ============================================================================
// SUPABASE STORAGE CONFIGURATION
// ============================================================================

/**
 * Supabase Storage buckets configuration
 * Based on your actual Supabase project
 */
export const STORAGE_BUCKETS = {
  // Public buckets
  avatars: "avatars",
  posts: "posts",
  thumbnails: "thumbnails",
  chat_media: "chat-media",

  // URLs
  getPublicUrl: (bucket: string, path: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  },

  getSignedUrl: (bucket: string, path: string, expiresIn = 3600) => {
    // This would need to be called server-side or with proper auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/sign/${bucket}/${path}?expires_in=${expiresIn}`;
  },
} as const;

// ============================================================================
// DEVICE & NETWORK DETECTION
// ============================================================================

/**
 * Detect device type based on viewport
 */
export function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";

  const width = window.innerWidth;
  const userAgent = navigator.userAgent.toLowerCase();

  // Check user agent for mobile devices
  if (/mobile|android|iphone/.test(userAgent) || width < 768) {
    return "mobile";
  }

  if (/tablet|ipad/.test(userAgent) || width < 1024) {
    return "tablet";
  }

  return "desktop";
}

/**
 * NetworkInformation type for browser compatibility
 */
type NetworkInformation = {
  effectiveType?: string;
  downlink?: number;
  saveData?: boolean;
};

/**
 * Detect network quality using Network Information API
 */
export function getNetworkQuality(): "slow" | "medium" | "fast" | "unknown" {
  if (typeof navigator === "undefined") return "unknown";

  // Try Network Information API
  const connection: NetworkInformation | undefined =
    (navigator as Navigator & { connection?: NetworkInformation }).connection ||
    (navigator as Navigator & { mozConnection?: NetworkInformation })
      .mozConnection ||
    (navigator as Navigator & { webkitConnection?: NetworkInformation })
      .webkitConnection;

  if (!connection) return "unknown";

  // Check effective type
  if (connection.effectiveType) {
    switch (connection.effectiveType) {
      case "slow-2g":
      case "2g":
        return "slow";
      case "3g":
        return "medium";
      case "4g":
      case "5g":
        return "fast";
      default:
        return "medium";
    }
  }

  // Fallback to downlink speed
  if (connection.downlink) {
    if (connection.downlink < 1) return "slow";
    if (connection.downlink < 5) return "medium";
    return "fast";
  }

  return "unknown";
}

/**
 * Check if user has data saver enabled
 */
export function isDataSaverEnabled(): boolean {
  if (typeof navigator === "undefined") return false;

  const connection: NetworkInformation | undefined =
    (navigator as Navigator & { connection?: NetworkInformation }).connection;
  return connection?.saveData === true;
}

// ============================================================================
// URL OPTIMIZATION
// ============================================================================

/**
 * Optimize image URL with Supabase transformations
 */
export function optimizeImageUrl(
  originalUrl: string | null | undefined,
  size: keyof typeof IMAGE_SIZES = "feed_medium",
  options?: {
    format?: "webp" | "avif" | "jpg" | "png" | "auto";
    quality?: number;
    resize?: "cover" | "contain" | "fill";
  },
): string {
  if (!originalUrl) return "";

  // Check if it's a Supabase Storage URL
  if (originalUrl.includes("supabase.co/storage")) {
    const { width, height, quality: defaultQuality } = IMAGE_SIZES[size];
    const params = new URLSearchParams();

    // Size parameters
    params.set("width", width.toString());
    params.set("height", height.toString());
    params.set("resize", options?.resize || "cover");
    params.set("quality", (options?.quality || defaultQuality).toString());

    // Format parameter
    if (options?.format && options.format !== "auto") {
      params.set("format", options.format);
    }

    // Check if URL already has parameters
    const separator = originalUrl.includes("?") ? "&" : "?";
    return `${originalUrl}${separator}${params.toString()}`;
  }

  // For external URLs, return as-is
  return originalUrl;
}

/**
 * Optimize video URL with quality parameters
 */
export function optimizeVideoUrl(
  originalUrl: string | null | undefined,
  quality: keyof typeof VIDEO_QUALITIES = "medium",
): string {
  if (!originalUrl) return "";

  // For Supabase videos
  if (originalUrl.includes("supabase.co/storage")) {
    const qualitySettings = VIDEO_QUALITIES[quality];
    const params = new URLSearchParams({
      w: qualitySettings.width.toString(),
      h: qualitySettings.height.toString(),
      br: qualitySettings.bitrate,
      fps: qualitySettings.fps.toString(),
    });

    const separator = originalUrl.includes("?") ? "&" : "?";
    return `${originalUrl}${separator}${params.toString()}`;
  }

  return originalUrl;
}

/**
 * Generate video thumbnail URL
 */
export function getVideoThumbnailUrl(
  videoUrl: string | null | undefined,
  options?: {
    time?: number; // Time offset in seconds
    size?: keyof typeof IMAGE_SIZES;
  },
): string {
  if (!videoUrl) return "";

  const time = options?.time || 1;
  const size = options?.size || "thumbnail";

  // For Supabase videos, generate frame capture
  if (videoUrl.includes("supabase.co/storage")) {
    const { width, height, quality } = IMAGE_SIZES[size];
    const params = new URLSearchParams({
      t: time.toString(),
      w: width.toString(),
      h: height.toString(),
      q: quality.toString(),
      f: "jpg",
    });

    // Replace video extension with _thumb.jpg
    const thumbUrl = videoUrl.replace(/\.[^.]+$/, "_thumb.jpg");
    return `${thumbUrl}?${params.toString()}`;
  }

  return videoUrl;
}

// ============================================================================
// ADAPTIVE LOADING
// ============================================================================

/**
 * Get adaptive image size based on device and network
 */
export function getAdaptiveImageSize(): keyof typeof IMAGE_SIZES {
  const device = getDeviceType();
  const network = getNetworkQuality();
  const dataSaver = isDataSaverEnabled();

  // Data saver mode - always use smallest sizes
  if (dataSaver) {
    return device === "mobile" ? "thumbnail" : "feed_small";
  }

  // Network-based selection
  switch (network) {
    case "slow":
      return device === "mobile" ? "thumbnail" : "feed_small";
    case "medium":
      return device === "mobile" ? "feed_small" : "feed_medium";
    case "fast":
      return device === "mobile" ? "feed_medium" : "feed_large";
    default:
      return "feed_medium";
  }
}

/**
 * Get adaptive video quality based on device and network
 */
export function getAdaptiveVideoQuality(): keyof typeof VIDEO_QUALITIES {
  const device = getDeviceType();
  const network = getNetworkQuality();
  const dataSaver = isDataSaverEnabled();

  // Data saver mode - use preview only
  if (dataSaver) {
    return "preview";
  }

  // Network-based selection
  switch (network) {
    case "slow":
      return "low";
    case "medium":
      return device === "mobile" ? "low" : "medium";
    case "fast":
      return device === "mobile" ? "vertical_standard" : "vertical_hd";
    default:
      return "medium";
  }
}

// ============================================================================
// FORMAT DETECTION
// ============================================================================

/**
 * Detect best supported image format
 */
export function getBestImageFormat(): "avif" | "webp" | "jpg" {
  if (typeof window === "undefined") return "jpg";

  // Check for AVIF support using canvas
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  let avifSupported = false;
  try {
    avifSupported = canvas.toDataURL("image/avif").indexOf("image/avif") === 5;
  } catch (e) {
    avifSupported = false;
  }
  if (avifSupported) {
    return "avif";
  }

  // Check for WebP support
  let webpSupported = false;
  try {
    webpSupported = canvas.toDataURL("image/webp").indexOf("image/webp") === 5;
  } catch (e) {
    webpSupported = false;
  }
  if (webpSupported) {
    return "webp";
  }

  return "jpg";
}

/**
 * Check if browser supports lazy loading
 */
export function supportsLazyLoading(): boolean {
  if (typeof HTMLImageElement === "undefined") return false;
  return "loading" in HTMLImageElement.prototype;
}

// ============================================================================
// PRELOADING UTILITIES
// ============================================================================

/**
 * Preload image with timeout
 */
export function preloadImage(
  url: string,
  timeout = 10000,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error("No URL provided"));
      return;
    }

    const img = new Image();
    const timer = setTimeout(() => {
      reject(new Error(`Image load timeout: ${url}`));
    }, timeout);

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error(`Failed to load image: ${url}`));
    };

    img.src = url;
  });
}

/**
 * Preload video metadata
 */
export function preloadVideo(
  url: string,
  timeout = 15000,
): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error("No URL provided"));
      return;
    }

    const video = document.createElement("video");
    const timer = setTimeout(() => {
      reject(new Error(`Video load timeout: ${url}`));
    }, timeout);

    video.preload = "metadata";
    video.muted = true; // Required for autoplay policies

    video.onloadedmetadata = () => {
      clearTimeout(timer);
      resolve(video);
    };

    video.onerror = () => {
      clearTimeout(timer);
      reject(new Error(`Failed to load video: ${url}`));
    };

    video.src = url;
  });
}

// ============================================================================
// RESPONSIVE UTILITIES
// ============================================================================

/**
 * Create responsive srcSet for images
 */
export function createResponsiveSrcSet(
  baseUrl: string,
  sizes: (keyof typeof IMAGE_SIZES)[] = [
    "feed_small",
    "feed_medium",
    "feed_large",
  ],
): string {
  if (!baseUrl) return "";

  return sizes
    .map((size) => {
      const { width } = IMAGE_SIZES[size];
      const url = optimizeImageUrl(baseUrl, size);
      return `${url} ${width}w`;
    })
    .join(", ");
}

/**
 * Get responsive sizes attribute
 */
export function getResponsiveSizes(): string {
  return [
    "(max-width: 640px) 100vw",
    "(max-width: 768px) 80vw",
    "(max-width: 1024px) 60vw",
    "40vw",
  ].join(", ");
}

// ============================================================================
// MEDIA VALIDATION
// ============================================================================

/**
 * Validate media file size
 */
export function validateFileSize(
  file: File,
  maxSizeMB: number = 100,
): { valid: boolean; error?: string } {
  const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { valid: true };
}

/**
 * Validate media file type
 */
export function validateFileType(
  file: File,
  allowedTypes: MediaType[],
): { valid: boolean; error?: string } {
  const typeMap: Record<MediaType, string[]> = {
    image: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
    video: ["video/mp4", "video/webm", "video/quicktime"],
    audio: ["audio/mpeg", "audio/wav", "audio/ogg"],
    gif: ["image/gif"],
    file: ["application/pdf", "application/zip", "text/plain"],
  };

  const allowedMimeTypes = allowedTypes.flatMap((type) => typeMap[type]);

  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed`,
    };
  }

  return { valid: true };
}

// ============================================================================
// CACHE HEADERS
// ============================================================================

/**
 * Get optimal cache headers for media
 */
export function getMediaCacheHeaders(
  mediaType: "image" | "video" | "avatar" = "image",
): Record<string, string> {
  const cacheSettings = {
    avatar: 604800, // 7 days for avatars
    image: 2592000, // 30 days for images
    video: 86400, // 1 day for videos
  };

  const maxAge = cacheSettings[mediaType] || cacheSettings.image;

  return {
    "Cache-Control":
      `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=86400`,
    "CDN-Cache-Control": `public, max-age=${maxAge}`,
    "Vary": "Accept-Encoding, Accept",
  };
}

// ============================================================================
// INTERSECTION OBSERVER OPTIONS
// ============================================================================

/**
 * Lazy loading options for images
 */
export const IMAGE_LAZY_LOADING_OPTIONS: IntersectionObserverInit = {
  root: null,
  rootMargin: "100px", // Start loading 100px before viewport
  threshold: 0.01,
};

/**
 * Lazy loading options for videos
 */
export const VIDEO_LAZY_LOADING_OPTIONS: IntersectionObserverInit = {
  root: null,
  rootMargin: "50px", // Start loading 50px before viewport
  threshold: 0.25, // Require 25% visibility
};

/**
 * Options for infinite scroll
 */
export const INFINITE_SCROLL_OPTIONS: IntersectionObserverInit = {
  root: null,
  rootMargin: "200px", // Trigger 200px before end
  threshold: 0.1,
};

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

const mediaOptimizationUtils = {
  // Configuration
  IMAGE_SIZES,
  VIDEO_QUALITIES,
  ASPECT_RATIOS,
  STORAGE_BUCKETS,

  // Detection
  getDeviceType,
  getNetworkQuality,
  isDataSaverEnabled,
  getBestImageFormat,
  supportsLazyLoading,

  // Optimization
  optimizeImageUrl,
  optimizeVideoUrl,
  getVideoThumbnailUrl,
  getAdaptiveImageSize,
  getAdaptiveVideoQuality,

  // Preloading
  preloadImage,
  preloadVideo,

  // Responsive
  createResponsiveSrcSet,
  getResponsiveSizes,

  // Validation
  validateFileSize,
  validateFileType,

  // Cache
  getMediaCacheHeaders,

  // Observer options
  IMAGE_LAZY_LOADING_OPTIONS,
  VIDEO_LAZY_LOADING_OPTIONS,
  INFINITE_SCROLL_OPTIONS,
};

export default mediaOptimizationUtils;
