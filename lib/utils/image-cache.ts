/**
 * Image cache utilities for handling browser caching issues
 * Includes Supabase storage URL handling
 */

// Supabase storage base URL
const SUPABASE_STORAGE_URL = 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public';

// Get stored version or use current timestamp
const getStoredVersion = (): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("imageVersion") || Date.now().toString();
  }
  return Date.now().toString();
};

// Version timestamp that can be updated when images change
// To force refresh all images, update this value
const IMAGE_VERSION = getStoredVersion();

/**
 * Force refresh all cached images by updating the version
 */
export function forceClearImageCache(): void {
  if (typeof window !== "undefined" && window.location) {
    const newVersion = Date.now().toString();
    localStorage.setItem("imageVersion", newVersion);
    // Reload the page to apply new cache version
    window.location.reload();
  }
}

/**
 * Check if URL is from Supabase storage
 * @param url - The URL to check
 * @returns Whether the URL is from Supabase storage
 */
function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase.co/storage/v1/object/public');
}

/**
 * Add cache-busting parameter to image URLs
 * @param src - The image source path
 * @param forceRefresh - Whether to use current timestamp (default: false uses build-time version)
 * @returns Image URL with cache-busting parameter
 */
export function getCacheBustedImageUrl(
  src: string,
  forceRefresh: boolean = false,
): string {
  if (!src) return src;

  // Don't add cache busting to data URLs or blob URLs
  if (src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }

  // For Supabase storage URLs, add version parameter
  if (isSupabaseStorageUrl(src)) {
    const version = forceRefresh ? Date.now().toString() : IMAGE_VERSION;
    const separator = src.includes("?") ? "&" : "?";
    return `${src}${separator}v=${version}`;
  }

  // For external URLs (non-Supabase), return as-is
  if (src.startsWith("http") || src.startsWith("https")) {
    return src;
  }

  // For local paths, add version parameter
  const version = forceRefresh ? Date.now().toString() : IMAGE_VERSION;
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}v=${version}`;
}

/**
 * Get cache-busted URL with current timestamp (always fresh)
 * @param src - The image source path
 * @returns Image URL with current timestamp
 */
export function getFreshImageUrl(src: string): string {
  return getCacheBustedImageUrl(src, true);
}

/**
 * Array of Supabase storage paths that should always be cache-busted
 * These are relative to the storage bucket
 */
const ALWAYS_CACHE_BUST_PATHS = [
  // Front-end images
  'front-end-images/sidehustle.png',
  'front-end-images/ufc-section.jpeg',
  'front-end-images/variety.png',
  'front-end-images/salem-location.jpg',
  'front-end-images/portland-side-hustle.jpg',
  'front-end-images/doordash_icon.png',
  'front-end-images/uber-eats.png',
  'front-end-images/postmates.png',
  
  // Icons
  'icons/special-font-sidehustle-title.png',
  'icons/favicon.png',
  'icons/wolf-512x512.png',
  'icons/wolf-paw-192x192.png',
  'icons/android-lil-icon-white.png',
  'icons/notification-small-24x24.png',
  
  // Menu images (all food and drink images)
  'menu-images/food/',
  'menu-images/drinks/',
  
  // Videos that might have thumbnails
  'front-end-videos/',
  'menu-videos/',
];

/**
 * Full Supabase storage URLs that should always be cache-busted
 */
const ALWAYS_CACHE_BUST_URLS = ALWAYS_CACHE_BUST_PATHS.map(
  path => `${SUPABASE_STORAGE_URL}/${path}`
);

/**
 * Smart cache busting - only applies to images that need it
 * @param src - The image source path or full URL
 * @returns Image URL with cache-busting if needed
 */
export function getSmartCacheBustedUrl(src: string): string {
  if (!src) return src;

  // Check if this is a Supabase storage URL that should always be cache-busted
  const shouldCacheBust = ALWAYS_CACHE_BUST_URLS.some((url) => 
    src.includes(url) || 
    ALWAYS_CACHE_BUST_PATHS.some(path => src.includes(path))
  );

  if (shouldCacheBust) {
    return getCacheBustedImageUrl(src, true);
  }

  // For other Supabase storage URLs, use standard cache busting
  if (isSupabaseStorageUrl(src)) {
    return getCacheBustedImageUrl(src, false);
  }

  return src;
}

/**
 * Clear browser cache for images (more aggressive approach)
 */
export async function clearBrowserImageCache(): Promise<void> {
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName)),
      );
      console.log("Browser caches cleared");
    } catch (error) {
      console.error("Failed to clear caches:", error);
    }
  }

  // Also clear the version and reload
  forceClearImageCache();
}

/**
 * Utility to get full Supabase storage URL from bucket and path
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @returns Full Supabase storage URL
 */
export function getSupabaseStorageUrl(bucket: string, path: string): string {
  return `${SUPABASE_STORAGE_URL}/${bucket}/${path}`;
}

/**
 * Get cache-busted Supabase storage URL
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @param forceRefresh - Whether to force refresh with current timestamp
 * @returns Cache-busted Supabase storage URL
 */
export function getCacheBustedSupabaseUrl(
  bucket: string, 
  path: string, 
  forceRefresh: boolean = false
): string {
  const url = getSupabaseStorageUrl(bucket, path);
  return getCacheBustedImageUrl(url, forceRefresh);
}

/**
 * Preload images to ensure they're cached
 * @param urls - Array of image URLs to preload
 */
export async function preloadImages(urls: string[]): Promise<void> {
  const promises = urls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = getSmartCacheBustedUrl(url);
    });
  });
  
  try {
    await Promise.all(promises);
    console.log(`Successfully preloaded ${urls.length} images`);
  } catch (error) {
    console.error('Error preloading images:', error);
  }
}

/**
 * Common Supabase storage URLs for easy access
 */
export const STORAGE_URLS = {
  base: SUPABASE_STORAGE_URL,
  
  // Front-end images
  logo: getSupabaseStorageUrl('icons', 'special-font-sidehustle-title.png'),
  sidehustle: getSupabaseStorageUrl('front-end-images', 'sidehustle.png'),
  favicon: getSupabaseStorageUrl('icons', 'favicon.png'),
  wolfIcon512: getSupabaseStorageUrl('icons', 'wolf-512x512.png'),
  wolfPaw192: getSupabaseStorageUrl('icons', 'wolf-paw-192x192.png'),
  ufcSection: getSupabaseStorageUrl('front-end-images', 'ufc-section.jpeg'),
  variety: getSupabaseStorageUrl('front-end-images', 'variety.png'),
  salemLocation: getSupabaseStorageUrl('front-end-images', 'salem-location.jpg'),
  portlandLocation: getSupabaseStorageUrl('front-end-images', 'portland-side-hustle.jpg'),
  
  // Delivery platform icons
  doordash: getSupabaseStorageUrl('front-end-images', 'doordash_icon.png'),
  uberEats: getSupabaseStorageUrl('front-end-images', 'uber-eats.png'),
  postmates: getSupabaseStorageUrl('front-end-images', 'postmates.png'),
  
  // Videos
  heroVideo: getSupabaseStorageUrl('front-end-videos', 'hero-video.mp4'),
  secondVideo: getSupabaseStorageUrl('front-end-videos', '2nd-video.mp4'),
  thirdVideo: getSupabaseStorageUrl('front-end-videos', '3rd-video.mp4'),
  
  // Helper functions for dynamic paths
  menuFood: (filename: string) => getSupabaseStorageUrl('menu-images/food', filename),
  menuDrink: (filename: string) => getSupabaseStorageUrl('menu-images/drinks', filename),
  menuVideo: (filename: string) => getSupabaseStorageUrl('menu-videos', filename),
  icon: (filename: string) => getSupabaseStorageUrl('icons', filename),
} as const;

/**
 * Get cache-busted versions of common URLs
 */
export const CACHED_STORAGE_URLS = {
  logo: () => getSmartCacheBustedUrl(STORAGE_URLS.logo),
  sidehustle: () => getSmartCacheBustedUrl(STORAGE_URLS.sidehustle),
  favicon: () => getSmartCacheBustedUrl(STORAGE_URLS.favicon),
  wolfIcon512: () => getSmartCacheBustedUrl(STORAGE_URLS.wolfIcon512),
  wolfPaw192: () => getSmartCacheBustedUrl(STORAGE_URLS.wolfPaw192),
  ufcSection: () => getSmartCacheBustedUrl(STORAGE_URLS.ufcSection),
  variety: () => getSmartCacheBustedUrl(STORAGE_URLS.variety),
  salemLocation: () => getSmartCacheBustedUrl(STORAGE_URLS.salemLocation),
  portlandLocation: () => getSmartCacheBustedUrl(STORAGE_URLS.portlandLocation),
  doordash: () => getSmartCacheBustedUrl(STORAGE_URLS.doordash),
  uberEats: () => getSmartCacheBustedUrl(STORAGE_URLS.uberEats),
  postmates: () => getSmartCacheBustedUrl(STORAGE_URLS.postmates),
  heroVideo: () => getSmartCacheBustedUrl(STORAGE_URLS.heroVideo),
  secondVideo: () => getSmartCacheBustedUrl(STORAGE_URLS.secondVideo),
  thirdVideo: () => getSmartCacheBustedUrl(STORAGE_URLS.thirdVideo),
} as const;