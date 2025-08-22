import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@/lib/supabase/server";
import { WolfpackService, mapSupabaseError } from '@/lib/services/wolfpack';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { location_id, latitude, longitude, profile_data } = body;

    // Verify user authentication
    const verifiedUser = await WolfpackService.auth.verifyUser();
    if (!verifiedUser) {
      return NextResponse.json(
        { error: 'User verification failed', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    // Check if user is VIP or permanent pack member
    const isVipUser = await WolfpackService.auth.isVipUser();
    const isPermanentPackMember = verifiedUser.wolfpack_status === 'permanent_member';

    // TODO: Location verification for non-VIP and non-permanent members
    // The location service is not yet implemented in the consolidated WolfpackService
    
    // TODO: Join pack logic - membership service not yet implemented
    // For now, return a temporary response
    return NextResponse.json({
      success: false,
      message: 'Wolfpack join functionality is currently being refactored',
      code: 'SERVICE_UNAVAILABLE'
    }, { status: 503 });

  } catch (error) {
    console.error('Join wolfpack error:', error);
    
    // Type guard to ensure error is properly typed for WolfpackErrorHandler
    const typedError = error instanceof Error 
      ? error 
      : new Error(typeof error === 'string' ? error : 'Unknown error occurred');
    
    const userError = mapSupabaseError(typedError);

    return NextResponse.json(
      { error: userError.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}