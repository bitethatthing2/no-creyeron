/**
 * Image cache utilities for handling browser caching issues
 */

// Get stored version or use current timestamp
const getStoredVersion = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('imageVersion') || Date.now().toString();
  }
  return Date.now().toString();
};

// Version timestamp that can be updated when images change
// To force refresh all images, update this value
const IMAGE_VERSION = getStoredVersion();

/**
 * Force refresh all cached images by updating the version
 */
export function forceClearImageCache() {
  if (typeof window !== 'undefined') {
    const newVersion = Date.now().toString();
    localStorage.setItem('imageVersion', newVersion);
    // Reload the page to apply new cache version
    window.location.reload();
  }
}

/**
 * Add cache-busting parameter to image URLs
 * @param src - The image source path
 * @param forceRefresh - Whether to use current timestamp (default: false uses build-time version)
 * @returns Image URL with cache-busting parameter
 */
export function getCacheBustedImageUrl(src: string, forceRefresh: boolean = false): string {
  if (!src) return src;
  
  // Don't add cache busting to external URLs or data URLs
  if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }
  
  // Use current timestamp for force refresh, otherwise use build-time version
  const version = forceRefresh ? Date.now().toString() : IMAGE_VERSION;
  
  // Check if URL already has query parameters
  const separator = src.includes('?') ? '&' : '?';
  
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
 * Array of image paths that should always be cache-busted
 * Add paths here for images that change frequently
 */
const ALWAYS_CACHE_BUST = [
  '/icons/wolf-and-title.png',
  '/icons/wolf-icon.png', 
  '/icons/sidehustle.png',
  '/icons/WOLFPACK-PAW.png',
  '/icons/wolf-icon-light-screen.png',
  '/food-menu-images/',
  '/drink-menu-images/'
];

/**
 * Smart cache busting - only applies to images that need it
 * @param src - The image source path
 * @returns Image URL with cache-busting if needed
 */
export function getSmartCacheBustedUrl(src: string): string {
  if (!src) return src;
  
  // Check if this image should always be cache-busted
  const shouldCacheBust = ALWAYS_CACHE_BUST.some(path => src.includes(path));
  
  if (shouldCacheBust) {
    return getCacheBustedImageUrl(src, true);
  }
  
  return src;
}

/**
 * Clear browser cache for images (more aggressive approach)
 */
export async function clearBrowserImageCache() {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('Browser caches cleared');
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }
  
  // Also clear the version and reload
  forceClearImageCache();
}