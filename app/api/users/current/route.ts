import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's database record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, display_name, auth_id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    return NextResponse.json(userData);

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}