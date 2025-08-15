import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  console.log('🔥 CONVERSATIONS API HIT AT:', new Date().toISOString());
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

    console.log('🚀 API UPDATED - Fetching conversations for auth user:', user.id, 'at', new Date().toISOString());

    // Get the current user's database record first
    const { data: currentUserRecord, error: userError } = await supabase
      .from('users')
      .select('id, display_name')
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

    console.log('📍 Found current user record:', {
      id: currentUserRecord.id, 
      auth_id: user.id,
      display_name: currentUserRecord.display_name || 'N/A'
    });

    // Use the FIXED database view that now returns proper user names
    const { data: conversations, error } = await supabase
      .from('user_conversations_view')
      .select('*')
      .eq('user_id', currentUserRecord.id)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching conversations from FIXED view:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch conversations',
        code: 'CONVERSATION_FETCH_FAILED',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ FIXED VIEW - Conversations with real names:', conversations);

    // Transform the FIXED view data (should now have proper display names)
    const transformedConversations = (conversations || []).map((conv: any) => {
      console.log(`🎯 Processing conversation from FIXED view:`, {
        conversation_id: conv.conversation_id,
        display_name: conv.display_name,
        conversation_type: conv.conversation_type,
        participants: conv.participants,
        other_user_id: conv.other_user_id,
        other_user_name: conv.other_user_name,
        other_user_display_name: conv.other_user_display_name
      });
      
      // Use the correct fields from the rebuilt view
      const actualDisplayName = conv.other_user_display_name || conv.other_user_name || conv.display_name || 'Wolf Pack Member';
      
      return {
        id: conv.conversation_id,
        conversation_id: conv.conversation_id,
        conversation_type: conv.conversation_type,
        name: actualDisplayName,
        last_message_at: conv.last_message_at,
        last_message_preview: conv.last_message_preview || '',
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        unread_count: conv.unread_count || 0,
        
        // Other participant info - use direct view fields
        other_user_id: conv.other_user_id || conv.participants?.[0]?.user_id || null,
        other_user_name: actualDisplayName,
        other_user_avatar: conv.other_user_avatar_url || conv.avatar_url || '/icons/wolf-icon.png',
        other_user_username: conv.other_user_username || conv.participants?.[0]?.username || null,
        other_user_is_online: conv.other_user_is_online || conv.participants?.[0]?.is_online || false,
        
        // Legacy format for backward compatibility
        user_id: conv.other_user_id || conv.participants?.[0]?.user_id || null,
        display_name: actualDisplayName,
        username: conv.other_user_username || conv.participants?.[0]?.username || null,
        avatar_url: conv.other_user_avatar_url || conv.avatar_url || '/icons/wolf-icon.png',
        last_message: conv.last_message_preview || '',
        last_message_time: conv.last_message_at,
        is_online: conv.other_user_is_online || conv.participants?.[0]?.is_online || false
      };
    });

    console.log('🎯 FINAL transformed conversations COUNT:', transformedConversations.length);
    console.log('🎯 FINAL transformed conversations:', JSON.stringify(transformedConversations, null, 2));

    return NextResponse.json({ 
      conversations: transformedConversations 
    });

  } catch (error) {
    console.error('Conversation fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}