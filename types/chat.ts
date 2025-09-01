/**
 * Chat Types for NEW SIDEHUSTLE Project
 * This file contains all type definitions for the chat system
 * matching the exact database schema from Supabase
 */

import { Database } from "@/types/database.types";

// ============================================
// Base Database Types (Direct from schema)
// ============================================

export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];
export type ChatConversation =
  Database["public"]["Tables"]["chat_conversations"]["Row"];
export type ChatMessageReaction =
  Database["public"]["Tables"]["chat_message_reactions"]["Row"];
export type ChatParticipant =
  Database["public"]["Tables"]["chat_participants"]["Row"];
export type ChatMessageReceipt =
  Database["public"]["Tables"]["chat_message_receipts"]["Row"];
export type User = Database["public"]["Tables"]["users"]["Row"];

// Insert types for creating new records
export type ChatMessageInsert =
  Database["public"]["Tables"]["chat_messages"]["Insert"];
export type ChatConversationInsert =
  Database["public"]["Tables"]["chat_conversations"]["Insert"];
export type ChatParticipantInsert =
  Database["public"]["Tables"]["chat_participants"]["Insert"];
export type ChatMessageReactionInsert =
  Database["public"]["Tables"]["chat_message_reactions"]["Insert"];

// Update types for modifying records
export type ChatMessageUpdate =
  Database["public"]["Tables"]["chat_messages"]["Update"];
export type ChatConversationUpdate =
  Database["public"]["Tables"]["chat_conversations"]["Update"];
export type ChatParticipantUpdate =
  Database["public"]["Tables"]["chat_participants"]["Update"];

// ============================================
// Extended Types with Relationships
// ============================================

/**
 * Message with sender information and reactions
 */
export interface MessageWithSender extends ChatMessage {
  sender:
    | Pick<
      User,
      "id" | "display_name" | "username" | "avatar_url" | "profile_image_url"
    >
    | null;
  reactions?: Array<{
    id: string;
    reaction: string;
    user_id: string | null;
    message_id: string | null;
    created_at: string | null;
    user?: Pick<User, "id" | "display_name" | "username">;
  }>;
  receipts?: ChatMessageReceipt[];
  reply_to?: Pick<ChatMessage, "id" | "content" | "sender_id"> | null;
}

/**
 * Conversation with participants and last message info
 */
export interface ConversationWithParticipants extends ChatConversation {
  participants: Array<{
    id: string;
    user_id: string;
    conversation_id: string;
    role: string | null;
    joined_at: string | null;
    last_read_at: string | null;
    left_at: string | null;
    is_active: boolean | null;
    notification_settings: Record<string, unknown> | null;
    updated_at: string | null;
    user: Pick<
      User,
      | "id"
      | "display_name"
      | "username"
      | "avatar_url"
      | "profile_image_url"
      | "account_status"
    >;
  }>;
  last_message?:
    | Pick<ChatMessage, "id" | "content" | "created_at" | "message_type">
    | null;
  unread_count?: number;
}

/**
 * Participant with full user details
 */
export interface ParticipantWithUser extends ChatParticipant {
  user: Pick<
    User,
    | "id"
    | "display_name"
    | "username"
    | "avatar_url"
    | "profile_image_url"
    | "account_status"
  >;
}

// ============================================
// Component Props Interfaces
// ============================================

/**
 * Props for ChatInput component
 */
export interface ChatInputProps {
  conversationId: string;
  onSendMessage: (params: {
    conversationId: string;
    content: string;
    messageType?: "text" | "image" | "system" | "deleted";
    mediaUrl?: string;
    mediaType?: "image" | "video" | "audio" | "file" | "gif";
    replyToId?: string;
    attachments?: Array<{
      id: string;
      name: string;
      size: number;
      type: string;
      url: string;
    }>;
  }) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  replyTo?: Pick<MessageWithSender, "id" | "content" | "sender"> | null;
  onCancelReply?: () => void;
  maxLength?: number;
  showTypingIndicator?: boolean;
  className?: string;
}

/**
 * Props for MessageItem component
 */
export interface MessageItemProps {
  message: MessageWithSender;
  currentUserId: string;
  onReactionAdd?: (messageId: string, reaction: string) => Promise<void>;
  onReactionRemove?: (reactionId: string) => Promise<void>;
  onReply?: (message: MessageWithSender) => void;
  onEdit?: (messageId: string, newContent: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
  showReadReceipts?: boolean;
  isHighlighted?: boolean;
  className?: string;
}

/**
 * Props for ConversationList component
 */
export interface ConversationListProps {
  conversations: ConversationWithParticipants[];
  currentUserId: string;
  selectedConversationId?: string;
  onConversationSelect?: (conversation: ConversationWithParticipants) => void;
  onStartNewChat?: () => void;
  onArchiveConversation?: (conversationId: string) => Promise<void>;
  onPinConversation?: (conversationId: string) => Promise<void>;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * Props for MessageList component
 */
export interface MessageListProps {
  messages: MessageWithSender[];
  currentUserId: string;
  conversationId: string;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  loading?: boolean;
  onReactionAdd?: (messageId: string, reaction: string) => Promise<void>;
  onReactionRemove?: (reactionId: string) => Promise<void>;
  onReply?: (message: MessageWithSender) => void;
  className?: string;
}

// ============================================
// Database Function Parameters
// ============================================

/**
 * Parameters for send_message database function
 */
export interface SendMessageParams {
  p_conversation_id: string;
  p_content: string;
  p_message_type?: string;
  p_media_type?: string;
  p_media_url?: string;
  p_reply_to_id?: string;
}

/**
 * Parameters for get_conversation_messages database function
 */
export interface GetConversationMessagesParams {
  p_conversation_id: string;
  p_limit?: number;
  p_before_message_id?: string;
}

/**
 * Parameters for get_or_create_dm_conversation database function
 */
export interface GetOrCreateDMParams {
  other_user_id: string;
}

// ============================================
// Enums and Constants
// ============================================

/**
 * Message types enum
 */
export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  SYSTEM = "system",
  DELETED = "deleted",
}

/**
 * Media types enum
 */
export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "audio",
  FILE = "file",
  GIF = "gif",
}

