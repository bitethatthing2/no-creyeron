import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { debugLog } from "@/lib/debug";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Type aliases for cleaner code
type Tables = Database["public"]["Tables"];
type ChatMessage = Tables["chat_messages"]["Row"];
type ChatConversation = Tables["chat_conversations"]["Row"];
type ChatParticipant = Tables["chat_participants"]["Row"];
type ChatMessageReaction = Tables["chat_message_reactions"]["Row"];
type ChatMessageReceipt = Tables["chat_message_receipts"]["Row"];
type User = Tables["users"]["Row"];

// Insert types for creating new records
type MessageInsert = Tables["chat_messages"]["Insert"];
type ConversationInsert = Tables["chat_conversations"]["Insert"];
type ParticipantInsert = Tables["chat_participants"]["Insert"];
type ReactionInsert = Tables["chat_message_reactions"]["Insert"];
type ReceiptInsert = Tables["chat_message_receipts"]["Insert"];

// Extended types with joined data
export interface MessageWithSender extends ChatMessage {
  sender?: Pick<
    User,
    | "id"
    | "email"
    | "first_name"
    | "last_name"
    | "display_name"
    | "username"
    | "avatar_url"
    | "profile_image_url"
  >;
  reactions?: ChatMessageReaction[];
  receipts?: ChatMessageReceipt[];
  reply_to?: Pick<ChatMessage, "id" | "content" | "sender_id" | "created_at">;
}

export interface ConversationWithParticipants extends ChatConversation {
  participants?: ParticipantWithUser[];
  unread_count?: number;
  other_participant?: User; // For direct conversations
}

export interface ParticipantWithUser extends ChatParticipant {
  user?: Pick<
    User,
    | "id"
    | "email"
    | "first_name"
    | "last_name"
    | "display_name"
    | "username"
    | "avatar_url"
    | "profile_image_url"
  >;
}

// Enums matching backend constraints
export enum ConversationType {
  DIRECT = "direct",
  GROUP = "group",
  LOCATION = "location",
  BROADCAST = "broadcast",
}

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  SYSTEM = "system",
  DELETED = "deleted",
}

export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "audio",
  FILE = "file",
  GIF = "gif",
}

export enum ParticipantRole {
  ADMIN = "admin",
  MODERATOR = "moderator",
  MEMBER = "member",
}

// Notification settings structure
interface NotificationSettings {
  muted?: boolean;
  sound?: string;
  vibrate?: boolean;
  [key: string]: unknown;
}

// Hook return interface
interface UseMessagingReturn {
  // Data
  conversations: ConversationWithParticipants[];
  messages: MessageWithSender[];
  loading: boolean;
  error: string | null;
  currentUserId: string | null;
  typingUsers: Map<string, string[]>; // conversationId -> array of userIds

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
    updates: Partial<ConversationInsert>,
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
  removeReaction: (messageId: string, reaction: string) => Promise<boolean>;

  // Real-time actions
  subscribeToConversation: (conversationId: string) => () => void;
  subscribeToTypingIndicators: (conversationId: string) => () => void;
  sendTypingIndicator: (
    conversationId: string,
    isTyping: boolean,
  ) => Promise<void>;

  // Participant actions
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

  // Notification actions
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

  // Load conversations for current user
  const loadConversations = React.useCallback(async () => {
    if (!currentUserId) return;

    setLoading(true);
    setError(null);

    try {
      // Get conversations where user is an active participant
      const { data: participantData, error: partError } = await supabase
        .from("chat_participants")
        .select(`
          conversation_id,
          conversation:chat_conversations!inner(
            *
          )
        `)
        .eq("user_id", currentUserId)
        .eq("is_active", true);

      if (partError) throw partError;

      // Extract unique conversations
      const conversationIds = participantData?.map((p) => p.conversation_id) ||
        [];

      // Load full conversation data with participants
      const conversationsWithData = await Promise.all(
        conversationIds.map(async (convId) => {
          // Get conversation
          const { data: conv } = await supabase
            .from("chat_conversations")
            .select("*")
            .eq("id", convId)
            .single();

          if (!conv) return null;

          // Get participants
          const { data: participants } = await supabase
            .from("chat_participants")
            .select(`
              *,
              user:users(
                id, email, first_name, last_name, 
                display_name, username, avatar_url, profile_image_url
              )
            `)
            .eq("conversation_id", convId)
            .eq("is_active", true);

          // Get unread count using receipts
          const { data: unreadMessages } = await supabase
            .from("chat_messages")
            .select("id", { count: "exact" })
            .eq("conversation_id", convId)
            .neq("sender_id", currentUserId)
            .not(
              "id",
              "in",
              `(
              SELECT message_id FROM chat_message_receipts 
              WHERE user_id = '${currentUserId}' 
              AND read_at IS NOT NULL
            )`,
            );

          const unreadCount = unreadMessages?.length || 0;

          // For direct conversations, identify the other participant
          let otherParticipant: User | undefined;
          if (conv.conversation_type === "direct" && participants) {
            const other = participants.find((p) => p.user_id !== currentUserId);
            if (other?.user) {
              otherParticipant = other.user as User;
            }
          }

          return {
            ...conv,
            participants: participants as ParticipantWithUser[],
            unread_count: unreadCount,
            other_participant: otherParticipant,
          } as ConversationWithParticipants;
        }),
      );

      const validConversations = conversationsWithData.filter(
        Boolean,
      ) as ConversationWithParticipants[];

      // Sort by last message timestamp
      validConversations.sort((a, b) => {
        const timeA = a.last_message_at
          ? new Date(a.last_message_at).getTime()
          : 0;
        const timeB = b.last_message_at
          ? new Date(b.last_message_at).getTime()
          : 0;
        return timeB - timeA;
      });

      setConversations(validConversations);
      debugLog.success("loadConversations", {
        count: validConversations.length,
      });
    } catch (err) {
      debugLog.error("loadConversations", err);
      setError(
        err instanceof Error ? err.message : "Failed to load conversations",
      );
    } finally {
      setLoading(false);
    }
  }, [currentUserId, supabase]);

