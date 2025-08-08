// app/api/wolfpack/leave/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getDatabaseUserId } from '@/lib/utils/user-mapping';

export async function DELETE() {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    // Get database user ID
    const databaseUserId = await getDatabaseUserId(user.id);
    if (!databaseUserId) {
      return NextResponse.json(
        { error: 'User not found in database', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update user's wolfpack status to inactive
    const { error: leaveError } = await supabase
      .from('users')
      .update({
        wolfpack_status: 'inactive',
        is_wolfpack_member: false,
        last_activity: new Date().toISOString()
      })
      .eq('id', databaseUserId);

    if (leaveError) {
      console.error('Leave error:', leaveError);
      return NextResponse.json(
        { error: 'Failed to leave wolfpack', code: 'LEAVE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Left wolfpack successfully'
    });

  } catch (error) {
    console.error('Leave wolfpack error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

// Also support POST method for consistency with other endpoints
export async function POST() {
  return DELETE();
}