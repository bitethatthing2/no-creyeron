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
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
    }

    // Temporarily use direct query until user_conversations_view is confirmed to exist
    const { data: participantData, error: participantError } = await supabase
      .from('wolfpack_conversation_participants')
      .select(`
        conversation_id,
        wolfpack_conversations!inner(
          id,
          conversation_type,
          name,
          last_message_at,
          last_message_preview,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', currentUserRecord.id)
      .order('wolfpack_conversations.last_message_at', { ascending: false });

    if (participantError) {
      console.error('Error fetching conversations:', participantError);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // Transform to expected format
    const conversationsData = participantData?.map(p => ({
      conversation_id: p.wolfpack_conversations.id,
      conversation_type: p.wolfpack_conversations.conversation_type,
      conversation_name: p.wolfpack_conversations.name,
      last_message_at: p.wolfpack_conversations.last_message_at,
      last_message_preview: p.wolfpack_conversations.last_message_preview,
      created_at: p.wolfpack_conversations.created_at,
      updated_at: p.wolfpack_conversations.updated_at,
      unread_count: 0, // TODO: Calculate unread count
      // For now, set placeholder other user data
      other_user_id: null,
      other_user_name: 'Chat Participant',
      other_user_avatar: '/icons/wolf-icon.png',
      other_user_username: null,
      other_user_is_online: false
    })) || [];

    const error = participantError;

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    console.log('Raw conversations data from direct query:', conversationsData);

    // Transform the data from user_conversations_view to match frontend expectations
    const flattenedConversations = (conversationsData || []).map((conv: any) => {
      return {
        // New format fields from view
        id: conv.conversation_id,
        conversation_type: conv.conversation_type,
        name: conv.conversation_name || 'Conversation',
        last_message_at: conv.last_message_at,
        last_message_preview: conv.last_message_preview,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        unread_count: conv.unread_count || 0,
        
        // Other participant info from view
        other_user_id: conv.other_user_id,
        other_user_name: conv.other_user_name || 'Anonymous User',
        other_user_avatar: conv.other_user_avatar || '/icons/wolf-icon.png',
        other_user_username: conv.other_user_username,
        other_user_is_online: conv.other_user_is_online || false,
        
        // Legacy format for backward compatibility
        user_id: conv.other_user_id,
        display_name: conv.other_user_name || 'Anonymous User',
        username: conv.other_user_username,
        avatar_url: conv.other_user_avatar || '/icons/wolf-icon.png',
        last_message: conv.last_message_preview,
        last_message_time: conv.last_message_at,
        is_online: conv.other_user_is_online || false
      };
    });

    console.log('Transformed conversations:', flattenedConversations);

    // Return in the format the frontend expects: { conversations: [...] }
    return NextResponse.json({ 
      conversations: flattenedConversations 
    });

  } catch (error) {
    console.error('Conversation fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}