  // Load messages for a conversation
  const loadMessages = React.useCallback(async (
    conversationId: string,
    limit = 50,
    before?: string,
  ) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("chat_messages")
        .select(`
          *,
          sender:users!sender_id(
            id, email, first_name, last_name,
            display_name, username, avatar_url, profile_image_url
          ),
          reply_to:chat_messages!reply_to_id(
            id, content, sender_id, created_at
          )
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(limit);

      // Filter out deleted messages
      query = query.or("is_deleted.is.null,is_deleted.is.false");

      if (before) {
        query = query.lt("created_at", before);
      }

      const { data: messages, error: msgError } = await query;

      if (msgError) throw msgError;

      // Load reactions for these messages
      const messageIds = messages?.map((m) => m.id) || [];
      const { data: reactions } = await supabase
        .from("chat_message_reactions")
        .select("*")
        .in("message_id", messageIds);

      // Load receipts for these messages
      const { data: receipts } = await supabase
        .from("chat_message_receipts")
        .select("*")
        .in("message_id", messageIds);

      // Combine data
      const messagesWithData: MessageWithSender[] = (messages || []).map(
        (msg) => ({
          ...msg,
          reactions: reactions?.filter((r) => r.message_id === msg.id) || [],
          receipts: receipts?.filter((r) => r.message_id === msg.id) || [],
        }),
      ).reverse(); // Reverse for chronological order

      setMessages(messagesWithData);
      debugLog.success("loadMessages", { count: messagesWithData.length });
    } catch (err) {
      debugLog.error("loadMessages", err);
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Send a message
  const sendMessage = React.useCallback(async (
    conversationId: string,
    content: string,
    messageType: MessageType = MessageType.TEXT,
    mediaUrl?: string,
    mediaType?: MediaType,
  ) => {
    if (!currentUserId || !content.trim()) return false;

    try {
      const messageData: MessageInsert = {
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: content.trim(),
        message_type: messageType,
      };

      if (mediaUrl && mediaType) {
        messageData.media_url = mediaUrl;
        messageData.media_type = mediaType;
      }

      const { data, error } = await supabase
        .from("chat_messages")
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      // Update conversation's last message info
      await supabase
        .from("chat_conversations")
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: content.substring(0, 100),
          last_message_sender_id: currentUserId,
          message_count: (await supabase
            .from("chat_messages")
            .select("id", { count: "exact" })
            .eq("conversation_id", conversationId)).count || 0,
        })
        .eq("id", conversationId);

      // Create notification for other participants
      const { data: participants } = await supabase
        .from("chat_participants")
        .select("user_id")
        .eq("conversation_id", conversationId)
        .eq("is_active", true)
        .neq("user_id", currentUserId);

      if (participants) {
        const notifications = participants.map((p) => ({
          recipient_id: p.user_id,
          type: "message",
          message: `New message: ${content.substring(0, 50)}...`,
          content_type: "message",
          content_id: data.id,
          related_user_id: currentUserId,
        }));

        await supabase.from("notifications").insert(notifications);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      return false;
    }
  }, [currentUserId, supabase]);

  // Get or create direct conversation
  const getOrCreateDirectConversation = React.useCallback(async (
    otherUserId: string,
  ) => {
    if (!currentUserId) return null;

    try {
      // Use the database function
      const { data, error } = await supabase
        .rpc("get_or_create_dm_conversation", {
          other_user_id: otherUserId,
        });

      if (error) throw error;

      return data?.conversation_id || null;
    } catch (err) {
      debugLog.error("getOrCreateDirectConversation", err);
      setError(
        err instanceof Error ? err.message : "Failed to create conversation",
      );
      return null;
    }
  }, [currentUserId, supabase]);

  // Create group conversation
  const createGroupConversation = React.useCallback(async (
    name: string,
    participantIds: string[],
  ) => {
    if (!currentUserId) return null;

    try {
      // Create conversation
      const conversationData: ConversationInsert = {
        conversation_type: ConversationType.GROUP,
        name,
        created_by: currentUserId,
        is_active: true,
      };

      const { data: conv, error: convError } = await supabase
        .from("chat_conversations")
        .insert(conversationData)
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const participants: ParticipantInsert[] = [
        currentUserId,
        ...participantIds,
      ].map((userId) => ({
        conversation_id: conv.id,
        user_id: userId,
        role: userId === currentUserId
          ? ParticipantRole.ADMIN
          : ParticipantRole.MEMBER,
        is_active: true,
      }));

      const { error: partError } = await supabase
        .from("chat_participants")
        .insert(participants);

      if (partError) throw partError;

      return conv.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
      return null;
    }
  }, [currentUserId, supabase]);

  // Mark message as read
  const markMessageAsRead = React.useCallback(async (messageId: string) => {
    if (!currentUserId) return false;

    try {
      // Check if receipt exists
      const { data: existing } = await supabase
        .from("chat_message_receipts")
        .select("id")
        .eq("message_id", messageId)
        .eq("user_id", currentUserId)
        .single();

      if (existing) {
        // Update existing receipt
        const { error } = await supabase
          .from("chat_message_receipts")
          .update({ read_at: new Date().toISOString() })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Create new receipt
        const receiptData: ReceiptInsert = {
          message_id: messageId,
          user_id: currentUserId,
          delivered_at: new Date().toISOString(),
          read_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("chat_message_receipts")
          .insert(receiptData);

        if (error) throw error;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark as read");
      return false;
    }
  }, [currentUserId, supabase]);

  // Mark entire conversation as read
  const markConversationAsRead = React.useCallback(async (
    conversationId: string,
  ) => {
    if (!currentUserId) return false;

    try {
      // Get all unread messages in conversation
      const { data: messages } = await supabase
        .from("chat_messages")
        .select("id")
        .eq("conversation_id", conversationId)
        .neq("sender_id", currentUserId);

      if (!messages || messages.length === 0) return true;

      // Create receipts for all messages
      const receipts: ReceiptInsert[] = messages.map((msg) => ({
        message_id: msg.id,
        user_id: currentUserId,
        delivered_at: new Date().toISOString(),
        read_at: new Date().toISOString(),
      }));

      // Insert receipts (upsert to handle existing ones)
      for (const receipt of receipts) {
        await supabase
          .from("chat_message_receipts")
          .upsert(receipt, {
            onConflict: "message_id,user_id",
          });
      }

      // Update participant's last_read_at
      await supabase
        .from("chat_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", currentUserId);

      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark conversation as read",
      );
      return false;
    }
  }, [currentUserId, supabase]);

  // Add reaction to message
  const addReaction = React.useCallback(async (
    messageId: string,
    reaction: string,
  ) => {
    if (!currentUserId) return false;

    try {
      const reactionData: ReactionInsert = {
        message_id: messageId,
        user_id: currentUserId,
        reaction,
      };

      const { error } = await supabase
        .from("chat_message_reactions")
        .insert(reactionData);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add reaction");
      return false;
    }
  }, [currentUserId, supabase]);

  // Remove reaction from message
  const removeReaction = React.useCallback(async (
    messageId: string,
    reaction: string,
  ) => {
    if (!currentUserId) return false;

    try {
      const { error } = await supabase
        .from("chat_message_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", currentUserId)
        .eq("reaction", reaction);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove reaction",
      );
      return false;
    }
  }, [currentUserId, supabase]);

  // Subscribe to real-time messages
  const subscribeToConversation = React.useCallback(
    (conversationId: string) => {
      // Remove existing subscription
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
          async (payload: RealtimePostgresChangesPayload<ChatMessage>) => {
            // Fetch full message with sender info
            const { data } = await supabase
              .from("chat_messages")
              .select(`
              *,
              sender:users!sender_id(
                id, email, first_name, last_name,
                display_name, username, avatar_url, profile_image_url
              )
            `)
              .eq("id", payload.new.id)
              .single();

            if (data) {
              setMessages((prev) => [...prev, data as MessageWithSender]);
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "chat_messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload: RealtimePostgresChangesPayload<ChatMessage>) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
              )
            );
          },
        )
        .subscribe();

      subscriptionsRef.current.set(conversationId, channel);

      return () => {
        supabase.removeChannel(channel);
        subscriptionsRef.current.delete(conversationId);
      };
    },
    [supabase],
  );

  // Subscribe to typing indicators using database
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
            // Query the v_typing_users view for typing status
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

  // Send typing indicator
  const sendTypingIndicator = React.useCallback(async (
    conversationId: string,
    isTyping: boolean,
  ) => {
    if (!currentUserId) return;

    try {
      // Use the database function
      await supabase.rpc("set_typing_status", {
        p_conversation_id: conversationId,
        p_is_typing: isTyping,
      });
    } catch (err) {
      debugLog.error("sendTypingIndicator", err);
    }
  }, [currentUserId, supabase]);

  // Edit message
  const editMessage = React.useCallback(async (
    messageId: string,
    newContent: string,
  ) => {
    if (!currentUserId || !newContent.trim()) return false;

    try {
      const { error } = await supabase
        .from("chat_messages")
        .update({
          content: newContent.trim(),
          edited_at: new Date().toISOString(),
        })
        .eq("id", messageId)
        .eq("sender_id", currentUserId);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to edit message");
      return false;
    }
  }, [currentUserId, supabase]);

  // Delete message
  const deleteMessage = React.useCallback(async (messageId: string) => {
    if (!currentUserId) return false;

    try {
      const { error } = await supabase
        .from("chat_messages")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: currentUserId,
        })
        .eq("id", messageId)
        .eq("sender_id", currentUserId);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete message");
      return false;
    }
  }, [currentUserId, supabase]);

  // Update conversation
  const updateConversation = React.useCallback(async (
    conversationId: string,
    updates: Partial<ConversationInsert>,
  ) => {
    try {
      const { error } = await supabase
        .from("chat_conversations")
        .update(updates)
        .eq("id", conversationId);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update conversation",
      );
      return false;
    }
  }, [supabase]);

  // Archive conversation
  const archiveConversation = React.useCallback(
    async (conversationId: string) => {
      return updateConversation(conversationId, { is_archived: true });
    },
    [updateConversation],
  );

  // Leave conversation
  const leaveConversation = React.useCallback(
    async (conversationId: string) => {
      if (!currentUserId) return false;

      try {
        const { error } = await supabase
          .from("chat_participants")
          .update({
            is_active: false,
            left_at: new Date().toISOString(),
          })
          .eq("conversation_id", conversationId)
          .eq("user_id", currentUserId);

        if (error) throw error;
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to leave conversation",
        );
        return false;
      }
    },
    [currentUserId, supabase],
  );

  // Add participants
  const addParticipants = React.useCallback(async (
    conversationId: string,
    userIds: string[],
  ) => {
    try {
      const participants: ParticipantInsert[] = userIds.map((userId) => ({
        conversation_id: conversationId,
        user_id: userId,
        role: ParticipantRole.MEMBER,
        is_active: true,
      }));

      const { error } = await supabase
        .from("chat_participants")
        .insert(participants);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add participants",
      );
      return false;
    }
  }, [supabase]);

  // Remove participant
  const removeParticipant = React.useCallback(async (
    conversationId: string,
    userId: string,
  ) => {
    try {
      const { error } = await supabase
        .from("chat_participants")
        .update({
          is_active: false,
          left_at: new Date().toISOString(),
        })
        .eq("conversation_id", conversationId)
        .eq("user_id", userId);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove participant",
      );
      return false;
    }
  }, [supabase]);

  // Update participant role
  const updateParticipantRole = React.useCallback(async (
    conversationId: string,
    userId: string,
    role: ParticipantRole,
  ) => {
    try {
      const { error } = await supabase
        .from("chat_participants")
        .update({ role })
        .eq("conversation_id", conversationId)
        .eq("user_id", userId);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
      return false;
    }
  }, [supabase]);

  // Get notification settings
  const getNotificationSettings = React.useCallback(async (
    conversationId: string,
  ): Promise<NotificationSettings | null> => {
    if (!currentUserId) return null;

    try {
      const { data } = await supabase
        .from("chat_participants")
        .select("notification_settings")
        .eq("conversation_id", conversationId)
        .eq("user_id", currentUserId)
        .single();

      return (data?.notification_settings as NotificationSettings) || null;
    } catch (err) {
      debugLog.error("getNotificationSettings", err);
      return null;
    }
  }, [currentUserId, supabase]);

  // Update notification settings
  const updateNotificationSettings = React.useCallback(async (
    conversationId: string,
    settings: NotificationSettings,
  ) => {
    if (!currentUserId) return false;

    try {
      const { error } = await supabase
        .from("chat_participants")
        .update({ notification_settings: settings })
        .eq("conversation_id", conversationId)
        .eq("user_id", currentUserId);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update notification settings",
      );
      return false;
    }
  }, [currentUserId, supabase]);

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
