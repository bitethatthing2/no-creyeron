import * as React from 'react';
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { debugLog, performanceLog } from "@/lib/debug";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "image" | "video" | "audio";
  media_url?: string;
  reply_to_id?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  is_edited: boolean;
  sender_first_name?: string;
  sender_last_name?: string;
  sender_display_name?: string;
  sender_avatar_url?: string;
}

export interface Conversation {
  conversation_id: string;
  conversation_name: string | null;
  conversation_type: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count: number;
  participants?: any[];
}

interface UseMessagingReturn {
  conversations: Conversation[];
  messages: Message[];
  loading: boolean;
  error: string | null;
  currentUserId: string | null;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<boolean>;
  getOrCreateDirectConversation: (
    otherUserId: string,
  ) => Promise<string | null>;
  subscribeToMessages: (conversationId: string) => () => void;
}

export function useMessaging(): UseMessagingReturn {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  // Get current user's database ID from context
  React.useEffect(() => {
    if (currentUser) {
      setCurrentUserId(currentUser.id);
    } else {
      setCurrentUserId(null);
    }
  }, [currentUser]);

  // Load all conversations for the current user
  const loadConversations = React.useCallback(async () => {
    if (!currentUserId) {
      debugLog.messaging("loadConversations", "No current user ID available");
      return;
    }

    const startTime = performanceLog.start("loadConversations");
    debugLog.messaging("loadConversations", { currentUserId });

    setLoading(true);
    setError(null);

    try {
      // Use the API route which uses the proper database view with real names
      const response = await fetch("/api/messages/conversations");
      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }

      const apiData = await response.json();
      setConversations(apiData.conversations || []);
      debugLog.success("loadConversations", {
        count: apiData.conversations?.length || 0,
        conversations: apiData.conversations,
      });
      performanceLog.end("loadConversations", startTime);
    } catch (err) {
      debugLog.error("loadConversations", err, { currentUserId });
      setError(
        err instanceof Error ? err.message : "Failed to load conversations",
      );
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Load messages for a specific conversation
  const loadMessages = React.useCallback(async (conversationId: string) => {
    const startTime = performanceLog.start("loadMessages");
    debugLog.messaging("loadMessages", { conversationId });

    setLoading(true);
    setError(null);

    try {
      // Use the API route which uses the proper database view with real sender names
      const response = await fetch(
        `/api/messages/conversation/${conversationId}`,
      );
      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }

      const apiData = await response.json();
      setMessages(apiData.messages || []);
      debugLog.success("loadMessages", {
        count: apiData.messages?.length || 0,
        conversationId,
        messages: apiData.messages,
      });
      performanceLog.end("loadMessages", startTime);
    } catch (err) {
      debugLog.error("loadMessages", err, { conversationId });
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  // Send a message to a conversation
  const sendMessage = React.useCallback(
    async (conversationId: string, content: string) => {
      if (!currentUserId || !content.trim()) return false;

      try {
        const { error } = await supabase
          .from("wolfpack_messages")
          .insert({
            conversation_id: conversationId,
            sender_id: currentUserId,
            content: content.trim(),
            message_type: "text",
            status: "sent",
          });

        if (error) throw error;

        // Reload messages
        await loadMessages(conversationId);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
        return false;
      }
    },
    [currentUserId, loadMessages],
  );

  // Create or get a direct conversation with another user
  const getOrCreateDirectConversation = React.useCallback(
    async (otherUserIdOrAuthId: string) => {
      if (!currentUserId) return null;

      try {
        // First, resolve the auth_id to database user_id if needed
        let otherUserId = otherUserIdOrAuthId;

        // Check if the provided ID looks like an auth_id (Firebase format) or a database ID
        // Firebase auth IDs are typically longer and contain hyphens
        if (
          otherUserIdOrAuthId.includes("-") && otherUserIdOrAuthId.length > 20
        ) {
          const { data: otherUser } = await supabase
            .from("users")
            .select("id")
            .eq("auth_id", otherUserIdOrAuthId)
            .single();

          if (!otherUser) {
            setError("User not found");
            return null;
          }

          otherUserId = otherUser.id;
        }

        // First check if a direct conversation already exists
        const { data: existing } = await supabase
          .from("wolfpack_conversations")
          .select(`
          *,
          wolfpack_conversation_participants!inner(user_id)
        `)
          .eq("conversation_type", "direct")
          .eq("wolfpack_conversation_participants.user_id", currentUserId);

        // Find conversation that includes both users
        const existingConversation = existing?.find((conv) => {
          const participants = conv.wolfpack_conversation_participants as any[];
          return participants.some((p) => p.user_id === otherUserId);
        });

        if (existingConversation) {
          return existingConversation.id;
        }

        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from("wolfpack_conversations")
          .insert({
            conversation_type: "direct",
            created_by: currentUserId,
          })
          .select()
          .single();

        if (convError) throw convError;

        // Add participants
        const { error: partError } = await supabase
          .from("wolfpack_conversation_participants")
          .insert([
            { conversation_id: newConv.id, user_id: currentUserId },
            { conversation_id: newConv.id, user_id: otherUserId },
          ]);

        if (partError) throw partError;

        return newConv.id;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create conversation",
        );
        return null;
      }
    },
    [currentUserId],
  );

  // Subscribe to real-time messages
  const subscribeToMessages = React.useCallback((conversationId: string) => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wolfpack_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Reload messages to get full sender info
          loadMessages(conversationId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMessages]);

  return {
    // Data
    conversations,
    messages,
    loading,
    error,
    currentUserId,

    // Actions
    loadConversations,
    loadMessages,
    sendMessage,
    getOrCreateDirectConversation,
    subscribeToMessages,
  };
}
