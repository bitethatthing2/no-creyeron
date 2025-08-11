import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

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

    // Fetch messages with sender info using direct join
    const { data: messages, error: messagesError } = await supabase
      .from('wolfpack_messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        created_at,
        message_type,
        media_url,
        is_deleted,
        users!sender_id(
          display_name,
          first_name,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (messagesError) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ 
      messages: messages || [],
      conversationId
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}