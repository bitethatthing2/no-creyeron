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

    // Fetch conversations using the new user_conversations_view
    const { data: conversationsData, error } = await supabase
      .from('user_conversations_view')
      .select('*')
      .eq('user_id', currentUserRecord.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    console.log('Raw conversations data from user_conversations_view:', conversationsData);

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