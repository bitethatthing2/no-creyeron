import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@/lib/supabase/server";

interface Params {
  params: {
    conversationId: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createServerClient();
    const { conversationId } = params;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch messages using the messages_with_sender_view 
    const { data: messages, error: messagesError } = await supabase
      .from('messages_with_sender_view')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({ 
        error: 'Failed to fetch messages',
        details: messagesError.message 
      }, { status: 500 });
    }

    console.log(`Fetched ${messages?.length || 0} messages for conversation ${conversationId}`);

    // Get conversation metadata with participants
    const { data: conversationData } = await supabase
      .from('wolfpack_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    // Get other participants in this conversation (exclude current user)
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const { data: currentUserRecord } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser?.id!)
      .single();

    const { data: participants } = await supabase
      .from('wolfpack_conversation_participants')
      .select(`
        user_id,
        users(
          id,
          auth_id,
          first_name,
          last_name,
          display_name,
          username,
          avatar_url,
          wolfpack_status
        )
      `)
      .eq('conversation_id', conversationId)
      .neq('user_id', currentUserRecord?.id);

    console.log(`Participants for conversation ${conversationId}:`, participants);

    return NextResponse.json({ 
      messages: messages || [],
      conversation: conversationData,
      participants: participants || [],
      conversationId
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}