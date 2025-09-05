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
// Extended Types with Relationships (Updated)
// ============================================

/**
 * Message with sender information and reactions
 */
export interface MessageWithSender extends ChatMessage {
  sender:
    | Pick<
      User,
      | "id" 
      | "email"
      | "display_name" 
      | "first_name"
      | "last_name"
      | "username" 
      | "avatar_url" 
      | "profile_image_url"
      | "is_verified"
    >
    | null;
  reactions?: Array<{
    id: string;
    reaction: string;
    user_id: string | null;
    message_id: string | null;
    created_at: string | null;
    user?: Pick<User, "id" | "email" | "display_name" | "first_name" | "last_name" | "username" | "is_verified">;
  }>;
  receipts?: ChatMessageReceipt[];
  reply_to?: Pick<ChatMessage, "id" | "content"> & { sender?: Pick<User, "id" | "display_name" | "username"> } | null;
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
      | "email"
      | "display_name"
      | "first_name"
      | "last_name"
      | "username"
      | "avatar_url"
      | "profile_image_url"
      | "account_status"
      | "is_verified"
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
    | "email"
    | "display_name"
    | "first_name"
    | "last_name"
    | "username"
    | "avatar_url"
    | "profile_image_url"
    | "account_status"
    | "is_verified"
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
  success: boolean;
  conversation_id?: string;
  conversation?: ChatConversation;
  is_new?: boolean;
  error?: string;
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
// Hook Return Types
// ============================================

/**
 * Return type for useMessaging hook
 */
// UseMessagingReturn interface is defined in /lib/hooks/useMessaging.ts 
// to avoid conflicts and keep it close to the hook implementation

/**
 * Options for message loading
 */
export interface MessageLoadOptions {
  limit?: number;
  beforeMessageId?: string;
  afterMessageId?: string;
  includeReactions?: boolean;
  includeReceipts?: boolean;
}

/**
 * Options for conversation loading
 */
export interface ConversationLoadOptions {
  includeArchived?: boolean;
  conversationType?: ConversationType;
  limit?: number;
  search?: string;
}

// ============================================
// API Response Types
// ============================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

/**
 * Response for conversation list API
 */
export interface ConversationListResponse extends ApiResponse<ConversationWithParticipants[]> {
  total_count?: number;
  has_more?: boolean;
}

/**
 * Response for message list API
 */
export interface MessageListResponse extends ApiResponse<MessageWithSender[]> {
  conversation_id: string;
  has_more?: boolean;
  oldest_message_id?: string | null;
  newest_message_id?: string | null;
}

// ============================================
// UI State Types
// ============================================

/**
 * State for message input component
 */
export interface MessageInputState {
  content: string;
  isTyping: boolean;
  replyTo: MessageWithSender | null;
  attachments: File[];
  isUploading: boolean;
  mentions: User[];
}

/**
 * State for conversation list component
 */
export interface ConversationListState {
  selectedConversationId: string | null;
  searchQuery: string;
  filter: ConversationFilters;
  sortBy: 'recent' | 'unread' | 'name';
}

/**
 * State for message list component
 */
export interface MessageListState {
  hasMore: boolean;
  isLoadingMore: boolean;
  highlightedMessageId: string | null;
  selectedMessages: Set<string>;
}

// ============================================
// Validation and Error Types
// ============================================

/**
 * Message validation result
 */
export interface MessageValidation {
  isValid: boolean;
  errors: string[];
  sanitizedContent?: string;
  wordCount?: number;
  containsSpam?: boolean;
}

/**
 * Rate limiting information
 */
export interface RateLimit {
  allowed: number;
  remaining: number;
  resetTime: Date;
  blocked: boolean;
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

// ============================================
// User Display Name Utilities
// ============================================

/**
 * Interface for user objects that contain name fields
 */
export interface UserWithNames {
  id: string;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  email?: string | null;
  is_verified?: boolean | null;
  avatar_url?: string | null;
  profile_image_url?: string | null;
}

/**
 * Get the display name for a user, prioritizing real names
 * 
 * Priority order:
 * 1. display_name (if set and not empty)
 * 2. first_name + last_name (if either is set)
 * 3. username (if set and not empty)
 * 4. email prefix (if available)
 * 5. 'Unknown User' as fallback
 */
export function getUserDisplayName(user: UserWithNames | null | undefined): string {
  if (!user) return 'Unknown User';
  
  // First priority: display_name
  if (user.display_name?.trim()) {
    return user.display_name.trim();
  }
  
  // Second priority: construct from first_name and last_name
  const firstName = user.first_name?.trim() || '';
  const lastName = user.last_name?.trim() || '';
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) {
    return fullName;
  }
  
  // Third priority: username
  if (user.username?.trim()) {
    return user.username.trim();
  }
  
  // Fourth priority: email prefix (if available)
  if ('email' in user && user.email?.trim()) {
    return user.email.split('@')[0];
  }
  
  return 'Unknown User';
}

/**
 * Get the full name (first + last) for a user
 * Returns null if neither first_name nor last_name is available
 */
export function getUserFullName(user: UserWithNames | null | undefined): string | null {
  if (!user) return null;
  
  const firstName = user.first_name?.trim() || '';
  const lastName = user.last_name?.trim() || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  return fullName || null;
}

/**
 * Get initials from a user's name
 * Uses display name or full name to generate initials
 */
export function getUserInitials(user: UserWithNames | null | undefined): string {
  if (!user) return 'U';
  
  const displayName = getUserDisplayName(user);
  
  return displayName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';
}

/**
 * Get the best avatar URL for a user
 */
export function getUserAvatarUrl(user: { avatar_url?: string | null; profile_image_url?: string | null } | null | undefined): string | null {
  if (!user) return null;
  return user.avatar_url || user.profile_image_url || null;
}
