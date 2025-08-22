'use client';

import * as React from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Utensils, Wine, Star, Search, Play, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import styles from './FoodDrinkCarousel.module.css';

// Lazy load heavy components
const VideoPlayer = dynamic(() => import('@/components/ui/VideoPlayer').then(mod => ({ default: mod.VideoPlayer })), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-800 animate-pulse" />
});

const WatchItMadeModal = dynamic(() => import('@/components/menu/WatchItMadeModal'), {
  ssr: false
});

// Types
interface CarouselItem {
  id: string;
  name: string;
  image: string;
  type: 'food' | 'drink';
  description: string;
  price: string;
  category: string;
  subcategory?: string;
  features?: string[];
  isPopular?: boolean;
  hasWatchItMade?: boolean;
}

interface FoodDrinkCarouselProps {
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  onItemClick?: (item: CarouselItem) => void;
}

// Constants - Move data to separate file in production
const CAROUSEL_ITEMS: CarouselItem[] = [
  // Your items here - I'll keep the structure but recommend moving to a separate data file
  { 
    id: '1', 
    name: 'Birria Queso Tacos', 
    image: '/food-menu-images/queso-tacos.png', 
    type: 'food', 
    description: '3 queso birria tacos with queso oaxaca, onions, and cilantro. Served with consommé for dipping.',
    price: '$16.75',
    category: 'BIRRIA',
    subcategory: 'Food',
    features: ['Signature Item', '3 Tacos Included'],
    isPopular: true
  },
  // ... rest of items (keeping structure, recommend separate file)
];

// Utility functions
const getWatchItMadeVideo = (itemName: string): string | null => {
  // Mock implementation - replace with actual logic
  const videoMap: Record<string, string> = {
    'Burrito': '/videos/burrito-making.mp4',
    // Add more mappings
  };
  return videoMap[itemName] || null;
};

// Minimum swipe distance for mobile
const MIN_SWIPE_DISTANCE = 50;

