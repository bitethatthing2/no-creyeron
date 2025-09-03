'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';

interface DynamicLogoProps {
  type?: 'brand' | 'wolf';
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

export function DynamicLogo({ 
  type = 'brand', 
  className = '', 
  width = 200, 
  height = 50,
  alt 
}: DynamicLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <div 
        className={`bg-muted animate-pulse ${className}`}
        style={{ width, height }}
        aria-label="Loading logo..."
      />
    );
  }

  const isDark = resolvedTheme === 'dark';
  
  const logoSources = {
    brand: {
      light: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/special-font-sidehustle-title.png',
      dark: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/special-font-sidehustle-title.png'
    },
    wolf: {
      light: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png',
      dark: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png'
    }
  };

  const currentSrc = isDark ? logoSources[type].dark : logoSources[type].light;
  const logoAlt = alt || (type === 'brand' ? 'Side Hustle Bar' : 'Wolf Pack');

  return (
    <Image
      src={currentSrc}
      alt={logoAlt}
      width={width}
      height={height}
      className={`transition-opacity duration-300 ${className}`}
      priority={type === 'brand' || (type === 'wolf' && width >= 40)} // Prioritize brand and large wolf logos
      style={{
        maxWidth: '100%',
        height: 'auto'
      }}
    />
  );
}

// Preload images for smoother transitions
export function preloadLogos() {
  if (typeof window === 'undefined') return;

  const imagesToPreload = [
    'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/special-font-sidehustle-title.png',
    'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png'
  ];

  imagesToPreload.forEach(src => {
    const img = new window.Image();
    img.src = src;
  });
}

// Hook to use in layout or main app component
export function useLogoPreload() {
  React.useEffect(() => {
    preloadLogos();
  }, []);
}