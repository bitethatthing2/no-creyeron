// MENU_ITEMS Edge Function - Complete Implementation
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface MenuItemRecord {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  price: number;
  image_url?: string;
  video_url?: string;
  video_thumbnail_url?: string;
  is_active: boolean;
  is_available: boolean;
  is_featured: boolean;
  created_at?: string;
  updated_at?: string;
  display_order?: number;
  spice_level?: number;
  prep_time_minutes?: number;
  allergens?: string[];
  has_video?: boolean;
}

interface MenuFilters {
  type?: string;
  category?: string;
  is_active?: boolean;
  is_available?: boolean;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Helper function to create JSON response
function jsonResponse(data: unknown, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

// Helper function to handle errors
function errorResponse(message: string, status: number = 500) {
  return jsonResponse({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  }, status);
}

// Helper function to convert relative URLs to full URLs
function processMediaUrls(item: MenuItemRecord): MenuItemRecord {
  const STORAGE_BASE =
    "https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public";

  const processUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    return `${STORAGE_BASE}/${url.startsWith("/") ? url.slice(1) : url}`;
  };

  return {
    ...item,
    image_url: processUrl(item.image_url),
    video_url: processUrl(item.video_url),
    video_thumbnail_url: processUrl(item.video_thumbnail_url),
  };
}

serve(async (req: Request) => {
  // Handle preflight CORS requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let path = url.pathname;
    // Handle different routing contexts (local vs production)
    if (path.startsWith("/functions/v1/MENU_ITEMS")) {
      path = path.replace("/functions/v1/MENU_ITEMS", "");
    } else if (path.startsWith("/MENU_ITEMS")) {
      path = path.replace("/MENU_ITEMS", "");
    }

    // Ensure we have a valid path
    if (!path || path === "/") {
      path = "/health"; // Default to health check
    }

    // Remove debug info from error messages in production
    console.log("Processing request:", {
      originalPath: url.pathname,
      processedPath: path,
      fullUrl: req.url,
    });
    const searchParams = url.searchParams;

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Route handling
    switch (path) {
      case "/health":
        return jsonResponse({
          success: true,
          status: "healthy",
          timestamp: new Date().toISOString(),
          service: "MENU_ITEMS",
          version: "1.0.0",
        });

      case "/items":
      case "/list": {
        // Parse filters from query parameters
        const filters: MenuFilters = {
          type: searchParams.get("type") || undefined,
          category: searchParams.get("category") || undefined,
          is_active: searchParams.get("is_active") === "false" ? false : true,
          is_available: searchParams.get("is_available")
            ? searchParams.get("is_available") === "true"
            : undefined,
          featured: searchParams.get("featured")
            ? searchParams.get("featured") === "true"
            : undefined,
          search: searchParams.get("search") || undefined,
          limit: parseInt(searchParams.get("limit") || "50"),
          offset: parseInt(searchParams.get("offset") || "0"),
          sort_by: searchParams.get("sort_by") || "sort_order",
          sort_order: (searchParams.get("sort_order") as "asc" | "desc") ||
            "asc",
        };

        // Build query
        let query = supabase
          .from("menu_items")
          .select("*")
          .eq("is_active", filters.is_active);

        // Apply filters
        if (filters.category) query = query.eq("category_id", filters.category);
        if (filters.is_available !== undefined) {
          query = query.eq("is_available", filters.is_available);
        }
        if (filters.featured !== undefined) {
          query = query.eq("is_featured", filters.featured);
        }
        if (filters.search) {
          query = query.or(
            `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
          );
        }

        // Apply sorting and pagination - use display_order instead of sort_order
        const sortBy = filters.sort_by === "sort_order"
          ? "display_order"
          : filters.sort_by || "display_order";
        query = query
          .order(sortBy, { ascending: filters.sort_order === "asc" })
          .range(
            filters.offset ?? 0,
            (filters.offset ?? 0) + (filters.limit ?? 50) - 1,
          );

        const { data, error, count } = await query;

        if (error) throw error;

        // Process media URLs
        const processedData = data?.map(processMediaUrls) || [];

        return jsonResponse({
          success: true,
          data: processedData,
          total_count: count || processedData.length,
          pagination: {
            limit: filters.limit,
            offset: filters.offset,
            has_more: processedData.length === filters.limit,
          },
        });
      }

      case "/search": {
        const query = searchParams.get("q");
        if (!query) {
          return errorResponse('Query parameter "q" is required', 400);
        }

        const filtersParam = searchParams.get("filters");
        let additionalFilters: {
          category?: string;
          min_price?: number;
          max_price?: number;
          featured?: boolean;
          spice_level?: number;
          prep_time_max?: number;
        } = {};
        if (filtersParam) {
          try {
            additionalFilters = JSON.parse(filtersParam);
          } catch {
            return errorResponse("Invalid filters JSON", 400);
          }
        }

        // Build search query
        let searchQuery = supabase
          .from("menu_items")
          .select("*")
          .eq("is_active", true)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

        // Apply additional filters
        if (additionalFilters.category) {
          searchQuery = searchQuery.eq(
            "category_id",
            additionalFilters.category,
          );
        }
        if (additionalFilters.min_price) {
          searchQuery = searchQuery.gte("price", additionalFilters.min_price);
        }
        if (additionalFilters.max_price) {
          searchQuery = searchQuery.lte("price", additionalFilters.max_price);
        }
        if (additionalFilters.featured) {
          searchQuery = searchQuery.eq(
            "is_featured",
            additionalFilters.featured,
          );
        }
        if (additionalFilters.spice_level) {
          searchQuery = searchQuery.lte(
            "spice_level",
            additionalFilters.spice_level,
          );
        }
        if (additionalFilters.prep_time_max) {
          searchQuery = searchQuery.lte(
            "prep_time_minutes",
            additionalFilters.prep_time_max,
          );
        }

        const { data, error } = await searchQuery.limit(50);

        if (error) throw error;

        const processedData = data?.map(processMediaUrls) || [];

        return jsonResponse({
          success: true,
          data: processedData,
          total_count: processedData.length,
          query,
          filters: additionalFilters,
        });
      }

      case "/detail": {
        const id = searchParams.get("id");
        if (!id) {
          return errorResponse('Query parameter "id" is required', 400);
        }

        const { data, error } = await supabase
          .from("menu_items")
          .select("*")
          .eq("id", id)
          .eq("is_active", true)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return errorResponse("Menu item not found", 404);
          }
          throw error;
        }

        return jsonResponse({
          success: true,
          data: processMediaUrls(data),
        });
      }

      case "/types": {
        // This schema doesn't have a direct 'type' field, return empty for now
        return jsonResponse({
          success: true,
          data: [],
          total: 0,
          message:
            "Types endpoint not available - schema uses category_id instead",
        });
      }

      case "/categories": {
        // Get categories from the menu_categories table if it exists
        const { data, error } = await supabase
          .from("menu_categories")
          .select("id, name")
          .eq("is_active", true);

        if (error) {
          // Fallback: return empty if table doesn't exist
          return jsonResponse({
            success: true,
            data: [],
            total: 0,
            message:
              "Categories endpoint not available - menu_categories table not found",
          });
        }

        const categories = data?.map((cat) => ({
          category: cat.name,
          id: cat.id,
          count: 0, // Would need a join query to get actual counts
        })) || [];

        return jsonResponse({
          success: true,
          data: categories,
          total: categories.length,
        });
      }

      case "/featured": {
        const { data, error } = await supabase
          .from("menu_items")
          .select("*")
          .eq("is_active", true)
          .eq("is_featured", true)
          .order("display_order", { ascending: true });

        if (error) throw error;

        const processedData = data?.map(processMediaUrls) || [];

        return jsonResponse({
          success: true,
          data: processedData,
          total_count: processedData.length,
        });
      }

      case "/grouped": {
        const groupBy = searchParams.get("group_by") as "type" | "category";
        if (!groupBy || !["type", "category"].includes(groupBy)) {
          return errorResponse(
            'Query parameter "group_by" must be "type" or "category"',
            400,
          );
        }

        // This endpoint is not fully supported with current schema
        return jsonResponse({
          success: true,
          grouped_by: groupBy,
          groups: [],
          total_groups: 0,
          total_items: 0,
          message:
            `Grouped by ${groupBy} not available - current schema uses category_id references`,
        });
      }

      default:
        return errorResponse(`Endpoint not found: ${path}`, 404);
    }
  } catch (error) {
    console.error("Edge function error:", error);
    const errorMessage =
      (typeof error === "object" && error !== null && "message" in error &&
          typeof (error as Error).message === "string")
        ? (error as Error).message
        : "Internal server error";
    return errorResponse(
      errorMessage,
      500,
    );
  }
});
