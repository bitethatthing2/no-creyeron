import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { otherUserId } = await request.json();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's database record
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
    }

    // Get other user's database record (try both id and auth_id)
    let { data: otherUser } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('id', otherUserId)
      .maybeSingle();

    // If not found by id, try by auth_id
    if (!otherUser) {
      const { data: otherUserByAuth } = await supabase
        .from('users')
        .select('id, display_name')
        .eq('auth_id', otherUserId)
        .maybeSingle();
      otherUser = otherUserByAuth;
    }

    if (!otherUser) {
      return NextResponse.json({ error: 'Other user not found' }, { status: 404 });
    }

    // Use RPC to find or create conversation
    const { data: conversationId, error: convError } = await supabase
      .rpc('find_or_create_direct_conversation', {
        other_user_id: otherUser.id
      });

    if (convError) {
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    return NextResponse.json({ 
      conversationId,
      otherUser: {
        id: otherUser.id,
        display_name: otherUser.display_name
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}