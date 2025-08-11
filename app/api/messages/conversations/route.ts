import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Create server client using the same pattern as other API routes
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('🚀 Fetching conversations for user:', user.id, 'at', new Date().toISOString());

    // Get the current user's database record first
    const { data: currentUserRecord, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (userError || !currentUserRecord) {
      console.error('Current user not found in database:', userError);
      
      // Provide more specific error information
      if (userError?.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'User profile not found. Please complete profile setup.',
          code: 'PROFILE_MISSING',
          details: userError.message 
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to verify user profile',
        code: 'USER_LOOKUP_FAILED',
        details: userError?.message || 'Unknown error'
      }, { status: 500 });
    }

    // Use the proper database view that returns real names
    const { data: conversations, error } = await supabase
      .from('user_conversations_view')
      .select('*')
      .eq('user_id', currentUserRecord.id)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching conversations from view:', error);
      
      // Handle specific database errors
      if (error.code === 'PGRST116') {
        // No conversations found - not an error, return empty array
        console.log('No conversations found for user:', currentUserRecord.id);
        return NextResponse.json({ 
          conversations: [],
          message: 'No conversations found'
        });
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch conversations',
        code: 'CONVERSATION_FETCH_FAILED',
        details: error.message 
      }, { status: 500 });
    }

    console.log('Raw conversations from user_conversations_view:', conversations);

    // Transform the view data to match frontend expectations
    const transformedConversations = (conversations || []).map((conv: any) => ({
      // Primary fields from view
      id: conv.conversation_id,
      conversation_id: conv.conversation_id,
      conversation_type: conv.conversation_type,
      name: conv.display_name, // This comes from the view with real names!
      last_message_at: conv.last_message_at,
      last_message_preview: conv.last_message_preview,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      unread_count: conv.unread_count || 0,
      
      // Other participant info from view
      other_user_id: conv.other_user_id,
      other_user_name: conv.display_name, // Real name from view!
      other_user_avatar: conv.avatar_url || '/icons/wolf-icon.png',
      other_user_username: conv.other_user_username,
      other_user_is_online: conv.other_user_is_online || false,
      
      // Legacy format for backward compatibility
      user_id: conv.other_user_id,
      display_name: conv.display_name, // Real name from view!
      username: conv.other_user_username,
      avatar_url: conv.avatar_url || '/icons/wolf-icon.png',
      last_message: conv.last_message_preview,
      last_message_time: conv.last_message_at,
      is_online: conv.other_user_is_online || false
    }));

    console.log('Transformed conversations with real names:', transformedConversations);

    return NextResponse.json({ 
      conversations: transformedConversations 
    });

  } catch (error) {
    console.error('Conversation fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}