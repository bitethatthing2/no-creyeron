import { useCallback, useEffect, useState } from "react";
import { MenuFilters, MenuItem } from "@/types/functions/MENU_ITEMS";
import { menuApiService } from "@/lib/services/menu-api.service";

export const useMenuItems = (filters: MenuFilters = {}) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Use stable filters reference by destructuring specific properties
  const {
    is_active,
    is_available,
    limit,
    offset,
    category,
    featured,
    search,
    sort_by,
    sort_order,
  } = filters;

  useEffect(() => {
    let mounted = true;

    const fetchItems = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await menuApiService.getMenuItems(filters);

        if (mounted) {
          setItems(data.data);
          setTotalCount(data.total_count);
          setHasMore(data.pagination?.has_more || false);
        }
      } catch (err) {
        if (mounted) {
          console.error("Failed to fetch menu items:", err);
          setError(
            err instanceof Error ? err.message : "Failed to fetch menu items",
          );
          setItems([]); // Fallback to empty array
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchItems();

    return () => {
      mounted = false;
    };
  }, [
    is_active,
    is_available,
    limit,
    offset,
    category,
    featured,
    search,
    sort_by,
    sort_order,
    filters,
  ]); // Use specific filter properties and filters object

  // Use useCallback for stable function reference
  const searchItems = useCallback(
    async (
      query: string,
      additionalFilters: Omit<MenuFilters, "search"> = {},
    ) => {
      setLoading(true);
      setError(null);

      try {
        const data = await menuApiService.searchMenuItems(
          query,
          additionalFilters,
        );
        setItems(data.data);
        setTotalCount(data.total_count);
        setHasMore(data.pagination?.has_more || false);
      } catch (err) {
        console.error("Failed to search menu items:", err);
        setError(err instanceof Error ? err.message : "Search failed");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Stable refetch function
  const refetch = useCallback(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await menuApiService.getMenuItems(filters);
        setItems(data.data);
        setTotalCount(data.total_count);
        setHasMore(data.pagination?.has_more || false);
      } catch (err) {
        console.error("Failed to fetch menu items:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch menu items",
        );
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [filters]);

  return {
    items,
    loading,
    error,
    totalCount,
    hasMore,
    refetch,
    searchItems,
  };
};

// Additional hook for fetching item types and categories
export const useMenuMetadata = () => {
  const [types, setTypes] = useState<Array<{ type: string; count: number }>>(
    [],
  );
  const [categories, setCategories] = useState<
    Array<{ category: string; count: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    setLoading(true);
    setError(null);

    try {
      const { types, categories } = await menuApiService.getMenuMetadata();
      setTypes(types.data);
      setCategories(categories.data);
    } catch (err) {
      console.error("Failed to fetch metadata:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch metadata");
    } finally {
      setLoading(false);
    }
  };

  return { types, categories, loading, error, refetch: fetchMetadata };
};

// Hook for fetching featured items
export const useFeaturedItems = () => {
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeaturedItems();
  }, []);

  const fetchFeaturedItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await menuApiService.getFeaturedItems();
      setFeaturedItems(data.data);
    } catch (err) {
      console.error("Failed to fetch featured items:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch featured items",
      );
      setFeaturedItems([]);
    } finally {
      setLoading(false);
    }
  };

  return { featuredItems, loading, error, refetch: fetchFeaturedItems };
};
