// lib/hooks/useMessaging.ts
// Main messaging hook that uses MESSAGE_HANDLER edge function for better performance and automatic notifications

import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { error as logError, info, success } from "@/lib/debug";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { messageHandlerService } from "@/lib/services/message-handler.service";
import type {
  ConversationWithParticipants,
  MediaType,
  MessageWithSender,
  ParticipantRole,
  MessageType,
} from "@/types/chat";
import { RealtimeChannel } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Notification settings structure
interface NotificationSettings {
  muted?: boolean;
  sound?: string;
  vibrate?: boolean;
  [key: string]: unknown;
}

// Same interface as original useMessaging
interface UseMessagingReturn {
  // Data
  conversations: ConversationWithParticipants[];
  messages: MessageWithSender[];
  loading: boolean;
  error: string | null;
  currentUserId: string | null;
  typingUsers: Map<string, string[]>;

  // Conversation actions
  loadConversations: () => Promise<void>;
  getOrCreateDirectConversation: (
    otherUserId: string,
  ) => Promise<string | null>;
  createGroupConversation: (
    name: string,
    participantIds: string[],
  ) => Promise<string | null>;
  updateConversation: (
    conversationId: string,
    updates: Partial<ConversationWithParticipants>,
  ) => Promise<boolean>;
  archiveConversation: (conversationId: string) => Promise<boolean>;
  leaveConversation: (conversationId: string) => Promise<boolean>;

