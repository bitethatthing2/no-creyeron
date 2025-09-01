import * as React from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { debugLog, performanceLog } from "@/lib/debug";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

// Precise message type matching chat_messages table schema
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string | null;
  media_url: string | null;
  media_type: string | null;
  media_thumbnail_url: string | null;
  media_size: number | null; // bigint in DB
  media_duration: number | null;
  media_metadata: Record<string, unknown> | null; // jsonb - use Record instead of any
  attachments: Record<string, unknown> | null; // jsonb - use Record instead of any
  reply_to_id: string | null;
  parent_message_id: string | null;
  created_at: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  is_deleted: boolean | null;
  is_edited: boolean | null;
  is_read: boolean | null;
  read_at: string | null;
  delivered_at: string | null;
  status: string | null;
  metadata: Record<string, unknown> | null; // jsonb - use Record instead of any
  reactions_count: Record<string, number> | null; // jsonb - use Record instead of any
  reply_count: number | null;
  // Joined fields from users table (optional, populated via select)
  sender?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    profile_image_url: string | null;
  };
  reply_to?: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string | null;
  };
}

// Precise conversation type matching chat_conversations table schema
export interface Conversation {
  id: string;
  conversation_type: string;
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_sender_id: string | null;
  is_active: boolean | null;
  metadata: Record<string, unknown> | null; // jsonb
  // Computed/joined fields
  unread_count?: number;
  participant_count?: number;
  participants?: ConversationParticipant[];
  other_participant?: UserProfile;
}

// Precise participant type matching chat_participants table schema
export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: string | null;
  joined_at: string | null;
  left_at: string | null;
  last_read_at: string | null;
  is_active: boolean | null;
  notification_settings: {
    muted?: boolean;
    sound?: string;
    vibrate?: boolean;
    [key: string]: unknown;
  } | null; // jsonb with known structure
  // Joined user data
  user?: UserProfile;
}

// User profile type (subset of users table that we need)
export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  profile_image_url: string | null;
  is_online: boolean | null;
  last_seen_at: string | null;
  wolfpack_status: string | null;
  bio: string | null;
}

// Message type for sending (transformed for display)
export interface DisplayMessage extends Message {
  // Flattened sender fields for easier access in UI
  sender_first_name?: string | null;
  sender_last_name?: string | null;
  sender_display_name?: string | null;
  sender_avatar_url?: string | null;
  sender_username?: string | null;
}

// Message status enum
export enum MessageStatus {
  SENDING = "sending",
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
  FAILED = "failed",
}

// Conversation type enum
export enum ConversationType {
  DIRECT = "direct",
  GROUP = "group",
  CHANNEL = "channel",
}

// Message type enum
export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "audio",
  FILE = "file",
  SYSTEM = "system",
}

// Helper types for Supabase operations
type MessageInsert = {
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  media_thumbnail_url?: string | null;
  media_size?: number | null;
  media_duration?: number | null;
  media_metadata?: Record<string, unknown> | null;
  attachments?: Record<string, unknown> | null;
  reply_to_id?: string | null;
  parent_message_id?: string | null;
  status?: string | null;
  is_deleted?: boolean | null;
  is_edited?: boolean | null;
  is_read?: boolean | null;
  metadata?: Record<string, unknown> | null;
};

type ConversationInsert = {
  conversation_type: string;
  name?: string | null;
  description?: string | null;
  avatar_url?: string | null;
  created_by?: string | null;
  is_active?: boolean | null;
  metadata?: Record<string, unknown> | null;
};

type ParticipantInsert = {
  conversation_id: string;
  user_id: string;
  role?: string | null;
  is_active?: boolean | null;
  notification_settings?: Record<string, unknown> | null;
};

// Notification payload for push notifications
interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  sound?: string;
  data?: {
    conversationId: string;
    messageId: string;
    senderId: string;
    type: "message" | "typing" | "read";
    [key: string]: unknown;
  };
}

// Types for debugging
type MessagingEventData = {
  userId?: string;
  currentUserId?: string;
  conversationId?: string;
  status?: string;
  limit?: number;
  timestamp?: string;
  [key: string]: unknown;
};

