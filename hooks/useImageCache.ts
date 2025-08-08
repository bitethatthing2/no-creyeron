import { useMemo } from 'react';
import { getSmartCacheBustedUrl, getFreshImageUrl } from '@/lib/utils/image-cache';

/**
 * Hook for handling image cache busting
 * @param src - The image source path
 * @param alwaysFresh - Whether to always use a fresh timestamp (default: false)
 * @returns Cache-busted image URL
 */
export function useImageCache(src: string, alwaysFresh: boolean = false): string {
  return useMemo(() => {
    if (alwaysFresh) {
      return getFreshImageUrl(src);
    }
    return getSmartCacheBustedUrl(src);
  }, [src, alwaysFresh]);
}

/**
 * Hook for getting multiple cache-busted image URLs
 * @param sources - Array of image source paths
 * @param alwaysFresh - Whether to always use fresh timestamps
 * @returns Array of cache-busted image URLs
 */
export function useMultipleImageCache(sources: string[], alwaysFresh: boolean = false): string[] {
  return useMemo(() => {
    return sources.map(src => 
      alwaysFresh ? getFreshImageUrl(src) : getSmartCacheBustedUrl(src)
    );
  }, [sources, alwaysFresh]);
}