// app/(main)/menu/MenuServer.tsx

import MenuClient from './MenuClient';
import { MenuErrorFallback } from 'components/menu/MenuErrorFallback';
import type { Database } from '@/types/database.types'; // Still needed for MenuCategory type
import type { MenuCategoryWithCount } from '@/types/features/menu'; // Still needed
import { getCategoriesByTypePublic } from '@/lib/supabase/menu'; // Updated to use menu_view

// Import MenuCategory type from the updated menu types
import type { MenuCategory } from '@/types/features/menu';

// No need for MenuItemWithWorkingModifiersRow or any direct Supabase queries for items here,
// as items are fetched client-side via the API.

export default async function MenuServer() {
  try {
    // --- Step 1: Fetch Categories ONLY on the server ---
    // This is the primary role of MenuServer.tsx, as it passes initial categories to the client.
    const [foodCategoriesResult, drinkCategoriesResult] = await Promise.all([
      getCategoriesByTypePublic('food'), // Assumed to fetch categories from your backend
      getCategoriesByTypePublic('drink'), // Assumed to fetch categories from your backend
    ]);

    // --- Error Handling for fetched categories ---
    if (!foodCategoriesResult || !Array.isArray(foodCategoriesResult)) {
        console.error('❌ SERVER ERROR: [MenuServer] Invalid or empty food categories data from getCategoriesByTypePublic.');
        throw new Error('Failed to load food categories.');
    }
    if (!drinkCategoriesResult || !Array.isArray(drinkCategoriesResult)) {
        console.error('❌ SERVER ERROR: [MenuServer] Invalid or empty drink categories data from getCategoriesByTypePublic.');
        throw new Error('Failed to load drink categories.');
    }

    const foodCategories: MenuCategory[] = foodCategoriesResult;
    const drinkCategories: MenuCategory[] = drinkCategoriesResult;
    
    // --- Step 2: Augment categories with dummy item_count for initial display ---
    // Since actual item counts come from client-side fetches, we can initialize with 0
    // or a placeholder if the backend doesn't provide a count per category.
    // Assuming getCategoriesByTypePublic returns a simple array of FoodDrinkCategoryRow.
    const foodCategoriesWithCount: MenuCategoryWithCount[] = foodCategories
      .filter(cat => cat.is_active) // Filter only active categories
      .map((cat): MenuCategoryWithCount => ({
        ...cat,
        item_count: 0 // Initialize item_count to 0, as true count is dynamic client-side
      }));

    const drinkCategoriesWithCount: MenuCategoryWithCount[] = drinkCategories
      .filter(cat => cat.is_active)
      .map((cat): MenuCategoryWithCount => ({
        ...cat,
        item_count: 0 // Initialize item_count to 0
      }));

    const allCategories = [...foodCategoriesWithCount, ...drinkCategoriesWithCount];

    // --- Step 3: Server-side Debugging Logs ---
    console.log('🍽️ SERVER DEBUG: [MenuServer] Categories fetched successfully');
    console.log('📊 SERVER DEBUG: [MenuServer] Active Food categories count:', foodCategoriesWithCount.length);
    console.log('🍹 SERVER DEBUG: [MenuServer] Active Drink categories count:', drinkCategoriesWithCount.length);
    console.log('📋 SERVER DEBUG: [MenuServer] Total active categories (Food + Drink):', allCategories.length);
    // Removed 'Total menu items' log here as it's a client-side concern now.

    if (allCategories.length === 0) {
      console.warn('⚠️ SERVER WARNING: [MenuServer] No active categories found! Menu will likely be empty.');
    } else {
      console.log('✅ SERVER DEBUG: [MenuServer] Menu categories successfully processed!');
    }

    // --- Step 4: Pass initial props to the client component ---
    return (
      <MenuClient
        initialCategories={allCategories}
        initialFoodCategories={foodCategoriesWithCount}
        initialDrinkCategories={drinkCategoriesWithCount}
      />
    );

  } catch (error: unknown) {
    // --- Catch-all for any errors during server-side data fetching ---
    console.error('❌ SERVER CRITICAL ERROR: [MenuServer] Failed to load menu data:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during menu data fetching.';

    // Use the client component for error handling to avoid event handler issues
    return <MenuErrorFallback errorMessage={errorMessage} />;
  }
}