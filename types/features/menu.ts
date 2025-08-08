// lib/types/menu.ts

// ============================================
// Core Types - These are what your components use
// ============================================

// Alias for backward compatibility
export type MenuItem = MenuItemWithModifiers;

// Alias for backward compatibility
export type MenuModifier = MenuItemModifier;

// Food/Drink category type
export type FoodDrinkCategory = 'food' | 'drink';

// Category types
export interface MenuCategory {
  id: string;
  name: string;
  type: 'food' | 'drink';
  display_order: number;
  is_active: boolean;
  icon: string | null;
  description: string | null;
  color: string | null;
}

export interface MenuCategoryWithCount extends MenuCategory {
  item_count: number;
}

// API types for compatibility
export interface APIMenuItem {
  item_id: string;
  item_name: string;
  description?: string | null;
  price: number | string;
  is_available: boolean;
  item_order: number;
  category_name: string;
  category_type: string;
  category_order: number;
  modifier_groups?: ModifierGroupFromDB[];
  image_url?: string | null;
  watch_it_made_video?: string | null;
}

// Main menu item type expected by components
export interface MenuItemWithModifiers {
  id: string;
  name: string;
  description?: string;
  price: number;
  is_available: boolean;
  display_order?: number;
  category?: {
    id?: string;
    name: string;
    type: string;
  };
  category_id?: string | null; // Add this for filtering
  modifiers?: APIModifierGroup[]; // This matches what MenuItemModal expects
  image_url?: string | null;
  watch_it_made_video?: string | null;
}

// Modifier types expected by MenuItemModal
export interface APIModifierGroup {
  id: string;
  type: string;
  name?: string;
  options: APIModifierOption[];
  required: boolean;
  max_selections: number;
}

export interface APIModifierOption {
  id: string;
  name: string;
  price_adjustment: number;
}

// Individual modifier (flattened version)
export interface MenuItemModifier {
  id: string;
  name: string;
  modifier_type: string;
  price_adjustment: number;
  is_available?: boolean;
  is_default?: boolean;
  display_order?: number;
}

// Cart types with required fields
export interface CartOrderData {
  item: {
    id: string;
    name: string;
    price: number;
  };
  modifiers: {
    meat: {
      id: string;
      name: string;
      price_adjustment: number;
    } | null;
    sauces: Array<{
      id: string;
      name: string;
      price_adjustment: number;
    }>;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
}

// ============================================
// Database Types - From Supabase
// ============================================

// New menu_view interface for the consolidated view
export interface MenuViewRow {
  item_id: string;
  item_name: string;
  item_description: string | null;
  price: number;
  item_order: number;
  is_available: boolean;
  category_id: string;
  category_name: string;
  category_type: 'food' | 'drink';
  category_order: number;
  category_icon: string | null;
  category_color: string | null;
  image_url: string | null;
  image_path: string | null;
  watch_it_made_video?: string | null;
}

export interface MenuItemFromDB {
  item_id: string;
  item_name: string;
  description: string | null;
  price: number | string; // Can be string from DB
  is_available: boolean;
  item_order: number;
  category_name: string;
  category_type: string;
  category_order: number;
  modifier_groups: ModifierGroupFromDB[];
  image_url?: string | null;
  watch_it_made_video?: string | null;
}

export interface ModifierGroupFromDB {
  group_user_id: string;
  group_name: string;
  modifier_type: string;
  is_required: boolean;
  max_selections: number;
  min_selections?: number;
  modifiers: ModifierOptionFromDB[] | null; // Can be null from DB
}

export interface ModifierOptionFromDB {
  modifier_id: string;
  name: string;
  price_adjustment: number;
  is_default: boolean;
  display_order: number;
}

// ============================================
// Transform Functions
// ============================================

// Convert API format to component format
export function convertAPIMenuItem(apiItem: APIMenuItem): MenuItemWithModifiers {
  // Transform modifier groups to match APIModifierGroup format
  const modifierGroups: APIModifierGroup[] = [];
  
  if (apiItem.modifier_groups && apiItem.modifier_groups.length > 0) {
    apiItem.modifier_groups.forEach(group => {
      // Only add groups that have modifiers
      if (group.modifiers && group.modifiers.length > 0) {
        modifierGroups.push({
          id: group.group_user_id,
          type: group.modifier_type,
          name: group.group_name,
          options: group.modifiers.map(mod => ({
            id: mod.modifier_id,
            name: mod.name,
            price_adjustment: mod.price_adjustment
          })),
          required: group.is_required,
          max_selections: group.max_selections
        });
      }
    });
  }

  return {
    id: apiItem.item_id,
    name: apiItem.item_name,
    description: apiItem.description || undefined,
    price: typeof apiItem.price === 'string' ? parseFloat(apiItem.price) : apiItem.price,
    is_available: apiItem.is_available,
    display_order: apiItem.item_order,
    category: {
      name: apiItem.category_name,
      type: apiItem.category_type
    },
    modifiers: modifierGroups.length > 0 ? modifierGroups : undefined,
    image_url: apiItem.image_url,
    watch_it_made_video: apiItem.watch_it_made_video
  };
}

// Transform database format to component format
export function transformMenuItemFromDB(dbItem: MenuItemFromDB): MenuItemWithModifiers {
  // Transform modifier groups to match APIModifierGroup format
  const modifierGroups: APIModifierGroup[] = [];
  
  if (dbItem.modifier_groups && dbItem.modifier_groups.length > 0) {
    dbItem.modifier_groups.forEach(group => {
      // Only add groups that have modifiers
      if (group.modifiers && group.modifiers.length > 0) {
        modifierGroups.push({
          id: group.group_user_id,
          type: group.modifier_type,
          name: group.group_name,
          options: group.modifiers.map(mod => ({
            id: mod.modifier_id,
            name: mod.name,
            price_adjustment: mod.price_adjustment
          })),
          required: group.is_required,
          max_selections: group.max_selections
        });
      }
    });
  }

  return {
    id: dbItem.item_id,
    name: dbItem.item_name,
    description: dbItem.description || undefined,
    price: typeof dbItem.price === 'string' ? parseFloat(dbItem.price) : dbItem.price,
    is_available: dbItem.is_available,
    display_order: dbItem.item_order,
    category: {
      name: dbItem.category_name,
      type: dbItem.category_type
    },
    modifiers: modifierGroups.length > 0 ? modifierGroups : undefined,
    image_url: dbItem.image_url,
    watch_it_made_video: dbItem.watch_it_made_video
  };
}

// Helper to calculate cart item prices
export function calculateCartItemPrice(
  basePrice: number,
  modifiers: CartOrderData['modifiers'],
  quantity: number
): { unitPrice: number; totalPrice: number } {
  let unitPrice = basePrice;
  
  // Add meat modifier price
  if (modifiers.meat) {
    unitPrice += modifiers.meat.price_adjustment;
  }
  
  // Add sauce modifier prices
  modifiers.sauces.forEach(sauce => {
    unitPrice += sauce.price_adjustment;
  });
  
  return {
    unitPrice,
    totalPrice: unitPrice * quantity
  };
}