/**
 * Conversation types enum
 */
export enum ConversationType {
  DIRECT = "direct",
  GROUP = "group",
  LOCATION = "location",
  BROADCAST = "broadcast",
}

/**
 * Participant roles enum
 */
export enum ParticipantRole {
  ADMIN = "admin",
  MODERATOR = "moderator",
  MEMBER = "member",
}

/**
 * Available reaction emojis
 */
export const AVAILABLE_REACTIONS = [
  "👍",
  "❤️",
  "😂",
  "😮",
  "😢",
  "😡",
  "👎",
  "🔥",
  "🎉",
  "💯",
  "🤔",
  "👏",
  "🙏",
  "😍",
  "🤗",
] as const;

export type ReactionEmoji = typeof AVAILABLE_REACTIONS[number];

// ============================================
// Utility Types
// ============================================

/**
 * Type for creating a new message
 */
export interface CreateMessageInput {
  conversationId: string;
  content: string;
  messageType?: MessageType;
  mediaUrl?: string;
  mediaType?: MediaType;
  mediaThumbnailUrl?: string;
  mediaSize?: number;
  mediaDuration?: number;
  replyToId?: string;
  attachments?: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
  metadata?: Record<string, unknown>;
}

/**
 * Type for creating a new conversation
 */
export interface CreateConversationInput {
  name?: string;
  description?: string;
  avatarUrl?: string;
  conversationType: ConversationType;
  participantIds: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Type for conversation filters
 */
export interface ConversationFilters {
  isArchived?: boolean;
  isPinned?: boolean;
  conversationType?: ConversationType;
  hasUnread?: boolean;
  participantId?: string;
}

/**
 * Type for message filters
 */
export interface MessageFilters {
  conversationId: string;
  beforeDate?: string;
  afterDate?: string;
  senderId?: string;
  messageType?: MessageType;
  hasMedia?: boolean;
  isDeleted?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Type for typing indicator
 */
export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName?: string;
  timestamp: string;
}

/**
 * Type for read receipt
 */
export interface ReadReceipt {
  messageId: string;
  userId: string;
  readAt: string;
  user?: Pick<User, "id" | "display_name" | "username" | "avatar_url">;
}

// ============================================
// Response Types from Database Functions
// ============================================

/**
 * Response from send_message function
 */
export interface SendMessageResponse {
  success: boolean;
  message?: ChatMessage;
  error?: string;
}

/**
 * Response from get_or_create_dm_conversation function
 */
export interface GetOrCreateDMResponse {
  conversation_id: string;
  is_new: boolean;
  conversation?: ChatConversation;
}

/**
 * Response from get_conversation_messages function
 */
export interface GetConversationMessagesResponse {
  messages: MessageWithSender[];
  has_more: boolean;
  total_count?: number;
}

// ============================================
// Real-time Subscription Types
// ============================================

/**
 * Payload for real-time message events
 */
export interface RealtimeMessagePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  old: ChatMessage | null;
  new: ChatMessage | null;
}

/**
 * Payload for real-time conversation events
 */
export interface RealtimeConversationPayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  old: ChatConversation | null;
  new: ChatConversation | null;
}

/**
 * Payload for real-time reaction events
 */
export interface RealtimeReactionPayload {
  eventType: "INSERT" | "DELETE";
  old: ChatMessageReaction | null;
  new: ChatMessageReaction | null;
}

// ============================================
// JSON Type Guards (for runtime type checking)
// ============================================

export function isValidMessageType(type: string): type is MessageType {
  return Object.values(MessageType).includes(type as MessageType);
}

export function isValidMediaType(type: string): type is MediaType {
  return Object.values(MediaType).includes(type as MediaType);
}

export function isValidConversationType(
  type: string,
): type is ConversationType {
  return Object.values(ConversationType).includes(type as ConversationType);
}

export function isValidParticipantRole(role: string): role is ParticipantRole {
  return Object.values(ParticipantRole).includes(role as ParticipantRole);
}

export function isValidReactionEmoji(emoji: string): emoji is ReactionEmoji {
  return AVAILABLE_REACTIONS.includes(emoji as ReactionEmoji);
}