export function FoodDrinkCarousel({ 
  className,
  autoPlay = false,
  autoPlayInterval = 8000,
  onItemClick
}: FoodDrinkCarouselProps) {
  // State management
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [itemsPerView, setItemsPerView] = React.useState(4);
  const [isAutoPlaying, setIsAutoPlaying] = React.useState(autoPlay);
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'food' | 'drink' | 'popular'>('all');
  const [activeSubcategory, setActiveSubcategory] = React.useState<string>('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showWatchItMadeModal, setShowWatchItMadeModal] = React.useState<string>('');
  const [sectionToggle, setSectionToggle] = React.useState<'food' | 'drinks'>('food');
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);

  // Refs
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Memoized filtered items
  const filteredItems = React.useMemo(() => {
    return CAROUSEL_ITEMS.filter(item => {
      let typeMatch = false;
      
      if (activeFilter === 'all') {
        typeMatch = item.type === (sectionToggle === 'drinks' ? 'drink' : 'food');
      } else if (activeFilter === 'popular') {
        typeMatch = item.isPopular === true && item.type === (sectionToggle === 'drinks' ? 'drink' : 'food');
      } else if (activeFilter === 'food' || activeFilter === 'drink') {
        if (activeSubcategory === '') {
          typeMatch = item.type === activeFilter;
        } else {
          typeMatch = item.type === activeFilter && item.category === activeSubcategory;
        }
      }
      
      const searchMatch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      return typeMatch && searchMatch;
    });
  }, [activeFilter, activeSubcategory, searchQuery, sectionToggle]);

  // Get unique categories for current section
  const categories = React.useMemo(() => {
    const type = sectionToggle === 'drinks' ? 'drink' : 'food';
    return Array.from(new Set(
      CAROUSEL_ITEMS
        .filter(item => item.type === type)
        .map(item => item.category)
    ));
  }, [sectionToggle]);

  // Responsive items per view
  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setItemsPerView(1);
      } else if (width < 768) {
        setItemsPerView(2);
      } else if (width < 1024) {
        setItemsPerView(3);
      } else {
        setItemsPerView(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset index when filters change
  React.useEffect(() => {
    setCurrentIndex(0);
  }, [activeFilter, activeSubcategory, searchQuery, sectionToggle]);

  // Auto-play functionality
  React.useEffect(() => {
    if (!isAutoPlaying || filteredItems.length <= itemsPerView) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = Math.max(0, filteredItems.length - itemsPerView);
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [itemsPerView, isAutoPlaying, filteredItems.length, autoPlayInterval]);

  // Navigation functions
  const navigateToIndex = React.useCallback((index: number) => {
    const maxIndex = Math.max(0, filteredItems.length - itemsPerView);
    const newIndex = Math.max(0, Math.min(index, maxIndex));
    setCurrentIndex(newIndex);
    setIsAutoPlaying(false);
  }, [filteredItems.length, itemsPerView]);

  const nextSlide = React.useCallback(() => {
    navigateToIndex(currentIndex + 1);
  }, [currentIndex, navigateToIndex]);

  const prevSlide = React.useCallback(() => {
    navigateToIndex(currentIndex - 1);
  }, [currentIndex, navigateToIndex]);

  // Touch handlers
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = React.useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > MIN_SWIPE_DISTANCE;
    const isRightSwipe = distance < -MIN_SWIPE_DISTANCE;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  }, [touchStart, touchEnd, nextSlide, prevSlide]);

  // Filter handlers
  const handleFilterChange = React.useCallback((filter: 'all' | 'food' | 'drink' | 'popular') => {
    setActiveFilter(filter);
    setIsAutoPlaying(false);
    
    if (filter === 'food') {
      setSectionToggle('food');
    } else if (filter === 'drink') {
      setSectionToggle('drinks');
    }
  }, []);

  const handleSubcategoryChange = React.useCallback((subcategory: string) => {
    setActiveSubcategory(subcategory);
    setIsAutoPlaying(false);
  }, []);

  const handleSectionToggle = React.useCallback((section: 'food' | 'drinks') => {
    setSectionToggle(section);
    setCurrentIndex(0);
    setActiveFilter('all');
    setActiveSubcategory('');
  }, []);

  const handleSearchChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSearchClear = React.useCallback(() => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  }, []);

  const handleItemAction = React.useCallback((item: CarouselItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
  }, [onItemClick]);

  const maxIndex = Math.max(0, filteredItems.length - itemsPerView);
  const canNavigatePrev = currentIndex > 0;
  const canNavigateNext = currentIndex < maxIndex;

  return (
    <div className={cn("relative w-full", className)}>
      {/* Search Bar */}
      <div className="flex justify-center mb-4">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
        ref={searchInputRef}
        type="text"
        placeholder="Search menu items..."
        value={searchQuery}
        onChange={handleSearchChange}
        className="w-full pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        aria-label="Search menu items"
        />
        {searchQuery && (
        <button
          onClick={handleSearchClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
        )}
      </div>
      </div>

      {/* Section Toggle */}
      <div className="flex justify-center gap-3 mb-4">
      <button
        onClick={() => handleSectionToggle('food')}
        className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all shadow-lg",
        sectionToggle === 'food'
          ? "bg-white text-black border-2 border-white"
          : "bg-gray-800 text-gray-300 border-2 border-gray-700 hover:bg-gray-700 hover:text-white"
        )}
        aria-pressed={sectionToggle === 'food' ? 'true' : 'false'}
      >
        <Utensils className="w-4 h-4" />
        Food
      </button>
      <button
        onClick={() => handleSectionToggle('drinks')}
        className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all shadow-lg",
        sectionToggle === 'drinks'
          ? "bg-white text-black border-2 border-white"
          : "bg-gray-800 text-gray-300 border-2 border-gray-700 hover:bg-gray-700 hover:text-white"
        )}
        aria-pressed={sectionToggle === 'drinks' ? 'true' : 'false'}
      >
        <Wine className="w-4 h-4" />
        Drinks
      </button>
      </div>

      {/* Category Filters */}
      <div className="relative mb-6">
      <div className={cn("overflow-x-auto", styles.scrollbarHide)}>
        <div className="flex items-center gap-2 px-4 py-3 min-w-max">
        <button
          onClick={() => {
          handleFilterChange('all');
          handleSubcategoryChange('');
          }}
          className={cn(
          "px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all min-h-[36px]",
          activeFilter === 'all'
            ? "bg-white text-black"
            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          )}
        >
          All
        </button>

        <button
          onClick={() => {
          handleFilterChange('popular');
          handleSubcategoryChange('');
          }}
          className={cn(
          "flex items-center gap-1.5 px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all min-h-[36px]",
          activeFilter === 'popular'
            ? "bg-white text-black"
            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          )}
        >
          <Star className="w-3.5 h-3.5" />
          Popular
        </button>

        {categories.map((category: string) => (
          <button
          key={category}
          onClick={() => {
            handleFilterChange(sectionToggle === 'drinks' ? 'drink' : 'food');
            handleSubcategoryChange(category);
          }}
          className={cn(
            "px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all min-h-[36px]",
            activeFilter === (sectionToggle === 'drinks' ? 'drink' : 'food') && activeSubcategory === category
            ? "bg-white text-black"
            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          )}
          >
          {category}
          </button>
        ))}
        </div>
      </div>
      
      {/* Gradient edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent pointer-events-none" />
      </div>

      {/* Carousel */}
      {filteredItems.length > 0 ? (
      <div
        ref={carouselRef}
        className="relative overflow-hidden rounded-xl"
        onTouchStart={handleTouchStart as React.TouchEventHandler<HTMLDivElement>}
        onTouchMove={handleTouchMove as React.TouchEventHandler<HTMLDivElement>}
        onTouchEnd={handleTouchEnd as React.TouchEventHandler<HTMLDivElement>}
      >
        <div
        className={cn("flex", styles.carouselTrack)}
        style={{
          '--carousel-transform': `translateX(-${(currentIndex * 100) / itemsPerView}%)`
        } as React.CSSProperties}
        >
        {filteredItems.map((item: CarouselItem) => (
          <div
          key={item.id}
          className={cn(
            styles.carouselItem,
            itemsPerView === 1 && styles.carouselItem1,
            itemsPerView === 2 && styles.carouselItem2,
            itemsPerView === 3 && styles.carouselItem3,
            itemsPerView === 4 && styles.carouselItem4
          )}
          >
          <CarouselCard
            item={item}
            onWatchItMade={() => setShowWatchItMadeModal(item.id)}
            onItemClick={() => handleItemAction(item)}
          />
          </div>
        ))}
        </div>

        {/* Navigation Arrows */}
        {filteredItems.length > itemsPerView && (
        <>
          <button
          onClick={prevSlide}
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-200 z-10 shadow-lg",
            canNavigatePrev
            ? "bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 border border-gray-200"
            : "bg-gray-300/50 text-gray-400 cursor-not-allowed"
          )}
          disabled={!canNavigatePrev}
          aria-label="Previous items"
          >
          <ChevronLeft className="h-5 w-5" />
          </button>
          <button
          onClick={nextSlide}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-200 z-10 shadow-lg",
            canNavigateNext
            ? "bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 border border-gray-200"
            : "bg-gray-300/50 text-gray-400 cursor-not-allowed"
          )}
          disabled={!canNavigateNext}
          aria-label="Next items"
          >
          <ChevronRight className="h-5 w-5" />
          </button>
        </>
        )}
      </div>
      ) : (
      <div className="text-center py-12">
        <p className="text-gray-500">No items found matching your search.</p>
      </div>
      )}

      {/* Watch It Made Modals */}
      {filteredItems.map((item: CarouselItem) => {
      const videoUrl: string | null = getWatchItMadeVideo(item.name);
      return (
        videoUrl &&
        showWatchItMadeModal === item.id && (
        <WatchItMadeModal
          key={item.id}
          videoUrl={videoUrl}
          itemName={item.name}
          onClose={() => setShowWatchItMadeModal('')}
        />
        )
      );
      })}
    </div>
  );
}

