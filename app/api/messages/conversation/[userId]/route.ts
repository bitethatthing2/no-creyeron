import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

interface Params {
  params: {
    userId: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createServerClient();
    const { userId: otherUserId } = params;
    
    console.log('🚀 Conversation API called with otherUserId:', otherUserId, 'at', new Date().toISOString());
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Current user auth ID:', user.id);

    // Get the current user's database record
    const { data: currentUserRecord, error: currentUserError } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (currentUserError || !currentUserRecord) {
      console.error('Current user not found in database:', currentUserError);
      return NextResponse.json(
        { error: 'Current user not found in database' },
        { status: 404 }
      );
    }

    // Verify the other user exists (check both id and auth_id)
    let { data: otherUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, auth_id, display_name')
      .eq('id', otherUserId)
      .maybeSingle();

    // If not found by id, try by auth_id
    if (!otherUser && !userCheckError) {
      const { data: otherUserByAuth, error: authCheckError } = await supabase
        .from('users')
        .select('id, auth_id, display_name')
        .eq('auth_id', otherUserId)
        .maybeSingle();
      
      otherUser = otherUserByAuth;
      userCheckError = authCheckError;
    }

    if (userCheckError) {
      console.error('Error checking other user:', userCheckError);
      return NextResponse.json(
        { error: 'Error validating user' },
        { status: 500 }
      );
    }

    if (!otherUser) {
      console.log('Other user not found:', otherUserId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Users found - Current:', currentUserRecord.id, 'Other:', otherUser.id);

    // Use the safe helper function to find or create conversation
    const { data: conversationResult, error: conversationError } = await supabase
      .rpc('find_or_create_direct_conversation', {
        other_user_id: otherUser.id
      });

    if (conversationError) {
      console.error('Error with conversation function:', conversationError);
      return NextResponse.json(
        { error: 'Failed to get conversation', details: conversationError.message },
        { status: 500 }
      );
    }

    const conversationId = conversationResult;
    console.log('Conversation ID:', conversationId);

    // Fetch messages using the new messages_with_sender_view
    const { data: messages, error: messagesError } = await supabase
      .from('messages_with_sender_view')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(100);

    console.log('Messages query result:', { messages, messagesError });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages', details: messagesError.message },
        { status: 500 }
      );
    }

    // Mark messages as read using the helper function
    const { error: readError } = await supabase
      .rpc('mark_messages_as_read', {
        p_conversation_id: conversationId,
        p_user_id: currentUserRecord.id
      });

    if (readError) {
      console.error('Error marking as read:', readError);
      // Don't fail the request for this
    }

    return NextResponse.json({ 
      conversationId,
      messages: messages || [],
      otherUser: {
        id: otherUser.id,
        auth_id: otherUser.auth_id,
        display_name: otherUser.display_name
      },
      currentUserDbId: currentUserRecord.id
    });
  } catch (error) {
    console.error('Error in conversation API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}