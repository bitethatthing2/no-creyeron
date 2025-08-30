import { Database } from "@/types/database.types";

// Use the actual database types
export type MenuCategory =
  Database["public"]["Tables"]["menu_categories"]["Row"];
export type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];

// Type for inserting menu categories
export type MenuCategoryInsert =
  Database["public"]["Tables"]["menu_categories"]["Insert"];
export type MenuItemInsert =
  Database["public"]["Tables"]["menu_items"]["Insert"];

// For the hardcoded data, we'll use partial types since some fields can be null
export const menuCategories: Partial<MenuCategory>[] = [
  {
    id: "10921e3a-3ef4-4aa0-be00-b13a9d584ff2",
    name: "BIRRIA",
    type: "food",
    description: "Our signature birria dishes",
    display_order: 2,
    icon: null,
    color: null,
    is_active: true,
    // Timestamps will be set by the database
  },
  {
    id: "6f539351-ddbb-4dc5-b0c7-716822450806",
    name: "BREAKFAST",
    type: "food",
    description: "Morning favorites served all day",
    display_order: 3,
    icon: null,
    color: null,
    is_active: true,
  },
  {
    id: "3d7512d0-5de1-4d38-857c-ccb68f6449ff",
    name: "Main",
    type: "food",
    description: "Our main course offerings",
    display_order: 4,
    icon: null,
    color: null,
    is_active: true,
  },
  {
    id: "96e136e2-4bf2-43ea-9efd-8dcb9dd07ee6",
    name: "SEA FOOD",
    type: "food",
    description: "Fresh seafood specialties",
    display_order: 5,
    icon: null,
    color: null,
    is_active: true,
  },
  {
    id: "0d079e39-6461-4e07-913e-594151b9c102",
    name: "WINGS",
    type: "food",
    description: "Crispy wings with various sauces",
    display_order: 6,
    icon: null,
    color: null,
    is_active: true,
  },
  {
    id: "156f069d-4321-4d77-97cc-23423367a52e",
    name: "Keto",
    type: "food",
    description: "Keto-friendly options",
    display_order: 7,
    icon: null,
    color: null,
    is_active: true,
  },
  {
    id: "f3e366fc-c186-4fa7-ab88-a23e71ca4e1c",
    name: "Specials",
    type: "food",
    description: "Chef specials and seasonal items",
    display_order: 8,
    icon: null,
    color: null,
    is_active: true,
  },
  {
    id: "0de0fe10-2693-41e7-bb2b-4df2585d56ee",
    name: "Small Bites",
    type: "food",
    description: "Appetizers and small plates",
    display_order: 9,
    icon: null,
    color: null,
    is_active: true,
  },
  {
    id: "063c35c0-0d8a-401b-8c4f-6937f0b9f814",
    name: "Sides",
    type: "food",
    description: "Perfect sides to complement your meal",
    display_order: 10,
    icon: null,
    color: null,
    is_active: true,
  },
  {
    id: "1e66c8b1-929f-4e4d-9323-79e41cd376dc",
    name: "Boards",
    type: "drink",
    description: "Sharing boards for groups",
    display_order: 11,
    icon: null,
    color: null,
    is_active: true,
  },
  {
    id: "1c534050-4918-42f1-91ee-1a1eb1e85d5e",
    name: "Flights",
    type: "drink",
    description: "Tasting flights",
    display_order: 12,
    icon: null,
    color: null,
    is_active: true,
  },
  {
    id: "654b3933-6832-44c9-ab1e-adbe30a8a892",
    name: "Towers",
    type: "drink",
    description: "Large sharing drinks",
    display_order: 13,
    icon: null,
    color: null,
    is_active: true,
  },
  {
    id: "189d5ff5-624a-49ab-b0bf-35df993461ee",
    name: "House Favorites",
    type: "drink",
    description: "Our signature cocktails",
    display_order: 14,
    icon: null,
    color: null,
    is_active: true,
  },
  {
    id: "e9db6f0c-d8c8-416f-b1a1-a25634dc59ea",
    name: "Martinis",
    type: "drink",
    description: "Classic and creative martinis",
    display_order: 15,
    icon: null,
    color: null,
    is_active: true,
  },
  {
    id: "cf89e744-d940-45bf-9a69-c4b5f1bed568",
    name: "Margaritas",
    type: "drink",
    description: "Fresh margaritas and variations",
    display_order: 16,
    icon: null,
    color: null,
    is_active: true,
  },
  {
    id: "cc98b9f2-e63f-4730-856a-624f5884ce63",
    name: "Malibu Buckets",
    type: "drink",
    description: "Tropical Malibu cocktails",
    display_order: 17,
    icon: null,
    color: null,
    is_active: true,
  },
  {
    id: "2be62efe-0a46-41af-b7fc-64860a7736b2",
    name: "Refreshers",
    type: "drink",
    description: "Light and refreshing drinks",
    display_order: 18,
    icon: null,
    color: null,
    is_active: true,
  },
  {
    id: "ab52e655-78b9-47ad-934b-bca08c89ea96",
    name: "Bottle Beer",
    type: "drink",
    description: "Bottled beer selection",
    display_order: 19,
    icon: null,
    color: null,
    is_active: true,
  },
  {
    id: "e89f98e6-9472-424e-a755-478ab8e69989",
    name: "Wine",
    type: "drink",
    description: "Wine selection",
    display_order: 20,
    icon: null,
    color: null,
    is_active: true,
  },
  {
    id: "c0abf19e-3c24-43bd-ab16-acd3c87f2e61",
    name: "Non Alcoholic",
    type: "drink",
    description: "Non-alcoholic beverages",
    display_order: 21,
    icon: null,
    color: null,
    is_active: true,
  },
];

