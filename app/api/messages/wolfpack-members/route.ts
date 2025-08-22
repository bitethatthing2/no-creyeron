import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 NEW Wolfpack members API called at:', new Date().toISOString());
    
    const supabase = await createServerClient();
    console.log('✅ Supabase client created');
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error in wolfpack-members:', authError);
      return NextResponse.json(
        { error: 'Authentication failed', details: authError.message },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.error('❌ No user found in auth');
      return NextResponse.json(
        { error: 'No authenticated user' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Try to fetch users with detailed error handling
    console.log('📝 Attempting to query users table...');
    
    const { data: wolfpackMembers, error, count } = await supabase
      .from('users')
      .select(`
        id,
        auth_id,
        display_name,
        username,
        first_name,
        last_name,
        avatar_url,
        profile_image_url,
        location,
        wolfpack_status,
        status,
        created_at
      `, { count: 'exact' })
      .eq('wolfpack_status', 'active')
      .eq('status', 'active')
      .is('deleted_at', null)
      .neq('auth_id', user.id)
      .order('display_name', { ascending: true });

    console.log('📊 Query result:', { 
      memberCount: wolfpackMembers?.length || 0, 
      totalCount: count,
      error: error ? { code: error.code, message: error.message, details: error.details } : null
    });

    if (error) {
      console.error('❌ Database error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Return a fallback response instead of failing
      console.log('🔄 Returning fallback empty response due to database error');
      return NextResponse.json({ 
        members: [],
        totalCount: 0,
        currentUserId: user.id,
        message: 'Database tables may not be set up yet. Wolfpack member listing will be available once the database is configured.',
        error: 'Database access failed',
        details: error.message
      });
    }

    // Format the response
    const formattedMembers = wolfpackMembers?.map(member => ({
      ...member,
      displayName: member.display_name || 
                   `${member.first_name || ''} ${member.last_name || ''}`.trim() ||
                   member.username ||
                   'Wolf Pack Member',
      avatarUrl: member.avatar_url || member.profile_image_url || '/icons/wolf-icon.png',
      canMessage: true
    })) || [];

    console.log(`✅ Successfully returning ${formattedMembers.length} wolfpack members`);

    return NextResponse.json({ 
      members: formattedMembers,
      totalCount: count || 0,
      currentUserId: user.id,
      message: `Found ${count || 0} active Wolf Pack members available for messaging`
    });

  } catch (error) {
    console.error('💥 Unexpected error in wolfpack-members API:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        message: 'Unable to fetch wolfpack members at this time'
      },
      { status: 500 }
    );
  }
}