type ErrorContext = {
  userId?: string;
  conversationId?: string;
  messageId?: string;
  error?: unknown;
};

// Typing state for a user
interface TypingState {
  userId: string;
  timestamp: string;
}

interface UseMessagingReturn {
  // Data
  conversations: Conversation[];
  messages: DisplayMessage[];
  loading: boolean;
  error: string | null;
  currentUserId: string | null;
  typingUsers: Map<string, string[]>; // conversationId -> array of userIds typing

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
    updates: Partial<Conversation>,
  ) => Promise<boolean>;
  deleteConversation: (conversationId: string) => Promise<boolean>;
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
  ) => Promise<boolean>;
  editMessage: (messageId: string, newContent: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  markAsRead: (conversationId: string) => Promise<boolean>;

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
    role: string,
  ) => Promise<boolean>;

  // Notification actions
  requestNotificationPermission: () => Promise<boolean>;
  getNotificationSettings: (
    conversationId: string,
  ) => Promise<ConversationParticipant["notification_settings"]>;
  updateNotificationSettings: (
    conversationId: string,
    settings: ConversationParticipant["notification_settings"],
  ) => Promise<boolean>;
}

// Helper function to send push notifications
async function sendPushNotification(
  userId: string,
  notification: NotificationPayload,
): Promise<boolean> {
  try {
    // Check if user has FCM tokens registered
    const { data: tokens } = await supabase
      .from("user_fcm_tokens")
      .select("token, platform")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (!tokens || tokens.length === 0) {
      debugLog.messaging(
        "No active FCM tokens for user",
        { userId } as MessagingEventData,
      );
      return false;
    }

    // Send notification via your backend API that handles FCM
    // This should be implemented in your backend
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        tokens: tokens.map((t) => t.token),
        notification,
      }),
    });

    return response.ok;
  } catch (error) {
    debugLog.error(
      "Failed to send push notification",
      error,
      { userId } as ErrorContext,
    );
    return false;
  }
}

// Helper function to play notification sound (for foreground notifications)
function playNotificationSound(soundName: string = "default"): void {
  try {
    // Map sound names to audio files
    const soundMap: Record<string, string> = {
      "default": "/sounds/notification.mp3",
      "message": "/sounds/message.mp3",
      "ding": "/sounds/ding.mp3",
      "pop": "/sounds/pop.mp3",
    };

    const audio = new Audio(soundMap[soundName] || soundMap["default"]);
    audio.volume = 0.5;
    audio.play().catch((err) => {
      console.error("Failed to play notification sound", err);
    });
  } catch (error) {
    console.error("Error playing notification sound", error);
  }
}

// Helper function to show browser notification (for foreground)
async function showBrowserNotification(
  notification: NotificationPayload,
): Promise<void> {
  if (!("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    const notif = new Notification(notification.title, {
      body: notification.body,
      icon: notification.icon || "https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png",
      badge: notification.badge || "/icons/badge.png",
      tag: notification.data?.messageId || "message",
      data: notification.data,
    });

    notif.onclick = () => {
      window.focus();
      // Navigate to conversation if data is provided
      if (notification.data?.conversationId) {
        window.location.href = `/messages/${notification.data.conversationId}`;
      }
      notif.close();
    };
  }
  return;
}