export const menuItems: Partial<MenuItem>[] = [
  // BIRRIA ITEMS
  {
    id: "0363f9db-7a2c-4419-af04-f67c9f6d2423",
    category_id: "10921e3a-3ef4-4aa0-be00-b13a9d584ff2",
    name: "Birria Flautas",
    description: "Corn tortilla filled with birria, served with consommé.",
    price: 12.00, // Database expects numeric type
    image_url: null,
    image_id: null,
    video_url: null,
    video_thumbnail_url: null,
    has_video: false,
    is_available: true,
    is_featured: false,
    is_active: true,
    display_order: 0,
    spice_level: null,
    prep_time_minutes: null,
    allergens: [],
    storage_path: null,
    content_postsrc: null,
  },
  {
    id: "3f3a1567-0b28-411f-b75e-fe040f765e7d",
    category_id: "10921e3a-3ef4-4aa0-be00-b13a9d584ff2",
    name: "Birria Ramen Bowl",
    description: "Birria tapatío noodles with cilantro and onions.",
    price: 14.75,
    image_url: null,
    image_id: null,
    video_url: null,
    video_thumbnail_url: null,
    has_video: true,
    is_available: true,
    is_featured: true,
    is_active: true,
    display_order: 1,
    spice_level: null,
    prep_time_minutes: null,
    allergens: [],
    storage_path: null,
    content_postsrc: null,
  },
  {
    id: "5dc4fbf5-fbfd-49d7-bd17-f0065cbf7005",
    category_id: "10921e3a-3ef4-4aa0-be00-b13a9d584ff2",
    name: "Birria Queso Tacos",
    description:
      "3 queso birria tacos with queso oaxaca, onions, and cilantro. Served with consommé for dipping.",
    price: 16.75,
    image_url: null,
    image_id: null,
    video_url: null,
    video_thumbnail_url: null,
    has_video: true,
    is_available: true,
    is_featured: true,
    is_active: true,
    display_order: 2,
    spice_level: null,
    prep_time_minutes: null,
    allergens: [],
    storage_path: null,
    content_postsrc: null,
  },
  {
    id: "d223ac5e-d0e3-45b9-961a-7e55e9d4fcf5",
    category_id: "10921e3a-3ef4-4aa0-be00-b13a9d584ff2",
    name: "Birria Pizza",
    description:
      "Two flour tortillas with birria, cilantro, onions, and queso oaxaca.",
    price: 29.00,
    image_url: null,
    image_id: null,
    video_url: null,
    video_thumbnail_url: null,
    has_video: true,
    is_available: true,
    is_featured: true,
    is_active: true,
    display_order: 3,
    spice_level: null,
    prep_time_minutes: null,
    allergens: [],
    storage_path: null,
    content_postsrc: null,
  },

  // BREAKFAST ITEMS
  {
    id: "0dbfacbe-fa2e-4282-977e-eb0f9b11e8a9",
    category_id: "6f539351-ddbb-4dc5-b0c7-716822450806",
    name: "Monchi Pancakes",
    description: "Fluffy pancakes served with butter and maple syrup.",
    price: 15.00,
    image_url: null,
    image_id: null,
    video_url: null,
    video_thumbnail_url: null,
    has_video: false,
    is_available: true,
    is_featured: false,
    is_active: true,
    display_order: 0,
    spice_level: null,
    prep_time_minutes: null,
    allergens: [],
    storage_path: null,
    content_postsrc: null,
  },
  // ... Add all other menu items following the same pattern
];

// Helper functions for database operations
export function prepareMenuCategoryForInsert(
  category: Partial<MenuCategory>,
): MenuCategoryInsert {
  const { /* created_at, */ ...insertData } = category;
  return insertData as MenuCategoryInsert;
}

export function prepareMenuItemForInsert(
  item: Partial<MenuItem>,
): MenuItemInsert {
  const insertData = { ...item };
  // Ensure price is properly formatted as numeric
  if (insertData.price !== undefined && insertData.price !== null) {
    insertData.price = typeof insertData.price === "string"
      ? parseFloat(insertData.price)
      : insertData.price;
  }
  return insertData as MenuItemInsert;
}

// Function to seed database (if needed)
import { SupabaseClient } from "@supabase/supabase-js";

export async function seedMenuData(supabase: SupabaseClient) {
  // Insert categories
  for (const category of menuCategories) {
    const { error } = await supabase
      .from("menu_categories")
      .upsert(prepareMenuCategoryForInsert(category), {
        onConflict: "id",
        ignoreDuplicates: false,
      });

    if (error) {
      console.error("Error inserting category:", category.name, error);
    }
  }

  // Insert items
  for (const item of menuItems) {
    const { error } = await supabase
      .from("menu_items")
      .upsert(prepareMenuItemForInsert(item), {
        onConflict: "id",
        ignoreDuplicates: false,
      });

    if (error) {
      console.error("Error inserting item:", item.name, error);
    }
  }
}

const menuData = { menuCategories, menuItems };
export default menuData;
