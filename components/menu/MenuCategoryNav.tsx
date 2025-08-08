// components/menu/MenuCategoryNav.tsx
import { useRef, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MenuCategory {
  id: string;
  name: string;
  type: 'food' | 'drink';
  description: string | null;
  display_order: number;
  is_active: boolean;
  icon: string | null;
  color: string | null;
  item_count?: number;
}

interface MenuCategoryNavProps {
  categories: MenuCategory[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  loading?: boolean;
}

// Get the appropriate CSS class based on category name and active state
const getCategoryColorClass = (name: string, isActive: boolean) => {
  const lowerName = (name || '').toLowerCase();
  
  // Food Categories
  if (lowerName.includes('small') || lowerName.includes('bite')) {
    return isActive ? 'menu-category-orange' : 'menu-category-inactive';
  }
  if (lowerName.includes('main')) {
    return isActive ? 'menu-category-blue' : 'menu-category-inactive';
  }
  if (lowerName.includes('meat') || lowerName.includes('beef')) {
    return isActive ? 'menu-category-red' : 'menu-category-inactive';
  }
  if (lowerName.includes('birria')) {
    return isActive ? 'menu-category-rose' : 'menu-category-inactive';
  }
  if (lowerName.includes('sea') || lowerName.includes('fish')) {
    return isActive ? 'menu-category-blue' : 'menu-category-inactive';
  }
  if (lowerName.includes('wings')) {
    return isActive ? 'menu-category-orange' : 'menu-category-inactive';
  }
  if (lowerName.includes('chefa') || lowerName.includes('sauce')) {
    return isActive ? 'menu-category-violet' : 'menu-category-inactive';
  }
  if (lowerName.includes('breakfast')) {
    return isActive ? 'menu-category-green' : 'menu-category-inactive';
  }
  if (lowerName.includes('special')) {
    return isActive ? 'menu-category-slate' : 'menu-category-inactive';
  }
  
  // Drink Categories
  if (lowerName.includes('boards') || lowerName.includes('malibu buckets')) {
    return isActive ? 'menu-category-amber' : 'menu-category-inactive';
  }
  if (lowerName.includes('flights') || lowerName.includes('non alcoholic')) {
    return isActive ? 'menu-category-cyan' : 'menu-category-inactive';
  }
  if (lowerName.includes('towers') || lowerName.includes('bottle beer')) {
    return isActive ? 'menu-category-indigo' : 'menu-category-inactive';
  }
  if (lowerName.includes('house favorites') || lowerName.includes('wine')) {
    return isActive ? 'menu-category-pink' : 'menu-category-inactive';
  }
  if (lowerName.includes('martinis')) {
    return isActive ? 'menu-category-teal' : 'menu-category-inactive';
  }
  if (lowerName.includes('margaritas') || lowerName.includes('refreshers')) {
    return isActive ? 'menu-category-lime' : 'menu-category-inactive';
  }
  
  return isActive ? 'menu-category-blue' : 'menu-category-inactive';
};

export default function MenuCategoryNav({ 
  categories, 
  activeCategory, 
  onCategoryChange,
  loading = false 
}: MenuCategoryNavProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Auto-scroll to active category on mount and when it changes
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

  // Handle momentum scrolling feedback
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex gap-2 p-3 overflow-hidden">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-10 w-24 bg-muted rounded-lg flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative bg-muted/50">
      {/* Scroll container */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "menu-category-scroll",
          "menu-scrollbar-hide", // Use standardized scrollbar hiding
          "scroll-smooth snap-x snap-mandatory",
          isScrolling && "pointer-events-none" // Prevent accidental taps while scrolling
        )}
      >
        {categories.map((category) => {
          const isActive = category.id === activeCategory;
          const colorClass = getCategoryColorClass(category.name, isActive);

          return (
            <button
              key={category.id}
              data-category-id={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                // Base styles
                "flex items-center gap-2 px-4 py-2.5 rounded-lg border",
                "font-medium text-sm whitespace-nowrap select-none",
                "transition-all duration-200 ease-out",
                "snap-start scroll-ml-3", // Snap alignment
                
                // Touch feedback
                "active:scale-95 active:transition-none",
                
                // Color classes from CSS
                "menu-category-button",
                colorClass,
                isActive && "menu-category-active",
                
                // Minimum touch target size
                "min-h-[44px] min-w-fit",
                
                // Focus styles for accessibility
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                
                // Touch optimization
                "menu-category-button-touch"
              )}
            >
              <span>{category.name}</span>
              {category.item_count !== undefined && category.item_count > 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "h-5 min-w-[20px] px-1.5 text-xs",
                    isActive ? "bg-white/20 text-white border-0" : ""
                  )}
                >
                  {category.item_count}
                </Badge>
              )}
            </button>
          );
        })}
        
        {/* Scroll padding at the end */}
        <div className="w-3 flex-shrink-0" aria-hidden="true" />
      </div>

      {/* Edge fade indicators (subtle on mobile) */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-muted/50 to-transparent pointer-events-none"
        aria-hidden="true"
      />
      <div 
        className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-muted/50 to-transparent pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}

// Alternative pill-style navigation for tablets/desktop
export function PillsCategoryNav({ 
  categories, 
  activeCategory, 
  onCategoryChange,
  loading = false 
}: MenuCategoryNavProps) {
  if (loading) {
    return (
      <div className="flex flex-wrap gap-2 p-4 justify-center">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-9 w-20 bg-muted rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 p-4 justify-center">
      {categories.map((category) => {
        const isActive = category.id === activeCategory;

        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-full",
              "text-sm font-medium transition-all duration-200",
              "hover:scale-105 active:scale-95",
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{category.name}</span>
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
    </div>
  );
}
