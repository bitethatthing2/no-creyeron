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

    // Fetch conversations for the authenticated user using the RPC function
    const { data: conversationsData, error } = await supabase.rpc('get_user_conversations', {
      input_user_id: user.id
    });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    console.log('Raw conversations data:', conversationsData);

    // Transform the data to match frontend expectations (flattened structure)
    const flattenedConversations = (conversationsData || []).map((conv: any) => {
      // For direct messages, get the other participant
      const otherParticipant = conv.other_participants && conv.other_participants.length > 0 
        ? conv.other_participants[0] 
        : null;

      return {
        // New format fields
        id: conv.id,
        conversation_type: conv.conversation_type,
        name: conv.name || (otherParticipant ? (otherParticipant.display_name || otherParticipant.username || 'Anonymous User') : 'Unknown'),
        last_message_at: conv.last_message_at,
        last_message_preview: conv.last_message_preview,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        unread_count: conv.unread_count || 0,
        
        // Flattened participant info for direct messages
        other_user_id: otherParticipant?.id,
        other_user_name: otherParticipant?.display_name || otherParticipant?.username || 'Anonymous User',
        other_user_avatar: otherParticipant?.avatar_url || '/icons/wolf-icon.png',
        other_user_username: otherParticipant?.username,
        other_user_is_online: otherParticipant?.is_online || false,
        other_participants: conv.other_participants,
        last_message_sender: conv.last_message_sender,
        
        // Legacy format for backward compatibility
        user_id: otherParticipant?.id,
        display_name: otherParticipant?.display_name || otherParticipant?.username || 'Anonymous User',
        username: otherParticipant?.username,
        avatar_url: otherParticipant?.avatar_url || '/icons/wolf-icon.png',
        last_message: conv.last_message_preview,
        last_message_time: conv.last_message_at,
        is_online: otherParticipant?.is_online || false
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