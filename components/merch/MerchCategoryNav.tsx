'use client';

import { useRef, useEffect } from 'react';
import { 
  ShoppingBag,
  ChevronLeft, ChevronRight
} from "lucide-react";
import type { MerchCategory } from '@/types/features/merch';

// Map of category IDs to icons
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  // apparel: <TShirt className="h-4 w-4" />,
  // drinkware: <Coffee className="h-4 w-4" />,
  // accessories: <Watch className="h-4 w-4" />,
  // headwear: <Hat className="h-4 w-4" />,
  default: <ShoppingBag className="h-4 w-4" />
};

interface MerchCategoryNavProps {
  categories: MerchCategory[];
  activeCategory: string;
  onCategoryChangeAction: (categoryId: string) => void;
  scrollToCategory?: (categoryId: string) => void;
}

export const MerchCategoryNav = ({ 
  categories, 
  activeCategory, 
  onCategoryChangeAction,
  scrollToCategory 
}: MerchCategoryNavProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = (categoryId: string) => {
    onCategoryChangeAction(categoryId);
    if (scrollToCategory) {
      scrollToCategory(categoryId);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Scroll active category into view when it changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeButton = scrollContainerRef.current.querySelector(`[data-category-id="${activeCategory}"]`);
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeCategory]);

  return (
    <div 
      ref={navRef} 
      className="sticky top-14 z-40 bg-background/95 backdrop-blur-md border-b pb-1 pt-1 shadow-sm"
    >
      <div className="flex items-center px-2 max-w-7xl mx-auto relative">
        <button 
          className="h-9 w-9 rounded-md bg-background/80 text-foreground border border-input inline-flex items-center justify-center shrink-0 absolute left-0 z-10" 
          onClick={scrollLeft}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div 
          ref={scrollContainerRef} 
          className="flex space-x-1 py-2 px-6 overflow-x-auto menu-scrollbar-hide"
        >
          {categories.map((category) => {
            const icon = CATEGORY_ICONS[category.id] || CATEGORY_ICONS.default;

            return (
              <button
                key={category.id}
                data-category-id={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`h-8 px-3 rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all ${activeCategory === category.id
                  ? 'bg-primary text-primary-foreground font-medium scale-105'
                  : 'bg-background text-foreground border border-input'
                }`}
              >
                {icon}
                <span className="ml-1">{category.name}</span>
              </button>
            );
          })}
        </div>

        <button 
          className="h-9 w-9 rounded-md bg-background/80 text-foreground border border-input inline-flex items-center justify-center shrink-0 absolute right-0 z-10" 
          onClick={scrollRight}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
