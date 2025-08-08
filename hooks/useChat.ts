// hooks/useChat.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
// Import message utilities - these need to be implemented
const validateMessage = (message: string, options: any) => {
  if (!message || message.trim().length === 0) {
    return { isValid: false, errors: ["Message cannot be empty"] };
  }
  if (message.length > (options.maxLength || 500)) {
    return { isValid: false, errors: ["Message too long"] };
  }
  return { isValid: true, sanitized: message.trim() };
};

const formatMessageTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString();
};

const groupMessages = (messages: any[], currentUserId: string) => {
  return messages;
};

class TypingIndicator {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  setTyping(
    key: string,
    isTyping: boolean,
    callback: (typing: boolean) => void,
  ) {
    if (isTyping) {
      callback(true);
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key)!);
      }
      this.timers.set(
        key,
        setTimeout(() => {
          callback(false);
          this.timers.delete(key);
        }, 3000),
      );
    } else {
      callback(false);
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key)!);
        this.timers.delete(key);
      }
    }
  }

  cleanup() {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }
}

const checkRateLimit = (currentUserId: string) => {
  return true; // Simplified implementation
};

export interface MessageReaction {
  emoji: string;
  reaction_count: number;
  currentUser_ids: string[];
}

export interface PrivateMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  image_url?: string | null;
  is_read: boolean | null;
  created_at: string | null;
  read_at?: string | null;
  is_deleted: boolean | null;
  flagged: boolean | null;
  flag_reason?: string | null;
  flagged_by?: string | null;
  flagged_at?: string | null;
  image_id?: string | null;
  thread_id?: string | null;
  reply_to_message_id?: string | null;
  reactions?: MessageReaction[];
  sender_currentUser?: {
    display_name: string | null;
    wolf_emoji: string | null;
    profile_image_url?: string | null;
  } | null;
}

export interface ChatUser {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  display_name?: string | null;
  wolf_emoji?: string | null;
  vibe_status?: string | null;
  profile_image_url?: string | null;
  allow_messages?: boolean | null;
  bio?: string | null;
  favorite_drink?: string | null;
  is_profile_visible?: boolean | null;
  is_online?: boolean | null;
  last_activity?: string | null;
}

export interface Conversation {
  other_currentUser_id: string;
  other_currentUser_display_name: string;
  other_currentUser_wolf_emoji: string;
  other_currentUser_profile_image_url: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_blocked: boolean;
}

export enum ConnectionState {
  CONNECTING = "connecting",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  RECONNECTING = "reconnecting",
  ERROR = "error",
}

interface UseChatOptions {
  otherUserId?: string;
  enableTypingIndicator?: boolean;
  enableOptimisticUpdates?: boolean;
  messageLimit?: number;
  reconnectDelay?: number;
}

