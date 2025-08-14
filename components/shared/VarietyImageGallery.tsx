'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface VarietyImage {
  id: string;
  src: string;
  alt: string;
  title?: string;
  description?: string;
}

interface VarietyImageGalleryProps {
  images: VarietyImage[];
  className?: string;
  showTitles?: boolean;
  columns?: 2 | 3 | 4;
  aspectRatio?: 'square' | 'landscape' | 'portrait';
}

export default function VarietyImageGallery({
  images,
  className,
  showTitles = false,
  columns = 3,
  aspectRatio = 'landscape'
}: VarietyImageGalleryProps) {
  const [mounted, setMounted] = React.useState(false);
  const [hoveredImage, setHoveredImage] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return skeleton loading state
    return (
      <div className={cn('grid gap-4', 
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', 
        columns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className={cn(
              'bg-gray-300 rounded-lg',
              aspectRatio === 'square' && 'aspect-square',
              aspectRatio === 'landscape' && 'aspect-[4/3]',
              aspectRatio === 'portrait' && 'aspect-[3/4]'
            )} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(
      'grid gap-4 sm:gap-6',
      columns === 2 && 'grid-cols-1 sm:grid-cols-2',
      columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      columns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      className
    )}>
      {images.map((image, index) => (
        <div
          key={image.id}
          className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 ease-out transform hover:-translate-y-1"
          onMouseEnter={() => setHoveredImage(image.id)}
          onMouseLeave={() => setHoveredImage(null)}
        >
          {/* Image Container */}
          <div className={cn(
            'relative overflow-hidden bg-gray-200',
            aspectRatio === 'square' && 'aspect-square',
            aspectRatio === 'landscape' && 'aspect-[4/3]',
            aspectRatio === 'portrait' && 'aspect-[3/4]'
          )}>
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className={cn(
                'object-cover transition-transform duration-700 ease-out',
                hoveredImage === image.id ? 'scale-110' : 'scale-100'
              )}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={index < 3} // Prioritize first 3 images
            />
            
            {/* Overlay */}
            <div className={cn(
              'absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out'
            )} />

            {/* Text Overlay */}
            {showTitles && (image.title || image.description) && (
              <div className={cn(
                'absolute bottom-0 left-0 right-0 p-4 text-white',
                'transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out'
              )}>
                {image.title && (
                  <h3 className="font-semibold text-sm sm:text-base mb-1 drop-shadow-md">
                    {image.title}
                  </h3>
                )}
                {image.description && (
                  <p className="text-xs sm:text-sm text-white/90 drop-shadow-md line-clamp-2">
                    {image.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Bottom Border Accent */}
          <div className={cn(
            'absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-yellow-500',
            'transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left'
          )} />
        </div>
      ))}
    </div>
  );
}

// Export preset configurations
export const CHEF_VARIETY_IMAGES: VarietyImage[] = [
  {
    id: 'birria-tacos',
    src: '/food-menu-images/birria-tacos.png',
    alt: 'Signature Birria Tacos',
    title: 'Legendary Birria Tacos',
    description: 'Tender slow-cooked beef in secret spice blend with house-made consommé'
  },
  {
    id: 'birria-ramen',
    src: '/food-menu-images/birria-soup.png',
    alt: 'Birria Ramen Bowl',
    title: 'Birria Ramen Fusion',
    description: 'Innovative fusion combining traditional birria with ramen noodles'
  },
  {
    id: 'fish-tacos',
    src: '/food-menu-images/fish-tacos.png',
    alt: 'Fresh Fish Tacos',
    title: 'Fresh Fish Tacos',
    description: 'Beer-battered fish with house-made slaw and signature sauces'
  },
  {
    id: 'nachos',
    src: '/food-menu-images/nachos.png',
    alt: 'Loaded Nachos',
    title: 'House-Made Nachos',
    description: 'Fresh tortilla chips with house-made queso and premium toppings'
  },
  {
    id: 'burrito',
    src: '/food-menu-images/burrito.png',
    alt: 'Signature Burrito',
    title: 'Signature Burritos',
    description: 'Hand-pressed tortillas with fresh ingredients and bold flavors'
  },
  {
    id: 'margarita',
    src: '/drink-menu-images/margarita.png',
    alt: 'Craft Margarita',
    title: 'Craft Margaritas',
    description: 'Premium tequila with fresh lime and house-made syrups'
  }
];