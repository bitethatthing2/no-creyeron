import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'audio';
  media_url?: string;
  reply_to_id?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  is_edited: boolean;
  sender?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export interface Conversation {
  conversation_id: string;
  conversation_type: string;
  conversation_name: string | null;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string;
  last_message_preview: string;
  last_message_at: string;
  unread_count: number;
}

interface UseMessagingReturn {
  conversations: Conversation[];
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string, conversationId?: string) => Promise<boolean>;
  loadConversation: (conversationId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

export function useMessaging(conversationId?: string): UseMessagingReturn {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Use the new API endpoint instead of RPC function
      const response = await fetch('/api/messages/conversations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load conversations');
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Unexpected error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Use the new messages_with_sender_view
      const { data, error: fetchError } = await supabase
        .from('messages_with_sender_view')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('Error loading messages:', fetchError);
        setError('Failed to load messages');
        return;
      }

      // Transform data from view to match hook interface
      const transformedMessages = (data || []).map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        content: msg.content,
        message_type: msg.message_type,
        media_url: msg.media_url,
        reply_to_id: msg.reply_to_id,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        is_deleted: msg.is_deleted,
        is_edited: msg.is_edited,
        sender: {
          username: msg.sender_username,
          display_name: msg.sender_first_name || msg.sender_display_name,
          avatar_url: msg.sender_avatar_url || '/icons/wolf-icon.png'
        }
      }));

      setMessages(transformedMessages);

      // Mark messages as read using RPC function (this should still work)
      await markAsRead(conversationId);
    } catch (err) {
      console.error('Unexpected error loading conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string, targetConversationId?: string): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to send messages');
      return false;
    }

    if (!content.trim()) {
      setError('Message cannot be empty');
      return false;
    }

    const useConversationId = targetConversationId || conversationId;
    if (!useConversationId) {
      setError('No conversation specified');
      return false;
    }

    try {
      // Get current user's database ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!userData) {
        setError('User not found');
        return false;
      }

      // Insert message directly into wolfpack_messages
      const { error: messageError } = await supabase
        .from('wolfpack_messages')
        .insert({
          conversation_id: useConversationId,
          sender_id: userData.id,
          content: content.trim(),
          message_type: 'text',
          status: 'sent'
        });

      if (messageError) {
        console.error('Error sending message:', messageError);
        setError('Failed to send message');
        return false;
      }

      // Refresh messages if we're in a conversation view
      if (conversationId) {
        await loadConversation(conversationId);
      } else {
        await loadConversations();
      }
      
      return true;
    } catch (err) {
      console.error('Unexpected error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    }
  };

  const markAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase.rpc('mark_messages_as_read', {
        conv_id: conversationId,
        user_uuid: user.id
      });

      // Refresh conversations to update unread counts
      await loadConversations();
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const refreshConversations = async () => {
    await loadConversations();
  };

  // Initial load - either conversations or messages for specific conversation
  useEffect(() => {
    if (!user) return;

    if (conversationId) {
      loadConversation(conversationId);
    } else {
      loadConversations();
    }
  }, [user, conversationId]);

  // Set up real-time subscription for specific conversation
  useEffect(() => {
    if (!user || !conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wolfpack_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('New message received:', payload);
          // Add new message to current messages
          setMessages(prev => [...prev, {
            id: payload.new.id,
            conversation_id: payload.new.conversation_id,
            sender_id: payload.new.sender_id,
            content: payload.new.content,
            message_type: payload.new.message_type,
            created_at: payload.new.created_at,
            updated_at: payload.new.updated_at,
            is_deleted: payload.new.is_deleted,
            is_edited: payload.new.is_edited,
            reply_to_id: payload.new.reply_to_id,
            media_url: payload.new.media_url
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, conversationId]);

  return {
    conversations,
    messages,
    loading,
    error,
    sendMessage,
    loadConversation,
    refreshConversations: conversationId ? () => loadConversation(conversationId) : loadConversations
  };
}