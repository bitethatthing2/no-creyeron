// app/api/wolfpack/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@/lib/supabase/server";
// Helper function to get database user ID from auth user ID
async function getUserId(authId: string): Promise<string | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data.id;
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('location_id');

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Get database user ID
    const databaseUserId = await getUserId(user.id);
    if (!databaseUserId) {
      return NextResponse.json(
        { error: 'User not found in database', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify user is member of this location
    const { data: userMembership } = await supabase
      .from('users')
      .select('id')
      .eq('id', databaseUserId)
      .eq('location_id', locationId)
      .eq('is_wolfpack_member', true)
      .eq('wolfpack_status', 'active')
      .maybeSingle();

    if (!userMembership) {
      return NextResponse.json(
        { error: 'Not a member of this wolfpack', code: 'ACCESS_DENIED' },
        { status: 403 }
      );
    }

    // Get all members at this location
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('*')
      .eq('location_id', locationId)
      .eq('is_wolfpack_member', true)
      .eq('wolfpack_status', 'active')
      .order('wolfpack_joined_at', { ascending: false });

    if (membersError) {
      console.error('Members error:', membersError);
      return NextResponse.json(
        { error: 'Failed to load members', code: 'MEMBERS_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      members: members || [],
      location_id: locationId,
      current_id: databaseUserId
    });

  } catch (error) {
    console.error('Get wolfpack members error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}