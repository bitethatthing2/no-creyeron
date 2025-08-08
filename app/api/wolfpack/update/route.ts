// app/api/wolfpack/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getDatabaseUserId } from '@/lib/utils/user-mapping';
import { sanitizeMessage, sanitizeDisplayName } from '@/lib/utils/input-sanitization';

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    // Sanitize and validate input fields
    const allowedFields = ['table_location', 'current_vibe', 'display_name'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        let sanitizedValue = body[field];
        
        // Apply appropriate sanitization based on field
        if (field === 'display_name') {
          sanitizedValue = sanitizeDisplayName(body[field]);
        } else if (field === 'current_vibe') {
          sanitizedValue = sanitizeMessage(body[field], {
            maxLength: 100,
            allowLineBreaks: false,
            trimWhitespace: true
          });
        } else if (field === 'table_location') {
          sanitizedValue = sanitizeMessage(body[field], {
            maxLength: 50,
            allowLineBreaks: false,
            trimWhitespace: true
          });
        }
        
        updateData[field] = sanitizedValue;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Add last_active timestamp
    updateData.last_active = new Date().toISOString();

    // Update user wolfpack profile
    const { data: updatedMembership, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', databaseUserId)
      .eq('is_wolfpack_member', true)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update membership', code: 'UPDATE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      membership: updatedMembership
    });

  } catch (error) {
    console.error('Update wolfpack error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

// Also support PUT method for consistency
export async function PUT(request: NextRequest) {
  return PATCH(request);
}