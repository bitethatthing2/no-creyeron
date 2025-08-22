import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@supabase/supabase-js";

// ============================================================================
// TYPE DEFINITIONS - Matched to your actual database schema
// ============================================================================

/**
 * Menu category from the menu_categories table
 */
interface MenuCategory {
  id: string;
  name: string;
  type: string; // In your DB this is text, not restricted to 'food' | 'drink'
  description: string | null;
  display_order: number | null;
  is_active: boolean | null;
  icon: string | null;
  color: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Menu item from the menu_items table
 */
interface MenuItem {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_id: string | null;
  display_order: number | null;
  is_available: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  video_url: string | null;
  has_video: boolean | null;
  video_thumbnail_url: string | null;
}

/**
 * Menu view combining items and categories
 */
interface MenuView {
  item_id: string;
  item_name: string;
  item_description: string | null;
  price: number;
  item_order: number | null;
  is_available: boolean | null;
  category_id: string;
  category_name: string;
  category_type: string;
  category_order: number | null;
  category_icon: string | null;
  category_color: string | null;
  image_url: string | null;
  image_path: string | null;
}

/**
 * Transformed menu item for frontend consumption
 */
interface TransformedMenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  is_available: boolean;
  display_order: number;
  category_id: string | null;
  category_name?: string;
  category_type?: string;
  image_url?: string;
  image_path?: string;
  video_url?: string;
  has_video: boolean;
  video_thumbnail_url?: string;
}

/**
 * Database connection test result
 */
interface DatabaseConnectionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

// ============================================================================
// SUPABASE CLIENT CREATION
// ============================================================================

/**
 * Creates a Supabase client for public menu access
 * Uses service role key if available (bypasses RLS), otherwise uses anon key
 */
function createPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }

  if (!anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable",
    );
  }

  // Try service role key first (for bypassing RLS)
  if (serviceRoleKey) {
    console.log("✅ Using service role key for menu access");
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // Fallback to anon key (RLS policies allow public read access)
  console.log("ℹ️ Using anon key for menu access (RLS allows public read)");

  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================================================
// MENU CATEGORY FUNCTIONS
// ============================================================================

/**
 * Fetches all active menu categories
 * RLS Policy: Public read access is allowed
 */
export async function getCategoriesPublic(): Promise<MenuCategory[]> {
  noStore();

  try {
    const supabase = createPublicClient();

    const { data: categories, error } = await supabase
      .from("menu_categories") // Correct table name
      .select("*")
      .eq("is_active", true)
      .order("type", { ascending: true })
      .order("display_order", { ascending: true })
      .returns<MenuCategory[]>();

    if (error) {
      console.error("❌ Error fetching categories:", error);

      // Provide specific error messages
      if (error.message.includes("Invalid API key")) {
        throw new Error(
          "Supabase API key is invalid. Check your environment variables.",
        );
      }
      if (
        error.message.includes("relation") &&
        error.message.includes("does not exist")
      ) {
        throw new Error(
          "Table menu_categories not found. Check database schema.",
        );
      }

      throw new Error(`Database error: ${error.message}`);
    }

    if (!categories || categories.length === 0) {
      console.warn("⚠️ No categories found in database");
      return [];
    }

    console.log(`✅ Successfully loaded ${categories.length} categories`);
    return categories;
  } catch (error) {
    console.error("💥 Unexpected error fetching categories:", error);

    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }

    // In production, return empty array to gracefully handle failures
    if (process.env.NODE_ENV === "development") {
      throw error;
    }

    return [];
  }
}

/**
 * Helper function to get categories by type
 * Note: Your DB uses text type, not enum, so this accepts any string
 */
export async function getCategoriesByTypePublic(
  type: string,
): Promise<MenuCategory[]> {
  noStore();

  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from("menu_categories")
      .select("*")
      .eq("type", type)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .returns<MenuCategory[]>();

    if (error) {
      console.error(`❌ Error fetching ${type} categories:`, error);
      return [];
    }

    console.log(
      `✅ Successfully loaded ${data?.length || 0} ${type} categories`,
    );
    return data || [];
  } catch (error) {
    console.error(`💥 Exception fetching ${type} categories:`, error);
    return [];
  }
}

// ============================================================================
// MENU ITEM FUNCTIONS
// ============================================================================

/**
 * Fetches menu items for a specific category
 * Uses the menu_items table directly since menu_items_with_working_modifiers doesn't exist
 */
