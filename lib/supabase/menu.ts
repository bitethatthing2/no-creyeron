// lib/supabase/menu.ts
import { getSupabaseBrowserClient } from './client';
import { 
  MenuCategory, 
  MenuItemWithModifiers, 
  APIModifierGroup,
  APIModifierOption,
  MenuItemModifier,
  MenuViewRow 
} from '@/types/features/menu';

// =============================================================================
// SUPABASE DATABASE TYPES - EXACT FROM GENERATED TYPES
// =============================================================================

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Database types from Supabase
type Database = {
  public: {
    Tables: {
      food_drink_categories: {
        Row: {
          id: string;
          name: string;
          type: string;
          description: string | null;
          display_order: number | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          created_by: string | null;
          icon: string | null;
          color: string | null;
        };
      };
      food_drink_items: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number;
          is_available: boolean | null;
          image_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          created_by: string | null;
          display_order: number | null;
        };
      };
      menu_item_modifiers: {
        Row: {
          id: string;
          name: string;
          modifier_type: string;
          price_adjustment: number | null;
          is_available: boolean | null;
          created_at: string | null;
          display_order: number | null;
          description: string | null;
          is_popular: boolean | null;
          spice_level: number | null;
        };
      };
      item_modifier_groups: {
        Row: {
          id: string;
          item_id: string | null;
          modifier_type: string;
          is_required: boolean | null;
          max_selections: number | null;
          created_at: string | null;
          group_name: string | null;
          min_selections: number | null;
          description: string | null;
        };
      };
    };
    Views: {
      menu_items_with_working_modifiers: {
        Row: {
          id: string | null;
          name: string | null;
          description: string | null;
          price: string | null; // numeric in DB, returned as string
          is_available: boolean | null;
          display_order: number | null;
          category_id: string | null;
          image_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          image_url: string | null;
          category: Json | null;
          modifiers: Json | null;
        };
      };
      menu_item_modifier_details: {
        Row: {
          modifier_id: string | null;
          modifier_name: string | null;
          modifier_type: string | null;
          price_adjustment: string | null; // numeric in DB, returned as string
          is_available: boolean | null;
          display_order: number | null;
          item_id: string | null;
          group_name: string | null;
          is_required: boolean | null;
          max_selections: number | null;
          min_selections: number | null;
          category: string | null;
          category_order: number | null;
          description: string | null;
          is_default: boolean | null;
        };
      };
    };
  };
};

// Type aliases for cleaner code
type FoodDrinkCategoryRow = Database['public']['Tables']['food_drink_categories']['Row'];
type FoodDrinkItemRow = Database['public']['Tables']['food_drink_items']['Row'];
type MenuItemModifierRow = Database['public']['Tables']['menu_item_modifiers']['Row'];
type ItemModifierGroupRow = Database['public']['Tables']['item_modifier_groups']['Row'];
type MenuItemWithWorkingModifiersRow = Database['public']['Views']['menu_items_with_working_modifiers']['Row'];
type MenuItemModifierDetailsRow = Database['public']['Views']['menu_item_modifier_details']['Row'];

// =============================================================================
// JSON STRUCTURE TYPES (From actual database inspection)
// =============================================================================

interface CategoryJsonStructure {
  id: string;
  name: string;
  type: string;
}

interface ModifierOptionJsonStructure {
  id: string;
  name: string;
  price_adjustment: number;
}

interface ModifierGroupJsonStructure {
  id: string;
  name: string;
  type: string;
  required: boolean;
  max_selections: number;
  min_selections: number;
  options: ModifierOptionJsonStructure[];
}

// Type guards for JSON validation
function isCategoryJson(obj: Json): obj is CategoryJsonStructure {
  return typeof obj === 'object' && 
         obj !== null && 
         typeof (obj as Record<string, unknown>).id === 'string' &&
         typeof (obj as Record<string, unknown>).name === 'string' &&
         typeof (obj as Record<string, unknown>).type === 'string';
}

