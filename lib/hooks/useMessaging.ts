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
  other_user_id: string;
  other_username: string;
  other_display_name: string;
  other_avatar_url: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface UseMessagingReturn {
  conversations: Conversation[];
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (recipientUserId: string, content: string) => Promise<boolean>;
  loadConversation: (conversationId: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

export function useMessaging(): UseMessagingReturn {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
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

  const sendMessage = async (recipientUserId: string, content: string): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to send messages');
      return false;
    }

    if (!content.trim()) {
      setError('Message cannot be empty');
      return false;
    }

    try {
      // Use the new send message API endpoint
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: recipientUserId,
          content: content.trim(),
          messageType: 'text'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      // Refresh conversations to show the new message
      await loadConversations();
      
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

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Set up real-time subscriptions for new messages
  useEffect(() => {
    if (!user) return;

    const messagesSubscription = supabase
      .channel('wolfpack_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wolfpack_messages'
        },
        (payload) => {
          console.log('New message received:', payload);
          // Refresh conversations when a new message comes in
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [user]);

  return {
    conversations,
    messages,
    loading,
    error,
    sendMessage,
    loadConversation,
    markAsRead,
    refreshConversations
  };
}