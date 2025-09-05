// Menu API Service - Fixed version using only available methods
import {
  MenuCategoryResponse,
  MenuFilters,
  MenuItem,
  MenuResponse,
  MenuSearchFilters,
  MenuTypeResponse,
} from "../types/MENU_ITEMS";

import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";
import {
  menuCategories as localCategories,
  menuItems as localMenuItems,
} from "@/lib/data/menu-items";

// Using centralized Supabase client

// Type for database category
interface DatabaseCategory {
  id: string;
  name: string;
  type: string;
  display_order: number | null;
  is_active: boolean | null;
}

class MenuApiService {
  /**
   * Convert null to undefined for MenuItem compatibility
   */
  private nullToUndefined<T>(value: T | null): T | undefined {
    return value === null ? undefined : value;
  }

  /**
   * Query using Edge Function (production data)
   */
  private async queryEdgeFunction(
    filters: MenuFilters = {},
  ): Promise<MenuResponse> {
    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (filters.type) params.set("type", filters.type);
      if (filters.category) params.set("category", filters.category);
      if (filters.is_available !== undefined) {
        params.set("is_available", filters.is_available.toString());
      }
      if (filters.featured !== undefined) {
        params.set("featured", filters.featured.toString());
      }
      if (filters.search) params.set("search", filters.search);
      if (filters.limit) params.set("limit", filters.limit.toString());
      if (filters.offset) params.set("offset", filters.offset.toString());
      if (filters.sort_by) params.set("sort_by", filters.sort_by);
      if (filters.sort_order) params.set("sort_order", filters.sort_order);

      // Use production edge function for complete data
      const edgeFunctionUrl =
        "https://tvnpgbjypnezoasbhbwx.supabase.co/functions/v1/MENU_ITEMS/items";
      const url = `${edgeFunctionUrl}?${params.toString()}`;

      console.log("Fetching from edge function:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          "Authorization": `Bearer ${
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
          }`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Edge function returned ${response.status}: ${response.statusText}`,
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Edge function returned error");
      }

      // Transform edge function data to MenuItem interface
      const items: MenuItem[] = (result.data || []).map(
        (item: Record<string, unknown>) => {
          // Find category info if not provided directly
          let categoryName = this.nullToUndefined(
            item.category_name as string | null ||
              item.category as string | null,
          );
          let categoryType = this.nullToUndefined(
            item.category_type as string | null || item.type as string | null,
          );

          // If category info is missing, try to find it from category_id
          if (!categoryName && item.category_id) {
            const categoryInfo = localCategories.find((cat) =>
              cat.id === item.category_id
            );
            if (categoryInfo) {
              categoryName = categoryInfo.name;
              categoryType = categoryInfo.type;
            }
          }

          return {
            id: item.id as string,
            name: item.name as string,
            price: item.price as number,
            is_active: (item.is_active as boolean | null) ?? true,
            is_available: (item.is_available as boolean | null) ?? true,
            featured: (item.is_featured as boolean | null) ?? false,
            created_at: (item.created_at as string) || "",
            updated_at: (item.updated_at as string) || "",
            description: this.nullToUndefined(
              item.description as string | null,
            ),
            type: categoryType,
            category: categoryName,
            image_url: this.nullToUndefined(item.image_url as string | null),
            video_url: this.nullToUndefined(item.video_url as string | null),
            thumbnail_url: this.nullToUndefined(
              (item.video_thumbnail_url || item.thumbnail_url) as string | null,
            ),
            sort_order: this.nullToUndefined(
              (item.display_order || item.sort_order) as number | null,
            ),
            spice_level: this.nullToUndefined(
              item.spice_level as number | null,
            ),
            prep_time_minutes: this.nullToUndefined(
              item.prep_time_minutes as number | null,
            ),
            preparation_time: this.nullToUndefined(
              item.prep_time_minutes as number | null,
            ),
            allergens: this.nullToUndefined(item.allergens as string[] | null),
          };
        },
      );