export function useChat(options: UseChatOptions = {}) {
  const { currentUser } = useAuth();
  const {
    otherUserId,
    enableTypingIndicator = true,
    enableOptimisticUpdates = true,
    messageLimit = 100,
    reconnectDelay = 5000,
  } = options;

  // State management
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED,
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup and management
  const channelRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const typingIndicatorRef = useRef(new TypingIndicator());

  // Cleanup function
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = undefined;
    }
    typingIndicatorRef.current.cleanup();
  }, []);

  // Load chat data using optimized function
  const loadChatData = useCallback(async () => {
    if (!currentUser || !otherUserId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load messages with reactions using optimized query
      const { data: messagesData, error: messagesError } = await supabase
        .from("wolf_private_messages")
        .select(`
          *,
          sender_currentUser:sender_id(id, display_name, wolf_emoji, profile_image_url),
          reply_to_message:reply_to_message_id(
            id,
            message,
            sender_id,
            sender_currentUser:sender_id(display_name)
          ),
          reactions:wolf_private_message_reaction_counts(
            emoji,
            reaction_count,
            currentUser_ids
          )
        `)
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.id})`,
        )
        .order("created_at", { ascending: false })
        .limit(messageLimit || 100);

      const { data: otherUserData, error: currentUserError } = await supabase
        .from("currentUsers")
        .select("*")
        .eq("id", otherUserId)
        .single();

      // Check if either currentUser has blocked the other
      const { data: blockData, error: blockError } = await supabase
        .from("wolf_pack_interactions")
        .select("*")
        .eq("interaction_type", "block")
        .eq("status", "active")
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.id})`,
        );

      if (messagesError) throw messagesError;
      if (currentUserError) throw currentUserError;
      if (blockError) throw blockError;

      if (!otherUserData) {
        throw new Error("User not found");
      }

      if (otherUserData.allow_messages === false) {
        throw new Error("This currentUser has disabled private messages");
      }

      // Check if there's an active block between currentUsers
      const isBlocked = blockData && blockData.length > 0;

      setOtherUser(otherUserData);
      setIsBlocked(isBlocked);

      if (messagesData && Array.isArray(messagesData)) {
        setMessages(messagesData);

        // Mark unread messages as read
        const unreadMessages = messagesData.filter(
          (msg: PrivateMessage) =>
            msg.sender_id === otherUserId && !msg.is_read,
        );

        if (unreadMessages.length > 0) {
          await markMessagesAsRead(unreadMessages.map((msg) => msg.id));
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : "Failed to load chat";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, otherUserId]);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase.rpc("get_recent_conversations", {
        p_currentUser_id: currentUser.id,
        p_limit: 20,
      });

      if (error) throw error;
      if (data) setConversations(data);
    } catch (err) {
      console.error("Error loading conversations:", err);
    }
  }, [currentUser]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return;

    try {
      await supabase
        .from("wolf_private_messages")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .in("id", messageIds);

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg.id)
            ? { ...msg, is_read: true, read_at: new Date().toISOString() }
            : msg
        )
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, []);

  // Setup real-time subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!currentUser || !otherUserId) return;

    cleanup();
    setConnectionState(ConnectionState.CONNECTING);

    const channel = supabase
      .channel(`private_chat_${currentUser.id}_${otherUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wolf_private_messages",
          filter:
            `or(and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.id}))`,
        },
        async (payload) => {
          try {
            const newMsg = payload.new as PrivateMessage;

            // Fetch sender information if missing
            if (!newMsg.sender_currentUser && newMsg.sender_id !== currentUser.id) {
              const { data: senderData } = await supabase
                .from("currentUsers")
                .select("display_name, wolf_emoji, profile_image_url")
                .eq("id", newMsg.sender_id)
                .single();

              if (senderData) {
                newMsg.sender_currentUser = senderData;
              }
            }

            // Add message to state (prevent duplicates)
            // Since messages are now ordered newest first, add new messages to the beginning
            setMessages((prev) => {
              if (prev.some((msg) => msg.id === newMsg.id)) {
                return prev;
              }
              return [newMsg, ...prev];
            });

            // Handle unread count and notifications
            if (newMsg.sender_id === otherUserId) {
              if (document.hasFocus()) {
                markMessagesAsRead([newMsg.id]);
              } else {
                setUnreadCount((c) => c + 1);

                // Show browser notification
                if (Notification.permission === "granted") {
                  new Notification(
                    `New message from ${otherUser?.display_name || "Someone"}`,
                    {
                      body: newMsg.message.slice(0, 100),
                      icon: otherUser?.profile_image_url ||
                        "/default-avatar.png",
                    },
                  );
                }
              }
            }
          } catch (error) {
            console.error("Error handling real-time message:", error);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "wolf_private_messages",
          filter:
            `or(and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.id}))`,
        },
        (payload) => {
          const updatedMsg = payload.new as PrivateMessage;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMsg.id ? { ...msg, ...updatedMsg } : msg
            )
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wolf_private_message_reactions",
        },
        async (payload) => {
          // Reload messages to get updated reaction counts
          await loadChatData();
        },
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);

        switch (status) {
          case "SUBSCRIBED":
            setConnectionState(ConnectionState.CONNECTED);
            setError(null);
            break;
          case "CHANNEL_ERROR":
          case "TIMED_OUT":
            setConnectionState(ConnectionState.DISCONNECTED);
            scheduleReconnection();
            break;
          case "CLOSED":
            setConnectionState(ConnectionState.DISCONNECTED);
            break;
        }
      });

    channelRef.current = channel;
  }, [currentUser, otherUserId, otherUser, cleanup, markMessagesAsRead]);

  // Schedule reconnection with exponential backoff
  const scheduleReconnection = useCallback(() => {
    if (retryTimeoutRef.current) return;

    setConnectionState(ConnectionState.RECONNECTING);

    retryTimeoutRef.current = setTimeout(() => {
      retryTimeoutRef.current = undefined;
      setupRealtimeSubscription();
    }, reconnectDelay);
  }, [setupRealtimeSubscription, reconnectDelay]);

  // Send message function (enhanced with reply support)
  const sendMessage = useCallback(
    async (messageText: string, replyToMessageId?: string) => {
      if (!currentUser || !otherUserId || isSending) return false;

      const validation = validateMessage(messageText, {
        maxLength: 500,
        allowLineBreaks: true,
        trimWhitespace: true,
        checkSpam: true,
        checkRateLimit: true,
        currentUserId: currentUser.id,
      });

      if (!validation.isValid) {
        toast.error(validation.errors[0]);
        return false;
      }

      try {
        setIsSending(true);

        let tempMessage: PrivateMessage | null = null;

        // Optimistic update
        if (enableOptimisticUpdates) {
          const tempId = `temp_${Date.now()}`;
          tempMessage = {
            id: tempId,
            sender_id: currentUser.id,
            receiver_id: otherUserId,
            message: validation.sanitized!,
            is_read: false,
            created_at: new Date().toISOString(),
            is_deleted: false,
            flagged: false,
            sender_currentUser: {
              display_name: currentUser.display_name || null,
              wolf_emoji: currentUser.wolf_emoji || null,
              profile_image_url: currentUser.profile_image_url || null,
            },
          };

          // Add optimistic message to the beginning since messages are ordered newest first
          setMessages((prev) => [tempMessage!, ...prev]);
        }

        // Prepare message data
        const messageData: any = {
          sender_id: currentUser.id,
          receiver_id: otherUserId,
          message: validation.sanitized!,
          is_read: false,
          is_deleted: false,
          flagged: false,
          created_at: new Date().toISOString(),
        };

        // Add threading info if replying
        if (replyToMessageId) {
          messageData.reply_to_message_id = replyToMessageId;
          // Find the original message to get/set thread_id
          const originalMessage = messages.find((msg) =>
            msg.id === replyToMessageId
          );
          messageData.thread_id = originalMessage?.thread_id ||
            replyToMessageId;
        }

        // Send to database
        const { data, error } = await supabase
          .from("wolf_private_messages")
          .insert(messageData)
          .select("id")
          .single();

        if (error) throw error;

        // Update optimistic message with real ID
        if (enableOptimisticUpdates && tempMessage && data) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempMessage!.id ? { ...msg, id: data.id } : msg
            )
          );
        }

        return true;
      } catch (error) {
        console.error("Error sending message:", error);

        // Remove optimistic update on error
        if (enableOptimisticUpdates && tempMessage) {
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== tempMessage!.id)
          );
        }

        toast.error("Failed to send message");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [currentUser, otherUserId, isSending, enableOptimisticUpdates, messages],
  );

  // Block currentUser function
  const blockUser = useCallback(async () => {
    if (!currentUser || !otherUserId) return false;

    try {
      const { error } = await supabase
        .from("wolf_pack_interactions")
        .upsert({
          sender_id: currentUser.id,
          receiver_id: otherUserId,
          interaction_type: "block",
          status: "active",
          created_at: new Date().toISOString(),
        }, {
          onConflict: "sender_id,receiver_id,interaction_type",
        });

      if (error) throw error;

      setIsBlocked(true);
      toast.success("User blocked");
      return true;
    } catch (error) {
      console.error("Error blocking currentUser:", error);
      toast.error("Failed to block currentUser");
      return false;
    }
  }, [currentUser, otherUserId]);

  // Report message function
  const reportMessage = useCallback(
    async (messageId: string, reason: string) => {
      if (!currentUser) return false;

      try {
        const { error } = await supabase
          .from("content_flags")
          .insert({
            content_type: "private_message",
            content_id: messageId,
            flagged_by: currentUser.id,
            reason,
            status: "pending",
          });

        if (error) throw error;
        toast.success("Message reported");
        return true;
      } catch (error) {
        console.error("Error reporting message:", error);
        toast.error("Failed to report message");
        return false;
      }
    },
    [currentUser],
  );

  // Toggle reaction function
  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!currentUser) {
        toast.error("Authentication required");
        return false;
      }

      try {
        const { data, error } = await supabase.rpc(
          "toggle_private_message_reaction",
          {
            p_message_id: messageId,
            p_emoji: emoji,
          },
        );

        if (error) throw error;

        // Refresh message reactions
        await loadChatData();

        if (data === true) {
          toast.success(`${emoji} reaction added!`);
        } else {
          toast.success("Reaction removed");
        }

        return true;
      } catch (error) {
        console.error("Error toggling reaction:", error);
        toast.error("Failed to update reaction");
        return false;
      }
    },
    [currentUser, loadChatData],
  );

  // Get conversation ID for typing indicators
  const getConversationId = useCallback(() => {
    if (!currentUser || !otherUserId) return "";
    return [currentUser.id, otherUserId].sort().join("_");
  }, [currentUser, otherUserId]);

  // Update typing indicator
  const updateTypingIndicator = useCallback(async () => {
    if (!currentUser || !otherUserId) return;

    try {
      await supabase.rpc("update_typing_indicator", {
        p_conversation_type: "private",
        p_conversation_id: getConversationId(),
      });
    } catch (error) {
      console.error("Error updating typing indicator:", error);
    }
  }, [currentUser, otherUserId, getConversationId]);

  // Mark messages as read using the new system
  const markConversationRead = useCallback(async (lastMessageId: string) => {
    if (!currentUser || !otherUserId) return;

    try {
      await supabase.rpc("mark_messages_read", {
        p_conversation_type: "private",
        p_conversation_id: getConversationId(),
        p_last_message_id: lastMessageId,
      });
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  }, [currentUser, otherUserId, getConversationId]);

  // Get unread count for conversation
  const getConversationUnreadCount = useCallback(async () => {
    if (!currentUser || !otherUserId) return 0;

    try {
      const { data, error } = await supabase.rpc("get_unread_count", {
        p_conversation_type: "private",
        p_conversation_id: getConversationId(),
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }, [currentUser, otherUserId, getConversationId]);

  // Typing indicator functions
  const setTypingStatus = useCallback((isTyping: boolean) => {
    if (!enableTypingIndicator || !currentUser || !otherUserId) return;

    typingIndicatorRef.current.setTyping(
      `${currentUser.id}_${otherUserId}`,
      isTyping,
      (typing) => {
        // You can implement real-time typing indicators here
        // by sending presence updates through Supabase channels
        console.log("Typing status:", typing);
      },
    );
  }, [enableTypingIndicator, currentUser, otherUserId]);

  // Get unread count for current currentUser
  const getUnreadCount = useCallback(async () => {
    if (!currentUser) return 0;

    try {
      const { data, error } = await supabase.rpc("get_unread_message_count", {
        p_currentUser_id: currentUser.id,
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }, [currentUser]);

  // Effect to load initial data
  useEffect(() => {
    if (otherUserId) {
      loadChatData();
    } else {
      loadConversations();
    }
  }, [otherUserId, loadChatData, loadConversations]);

  // Effect to setup real-time subscription
  useEffect(() => {
    if (currentUser && otherUserId && !isBlocked && !isLoading) {
      setupRealtimeSubscription();
    }

    return cleanup;
  }, [
    currentUser,
    otherUserId,
    isBlocked,
    isLoading,
    setupRealtimeSubscription,
    cleanup,
  ]);

  // Effect to handle focus/blur for read receipts
  useEffect(() => {
    const handleFocus = () => {
      if (unreadCount > 0 && otherUserId) {
        const unreadMessages = messages.filter(
          (msg) => msg.sender_id === otherUserId && !msg.is_read,
        );

        if (unreadMessages.length > 0) {
          markMessagesAsRead(unreadMessages.map((msg) => msg.id));
          setUnreadCount(0);
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [unreadCount, messages, otherUserId, markMessagesAsRead]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    // State
    messages,
    otherUser,
    currentUser: currentUser,
    conversations,
    isLoading,
    isSending,
    isBlocked,
    connectionState,
    unreadCount,
    isTyping,
    error,

    // Actions
    sendMessage,
    blockUser,
    reportMessage,
    toggleReaction,
    updateTypingIndicator,
    setTypingStatus,
    loadChatData,
    loadConversations,
    markMessagesAsRead,
    markConversationRead,
    getUnreadCount,
    getConversationUnreadCount,

    // Utilities
    formatMessageTime,
    groupMessages: (msgs: PrivateMessage[]) =>
      groupMessages(msgs, currentUser?.id || ""),

    // Connection management
    reconnect: setupRealtimeSubscription,
    disconnect: cleanup,
  };
}

// Hook for managing multiple conversations
export function useConversations() {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  const loadConversations = useCallback(async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);

      const [conversationsResult, unreadResult] = await Promise.all([
        supabase.rpc("get_recent_conversations", {
          p_currentUser_id: currentUser.id,
          p_limit: 50,
        }),
        supabase.rpc("get_unread_message_count", {
          p_currentUser_id: currentUser.id,
        }),
      ]);

      if (conversationsResult.data) {
        setConversations(conversationsResult.data);
      }

      if (unreadResult.data !== null) {
        setTotalUnreadCount(unreadResult.data);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    totalUnreadCount,
    isLoading,
    refresh: loadConversations,
  };
}
