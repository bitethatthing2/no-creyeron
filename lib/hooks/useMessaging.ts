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

      const { data, error: fetchError } = await supabase
        .rpc('get_user_conversations', { user_uuid: user.id });

      if (fetchError) {
        console.error('Error loading conversations:', fetchError);
        setError('Failed to load conversations');
        return;
      }

      setConversations(data || []);
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

      const { data, error: fetchError } = await supabase
        .from('wolfpack_messages')
        .select(`
          *,
          users!sender_id (
            username,
            display_name,
            avatar_url,
            profile_image_url
          )
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('Error loading messages:', fetchError);
        setError('Failed to load messages');
        return;
      }

      const transformedMessages = (data || []).map(msg => ({
        ...msg,
        sender: msg.users ? {
          username: msg.users.username,
          display_name: msg.users.display_name,
          avatar_url: msg.users.avatar_url || msg.users.profile_image_url
        } : undefined
      }));

      setMessages(transformedMessages);

      // Mark messages as read
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
      // Get or create conversation
      const { data: conversationId, error: convError } = await supabase
        .rpc('get_or_create_conversation', {
          user1_id: user.id,
          user2_id: recipientUserId
        });

      if (convError || !conversationId) {
        console.error('Error getting/creating conversation:', convError);
        setError('Failed to create conversation');
        return false;
      }

      // Send message
      const { error: messageError } = await supabase
        .from('wolfpack_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          message_type: 'text'
        });

      if (messageError) {
        console.error('Error sending message:', messageError);
        setError('Failed to send message');
        return false;
      }

      // Refresh conversations and current conversation if it's loaded
      await loadConversations();
      
      return true;
    } catch (err) {
      console.error('Unexpected error sending message:', err);
      setError('Failed to send message');
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