      return {
        success: true,
        data: items,
        total_count: result.total_count || items.length,
        pagination: {
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          has_more: result.pagination?.has_more || false,
        },
      };
    } catch (error) {
      console.error("Edge function query error:", error);
      console.log("Falling back to local menu data");

      // Fallback to local data
      return this.getLocalMenuItems(filters);
    }
  }

  /**
   * Get local menu items as fallback
   */
  private getLocalMenuItems(filters: MenuFilters = {}): MenuResponse {
    let filteredItems = localMenuItems.map((item) => {
      const category = localCategories.find((cat) =>
        cat.id === ((item as unknown) as Record<string, unknown>).category_id
      );
      return {
        ...item,
        type: category?.type,
        category: category?.name,
      } as MenuItem;
    });

    // Apply filters
    if (filters.type) {
      filteredItems = filteredItems.filter((item) =>
        item.type === filters.type
      );
    }

    if (filters.category) {
      filteredItems = filteredItems.filter((item) =>
        item.category?.toLowerCase() === filters.category?.toLowerCase()
      );
    }

    if (filters.is_available !== undefined) {
      filteredItems = filteredItems.filter((item) =>
        item.is_available === filters.is_available
      );
    }

    if (filters.featured !== undefined) {
      filteredItems = filteredItems.filter((item) =>
        item.featured === filters.featured
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredItems = filteredItems.filter((item) =>
        item.name.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    const sortBy = filters.sort_by || "sort_order";
    const sortOrder = filters.sort_order || "asc";

    filteredItems.sort((a, b) => {
      const field = sortBy as keyof MenuItem;
      const aVal = a[field];
      const bVal = b[field];

      if (aVal === undefined) return 1;
      if (bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === "desc" ? -comparison : comparison;
    });

    // Apply pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const paginatedItems = filteredItems.slice(offset, offset + limit);

    return {
      success: true,
      data: paginatedItems,
      total_count: filteredItems.length,
      pagination: {
        limit,
        offset,
        has_more: offset + limit < filteredItems.length,
      },
    };
  }

  /**
   * Get menu items with optional filters
   */
  async getMenuItems(filters: MenuFilters = {}): Promise<MenuResponse> {
    return this.queryEdgeFunction(filters);
  }

  /**
   * Get food items only using the dedicated food endpoint
   */
  async getFoodItems(
    filters: Omit<MenuFilters, "type"> = {},
  ): Promise<MenuResponse> {
    console.log("🍔 getFoodItems called with filters:", filters);
    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (filters.category) params.set("category", filters.category);
      if (filters.is_available !== undefined) {
        params.set("is_available", filters.is_available.toString());
      }
      if (filters.featured !== undefined) {
        params.set("featured", filters.featured.toString());
      }
      if (filters.search) params.set("search", filters.search);
      if (filters.limit) params.set("limit", filters.limit.toString());
      if (filters.offset) params.set("offset", filters.offset.toString());
      if (filters.sort_by) params.set("sort_by", filters.sort_by);
      if (filters.sort_order) params.set("sort_order", filters.sort_order);

      // Use dedicated food endpoint
      const edgeFunctionUrl =
        "https://tvnpgbjypnezoasbhbwx.supabase.co/functions/v1/MENU_ITEMS/food";
      const url = `${edgeFunctionUrl}?${params.toString()}`;

      console.log("Fetching food items from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          "Authorization": `Bearer ${
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
          }`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Food endpoint returned ${response.status}: ${response.statusText}`,
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Food endpoint returned error");
      }

      return {
        success: true,
        data: result.data || [],
        total_count: result.total_count || 0,
        pagination: {
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          has_more: result.pagination?.has_more || false,
        },
      };
    } catch (error) {
      console.error("Food items query error:", error);
      console.error(
        "Food endpoint URL was:",
        `https://tvnpgbjypnezoasbhbwx.supabase.co/functions/v1/MENU_ITEMS/food`,
      );
      console.error("Food error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack",
        type: typeof error,
        error: error,
      });
      console.log("Falling back to local food data");

      // Fallback to local data
      return this.getLocalMenuItems({ ...filters, type: "food" });
    }
  }

  /**
   * Get drink items only using the dedicated drink endpoint
   */
  async getDrinkItems(
    filters: Omit<MenuFilters, "type"> = {},
  ): Promise<MenuResponse> {
    console.log("🍺 getDrinkItems called with filters:", filters);
    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (filters.category) params.set("category", filters.category);
      if (filters.is_available !== undefined) {
        params.set("is_available", filters.is_available.toString());
      }
      if (filters.featured !== undefined) {
        params.set("featured", filters.featured.toString());
      }
      if (filters.search) params.set("search", filters.search);
      if (filters.limit) params.set("limit", filters.limit.toString());
      if (filters.offset) params.set("offset", filters.offset.toString());
      if (filters.sort_by) params.set("sort_by", filters.sort_by);
      if (filters.sort_order) params.set("sort_order", filters.sort_order);

      // Use dedicated drink endpoint
      const edgeFunctionUrl =
        "https://tvnpgbjypnezoasbhbwx.supabase.co/functions/v1/MENU_ITEMS/drink";
      const url = `${edgeFunctionUrl}?${params.toString()}`;

      console.log("Fetching drink items from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          "Authorization": `Bearer ${
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
          }`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Drink endpoint returned ${response.status}: ${response.statusText}`,
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Drink endpoint returned error");
      }

      return {
        success: true,
        data: result.data || [],
        total_count: result.total_count || 0,
        pagination: {
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          has_more: result.pagination?.has_more || false,
        },
      };
    } catch (error) {
      console.error("Drink items query error:", error);
      console.error(
        "Drink endpoint URL was:",
        `https://tvnpgbjypnezoasbhbwx.supabase.co/functions/v1/MENU_ITEMS/drink`,
      );
      console.error("Drink error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack",
        type: typeof error,
        error: error,
      });
      console.log("Falling back to local drink data");

      // Fallback to local data
      return this.getLocalMenuItems({ ...filters, type: "drink" });
    }
  }

  /**
   * Alias for getMenuItems
   */
  async getMenuList(filters: MenuFilters = {}): Promise<MenuResponse> {
    return this.queryEdgeFunction(filters);
  }

  /**
   * Direct database access
   */
  async getMenuItemsDirect(filters: MenuFilters = {}): Promise<MenuResponse> {
    // Just use the edge function
    return this.queryEdgeFunction(filters);
  }

  /**
   * Search menu items
   */
  async searchMenuItems(
    query: string,
    filters: MenuSearchFilters = {},
  ): Promise<MenuResponse> {
    const menuFilters: MenuFilters = {
      search: query,
      type: filters.type,
      category: filters.category,
      featured: filters.featured,
      is_available: true,
      is_active: true,
    };

    return this.queryEdgeFunction(menuFilters);
  }

  /**
   * Get single menu item by ID
   */
  async getMenuItem(
    id: string,
  ): Promise<{ success: boolean; data: MenuItem; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select(`
          *,
          menu_categories!inner (
            id,
            name,
            type
          )
        `)
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        throw new Error(error?.message || "Item not found");
      }

      const categoryData = Array.isArray(data.menu_categories)
        ? data.menu_categories[0]
        : data.menu_categories as DatabaseCategory | null;

      const item: MenuItem = {
        id: data.id,
        name: data.name,
        price: data.price,
        is_active: data.is_active ?? true,
        is_available: data.is_available ?? true,
        featured: data.is_featured ?? false,
        created_at: data.created_at || "",
        updated_at: data.updated_at || "",
        description: this.nullToUndefined(data.description),
        type: categoryData?.type,
        category: categoryData?.name,
        image_url: this.nullToUndefined(data.image_url),
        video_url: this.nullToUndefined(data.video_url),
        thumbnail_url: this.nullToUndefined(data.video_thumbnail_url),
        sort_order: this.nullToUndefined(data.display_order),
        spice_level: this.nullToUndefined(data.spice_level),
        prep_time_minutes: this.nullToUndefined(data.prep_time_minutes),
        preparation_time: this.nullToUndefined(data.prep_time_minutes),
        allergens: this.nullToUndefined(data.allergens),
      };

      return { success: true, data: item };
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Failed to get item";
      const emptyItem: MenuItem = {
        id: "",
        name: "",
        price: 0,
        is_active: false,
        is_available: false,
        featured: false,
        created_at: "",
        updated_at: "",
      };
      return {
        success: false,
        data: emptyItem,
        error: message,
      };
    }
  }

  /**
   * Get featured menu items
   */
  async getFeaturedItems(): Promise<MenuResponse> {
    return this.queryEdgeFunction({
      featured: true,
      is_active: true,
      is_available: true,
      limit: 20,
    });
  }

  /**
   * Get menu categories
   */
  async getMenuCategories(): Promise<MenuCategoryResponse> {
    try {
      const { data, error } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .returns<DatabaseCategory[]>();

      if (error) throw error;

      // Get item counts for each category
      const categoriesWithCounts = await Promise.all(
        (data || []).map(async (cat) => {
          const { count } = await supabase
            .from("menu_items")
            .select("*", { count: "exact", head: true })
            .eq("category_id", cat.id)
            .eq("is_active", true);

          return {
            category: cat.name,
            id: cat.id,
            type: cat.type,
            count: count || 0,
          };
        }),
      );

      return {
        success: true,
        data: categoriesWithCounts,
        total: categoriesWithCounts.length,
      };
    } catch (error) {
      console.error("getMenuCategories error:", error);

      // Fallback to local categories
      const categories = localCategories
        .filter((cat) => cat.is_active)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        .map((cat) => ({
          category: cat.name ?? "",
          count: 0,
        }));

      return {
        success: true,
        data: categories,
        total: categories.length,
      };
    }
  }

  /**
   * Get menu types
   */
  async getMenuTypes(): Promise<MenuTypeResponse> {
    try {
      const { data } = await supabase
        .from("menu_categories")
        .select("type")
        .eq("is_active", true)
        .returns<{ type: string }[]>();

      const typeCounts = new Map<string, number>();

      for (const item of data || []) {
        typeCounts.set(item.type, (typeCounts.get(item.type) || 0) + 1);
      }

      const types = Array.from(typeCounts.entries()).map(([type, count]) => ({
        type,
        count,
      }));

      return {
        success: true,
        data: types,
        total: types.length,
      };
    } catch (error) {
      console.error("getMenuTypes error:", error);
      return {
        success: false,
        data: [
          { type: "food", count: 0 },
          { type: "drink", count: 0 },
        ],
        total: 2,
      };
    }
  }

  /**
   * Get grouped items
   */
  async getGroupedItems(groupBy: "type" | "category"): Promise<{
    success: boolean;
    grouped_by: string;
    groups: Record<string, MenuItem[]>;
    total_groups: number;
    total_items: number;
  }> {
    try {
      const response = await this.queryEdgeFunction({
        is_active: true,
        is_available: true,
      });

      if (!response.success) {
        throw new Error("Failed to fetch menu items");
      }

      const groups: Record<string, MenuItem[]> = {};

      response.data.forEach((item) => {
        const key = groupBy === "type"
          ? (item.type || "other")
          : (item.category || "uncategorized");
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
      });

      return {
        success: true,
        grouped_by: groupBy,
        groups,
        total_groups: Object.keys(groups).length,
        total_items: response.data.length,
      };
    } catch (error) {
      console.error("getGroupedItems error:", error);
      return {
        success: false,
        grouped_by: groupBy,
        groups: {},
        total_groups: 0,
        total_items: 0,
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    version?: string;
  }> {
    try {
      const { count } = await supabase
        .from("menu_items")
        .select("*", { count: "exact", head: true });

      return {
        status: count !== null ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        version: "2.0.0",
      };
    } catch (error) {
      return {
        status: "error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get metadata
   */
  async getMenuMetadata(): Promise<{
    types: MenuTypeResponse;
    categories: MenuCategoryResponse;
  }> {
    const [types, categories] = await Promise.all([
      this.getMenuTypes(),
      this.getMenuCategories(),
    ]);

    return { types, categories };
  }

  /**
   * Get homepage items
   */
  async getHomepageItems(): Promise<{
    featured: MenuResponse;
    recent: MenuResponse;
  }> {
    const [featured, recent] = await Promise.all([
      this.getFeaturedItems(),
      this.getMenuItems({
        limit: 8,
        sort_by: "created_at",
        sort_order: "desc",
        is_available: true,
      }),
    ]);

    return { featured, recent };
  }

  /**
   * Advanced search
   */
  async advancedSearch(params: {
    query?: string;
    type?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    spiceLevel?: number;
    maxPrepTime?: number;
    excludeAllergens?: string[];
    featuredOnly?: boolean;
  }): Promise<MenuResponse> {
    const filters: MenuFilters = {
      search: params.query,
      type: params.type,
      category: params.category,
      featured: params.featuredOnly,
      is_available: true,
      is_active: true,
    };

    const response = await this.queryEdgeFunction(filters);

    // Apply additional filters
    if (response.success) {
      let filteredData = response.data;

      if (params.minPrice !== undefined) {
        filteredData = filteredData.filter((item) =>
          item.price >= params.minPrice!
        );
      }

      if (params.maxPrice !== undefined) {
        filteredData = filteredData.filter((item) =>
          item.price <= params.maxPrice!
        );
      }

      if (params.spiceLevel !== undefined) {
        filteredData = filteredData.filter((item) =>
          item.spice_level !== undefined &&
          item.spice_level <= params.spiceLevel!
        );
      }

      if (params.maxPrepTime !== undefined) {
        filteredData = filteredData.filter((item) =>
          item.prep_time_minutes !== undefined &&
          item.prep_time_minutes <= params.maxPrepTime!
        );
      }

      if (params.excludeAllergens && params.excludeAllergens.length > 0) {
        filteredData = filteredData.filter((item) => {
          if (!item.allergens) return true;
          return !params.excludeAllergens!.some((allergen) =>
            item.allergens?.includes(allergen)
          );
        });
      }

      response.data = filteredData;
      response.total_count = filteredData.length;
    }

    return response;
  }
}

// Export singleton instance
export const menuApiService = new MenuApiService();

// Export class for testing
export { MenuApiService };
