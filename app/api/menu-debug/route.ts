import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 DEBUG: Starting menu debug...');
    
    const supabase = await createServerClient();
    
    // Test basic connection with a simple query
    const { error: testError } = await supabase
      .from('food_drink_categories')
      .select('id')
      .limit(1);
      
    console.log('🔍 DEBUG: Connection test result:', { 
      connected: !testError, 
      error: testError?.message 
    });

    // Fetch categories with proper count
    const { data: categories, error: categoriesError, count: categoriesCount } = await supabase
      .from('food_drink_categories')
      .select('*', { count: 'exact' })
      .order('display_order', { ascending: true });

    console.log('🔍 DEBUG: Categories query result:', { 
      count: categories?.length || 0, 
      totalCount: categoriesCount,
      error: categoriesError?.message,
      categories: categories?.slice(0, 3) // Just first 3 for debug
    });

    // Fetch food/drink items (using the correct table name)
    const { data: items, error: itemsError, count: itemsCount } = await supabase
      .from('food_drink_items')
      .select('*', { count: 'exact' })
      .limit(10);

    console.log('🔍 DEBUG: Items query result:', { 
      count: items?.length || 0, 
      totalCount: itemsCount,
      error: itemsError?.message,
      items: items?.slice(0, 3) // Just first 3 for debug
    });

    // Test relationships - get items with their categories
    const { data: itemsWithCategories, error: relationError } = await supabase
      .from('food_drink_items')
      .select(`
        id,
        name,
        price,
        is_available,
        food_drink_categories!inner(
          id,
          name,
          type
        )
      `)
      .limit(5);

    console.log('🔍 DEBUG: Items with categories result:', { 
      count: itemsWithCategories?.length || 0, 
      error: relationError?.message,
      sample: itemsWithCategories?.slice(0, 2) // Just first 2 for debug
    });

    // Check table structure
    const tableStructure = {
      categories: {
        hasDisplayOrder: categories?.some(cat => cat.display_order !== undefined),
        hasIsActive: categories?.some(cat => cat.is_active !== undefined),
        hasType: categories?.some(cat => cat.type !== undefined),
      },
      items: {
        hasCategoryId: items?.some(item => item.category_id !== undefined),
        hasPrice: items?.some(item => item.price !== undefined),
        hasIsAvailable: items?.some(item => item.is_available !== undefined),
      }
    };

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      connection: testError ? 'Failed' : 'Success',
      categories: {
        count: categories?.length || 0,
        totalCount: categoriesCount,
        error: categoriesError?.message || null,
        sample: categories?.slice(0, 3) || []
      },
      items: {
        count: items?.length || 0,
        totalCount: itemsCount,
        error: itemsError?.message || null,
        sample: items?.slice(0, 3) || []
      },
      relationships: {
        itemsWithCategories: {
          count: itemsWithCategories?.length || 0,
          error: relationError?.message || null,
          sample: itemsWithCategories?.slice(0, 2) || []
        }
      },
      tableStructure,
      debug: {
        supabaseConnected: !testError,
        categoriesAccessible: !categoriesError,
        itemsAccessible: !itemsError,
        relationshipsWorking: !relationError
      }
    });

  } catch (error) {
    console.error('🔍 DEBUG: Error in menu debug:', error);
    return NextResponse.json(
      { 
        error: 'Debug failed', 
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.stack : null) : null
      },
      { status: 500 }
    );
  }
}