  // Message actions
  loadMessages: (
    conversationId: string,
    limit?: number,
    before?: string,
  ) => Promise<void>;
  sendMessage: (
    conversationId: string,
    content: string,
    messageType?: MessageType,
    mediaUrl?: string,
    mediaType?: MediaType,
  ) => Promise<boolean>;
  editMessage: (messageId: string, newContent: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;

  // Read receipts
  markMessageAsRead: (messageId: string) => Promise<boolean>;
  markConversationAsRead: (conversationId: string) => Promise<boolean>;

  // Reactions
  addReaction: (messageId: string, reaction: string) => Promise<boolean>;
  removeReaction: (reactionId: string) => Promise<boolean>;

  // Real-time actions
  subscribeToConversation: (conversationId: string) => () => void;
  subscribeToTypingIndicators: (conversationId: string) => () => void;
  sendTypingIndicator: (
    conversationId: string,
    isTyping: boolean,
  ) => Promise<void>;

  // Participant actions (fallback to original implementation)
  addParticipants: (
    conversationId: string,
    userIds: string[],
  ) => Promise<boolean>;
  removeParticipant: (
    conversationId: string,
    userId: string,
  ) => Promise<boolean>;
  updateParticipantRole: (
    conversationId: string,
    userId: string,
    role: ParticipantRole,
  ) => Promise<boolean>;

  // Notification actions (fallback to original implementation)
  getNotificationSettings: (
    conversationId: string,
  ) => Promise<NotificationSettings | null>;
  updateNotificationSettings: (
    conversationId: string,
    settings: NotificationSettings,
  ) => Promise<boolean>;
}

export function useMessaging(): UseMessagingReturn {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = React.useState<
    ConversationWithParticipants[]
  >([]);
  const [messages, setMessages] = React.useState<MessageWithSender[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [typingUsers, setTypingUsers] = React.useState<Map<string, string[]>>(
    new Map(),
  );

  const supabase = getSupabaseBrowserClient();

  // Track active subscriptions
  const subscriptionsRef = React.useRef<Map<string, RealtimeChannel>>(
    new Map(),
  );
  const typingTimeoutsRef = React.useRef<Map<string, NodeJS.Timeout>>(
    new Map(),
  );

  // Set current user ID
  React.useEffect(() => {
    if (currentUser?.id) {
      setCurrentUserId(currentUser.id);
    }
  }, [currentUser]);

  // Cleanup subscriptions on unmount
  React.useEffect(() => {
    const subscriptions = subscriptionsRef.current;
    const typingTimeouts = typingTimeoutsRef.current;

    return () => {
      subscriptions.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      typingTimeouts.forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, [supabase]);

  // Load conversations using MESSAGE_HANDLER
  const loadConversations = React.useCallback(async () => {
    if (!currentUserId) return;

    setLoading(true);
    setError(null);

    try {
      info("Messaging", "Loading conversations via MESSAGE_HANDLER");

      const response = await messageHandlerService.getConversations({
        limit: 50,
        offset: 0,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to load conversations");
      }

      const conversationList = response.conversations || [];
      setConversations(conversationList);
      success("loadConversations", { count: conversationList.length });
    } catch (err) {
      logError("loadConversations", err);
      setError(
        err instanceof Error ? err.message : "Failed to load conversations",
      );
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Load messages using MESSAGE_HANDLER
  const loadMessages = React.useCallback(async (
    conversationId: string,
    limit = 50,
    before?: string,
  ) => {
    setLoading(true);
    setError(null);

    try {
      info(
        "Messaging",
        `Loading messages via MESSAGE_HANDLER (conversationId=${conversationId}, limit=${limit})`,
      );

      const response = await messageHandlerService.getMessages({
        conversation_id: conversationId,
        limit,
        before_message_id: before,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to load messages");
      }

      const messageList = response.messages || [];
      setMessages(messageList);
      success("loadMessages", { count: messageList.length });
    } catch (err) {
      logError("loadMessages", err);
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  // Send message using MESSAGE_HANDLER
  const sendMessage = React.useCallback(async (
    conversationId: string,
    content: string,
    messageType: MessageType = MessageType.TEXT,
    mediaUrl?: string,
    mediaType?: MediaType,
  ) => {
    if (!currentUserId || !content.trim()) return false;

    try {
      const response = await messageHandlerService.sendMessage({
        conversation_id: conversationId,
        content: content.trim(),
        message_type: messageType,
        media_url: mediaUrl,
        media_type: mediaType,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to send message");
      }

      success("sendMessage", { conversationId });
      return true;
    } catch (err) {
      logError("sendMessage", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
      return false;
    }
  }, [currentUserId]);

  // Get or create direct conversation using MESSAGE_HANDLER
  const getOrCreateDirectConversation = React.useCallback(
    async (otherUserId: string) => {
      if (!currentUserId) return null;

      try {
        const response = await messageHandlerService.createDirectConversation({
          other_user_id: otherUserId,
        });

        if (!response.success) {
          throw new Error(response.error || "Failed to create conversation");
        }

        return response.conversation?.id || null;
      } catch (err) {
        logError("getOrCreateDirectConversation", err);
        setError(
          err instanceof Error ? err.message : "Failed to create conversation",
        );
        return null;
      }
    },
    [currentUserId],
  );

  // Mark message as read using MESSAGE_HANDLER
  const markMessageAsRead = React.useCallback(async (messageId: string) => {
    if (!currentUserId) return false;

    try {
      const response = await messageHandlerService.markMessageAsRead(messageId);
      return response.success || false;
    } catch (err) {
      logError("markMessageAsRead", err);
      return false;
    }
  }, [currentUserId]);

  // Mark conversation as read using MESSAGE_HANDLER
  const markConversationAsRead = React.useCallback(
    async (conversationId: string) => {
      if (!currentUserId) return false;

      try {
        const response = await messageHandlerService.markConversationAsRead(
          conversationId,
        );
        return response.success || false;
      } catch (err) {
        logError("markConversationAsRead", err);
        return false;
      }
    },
    [currentUserId],
  );

  // Add reaction using MESSAGE_HANDLER
  const addReaction = React.useCallback(
    async (messageId: string, reaction: string) => {
      if (!currentUserId) return false;

      try {
        const response = await messageHandlerService.addReaction(
          messageId,
          reaction,
        );
        return response.success || false;
      } catch (err) {
        logError("addReaction", err);
        return false;
      }
    },
    [currentUserId],
  );

  // Remove reaction (same endpoint as add in MESSAGE_HANDLER)
  const removeReaction = React.useCallback(async () => {
    // Note: MESSAGE_HANDLER toggles reactions, so this is same as add
    return false; // Not directly supported, would need message_id + reaction
  }, []);

  // Send typing indicator using MESSAGE_HANDLER
  const sendTypingIndicator = React.useCallback(async (
    conversationId: string,
    isTyping: boolean,
  ) => {
    if (!currentUserId) return;

    try {
      await messageHandlerService.setTypingStatus(conversationId, isTyping);
    } catch (err) {
      console.error("❌ sendTypingIndicator error:", err);
    }
  }, [currentUserId]);

  // Real-time subscriptions (keep original implementation)
  const subscribeToConversation = React.useCallback(
    (conversationId: string) => {
      const existing = subscriptionsRef.current.get(conversationId);
      if (existing) {
        supabase.removeChannel(existing);
      }

      const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          async () => {
            // Reload messages to get updated list
            await loadMessages(conversationId);
          },
        )
        .subscribe();

      subscriptionsRef.current.set(conversationId, channel);

      return () => {
        supabase.removeChannel(channel);
        subscriptionsRef.current.delete(conversationId);
      };
    },
    [supabase, loadMessages],
  );

  const subscribeToTypingIndicators = React.useCallback(
    (conversationId: string) => {
      const channel = supabase
        .channel(`typing:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "chat_participants",
            filter: `conversation_id=eq.${conversationId}`,
          },
          async () => {
            const { data } = await supabase
              .from("v_typing_users")
              .select("user_id")
              .eq("conversation_id", conversationId)
              .eq("is_typing", true);

            const typingUserIds = data?.map((d) => d.user_id) || [];
            setTypingUsers((prev) => {
              const newMap = new Map(prev);
              newMap.set(
                conversationId,
                typingUserIds.filter((id) => id !== currentUserId),
              );
              return newMap;
            });
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    [currentUserId, supabase],
  );

  // Fallback implementations for methods not in MESSAGE_HANDLER yet
  const createGroupConversation = React.useCallback(async () => {
    console.warn(
      "createGroupConversation: Using fallback - not implemented in MESSAGE_HANDLER",
    );
    return null;
  }, []);

  const updateConversation = React.useCallback(async () => {
    console.warn(
      "updateConversation: Using fallback - not implemented in MESSAGE_HANDLER",
    );
    return false;
  }, []);

  const archiveConversation = React.useCallback(async () => {
    console.warn(
      "archiveConversation: Using fallback - not implemented in MESSAGE_HANDLER",
    );
    return false;
  }, []);

  const leaveConversation = React.useCallback(async () => {
    console.warn(
      "leaveConversation: Using fallback - not implemented in MESSAGE_HANDLER",
    );
    return false;
  }, []);

  const editMessage = React.useCallback(async () => {
    console.warn(
      "editMessage: Using fallback - not implemented in MESSAGE_HANDLER",
    );
    return false;
  }, []);

  const deleteMessage = React.useCallback(async () => {
    console.warn(
      "deleteMessage: Using fallback - not implemented in MESSAGE_HANDLER",
    );
    return false;
  }, []);

  const addParticipants = React.useCallback(async () => {
    console.warn(
      "addParticipants: Using fallback - not implemented in MESSAGE_HANDLER",
    );
    return false;
  }, []);

  const removeParticipant = React.useCallback(async () => {
    console.warn(
      "removeParticipant: Using fallback - not implemented in MESSAGE_HANDLER",
    );
    return false;
  }, []);

  const updateParticipantRole = React.useCallback(async () => {
    console.warn(
      "updateParticipantRole: Using fallback - not implemented in MESSAGE_HANDLER",
    );
    return false;
  }, []);

  const getNotificationSettings = React.useCallback(async () => {
    console.warn(
      "getNotificationSettings: Using fallback - not implemented in MESSAGE_HANDLER",
    );
    return null;
  }, []);

  const updateNotificationSettings = React.useCallback(async () => {
    console.warn(
      "updateNotificationSettings: Using fallback - not implemented in MESSAGE_HANDLER",
    );
    return false;
  }, []);

  return {
    // Data
    conversations,
    messages,
    loading,
    error,
    currentUserId,
    typingUsers,

    // Conversation actions
    loadConversations,
    getOrCreateDirectConversation,
    createGroupConversation,
    updateConversation,
    archiveConversation,
    leaveConversation,

    // Message actions
    loadMessages,
    sendMessage,
    editMessage,
    deleteMessage,

    // Read receipts
    markMessageAsRead,
    markConversationAsRead,

    // Reactions
    addReaction,
    removeReaction,

    // Real-time actions
    subscribeToConversation,
    subscribeToTypingIndicators,
    sendTypingIndicator,

    // Participant actions
    addParticipants,
    removeParticipant,
    updateParticipantRole,

    // Notification actions
    getNotificationSettings,
    updateNotificationSettings,
  };
}
