'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Play, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMenuItemVideoUrl } from '@/lib/constants/video-urls';
import { useMenuItems } from '@/hooks/useMenuItems';
import { MenuItem } from '@/types/functions/MENU_ITEMS';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import styles from './SliderMenu.module.css';

const WatchItMadeModal = dynamic(() => import('@/components/menu/WatchItMadeModal'), {
  ssr: false
});

interface SliderMenuProps {
  initialType?: 'food' | 'drinks' | 'all';
  showSearch?: boolean;
  autoPlay?: boolean;
  className?: string;
}

const FOOD_CATEGORIES = [
  'Popular', 'BIRRIA', 'BREAKFAST', 'Main', 'SEA FOOD', 
  'WINGS', 'Keto', 'Specials', 'Small Bites', 'Sides'
];

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
  const [selectedType, setSelectedType] = useState<'food' | 'drinks' | 'all'>(initialType);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWatchItMadeModal, setShowWatchItMadeModal] = useState('');
  const [modalVideoUrl, setModalVideoUrl] = useState('');
  const [modalItemName, setModalItemName] = useState('');

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
    const localUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
    
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
    
    const processed = filtered.map((item): MenuItem => ({
      ...item,
      image_url: item.image_url || getDefaultImage(item.category || '', item.name),
      video_url: item.video_url || getMenuItemVideoUrl(item.name) || undefined
    }));

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
              onClick={() => setSelectedCategory(category)}
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

      {/* Navigation Controls */}
      {filteredItems.length > 0 && (
        <div className={styles.controls}>
          <button
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className={styles.controlButton}
            aria-label="Previous item"
            title="Previous item"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className={styles.indicator}>
            {currentIndex + 1} of {filteredItems.length}
          </span>
          <button
            onClick={nextSlide}
            disabled={currentIndex >= filteredItems.length - 1}
            className={styles.controlButton}
            aria-label="Next item"
            title="Next item"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Mobile Slider */}
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
              className={styles.sliderTrack}
              data-current-index={currentIndex}
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

      {/* Results count */}
      {filteredItems.length > 0 && (
        <div className="text-center py-6 text-gray-400 text-sm">
          Showing {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
        </div>
      )}

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
            width={400}
            height={400}
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