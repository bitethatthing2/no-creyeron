import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

interface MenuItem {
  category_id: string;
  category_name: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    
    const supabase = await createServerClient();
    
    const { data, error } = await supabase.rpc('get_menu_items_with_modifiers');
    
    if (error) {
      console.error('Error fetching menu items with modifiers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch menu items' },
        { status: 500 }
      );
    }
    
    let menuItems = data || [];
    
    if (categoryId) {
      menuItems = menuItems.filter((item: MenuItem) => {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId);
        
        if (isUUID) {
          return item.category_id === categoryId;
        } else {
          return item.category_name.toLowerCase() === categoryId.toLowerCase();
        }
      });
    }
    
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error('Unexpected error in menu-items API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}