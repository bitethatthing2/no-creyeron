'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';

interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  fallbackIcon?: React.ReactNode;
  onError?: () => void;
  onLoad?: () => void;
}

export function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackSrc,
  fallbackIcon,
  onError,
  onLoad
}: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(src || null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!src);

  useEffect(() => {
    setCurrentSrc(src || null);
    setHasError(false);
    setIsLoading(!!src);
  }, [src]);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setCurrentSrc(null);
    }
    
    onError?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  // If no src or error with no fallback, show icon
  if (!currentSrc || (hasError && !fallbackSrc)) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        {fallbackIcon || <User className="h-1/2 w-1/2 text-muted-foreground" />}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}
      <Image
        src={currentSrc}
        alt={alt}
        fill
        className={`object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        onError={handleError}
        onLoad={handleLoad}
        quality={95}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}

// Avatar component with better fallback handling
interface AvatarWithFallbackProps {
  src?: string | null;
  name?: string | null;
  emoji?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AvatarWithFallback({
  src,
  name,
  emoji,
  size = 'md',
  className = ''
}: AvatarWithFallbackProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg'
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'W';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getFallbackContent = () => {
    if (emoji) {
      return <span className="text-lg">{emoji}</span>;
    }
    if (name) {
      return <span className="font-medium">{getInitials(name)}</span>;
    }
    return <User className="h-1/2 w-1/2" />;
  };

  // Clean up the src URL to avoid common issues
  const cleanSrc = src ? src.replace(/\?.*$/, '') : null;

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
      <ImageWithFallback
        src={cleanSrc}
        alt={name || 'User avatar'}
        className="h-full w-full object-cover"
        fallbackIcon={getFallbackContent()}
      />
    </div>
  );
}

// Optimized image URLs helper
export function getOptimizedImageUrl(originalUrl: string | null | undefined, options?: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
}): string | null {
  if (!originalUrl) return null;

  try {
    const url = new URL(originalUrl);
    
    // Handle Unsplash URLs
    if (url.hostname.includes('unsplash.com')) {
      const { width = 300, height = 300, quality = 95, format = 'webp' } = options || {};
      return `${originalUrl}?w=${width}&h=${height}&fit=crop&crop=face&q=${quality}&fm=${format}`;
    }
    
    // Handle other image services
    if (url.hostname.includes('cloudinary.com')) {
      const { width = 300, height = 300, quality = 95 } = options || {};
      return originalUrl.replace('/upload/', `/upload/w_${width},h_${height},c_fill,q_${quality}/`);
    }
    
    // Return original URL if no optimization available
    return originalUrl;
  } catch (error) {
    console.warn('Invalid image URL:', originalUrl);
    return null;
  }
}

// Safe avatar generator that uses CSS gradients instead of SVG data URIs
export function generateSafeAvatarUrl(userId: string, name?: string): string | null {
  // Return null to force fallback to CSS-based avatars
  return null;
}

function getColorFromIndex(index: number, stop: number): string {
  const colorPairs = [
    ['#3B82F6', '#1D4ED8'], // blue
    ['#10B981', '#059669'], // green
    ['#8B5CF6', '#7C3AED'], // purple
    ['#EC4899', '#DB2777'], // pink
    ['#F59E0B', '#D97706'], // yellow
    ['#EF4444', '#DC2626'], // red
    ['#6366F1', '#4F46E5'], // indigo
    ['#14B8A6', '#0D9488']  // teal
  ];
  
  return colorPairs[index][stop];
}

// Image preloader to reduce loading times
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(url => 
      new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load ${url}`));
        img.src = url;
      })
    )
  );
}

// Image cache manager
class ImageCache {
  private cache = new Map<string, boolean>();
  private maxSize = 100;

  isValid(url: string): boolean {
    return this.cache.has(url) && this.cache.get(url) === true;
  }

  markValid(url: string): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(url, true);
  }

  markInvalid(url: string): void {
    this.cache.set(url, false);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const imageCache = new ImageCache();