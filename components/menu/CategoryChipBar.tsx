'use client';

import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryChipBarProps {
  categories: Array<{
    id: string;
    name: string;
    type: 'food' | 'drink' | 'all' | 'popular' | 'special';
    item_count?: number;
  }>;
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  loading?: boolean;
}

export default function CategoryChipBar({
  categories,
  activeCategory,
  onCategoryChange,
  loading = false
}: CategoryChipBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Check scroll position and update arrow visibility
  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  // Handle scroll events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      setIsScrolling(true);
      updateScrollButtons();
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    updateScrollButtons();
    
    // Check on resize
    const resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(container);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      clearTimeout(scrollTimeout);
    };
  }, [categories]);

  // Auto-scroll to active category
  useEffect(() => {
    if (!scrollContainerRef.current || !activeCategory) return;
    
    const activeButton = scrollContainerRef.current.querySelector(
      `[data-category-id="${activeCategory}"]`
    );
    
    if (activeButton) {
      activeButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeCategory]);

  // Scroll handlers for arrow buttons
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="relative bg-background border-b">
        <div className="flex items-center px-2 py-3 gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-9 w-20 bg-muted rounded-full flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-background border-b sticky top-0 z-40">
      {/* Left scroll button (desktop only) */}
      <button
        onClick={scrollLeft}
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 z-10",
          "hidden md:flex items-center justify-center",
          "h-8 w-8 rounded-full bg-background border shadow-sm",
          "hover:bg-muted transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          !canScrollLeft && "invisible"
        )}
        disabled={!canScrollLeft}
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Scroll container */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className={cn(
            "flex items-center gap-2 px-2 py-3 overflow-x-auto",
            "scrollbar-hide scroll-smooth snap-x snap-mandatory",
            "md:px-12", // Extra padding on desktop for arrow buttons
            isScrolling && "pointer-events-none"
          )}
        >
          {categories.map((category) => {
            const isActive = category.id === activeCategory;
            const isSpecial = ['all', 'popular', 'special'].includes(category.type);
            
            return (
              <button
                key={category.id}
                data-category-id={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  // Base styles
                  "flex items-center gap-1.5 px-4 py-2 rounded-full",
                  "font-medium text-sm whitespace-nowrap select-none",
                  "transition-all duration-200 ease-out",
                  "snap-start flex-shrink-0",
                  
                  // Touch feedback
                  "active:scale-95",
                  
                  // Active/inactive states
                  isActive ? [
                    "bg-primary text-primary-foreground",
                    "shadow-md shadow-primary/20",
                    "border border-primary"
                  ] : [
                    "bg-muted text-muted-foreground",
                    "hover:bg-muted/80 hover:text-foreground",
                    "border border-transparent"
                  ],
                  
                  // Special categories styling
                  isSpecial && !isActive && "border-muted-foreground/20",
                  
                  // Minimum touch target
                  "min-h-[36px] min-w-fit",
                  
                  // Focus styles
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                )}
              >
                {/* Popular category gets a star icon */}
                {category.type === 'popular' && (
                  <Star className={cn(
                    "h-3.5 w-3.5",
                    isActive ? "fill-current" : "fill-none"
                  )} />
                )}
                
                <span>{category.name}</span>
                
                {/* Item count badge */}
                {category.item_count !== undefined && category.item_count > 0 && (
                  <span className={cn(
                    "text-xs",
                    isActive ? "opacity-80" : "opacity-60"
                  )}>
                    ({category.item_count})
                  </span>
                )}
              </button>
            );
          })}
          
          {/* Scroll padding */}
          <div className="w-2 flex-shrink-0" aria-hidden="true" />
        </div>

        {/* Edge fade indicators (mobile) */}
        <div 
          className={cn(
            "absolute left-0 top-0 bottom-0 w-8",
            "bg-gradient-to-r from-background to-transparent",
            "pointer-events-none md:hidden",
            !canScrollLeft && "opacity-0"
          )}
          aria-hidden="true"
        />
        <div 
          className={cn(
            "absolute right-0 top-0 bottom-0 w-8",
            "bg-gradient-to-l from-background to-transparent",
            "pointer-events-none md:hidden",
            !canScrollRight && "opacity-0"
          )}
          aria-hidden="true"
        />
      </div>

      {/* Right scroll button (desktop only) */}
      <button
        onClick={scrollRight}
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 z-10",
          "hidden md:flex items-center justify-center",
          "h-8 w-8 rounded-full bg-background border shadow-sm",
          "hover:bg-muted transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          !canScrollRight && "invisible"
        )}
        disabled={!canScrollRight}
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}