import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { WolfpackService } from '@/lib/services/wolfpack';

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
    const authResult = await WolfpackService.auth.verifyUser(user);
    if (!authResult.isVerified) {
      return NextResponse.json(
        { error: authResult.error || 'User verification failed', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    // Location verification for non-VIP and non-permanent members
    if (!authResult.isVipUser && !authResult.isPermanentPackMember) {
      if (!latitude || !longitude) {
        return NextResponse.json(
          { error: 'Location coordinates required', code: 'LOCATION_ERROR' },
          { status: 400 }
        );
      }

      const locationResult = await WolfpackService.location.verifyUserLocation();
      if (!locationResult.isAtLocation) {
        return NextResponse.json(
          {
            error: 'Not within bar proximity',
            code: 'LOCATION_ERROR',
            details: { distance: locationResult.distance }
          },
          { status: 403 }
        );
      }
    }

    // Join the pack
    const joinData = {
      display_name: profile_data?.display_name || WolfpackService.auth.getUserDisplayName(user),
      emoji: profile_data?.emoji || '🐺',
      current_vibe: profile_data?.current_vibe || 'Ready to party!',
      favorite_drink: profile_data?.favorite_drink,
      looking_for: profile_data?.looking_for,
      instagram_handle: profile_data?.instagram_handle,
      table_location: profile_data?.table_location,
      latitude,
      longitude
    };

    const result = await WolfpackService.membership.joinPack(user, joinData, location_id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to join pack', code: 'JOIN_ERROR' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      pack_member_id: result.membershipId,
      data: result.data
    });

  } catch (error) {
    console.error('Join wolfpack error:', error);
    
    // Type guard to ensure error is properly typed for WolfpackErrorHandler
    const typedError = error instanceof Error 
      ? error 
      : new Error(typeof error === 'string' ? error : 'Unknown error occurred');
    
    const userError = WolfpackErrorHandler.handleSupabaseError(typedError, {
      operation: 'join_wolfpack'
    });

    return NextResponse.json(
      { error: userError.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}