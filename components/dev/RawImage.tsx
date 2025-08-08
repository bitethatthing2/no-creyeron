'use client';

import { useState, useEffect } from 'react';

interface RawImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onError?: () => void;
}

/**
 * Raw HTML img component that completely bypasses Next.js Image optimization
 * Uses aggressive cache-busting in development mode
 */
export default function RawImage({ src, alt, className, style, onError }: RawImageProps) {
  const [imageSrc, setImageSrc] = useState('');
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!src) return;
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      // In development, add aggressive cache busting
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2);
      const cleanSrc = src.split('?')[0];
      const cacheBustedSrc = `${cleanSrc}?_dev=${timestamp}&_r=${random}&_k=${key}`;
      setImageSrc(cacheBustedSrc);
    } else {
      setImageSrc(src);
    }
  }, [src, key]);

  // Force refresh function - can be called externally
  useEffect(() => {
    (window as any).refreshRawImage = () => {
      setKey(prev => prev + 1);
      console.log('Raw images refreshed');
    };
  }, []);

  if (!imageSrc) {
    return null;
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={style}
      onError={onError}
      loading="lazy"
      decoding="async"
      // Prevent any browser caching in development
      {...(process.env.NODE_ENV === 'development' && {
        'data-no-cache': 'true',
        referrerPolicy: 'no-referrer',
        crossOrigin: 'anonymous'
      })}
    />
  );
}