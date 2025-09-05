'use client';

import { useState, useEffect, useMemo, useCallback, useRef, TouchEvent } from 'react';
import { Play, Clock } from 'lucide-react';
import { getMenuItemVideoUrl } from '@/lib/constants/video-urls';
import { useMenuItems } from '@/lib/hooks/useMenuItems';
import { MenuItem } from '@/lib/edge-functions/types/MENU_ITEMS';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import styles from './SliderMenu.module.css';
import { useIsClient } from 'usehooks-ts';

const WatchItMadeModal = dynamic(() => import('@/components/menu/WatchItMadeModal'), {
  ssr: false
});

interface SliderMenuProps {
  initialType?: 'food' | 'drinks' | 'all';
  showSearch?: boolean;
  autoPlay?: boolean;
  className?: string;
}


const DRINK_CATEGORIES = [
  'Boards', 'Flights', 'Towers', 'House Favorites', 'Martinis',
  'Margaritas', 'Malibu Buckets', 'Refreshers', 'Bottle Beer', 
  'Wine', 'Non Alcoholic'
];

export default function SliderMenu({ 
  initialType = 'all',
  showSearch = false,
  className = ''
}: SliderMenuProps) {
  const isClient = useIsClient();
  const [selectedType, setSelectedType] = useState<'food' | 'drinks' | 'all'>(initialType);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWatchItMadeModal, setShowWatchItMadeModal] = useState('');
  const [modalVideoUrl, setModalVideoUrl] = useState('');
  const [modalItemName, setModalItemName] = useState('');
  
  // Touch handling refs
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Stable filters object
  const menuFilters = useMemo(() => ({
    is_active: true, 
    is_available: true,
    limit: 100
  }), []);
  
  // Use the original approach that was working with images, but add type filtering
  const { 
    items: allItems, 
    loading, 
    error
  } = useMenuItems(menuFilters);

  // Memoize the getDefaultImage function
  const getDefaultImage = useCallback((category: string, name: string): string => {
    // Use production Supabase URL for images since they exist there
    const productionUrl = 'https://tvnpgbjypnezoasbhbwx.supabase.co';
    
    // Special handling for wings with different quantities
    // Actual menu items are named: "4 Wings", "8 Wings", "Family Wing Pack (20 Wings)"
    if (name.toLowerCase().includes('wing')) {
      // Extract the number from various formats
      const match = name.match(/(\d+)\s*wings?|family.*\((\d+)/i);
      if (match) {
        const count = match[1] || match[2];
        if (count) {
          // Map to the hot-wings images
          return `${productionUrl}/storage/v1/object/public/menu-images/food/hot-wings-${count}.png`;
        }
      }
      // Try to identify by specific names
      if (name === '4 Wings') {
        return `${productionUrl}/storage/v1/object/public/menu-images/food/hot-wings-4.png`;
      } else if (name === '8 Wings') {
        return `${productionUrl}/storage/v1/object/public/menu-images/food/hot-wings-8.png`;
      } else if (name.includes('Family Wing Pack') || name.includes('20')) {
        return `${productionUrl}/storage/v1/object/public/menu-images/food/hot-wings-20.png`;
      }
      // Default to 8 if no number found
      return `${productionUrl}/storage/v1/object/public/menu-images/food/hot-wings-8.png`;
    }
    
    const itemName = name.toLowerCase().replace(/\s+/g, '-');
    const isDrink = DRINK_CATEGORIES.some(cat => 
      category.toUpperCase().includes(cat.toUpperCase()) || 
      name.toUpperCase().includes(cat.toUpperCase())
    );
    const folder = isDrink ? 'drinks' : 'food';
    
    // Try production first, fallback to local
    const baseUrl = `${productionUrl}/storage/v1/object/public/menu-images`;
    return `${baseUrl}/${folder}/${itemName}.png`;
  }, []);

  // Process items with proper memoization
  const processedItems = useMemo(() => {
    if (!allItems || allItems.length === 0) return [];
    
    let filtered = allItems;
    
    // Filter by type using the database views' information
    if (selectedType === 'food') {
      filtered = allItems.filter(item => item.type === 'food');
    } else if (selectedType === 'drinks') {
      filtered = allItems.filter(item => item.type === 'drink');
    }
    
    const processed = filtered.map((item): MenuItem => {
      const videoUrl = item.video_url || getMenuItemVideoUrl(item.name);
      
      // Check if item already has a specific image URL
      let imageUrl = item.image_url;
      
      // For wing items, ALWAYS override with correct image based on name
      // This is needed because database has wrong URLs (all pointing to hot-wings-8.png)
      if (item.name.toLowerCase().includes('wing')) {
        imageUrl = getDefaultImage(item.category || '', item.name);
      } else if (!imageUrl) {
        // For other items, use stored URL or generate default
        imageUrl = getDefaultImage(item.category || '', item.name);
      }
      
      return {
        ...item,
        image_url: imageUrl,
        video_url: videoUrl || undefined
      };
    });

    return processed;
  }, [allItems, selectedType, getDefaultImage]);

  // Filter items based on current selections (items are already filtered by type from database views)
  const filteredItems = useMemo(() => {
    let filtered = [...processedItems];

    // Category filtering
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => 
        item.category && item.category.toUpperCase().includes(selectedCategory.toUpperCase())
      );
    }

    // Search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    }

    // Sort by sort_order or name (database should already be sorted, but ensure it)
    return filtered.sort((a, b) => {
      const aOrder = a.sort_order ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.sort_order ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      return a.name.localeCompare(b.name);
    });
  }, [processedItems, selectedCategory, searchQuery]);

  // Get available categories based on actual items (already filtered by type from database)
  const categories = useMemo(() => {
    // Extract unique categories from processed items
    const uniqueCategories = Array.from(
      new Set(processedItems.map(item => item.category).filter(Boolean))
    ).sort();
    
    return uniqueCategories;
  }, [processedItems]);

  // Navigation handlers
  const nextSlide = useCallback(() => {
    if (currentIndex < filteredItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, filteredItems.length]);

  const prevSlide = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);
  
  // Touch handlers for swipe
  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = true;
  }, []);
  
  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    touchEndX.current = e.touches[0].clientX;
  }, []);
  
  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const swipeThreshold = 50; // minimum distance for swipe
    const diff = touchStartX.current - touchEndX.current;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swiped left - go to next
        nextSlide();
      } else {
        // Swiped right - go to previous
        prevSlide();
      }
    }
  }, [nextSlide, prevSlide]);

  const handleVideoClick = useCallback((item: MenuItem) => {
    if (item.video_url) {
      setModalVideoUrl(item.video_url);
      setModalItemName(item.name);
      setShowWatchItMadeModal(item.id);
    }
  }, []);

  const closeModal = useCallback(() => {
    setShowWatchItMadeModal('');
    setModalVideoUrl('');
    setModalItemName('');
  }, []);

  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedType, selectedCategory, searchQuery]);

  if (!isClient) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <div className={styles.loadingText}>Loading menu...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <div className={styles.loadingText}>Loading menu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Failed to load menu items. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerTop}>
            <div>
              <h2 className={styles.title}>Our Menu</h2>
              <p className={styles.subtitle}>Fresh & Authentic</p>
            </div>
            <div className={styles.liveIndicator}>
              <span className={styles.liveDot}></span>
              <span className={styles.liveText}>Live Menu</span>
            </div>
          </div>
        </div>
      </div>

      {/* Type Tabs */}
      <div className={styles.tabs}>
        <div className={styles.tabsContent}>
          <div className={styles.tabsList}>
            <button
              onClick={() => {
                setSelectedType('all');
                setSelectedCategory('all');
              }}
              className={`${styles.tab} ${selectedType === 'all' ? `${styles.active} ${styles.tabAll}` : styles.inactive}`}
            >
              All Items
            </button>
            <button
              onClick={() => {
                setSelectedType('food');
                setSelectedCategory('all');
              }}
              className={`${styles.tab} ${selectedType === 'food' ? `${styles.active} ${styles.tabFood}` : styles.inactive}`}
            >
              Food Menu
            </button>
            <button
              onClick={() => {
                setSelectedType('drinks');
                setSelectedCategory('all');
              }}
              className={`${styles.tab} ${selectedType === 'drinks' ? `${styles.active} ${styles.tabDrinks}` : styles.inactive}`}
            >
              Drink Menu
            </button>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className={styles.categoryNav}>
        <div className={styles.categoryScroll}>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`${styles.categoryButton} ${selectedCategory === 'all' ? styles.active : styles.inactive}`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category ?? 'all')}
              className={`${styles.categoryButton} ${selectedCategory === category ? styles.active : styles.inactive}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="px-4 py-4">
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md mx-auto block px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
          />
        </div>
      )}

      {/* Item counter for mobile */}
      {filteredItems.length > 0 && (
        <div className={styles.counter}>
          <span>{currentIndex + 1} / {filteredItems.length}</span>
        </div>
      )}

      {/* Mobile Slider with Touch Support */}
      <div className={styles.mobileSlider}>
        <div className={styles.sliderContainer}>
          {filteredItems.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No items found</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-red-500 hover:text-red-400 mt-4"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div 
              ref={sliderRef}
              className={styles.sliderTrack}
              data-current-index={currentIndex}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {filteredItems.map((item) => (
                <div key={item.id} className={styles.sliderItem}>
                  <MenuCard 
                    item={item} 
                    onVideoClick={() => handleVideoClick(item)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Grid */}
      <div className={styles.desktopGrid}>
        <div className={styles.gridContainer}>
          {filteredItems.map((item) => (
            <MenuCard 
              key={item.id}
              item={item} 
              onVideoClick={() => handleVideoClick(item)}
            />
          ))}
        </div>
      </div>


      {/* Watch It Made Modal */}
      {showWatchItMadeModal && modalVideoUrl && (
        <WatchItMadeModal
          videoUrl={modalVideoUrl}
          itemName={modalItemName}
          onCloseAction={closeModal}
        />
      )}
    </div>
  );
}

// Separate MenuCard component for better performance
interface MenuCardProps {
  item: MenuItem;
  onVideoClick: () => void;
}

function MenuCard({ item, onVideoClick }: MenuCardProps) {
  return (
    <div className={styles.menuCard}>
      <div className={styles.imageContainer}>
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            className={styles.image}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : null}
        {/* Always show placeholder as background/fallback */}
        <div 
          className={styles.imagePlaceholder}
          style={{ 
            display: item.image_url ? 'none' : 'flex' 
          }}
        >
          <div className={styles.placeholderContent}>
            <div className={styles.placeholderIcon}>🍽️</div>
            <div className={styles.placeholderText}>{item.name}</div>
          </div>
        </div>
        {item.featured && (
          <div className={styles.featuredBadge}>Featured</div>
        )}
        {item.category && (
          <div className={styles.categoryBadge}>{item.category}</div>
        )}
      </div>
      
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3 className={styles.itemName}>{item.name}</h3>
          {item.description && (
            <p className={styles.itemDescription}>{item.description}</p>
          )}
        </div>
        
        <div className={styles.cardFooter}>
          <span className={styles.price}>${item.price.toFixed(2)}</span>
          {item.prep_time_minutes && (
            <div className={styles.prepTime}>
              <Clock className="w-3 h-3" />
              <span>{item.prep_time_minutes}m</span>
            </div>
          )}
        </div>
        
        {item.video_url && (
          <button 
            onClick={onVideoClick}
            className={styles.videoButton}
          >
            <Play className="h-4 w-4" />
            Watch It Being Made
          </button>
        )}
      </div>
    </div>
  );
}