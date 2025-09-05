import { useMemo, useEffect } from "react";
import { useDebounceValue, useToggle, useLocalStorage } from 'usehooks-ts';
import { usePrevious } from './enhanced/usePrevious';
import { MenuFilters, MenuItem } from "@/lib/edge-functions/types/MENU_ITEMS";
import { menuApiService } from "@/lib/edge-functions/services/menu-api.service";

// Custom hook using react-query pattern with usehooks-ts
function useAsyncData<T>(
  fetcher: () => Promise<T>,
  key: string,
  deps: any[] = []
) {
  const [data, setData] = useLocalStorage<T | null>(`menu-${key}`, null);
  const [error, setError] = useLocalStorage<string | null>(`menu-error-${key}`, null);
  const [loading, toggleLoading, setLoading] = useToggle(false);
  
  const prevDeps = usePrevious(deps);
  
  useEffect(() => {
    const depsChanged = JSON.stringify(deps) !== JSON.stringify(prevDeps);
    if (depsChanged) {
      setLoading(true);
      setError(null);
      
      fetcher()
        .then(result => {
          setData(result);
          setError(null);
        })
        .catch(err => {
          setError(err instanceof Error ? err.message : 'Fetch failed');
          setData(null);
        })
        .finally(() => setLoading(false));
    }
  }, deps);

  return { data, error, loading, refetch: () => toggleLoading() };
}

// Main hook - dramatically simplified with usehooks-ts
export const useMenuItems = (filters: MenuFilters = {}) => {
  const [debouncedFilters] = useDebounceValue(filters, 500);
  
  const { data: response, error, loading, refetch } = useAsyncData(
    () => menuApiService.getMenuItems(debouncedFilters),
    `items-${JSON.stringify(debouncedFilters)}`,
    [debouncedFilters]
  );

  return {
    items: response?.data || [],
    loading,
    error,
    totalCount: response?.total_count || 0,
    hasMore: response?.pagination?.has_more || false,
    refetch
  };
};

// Search hook - optimized with debounce
export const useMenuSearch = (query: string, filters: Omit<MenuFilters, "search"> = {}) => {
  const [debouncedQuery] = useDebounceValue(query, 500);
  const [debouncedFilters] = useDebounceValue(filters, 300);
  
  const { data: response, error, loading } = useAsyncData(
    () => debouncedQuery ? menuApiService.searchMenuItems(debouncedQuery, debouncedFilters) : Promise.resolve({ success: true, data: [], total_count: 0 }),
    `search-${debouncedQuery}-${JSON.stringify(debouncedFilters)}`,
    [debouncedQuery, debouncedFilters]
  );

  return {
    items: response?.data || [],
    loading,
    error,
    totalCount: response?.total_count || 0,
  };
};

// Metadata hook - cached with localStorage
export const useMenuMetadata = () => {
  const { data, error, loading, refetch } = useAsyncData(
    async () => {
      const { types, categories } = await menuApiService.getMenuMetadata();
      return { types: types.data, categories: categories.data };
    },
    'metadata',
    [] // Only fetch once
  );

  return {
    types: data?.types || [],
    categories: data?.categories || [],
    loading,
    error,
    refetch
  };
};

// Featured items hook - simple and cached
export const useFeaturedItems = () => {
  const { data: response, error, loading, refetch } = useAsyncData(
    () => menuApiService.getFeaturedItems(),
    'featured',
    []
  );

  return {
    featuredItems: response?.data || [],
    loading,
    error,
    refetch
  };
};