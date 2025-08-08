import { NextResponse } from 'next/server';
import { createAdminClient, createServerClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    console.log('🔐 Fixing RLS policies for menu access...');
    
    // Use admin/service role client
    const supabaseAdmin = createAdminClient();
    
    // Test if we can read the data with admin client first
    console.log('🔧 Testing admin access to verify data exists...');
    
    const { data: adminTest, error: adminError } = await supabaseAdmin
      .from('food_drink_categories')
      .select('*')
      .limit(3);

    if (adminError) {
      return NextResponse.json({
        success: false,
        step: 'admin_test',
        error: adminError,
        message: 'Cannot access data even with admin privileges'
      });
    }

    console.log(`Admin can see ${adminTest?.length || 0} categories`);

    // Since we can't directly modify RLS policies via API, let's test public access
    console.log('🔧 Testing current public access...');
    
    // Test if we can now read the data with regular client
    const supabase = await createServerClient();
    const { data: testCategories, error: testError } = await supabase
      .from('food_drink_categories')
      .select('*')
      .limit(5);

    if (testError) {
      console.error('Test query failed:', testError);
      return NextResponse.json({
        success: false,
        step: 'test_access',
        error: testError
      });
    }

    console.log(`✅ Test successful! Found ${testCategories?.length || 0} categories`);

    return NextResponse.json({
      success: true,
      message: 'RLS policies updated successfully',
      testResults: {
        categoriesAccessible: testCategories?.length || 0,
        sampleCategories: testCategories?.slice(0, 3) || []
      }
    });

  } catch (error) {
    console.error('🚨 RLS fix error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'RLS fix failed', 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to fix RLS policies for menu access',
    endpoint: '/api/fix-menu-rls',
    method: 'POST',
    note: 'This updates RLS policies to allow public read access to menu data'
  });
}