function isModifierGroupArray(obj: Json): obj is ModifierGroupJsonStructure[] {
  return Array.isArray(obj) && 
         obj.every(item => 
           typeof item === 'object' && 
           item !== null &&
           typeof (item as Record<string, unknown>).id === 'string' &&
           typeof (item as Record<string, unknown>).name === 'string' &&
           typeof (item as Record<string, unknown>).type === 'string' &&
           typeof (item as Record<string, unknown>).required === 'boolean' &&
           typeof (item as Record<string, unknown>).max_selections === 'number' &&
           Array.isArray((item as Record<string, unknown>).options)
         );
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function isValidModifierType(type: string): boolean {
  return ['meat', 'sauce', 'salsa', 'addon', 'side'].includes(type);
}

export function isValidCategoryType(type: string): boolean {
  return ['food', 'drink'].includes(type);
}

function safeModifierType(type: string | null | undefined): string {
  if (!type) return 'addon';
  return isValidModifierType(type) ? type : 'addon';
}

function safeCategoryType(type: string): 'food' | 'drink' {
  return isValidCategoryType(type) ? (type as 'food' | 'drink') : 'food';
}

function parseNumeric(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

export async function getMenuCategories(): Promise<MenuCategory[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    // Get unique categories from menu_view
    const { data, error } = await supabase
      .from('menu_view')
      .select('category_id, category_name, category_type, category_order, category_icon, category_color')
      .eq('is_available', true)
      .order('category_order', { ascending: true });

    if (error) {
      console.error('Error fetching menu categories:', error);
      throw new Error(`Failed to fetch menu categories: ${error.message}`);
    }

    // Type the data properly
    const typedData = data as Pick<MenuViewRow, 'category_id' | 'category_name' | 'category_type' | 'category_order' | 'category_icon' | 'category_color'>[] | null;
    
    // Remove duplicates and transform to MenuCategory format
    const uniqueCategories = new Map<string, MenuCategory>();
    
    (typedData || []).forEach((row) => {
      if (!uniqueCategories.has(row.category_id)) {
        uniqueCategories.set(row.category_id, {
          id: row.category_id,
          name: row.category_name,
          type: safeCategoryType(row.category_type),
          display_order: row.category_order || 0,
          is_active: true,
          icon: row.category_icon,
          description: null,
          color: row.category_color
        });
      }
    });

    return Array.from(uniqueCategories.values())
      .sort((a, b) => a.display_order - b.display_order);
  } catch (error) {
    console.error('Error in getMenuCategories:', error);
    throw error;
  }
}

export async function getMenuItems(categoryId?: string): Promise<MenuItemWithModifiers[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    console.log('Fetching menu items from menu_view...');
    
    let query = supabase
      .from('menu_view')
      .select('*')
      .eq('is_available', true)
      .order('category_order', { ascending: true })
      .order('item_order', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching from menu_view:', error);
      return [];
    }

    // Type the data properly
    const typedData = data as MenuViewRow[] | null;
    
    console.log('Menu items fetched successfully:', {
      count: typedData?.length || 0,
      categoryId
    });

    const items: MenuItemWithModifiers[] = (typedData || []).map((item) => {
      // For now, no modifiers until we determine the correct structure
      const modifierGroups: APIModifierGroup[] = [];

      // Get category info from the view
      const categoryInfo = {
        id: item.category_id,
        name: item.category_name,
        type: item.category_type
      };

      return {
        id: item.item_id,
        name: item.item_name,
        description: item.item_description || undefined,
        price: item.price,
        is_available: item.is_available ?? true,
        display_order: item.item_order || 0,
        category: categoryInfo,
        category_id: item.category_id,
        modifiers: modifierGroups.length > 0 ? modifierGroups : undefined,
        image_url: item.image_url || undefined,
        watch_it_made_video: item.watch_it_made_video || undefined
      };
    });

    return items;
  } catch (error) {
    console.error('Unexpected error in getMenuItems:', error);
    return [];
  }
}

export async function getMenuModifiers(itemId?: string): Promise<MenuItemModifier[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    // For now, return empty array since modifier tables don't exist
    // This can be enhanced when the modifier system is properly implemented
    console.log('getMenuModifiers called - returning empty array (modifiers not implemented)');
    return [];
  } catch (error) {
    console.error('Unexpected error in getMenuModifiers:', error);
    return [];
  }
}

export async function getItemModifierGroups(itemId: string): Promise<ItemModifierGroupRow[]> {
  try {
    console.log('getItemModifierGroups called - returning empty array (modifiers not implemented)');
    return [];
  } catch (error) {
    console.error('Unexpected error in getItemModifierGroups:', error);
    return [];
  }
}

export async function getModifierOptionsByType(
  modifierType: 'meat' | 'sauce' | 'salsa' | 'addon' | 'side'
): Promise<MenuItemModifier[]> {
  try {
    console.log('getModifierOptionsByType called - returning empty array (modifiers not implemented)');
    return [];
  } catch (error) {
    console.error('Unexpected error in getModifierOptionsByType:', error);
    return [];
  }
}