export function useMessaging(): UseMessagingReturn {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [messages, setMessages] = React.useState<DisplayMessage[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [typingUsers, setTypingUsers] = React.useState<Map<string, string[]>>(
    new Map(),
  );
  const [isAppFocused, setIsAppFocused] = React.useState(true);

  // Track active subscriptions
  const subscriptionsRef = React.useRef<Map<string, RealtimeChannel>>(
    new Map(),
  );
  const typingTimeoutsRef = React.useRef<Map<string, NodeJS.Timeout>>(
    new Map(),
  );

  // Track app focus for notification handling
  React.useEffect(() => {
    const handleFocus = () => setIsAppFocused(true);
    const handleBlur = () => setIsAppFocused(false);

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    // Check initial focus state
    setIsAppFocused(document.hasFocus());

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // Get current user's database ID
  React.useEffect(() => {
    if (currentUser?.id) {
      setCurrentUserId(currentUser.id);
    } else {
      setCurrentUserId(null);
    }
  }, [currentUser]);

  // Clean up subscriptions on unmount
  React.useEffect(() => {
    // Capture the current ref values
    const subscriptions = subscriptionsRef.current;
    const typingTimeouts = typingTimeoutsRef.current;

    return () => {
      // Use the captured values in cleanup
      subscriptions.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      typingTimeouts.forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  // Request notification permission
  const requestNotificationPermission = React.useCallback(
    async (): Promise<boolean> => {
      if (!("Notification" in window)) {
        debugLog.messaging(
          "Browser does not support notifications",
          {} as MessagingEventData,
        );
        return false;
      }

      try {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      } catch (error) {
        debugLog.error(
          "Failed to request notification permission",
          error,
          {} as ErrorContext,
        );
        return false;
      }
    },
    [],
  );

  // Get notification settings for a conversation
  const getNotificationSettings = React.useCallback(
    async (
      conversationId: string,
    ): Promise<ConversationParticipant["notification_settings"]> => {
      if (!currentUserId) return null;

      try {
        const { data } = await supabase
          .from("chat_participants")
          .select("notification_settings")
          .eq("conversation_id", conversationId)
          .eq("user_id", currentUserId)
          .single();

        return data?.notification_settings || null;
      } catch (error) {
        debugLog.error(
          "Failed to get notification settings",
          error,
          { conversationId } as ErrorContext,
        );
        return null;
      }
    },
    [currentUserId],
  );

  // Update notification settings for a conversation
  const updateNotificationSettings = React.useCallback(
    async (
      conversationId: string,
      settings: ConversationParticipant["notification_settings"],
    ): Promise<boolean> => {
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
        debugLog.error(
          "Failed to update notification settings",
          err,
          { conversationId } as ErrorContext,
        );
        return false;
      }
    },
    [currentUserId],
  );

  // Handle incoming message notification
  const handleMessageNotification = React.useCallback(
    async (message: Message, conversation: Conversation) => {
      // Don't notify for own messages
      if (message.sender_id === currentUserId) return;

      // Check if conversation is muted
      const settings = await getNotificationSettings(message.conversation_id);
      if (settings?.muted) return;

      // Get sender info
      const { data: sender } = await supabase
        .from("users")
        .select("display_name, first_name, last_name, avatar_url")
        .eq("id", message.sender_id)
        .single();

      const senderName = sender?.display_name ||
        `${sender?.first_name || ""} ${sender?.last_name || ""}`.trim() ||
        "Someone";

      const notification: NotificationPayload = {
        title: conversation.name || senderName,
        body: message.message_type === "text"
          ? message.content
          : `Sent a ${message.message_type}`,
        icon: sender?.avatar_url || "https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png",
        sound: settings?.sound || "default",
        data: {
          conversationId: message.conversation_id,
          messageId: message.id,
          senderId: message.sender_id,
          type: "message",
        },
      };

      if (isAppFocused) {
        // App is in foreground - show browser notification and play sound
        await showBrowserNotification(notification);
        if (settings?.sound !== "none") {
          playNotificationSound(settings?.sound || "default");
        }
      } else {
        // App is in background - send push notification
        // Find all participants except sender to notify
        const { data: participants } = await supabase
          .from("chat_participants")
          .select("user_id")
          .eq("conversation_id", message.conversation_id)
          .eq("is_active", true)
          .neq("user_id", message.sender_id);

        if (participants) {
          for (const participant of participants) {
            await sendPushNotification(participant.user_id, notification);
          }
        }
      }
    },
    [currentUserId, isAppFocused, getNotificationSettings],
  );

  // Load all conversations for the current user
  const loadConversations = React.useCallback(async () => {
    if (!currentUserId) {
      debugLog.messaging(
        "loadConversations",
        { userId: currentUserId || "none" } as MessagingEventData,
      );
      return;
    }

    const startTime = performanceLog.start("loadConversations");
    debugLog.messaging(
      "loadConversations",
      { userId: currentUserId } as MessagingEventData,
    );

    setLoading(true);
    setError(null);

    try {
      // Get conversations with participants
      const { data: convData, error: convError } = await supabase
        .from("chat_conversations")
        .select(`
          *,
          participants:chat_participants(
            *,
            user:users(
              id,
              email,
              first_name,
              last_name,
              display_name,
              username,
              avatar_url,
              profile_image_url,
              is_online,
              last_seen_at,
              wolfpack_status
            )
          )
        `)
        .eq("participants.user_id", currentUserId)
        .eq("participants.is_active", true)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (convError) throw convError;

      // Calculate unread counts
      const conversationsWithUnread = await Promise.all(
        (convData || []).map(async (conv) => {
          // Get unread count
          const { count } = await supabase
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("is_deleted", false)
            .neq("sender_id", currentUserId)
            .or(`is_read.is.false,is_read.is.null`);

          // For direct conversations, get the other participant
          let otherParticipant: UserProfile | undefined;
          if (conv.conversation_type === "direct") {
            const otherPart = conv.participants?.find(
              (p: ConversationParticipant) => p.user_id !== currentUserId,
            );
            if (otherPart?.user) {
              otherParticipant = otherPart.user;
            }
          }

          return {
            ...conv,
            unread_count: count || 0,
            participant_count: conv.participants?.length || 0,
            other_participant: otherParticipant,
          };
        }),
      );

      setConversations(conversationsWithUnread);
      debugLog.success("loadConversations", {
        count: conversationsWithUnread.length,
      } as MessagingEventData);
      performanceLog.end("loadConversations", startTime);
    } catch (err) {
      debugLog.error(
        "loadConversations",
        err,
        { currentUserId } as ErrorContext,
      );
      setError(
        err instanceof Error ? err.message : "Failed to load conversations",
      );
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Load messages for a specific conversation
  const loadMessages = React.useCallback(
    async (conversationId: string, limit = 50, before?: string) => {
      const startTime = performanceLog.start("loadMessages");
      debugLog.messaging(
        "loadMessages",
        { conversationId, limit, before } as MessagingEventData,
      );

      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from("chat_messages")
          .select(`
            *,
            sender:users!sender_id(
              id,
              email,
              first_name,
              last_name,
              display_name,
              username,
              avatar_url,
              profile_image_url
            ),
            reply_to:chat_messages!reply_to_id(
              id,
              content,
              sender_id,
              created_at
            )
          `)
          .eq("conversation_id", conversationId)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (before) {
          query = query.lt("created_at", before);
        }

        const { data, error: msgError } = await query;

        if (msgError) throw msgError;

        // Transform messages to include flattened sender info for display
        const transformedMessages: DisplayMessage[] = (data || []).map(
          (msg) => ({
            ...msg,
            // Flatten sender info for easier access in UI
            sender_first_name: msg.sender?.first_name,
            sender_last_name: msg.sender?.last_name,
            sender_display_name: msg.sender?.display_name,
            sender_avatar_url: msg.sender?.avatar_url ||
              msg.sender?.profile_image_url,
            sender_username: msg.sender?.username,
          }),
        ).reverse(); // Reverse to get chronological order

        setMessages(transformedMessages);
        debugLog.success("loadMessages", {
          count: transformedMessages.length,
          conversationId,
        } as MessagingEventData);
        performanceLog.end("loadMessages", startTime);
      } catch (err) {
        debugLog.error("loadMessages", err, { conversationId } as ErrorContext);
        setError(
          err instanceof Error ? err.message : "Failed to load messages",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Send a message to a conversation
  const sendMessage = React.useCallback(
    async (
      conversationId: string,
      content: string,
      messageType: MessageType = MessageType.TEXT,
      mediaUrl?: string,
    ) => {
      if (!currentUserId || !content.trim()) return false;

      try {
        const messageData: MessageInsert = {
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: content.trim(),
          message_type: messageType,
          status: MessageStatus.SENT,
          is_deleted: false,
          is_edited: false,
        };

        if (mediaUrl) {
          messageData.media_url = mediaUrl;
          if (messageType === MessageType.IMAGE) {
            messageData.media_type = "image";
          } else if (messageType === MessageType.VIDEO) {
            messageData.media_type = "video";
          } else if (messageType === MessageType.AUDIO) {
            messageData.media_type = "audio";
          } else if (messageType === MessageType.FILE) {
            messageData.media_type = "file";
          }
        }

        const { error } = await supabase
          .from("chat_messages")
          .insert(messageData);

        if (error) throw error;

        // Update conversation's last message
        await supabase
          .from("chat_conversations")
          .update({
            last_message_at: new Date().toISOString(),
            last_message_preview: content.substring(0, 100),
            last_message_sender_id: currentUserId,
          })
          .eq("id", conversationId);

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
        return false;
      }
    },
    [currentUserId],
  );

  // Create or get a direct conversation with another user
  const getOrCreateDirectConversation = React.useCallback(
    async (otherUserId: string) => {
      console.log("🔍 getOrCreateDirectConversation called with:", {
        otherUserId,
        currentUserId,
        hasCurrentUser: !!currentUserId,
      });

      if (!currentUserId) {
        console.error("❌ No current user ID available");
        return null;
      }

      try {
        // First check if a direct conversation already exists
        console.log("🔍 Checking for existing conversation...");
        const { data: existing, error: existingError } = await supabase
          .from("chat_participants")
          .select(`
            conversation_id,
            conversation:chat_conversations(
              id,
              conversation_type
            )
          `)
          .eq("user_id", currentUserId)
          .eq("is_active", true);

        if (existingError) {
          console.error(
            "❌ Error fetching existing conversations:",
            existingError,
          );
          throw existingError;
        }

        console.log("📊 Found participations:", existing?.length || 0);

        // Find direct conversation with the other user
        if (existing) {
          for (const participation of existing) {
            // The conversation is a single object, not an array
            let conv = participation.conversation as
              | { id: string; conversation_type: string }
              | { id: string; conversation_type: string }[]
              | null;
            if (Array.isArray(conv)) {
              conv = conv[0] || null;
            }
            console.log("🔍 Checking participation:", {
              conversation_id: participation.conversation_id,
              has_conversation: !!conv,
              conversation_type: conv?.conversation_type,
            });

            if (!conv) continue;

            if (conv.conversation_type === "direct") {
              console.log(
                "📍 Found direct conversation, checking for other participant...",
              );
              const { data: otherParticipant } = await supabase
                .from("chat_participants")
                .select("user_id")
                .eq("conversation_id", participation.conversation_id)
                .eq("user_id", otherUserId)
                .eq("is_active", true)
                .single();

              if (otherParticipant) {
                console.log(
                  "✅ Found existing conversation with user:",
                  participation.conversation_id,
                );
                return participation.conversation_id;
              }
            }
          }
        }

        console.log("📝 No existing conversation found, creating new one...");

        // Create new conversation
        const conversationInsert: ConversationInsert = {
          conversation_type: ConversationType.DIRECT,
          created_by: currentUserId,
          is_active: true,
        };

        const { data: newConv, error: convError } = await supabase
          .from("chat_conversations")
          .insert(conversationInsert)
          .select()
          .single();

        if (convError) throw convError;

        // Add participants
        const participants: ParticipantInsert[] = [
          {
            conversation_id: newConv!.id,
            user_id: currentUserId,
            role: "member",
            is_active: true,
          },
          {
            conversation_id: newConv!.id,
            user_id: otherUserId,
            role: "member",
            is_active: true,
          },
        ];

        const { error: partError } = await supabase
          .from("chat_participants")
          .insert(participants);

        if (partError) throw partError;

        console.log("✅ Successfully created new conversation:", newConv!.id);
        return newConv!.id;
      } catch (err) {
        console.error("❌ Error in getOrCreateDirectConversation:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create conversation",
        );
        return null;
      }
    },
    [currentUserId],
  );

  // Create a group conversation
  const createGroupConversation = React.useCallback(
    async (name: string, participantIds: string[]) => {
      if (!currentUserId) return null;

      try {
        // Create new group conversation
        const conversationInsert: ConversationInsert = {
          conversation_type: ConversationType.GROUP,
          name,
          created_by: currentUserId,
          is_active: true,
        };

        const { data: newConv, error: convError } = await supabase
          .from("chat_conversations")
          .insert(conversationInsert)
          .select()
          .single();

        if (convError) throw convError;

        // Add all participants including creator
        const participants: ParticipantInsert[] = [
          currentUserId,
          ...participantIds,
        ].map((userId) => ({
          conversation_id: newConv!.id,
          user_id: userId,
          role: userId === currentUserId ? "admin" : "member",
          is_active: true,
        }));

        const { error: partError } = await supabase
          .from("chat_participants")
          .insert(participants);

        if (partError) throw partError;

        return newConv!.id;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to create group conversation",
        );
        return null;
      }
    },
    [currentUserId],
  );

  // Subscribe to real-time messages for a conversation
  const subscribeToConversation = React.useCallback(
    (conversationId: string) => {
      // Remove existing subscription if any
      const existingChannel = subscriptionsRef.current.get(conversationId);
      if (existingChannel) {
        supabase.removeChannel(existingChannel);
      }

      // Get current conversation for notification context
      const currentConversation = conversations.find((c) =>
        c.id === conversationId
      );

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
          async (
            payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>,
          ) => {
            // Type guard for payload.new
            const newRecord = payload.new as { id: string };
            if (!newRecord.id) return;

            // Fetch full message with sender info
            const { data } = await supabase
              .from("chat_messages")
              .select(`
                *,
                sender:users!sender_id(
                  id,
                  email,
                  first_name,
                  last_name,
                  display_name,
                  username,
                  avatar_url,
                  profile_image_url
                )
              `)
              .eq("id", newRecord.id)
              .single();

            if (data) {
              const newMessage: DisplayMessage = {
                ...data,
                sender_first_name: data.sender?.first_name,
                sender_last_name: data.sender?.last_name,
                sender_display_name: data.sender?.display_name,
                sender_avatar_url: data.sender?.avatar_url ||
                  data.sender?.profile_image_url,
                sender_username: data.sender?.username,
              };

              setMessages((prev) => [...prev, newMessage]);

              // Handle notification for new message
              if (currentConversation) {
                await handleMessageNotification(
                  data as Message,
                  currentConversation,
                );
              }
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
          (
            payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>,
          ) => {
            // Type guard for payload.new
            const newRecord = payload.new as
              & { id: string }
              & Partial<DisplayMessage>;
            if (!newRecord.id) return;

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === newRecord.id ? { ...msg, ...newRecord } : msg
              )
            );
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "chat_messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (
            payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>,
          ) => {
            // Type guard for payload.old
            const oldRecord = payload.old as { id: string };
            if (!oldRecord.id) return;

            setMessages((prev) =>
              prev.filter((msg) => msg.id !== oldRecord.id)
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
    [conversations, handleMessageNotification],
  );

  // Subscribe to typing indicators
  const subscribeToTypingIndicators = React.useCallback(
    (conversationId: string) => {
      const channel = supabase
        .channel(`typing:${conversationId}`)
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState() as Record<
            string,
            TypingState[]
          >;
          const typing = new Set<string>();

          Object.values(state).forEach((presences) => {
            presences.forEach((presence) => {
              if (presence.userId && presence.userId !== currentUserId) {
                typing.add(presence.userId);
              }
            });
          });

          setTypingUsers((prev) => {
            const newMap = new Map(prev);
            newMap.set(conversationId, Array.from(typing));
            return newMap;
          });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    [currentUserId],
  );

  // Send typing indicator
  const sendTypingIndicator = React.useCallback(
    async (conversationId: string, isTyping: boolean) => {
      if (!currentUserId) return;

      const channel = supabase.channel(`typing:${conversationId}`);

      if (isTyping) {
        await channel.track({
          userId: currentUserId,
          timestamp: new Date().toISOString(),
        });

        // Clear existing timeout
        const existingTimeout = typingTimeoutsRef.current.get(conversationId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Set timeout to stop typing after 3 seconds
        const timeout = setTimeout(() => {
          channel.untrack();
          typingTimeoutsRef.current.delete(conversationId);
        }, 3000);

        typingTimeoutsRef.current.set(conversationId, timeout);
      } else {
        await channel.untrack();

        const existingTimeout = typingTimeoutsRef.current.get(conversationId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          typingTimeoutsRef.current.delete(conversationId);
        }
      }
    },
    [currentUserId],
  );

  // Edit a message
  const editMessage = React.useCallback(
    async (messageId: string, newContent: string) => {
      if (!currentUserId || !newContent.trim()) return false;

      try {
        const { error } = await supabase
          .from("chat_messages")
          .update({
            content: newContent.trim(),
            is_edited: true,
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
    },
    [currentUserId],
  );

  // Delete a message
  const deleteMessage = React.useCallback(
    async (messageId: string) => {
      if (!currentUserId) return false;

      try {
        const { error } = await supabase
          .from("chat_messages")
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: currentUserId,
          })
          .eq("id", messageId)
          .eq("sender_id", currentUserId);

        if (error) throw error;

        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete message",
        );
        return false;
      }
    },
    [currentUserId],
  );

  // Mark messages as read
  const markAsRead = React.useCallback(
    async (conversationId: string) => {
      if (!currentUserId) return false;

      try {
        const { error } = await supabase
          .from("chat_messages")
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
          })
          .eq("conversation_id", conversationId)
          .neq("sender_id", currentUserId)
          .or(`is_read.is.false,is_read.is.null`);

        if (error) throw error;

        // Update participant's last read time
        await supabase
          .from("chat_participants")
          .update({
            last_read_at: new Date().toISOString(),
          })
          .eq("conversation_id", conversationId)
          .eq("user_id", currentUserId);

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to mark as read");
        return false;
      }
    },
    [currentUserId],
  );

  // Update conversation details
  const updateConversation = React.useCallback(
    async (conversationId: string, updates: Partial<Conversation>) => {
      try {
        // Filter out computed fields
        const {
          // other_participant is intentionally omitted to avoid unused variable error
          ...dbUpdates
        } = updates;

        const { error } = await supabase
          .from("chat_conversations")
          .update(dbUpdates)
          .eq("id", conversationId);

        if (error) throw error;

        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update conversation",
        );
        return false;
      }
    },
    [],
  );

  // Delete a conversation
  const deleteConversation = React.useCallback(
    async (conversationId: string) => {
      try {
        const { error } = await supabase
          .from("chat_conversations")
          .update({ is_active: false })
          .eq("id", conversationId);

        if (error) throw error;

        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete conversation",
        );
        return false;
      }
    },
    [],
  );

  // Leave a conversation
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
    [currentUserId],
  );

  // Add participants to conversation
  const addParticipants = React.useCallback(
    async (conversationId: string, userIds: string[]) => {
      try {
        const participants: ParticipantInsert[] = userIds.map((userId) => ({
          conversation_id: conversationId,
          user_id: userId,
          role: "member",
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
    },
    [],
  );

  // Remove participant from conversation
  const removeParticipant = React.useCallback(
    async (conversationId: string, userId: string) => {
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
    },
    [],
  );

  // Update participant role
  const updateParticipantRole = React.useCallback(
    async (conversationId: string, userId: string, role: string) => {
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
    },
    [],
  );

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
    deleteConversation,
    leaveConversation,

    // Message actions
    loadMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,

    // Real-time actions
    subscribeToConversation,
    subscribeToTypingIndicators,
    sendTypingIndicator,

    // Participant actions
    addParticipants,
    removeParticipant,
    updateParticipantRole,

    // Notification actions
    requestNotificationPermission,
    getNotificationSettings,
    updateNotificationSettings,
  };
}