export async function getMenuItemsByCategoryPublic(
  categoryId: string,
): Promise<TransformedMenuItem[]> {
  noStore();

  try {
    const supabase = createPublicClient();

    // First, get items from menu_items table
    const { data: items, error: itemsError } = await supabase
      .from("menu_items")
      .select("*")
      .eq("category_id", categoryId)
      .eq("is_available", true)
      .order("display_order", { ascending: true })
      .returns<MenuItem[]>();

    if (itemsError) {
      console.error(
        `❌ Error fetching menu items for category ${categoryId}:`,
        itemsError,
      );
      return [];
    }

    if (!items || items.length === 0) {
      return [];
    }

    // Get category details for enrichment
    const { data: category } = await supabase
      .from("menu_categories")
      .select("name, type")
      .eq("id", categoryId)
      .single<Pick<MenuCategory, "name" | "type">>();

    // Transform the data
    const transformedItems: TransformedMenuItem[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || undefined,
      price: Number(item.price), // Ensure it's a number
      is_available: item.is_available ?? false,
      display_order: item.display_order ?? 0,
      category_id: item.category_id,
      category_name: category?.name,
      category_type: category?.type,
      image_url: undefined, // You'll need to implement image fetching if using storage
      image_path: undefined,
      video_url: item.video_url || undefined,
      has_video: item.has_video ?? false,
      video_thumbnail_url: item.video_thumbnail_url || undefined,
    }));

    console.log(
      `✅ Successfully loaded ${transformedItems.length} items for category ${categoryId}`,
    );
    return transformedItems;
  } catch (error) {
    console.error(
      `💥 Exception fetching menu items for category ${categoryId}:`,
      error,
    );
    return [];
  }
}

/**
 * Fetches all menu items using the menu_view
 * This combines items with their category information
 */
export async function getAllMenuItemsWithCategories(): Promise<
  TransformedMenuItem[]
> {
  noStore();

  try {
    const supabase = createPublicClient();

    const { data: items, error } = await supabase
      .from("menu_view")
      .select("*")
      .eq("is_available", true)
      .order("category_order", { ascending: true })
      .order("item_order", { ascending: true })
      .returns<MenuView[]>();

    if (error) {
      console.error("❌ Error fetching menu view:", error);
      return [];
    }

    if (!items || items.length === 0) {
      return [];
    }

    // Transform menu view data to our format
    const transformedItems: TransformedMenuItem[] = items.map((item) => ({
      id: item.item_id,
      name: item.item_name,
      description: item.item_description || undefined,
      price: Number(item.price),
      is_available: item.is_available ?? false,
      display_order: item.item_order ?? 0,
      category_id: item.category_id,
      category_name: item.category_name,
      category_type: item.category_type,
      image_url: item.image_url || undefined,
      image_path: item.image_path || undefined,
      video_url: undefined, // Not in menu_view
      has_video: false,
      video_thumbnail_url: undefined,
    }));

    console.log(
      `✅ Successfully loaded ${transformedItems.length} items from menu view`,
    );
    return transformedItems;
  } catch (error) {
    console.error("💥 Exception fetching menu view:", error);
    return [];
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if the database connection is working
 * Tests connection by attempting to count categories
 */
export async function testMenuConnection(): Promise<DatabaseConnectionResult> {
  try {
    const supabase = createPublicClient();

    // Simple connectivity test - count categories
    const { count, error } = await supabase
      .from("menu_categories")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("❌ Menu connection test failed:", error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Menu connection test passed. Found ${count} categories`);
    return { success: true, data: { categoriesCount: count } };
  } catch (error) {
    console.error("💥 Menu connection test exception:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get menu statistics for debugging
 */
export async function getMenuStats(): Promise<{
  categories: number;
  items: number;
  availableItems: number;
}> {
  try {
    const supabase = createPublicClient();

    const [categoriesResult, itemsResult, availableResult] = await Promise.all([
      supabase.from("menu_categories").select("*", {
        count: "exact",
        head: true,
      }),
      supabase.from("menu_items").select("*", { count: "exact", head: true }),
      supabase.from("menu_items").select("*", { count: "exact", head: true })
        .eq("is_available", true),
    ]);

    return {
      categories: categoriesResult.count ?? 0,
      items: itemsResult.count ?? 0,
      availableItems: availableResult.count ?? 0,
    };
  } catch (error) {
    console.error("Error getting menu stats:", error);
    return { categories: 0, items: 0, availableItems: 0 };
  }
}