export async function getFullMenu(): Promise<{ menu: MenuCategory[]; items: MenuItemWithModifiers[]; modifiers: MenuItemModifier[] }> {
  try {
    console.log('Starting getFullMenu...');
    
    const [categories, items, modifiers] = await Promise.all([
      getMenuCategories(),
      getMenuItems(),
      getMenuModifiers()
    ]);

    console.log('Fetched data:', {
      categoriesCount: categories.length,
      itemsCount: items.length,
      modifiersCount: modifiers.length
    });

    // Don't nest items inside categories for backward compatibility
    return { menu: categories, items, modifiers };
  } catch (error) {
    console.error('Error in getFullMenu:', error);
    return { menu: [], items: [], modifiers: [] };
  }
}

export async function getAvailableModifierTypes(): Promise<string[]> {
  try {
    console.log('getAvailableModifierTypes called - returning default types (modifiers not implemented)');
    return ['meat', 'sauce', 'salsa', 'addon', 'side'];
  } catch (error) {
    console.error('Unexpected error in getAvailableModifierTypes:', error);
    return ['meat', 'sauce', 'salsa', 'addon', 'side'];
  }
}

// Server-side functions for SSR/API routes
export async function getCategoriesByTypePublic(type: 'food' | 'drink'): Promise<MenuCategory[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    // Get unique categories from menu_view filtered by type
    const { data, error } = await supabase
      .from('menu_view')
      .select('category_id, category_name, category_type, category_order, category_icon, category_color')
      .eq('is_available', true)
      .eq('category_type', type)
      .order('category_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories by type:', error);
      throw new Error(`Failed to fetch ${type} categories: ${error.message}`);
    }

    // Type the data properly
    const typedData = data as Pick<MenuViewRow, 'category_id' | 'category_name' | 'category_type' | 'category_order' | 'category_icon' | 'category_color'>[] | null;
    
    // Remove duplicates and transform to MenuCategory format
    const uniqueCategories = new Map<string, MenuCategory>();
    
    (typedData || []).forEach((row) => {
      if (!uniqueCategories.has(row.category_id)) {
        uniqueCategories.set(row.category_id, {
          id: row.category_id,
          name: row.category_name,
          type: safeCategoryType(row.category_type),
          display_order: row.category_order || 0,
          is_active: true,
          icon: row.category_icon,
          description: null,
          color: row.category_color
        });
      }
    });

    return Array.from(uniqueCategories.values())
      .sort((a, b) => a.display_order - b.display_order);
  } catch (error) {
    console.error(`Error in getCategoriesByTypePublic(${type}):`, error);
    throw error;
  }
}

export async function getMenuItemsByCategoryPublic(categoryId: string): Promise<MenuItemWithModifiers[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    console.log(`Fetching menu items for category ${categoryId} from menu_view...`);
    
    const { data, error } = await supabase
      .from('menu_view')
      .select('*')
      .eq('is_available', true)
      .eq('category_id', categoryId)
      .order('item_order', { ascending: true });

    if (error) {
      console.error('Error fetching menu items by category:', error);
      throw new Error(`Failed to fetch menu items for category ${categoryId}: ${error.message}`);
    }

    // Type the data properly
    const typedData = data as MenuViewRow[] | null;
    
    console.log(`Menu items fetched successfully for category ${categoryId}:`, {
      count: typedData?.length || 0
    });

    const items: MenuItemWithModifiers[] = (typedData || []).map((item) => {
      // For now, no modifiers until we determine the correct structure
      const modifierGroups: APIModifierGroup[] = [];

      // Get category info from the view
      const categoryInfo = {
        id: item.category_id,
        name: item.category_name,
        type: item.category_type
      };

      return {
        id: item.item_id,
        name: item.item_name,
        description: item.item_description || undefined,
        price: item.price,
        is_available: item.is_available ?? true,
        display_order: item.item_order || 0,
        category: categoryInfo,
        category_id: item.category_id,
        modifiers: modifierGroups.length > 0 ? modifierGroups : undefined,
        image_url: item.image_url || undefined,
        watch_it_made_video: item.watch_it_made_video || undefined
      };
    });

    return items;
  } catch (error) {
    console.error(`Unexpected error in getMenuItemsByCategoryPublic(${categoryId}):`, error);
    throw error;
  }
}