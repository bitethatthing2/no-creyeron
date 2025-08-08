'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';
import { clearBrowserImageCache, forceClearImageCache } from '@/lib/utils/image-cache';

/**
 * Development-only component for controlling image cache
 * Provides quick access to clear cache and refresh images
 */
export default function ImageCacheControl() {
  const [isVisible, setIsVisible] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return null;
  }

  const handleQuickRefresh = () => {
    setIsRefreshing(true);
    
    // Call the global force refresh function if available
    if ((window as any).forceRefreshImages) {
      (window as any).forceRefreshImages();
    } else {
      // Fallback: Force reload all images on the page with multiple cache-busting params
      const images = document.querySelectorAll('img');
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2);
      
      images.forEach((img, index) => {
        const src = img.src;
        if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
          // Remove all existing query params and add aggressive cache busting
          const cleanSrc = src.split('?')[0];
          const newSrc = `${cleanSrc}?_t=${timestamp}&_r=${random}&_i=${index}&_cb=${Date.now()}`;
          img.src = newSrc;
          
          // Force the image to reload by removing and re-adding to DOM
          const parent = img.parentNode;
          const next = img.nextSibling;
          parent?.removeChild(img);
          setTimeout(() => {
            if (next) {
              parent?.insertBefore(img, next);
            } else {
              parent?.appendChild(img);
            }
          }, 10);
        }
      });
      
      console.log(`Aggressively refreshed ${images.length} images`);
    }
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleClearCache = async () => {
    setIsRefreshing(true);
    await clearBrowserImageCache();
    // Page will reload automatically
  };

  const handleForceRefresh = () => {
    forceClearImageCache();
    // Page will reload automatically
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 p-3 bg-black/90 border border-yellow-500 rounded-lg shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-yellow-400">DEV: Image Cache</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsVisible(false)}
          className="h-5 w-5 p-0 hover:bg-transparent"
        >
          <X className="h-3 w-3 text-yellow-400" />
        </Button>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleQuickRefresh}
        disabled={isRefreshing}
        className="text-xs border-yellow-500 text-yellow-400 hover:bg-yellow-500/20"
      >
        <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
        Quick Refresh
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if ((window as any).refreshRawImage) {
            (window as any).refreshRawImage();
          }
        }}
        disabled={isRefreshing}
        className="text-xs border-green-500 text-green-400 hover:bg-green-500/20"
      >
        <RefreshCw className={`h-3 w-3 mr-1`} />
        Raw Images
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleClearCache}
        disabled={isRefreshing}
        className="text-xs border-orange-500 text-orange-400 hover:bg-orange-500/20"
      >
        Clear Cache
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleForceRefresh}
        disabled={isRefreshing}
        className="text-xs border-red-500 text-red-400 hover:bg-red-500/20"
      >
        Force Reload
      </Button>
      
      <div className="text-xs text-gray-400 mt-1">
        <div>Shortcuts:</div>
        <div>Ctrl+Shift+R: Quick refresh</div>
        <div>F5: Normal refresh</div>
      </div>
    </div>
  );
}