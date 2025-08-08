'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import type { MenuItemWithModifiers, MenuCategoryWithCount } from '@/types/features/menu';

interface MenuSearchProps {
  items: MenuItemWithModifiers[];
  categories: MenuCategoryWithCount[];
  onFilteredItemsChange: (items: MenuItemWithModifiers[]) => void;
  onSearchStateChange: (searching: boolean) => void;
}

export default function MenuSearch({
  items,
  categories,
  onFilteredItemsChange,
  onSearchStateChange
}: MenuSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Debounced search function
  const performSearch = useCallback((term: string, categoryFilter: string) => {
    const isSearching = term.trim() !== '' || categoryFilter !== '';
    onSearchStateChange(isSearching);

    if (!isSearching) {
      onFilteredItemsChange(items);
      return;
    }

    let filtered = items;

    // Filter by search term
    if (term.trim() !== '') {
      const searchLower = term.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.category?.name && item.category.name.toLowerCase().includes(searchLower))
      );
    }

    // Filter by category
    if (categoryFilter !== '') {
      filtered = filtered.filter(item => item.category_id === categoryFilter);
    }

    onFilteredItemsChange(filtered);
  }, [items, onFilteredItemsChange, onSearchStateChange]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchTerm, selectedCategory);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, performSearch]);

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedCategory('');
  };

  const hasActiveFilters = searchTerm.trim() !== '' || selectedCategory !== '';

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search menu items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 bg-zinc-800 border-zinc-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm('')}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('')}
            className="text-xs"
          >
            All Categories
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="text-xs"
            >
              {category.name} ({category.item_count})
            </Button>
          ))}
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            {searchTerm && `Searching for "${searchTerm}"`}
            {searchTerm && selectedCategory && ' in '}
            {selectedCategory && categories.find(c => c.id === selectedCategory)?.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}