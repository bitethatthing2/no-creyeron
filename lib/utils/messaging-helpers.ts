// lib/utils/messaging-helpers.ts
// Complete working solution for messaging

import { getSupabaseBrowserClient } from '@/lib/supabase';

export interface ConversationWithDetails {
  id: string;
  conversation_type: string;
  name?: string;
  last_message_at?: string;
  last_message_preview?: string;
  participants: any[];
  unread_count: number;
  other_participant?: any;
}

/**
 * Load all conversations for the current user
 */
export async function loadUserConversations(userId: string): Promise<ConversationWithDetails[]> {
  const supabase = getSupabaseBrowserClient();
  
  try {
    // First, get all conversation IDs where user is a participant
    const { data: participantData, error: partError } = await supabase
      .from('chat_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (partError) {
      console.error('Error loading participant data:', partError);
      return [];
    }

    if (!participantData || participantData.length === 0) {
      console.log('No conversations found');
      return [];
    }

    const conversationIds = participantData.map(p => p.conversation_id);

    // Get conversation details
    const { data: conversations, error: convError } = await supabase
      .from('chat_conversations')
      .select('*')
      .in('id', conversationIds)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (convError) {
      console.error('Error loading conversations:', convError);
      return [];
    }

    // For each conversation, get participants and unread count
    const conversationsWithDetails = await Promise.all(
      (conversations || []).map(async (conv) => {
        // Get all participants
        const { data: allParticipants } = await supabase
          .from('chat_participants')
          .select(`
            *,
            user:users(
              id,
              email,
              first_name,
              last_name,
              display_name,
              username,
              avatar_url
            )
          `)
          .eq('conversation_id', conv.id)
          .eq('is_active', true);

        // Get the user's last_read_at for this conversation
        const userParticipant = participantData.find(p => p.conversation_id === conv.id);
        const lastReadAt = userParticipant?.last_read_at || '2000-01-01';

        // Get unread count
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', userId)
          .gt('created_at', lastReadAt);

        return {
          ...conv,
          participants: allParticipants || [],
          unread_count: count || 0,
          other_participant: conv.conversation_type === 'direct' 
            ? allParticipants?.find(p => p.user_id !== userId)?.user
            : undefined
        };
      })
    );

    return conversationsWithDetails;
  } catch (error) {
    console.error('Failed to load conversations:', error);
    return [];
  }
}

/**
 * Create or get a direct message conversation
 */
export async function createOrGetDirectConversation(
  currentUserId: string,
  otherUserId: string
): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  
  try {
    // Check for existing conversation
    // Get all conversations where current user is a participant
    const { data: userConvs } = await supabase
      .from('chat_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId)
      .eq('is_active', true);

    if (userConvs && userConvs.length > 0) {
      const convIds = userConvs.map(c => c.conversation_id);
      
      // Check which of these also have the other user
      const { data: otherUserConvs } = await supabase
        .from('chat_participants')
        .select('conversation_id')
        .eq('user_id', otherUserId)
        .eq('is_active', true)
        .in('conversation_id', convIds);

      if (otherUserConvs && otherUserConvs.length > 0) {
        // Check if any are direct conversations
        const { data: directConv } = await supabase
          .from('chat_conversations')
          .select('id')
          .eq('conversation_type', 'direct')
          .in('id', otherUserConvs.map(c => c.conversation_id))
          .single();

        if (directConv) {
          console.log('Found existing conversation:', directConv.id);
          return directConv.id;
        }
      }
    }

    // Create new conversation
    const { data: newConv, error: convError } = await supabase
      .from('chat_conversations')
      .insert({
        conversation_type: 'direct',
        created_by: currentUserId,
        participant_count: 2,
        is_active: true
      })
      .select()
      .single();

    if (convError) {
      console.error('Error creating conversation:', convError);
      return null;
    }

    // Add participants
    const { error: partError } = await supabase
      .from('chat_participants')
      .insert([
        {
          conversation_id: newConv.id,
          user_id: currentUserId,
          role: 'admin',
          is_active: true
        },
        {
          conversation_id: newConv.id,
          user_id: otherUserId,
          role: 'member',
          is_active: true
        }
      ]);

    if (partError) {
      console.error('Error adding participants:', partError);
      // Clean up the conversation if participants failed
      await supabase.from('chat_conversations').delete().eq('id', newConv.id);
      return null;
    }

    console.log('Created new conversation:', newConv.id);
    return newConv.id;
  } catch (error) {
    console.error('Unexpected error in createOrGetDirectConversation:', error);
    return null;
  }
}

/**
 * Load messages for a conversation
 */
export async function loadConversationMessages(
  conversationId: string,
  limit = 50
): Promise<any[]> {
  const supabase = getSupabaseBrowserClient();
  
  try {
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:users!sender_id(
          id,
          email,
          first_name,
          last_name,
          display_name,
          username,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error loading messages:', error);
      return [];
    }

    // Reverse to get chronological order
    return (messages || []).reverse();
  } catch (error) {
    console.error('Failed to load messages:', error);
    return [];
  }
}

/**
 * Send a message to a conversation
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  
  try {
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: 'text'
      });

    if (error) {
      console.error('Error sending message:', error);
      return false;
    }

    // Update conversation's last message info
    await supabase
      .from('chat_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: content.substring(0, 100),
        last_message_sender_id: senderId
      })
      .eq('id', conversationId);

    return true;
  } catch (error) {
    console.error('Failed to send message:', error);
    return false;
  }
}

// Export all functions for easy use
export const messagingHelpers = {
  loadUserConversations,
  createOrGetDirectConversation,
  loadConversationMessages,
  sendMessage
};