// Separate Card Component for better performance
interface CarouselCardProps {
  item: CarouselItem;
  onWatchItMade: () => void;
  onItemClick: () => void;
}

const CarouselCard = React.memo(function CarouselCard({ 
  item, 
  onWatchItMade,
  onItemClick 
}: CarouselCardProps) {
  const isVideo = item.image.endsWith('.mp4') || item.image.endsWith('.webm');
  const hasWatchVideo = getWatchItMadeVideo(item.name) !== null;

  return (
    <div
      className={cn(
        "group rounded-xl shadow-lg border transition-all overflow-hidden cursor-pointer",
        styles.carouselCard,
        item.isPopular
          ? "bg-gradient-to-br from-red-900 to-red-800 border-red-500 shadow-red-500/25 hover:shadow-red-500/40"
          : "bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-gray-600"
      )}
      onClick={onItemClick}
    >
      {/* Image/Video Section */}
      <div className="aspect-square relative bg-gradient-to-br from-gray-800 to-gray-900">
        {isVideo ? (
          <VideoPlayer
            src={item.image}
            className="w-full h-full object-cover"
            showControls={false}
            autoPlay
            loop
            muted
          />
        ) : (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className={cn("object-contain object-center p-2", styles.cardImage)}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
          />
        )}
        
        <div className={styles.gradientOverlay} />

        {/* Price Badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            {item.price}
          </span>
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-black/90 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
            {item.category}
          </span>
        </div>

        {/* Popular Badge */}
        {item.isPopular && (
          <div className="absolute top-12 left-3 z-10">
            <span className={cn(
              "bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg",
              styles.popularBadge
            )}>
              ⭐ POPULAR
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="text-base sm:text-lg font-bold text-white leading-tight mb-2 group-hover:text-red-400 transition-colors duration-300 line-clamp-1">
          {item.name}
        </h3>

        <p className="text-gray-300 text-sm leading-relaxed mb-3 line-clamp-2">
          {item.description}
        </p>

        {item.features && item.features.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.features.slice(0, 2).map((feature, index) => (
              <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs font-medium">
                {feature}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1",
              item.type === 'food' ? "bg-orange-600 text-white" : "bg-blue-600 text-white"
            )}
          >
            {item.type === 'food' ? <Utensils className="h-3 w-3" /> : <Wine className="h-3 w-3" />}
            {item.type === 'food' ? 'Food' : 'Drink'}
          </span>

          {hasWatchVideo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWatchItMade();
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors duration-200"
              aria-label={`Watch how ${item.name} is made`}
            >
              <Play className="h-3 w-3" />
              <span className="tracking-wide">Watch</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default FoodDrinkCarousel;