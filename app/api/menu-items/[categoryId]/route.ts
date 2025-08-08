// app/api/menu-items/[categoryId]/route.ts
import { getMenuItemsByCategoryPublic } from '@/lib/supabase/menu';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    console.log(`🍽️ API: Fetching items for category: ${categoryId}`);

    const items = await getMenuItemsByCategoryPublic(categoryId);

    console.log(`✅ API: Found ${items.length} items for category: ${categoryId}`);

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error in menu items API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch menu items',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}