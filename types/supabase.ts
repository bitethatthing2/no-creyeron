// types/supabase.ts

import { Database } from "./database.types";

// Extract table types from the generated Database type
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Core table types from your actual database
export type User = Tables<"users">;
export type ContentPost = Tables<"content_posts">;
export type ContentComment = Tables<"content_comments">;
export type MenuItem = Tables<"menu_items">;
export type MenuCategory = Tables<"menu_categories">;
export type ChatConversation = Tables<"chat_conversations">;
export type ChatMessage = Tables<"chat_messages">;
export type ChatParticipant = Tables<"chat_participants">;
export type SocialFollow = Tables<"social_follows">;
export type SocialBlock = Tables<"social_blocks">;
export type Notification = Tables<"notifications">;
export type ContentInteraction = Tables<"content_interactions">;
export type UserPostInteraction = Tables<"user_post_interactions">;
export type PushToken = Tables<"push_tokens">;
export type AppConfig = Tables<"app_config">;
export type SystemConfig = Tables<"system_config">;
export type NotificationTopic = Tables<"notification_topics">;
export type StorageDocumentation = Tables<"storage_documentation">;
export type StorageMigrationPlan = Tables<"storage_migration_plan">;
export type CleanupLog = Tables<"cleanup_logs">;
export type ChatMessageReaction = Tables<"chat_message_reactions">;
export type ChatMessageReceipt = Tables<"chat_message_receipts">;

// Extended types with relationships
export interface UserWithStats extends User {
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  is_following?: boolean;
  is_blocked?: boolean;
}

export interface PostWithAuthor extends ContentPost {
  author?: User;
  has_liked?: boolean;
  has_viewed?: boolean;
  interaction_count?: number;
}

export interface CommentWithAuthor extends ContentComment {
  author?: User;
  replies?: CommentWithAuthor[];
}

export interface MenuItemWithCategory extends MenuItem {
  category?: MenuCategory;
}

export interface MessageWithSender extends ChatMessage {
  sender?: User;
  reactions?: ChatMessageReaction[];
  receipts?: ChatMessageReceipt[];
}

export interface ConversationWithDetails extends ChatConversation {
  participants?: Array<ChatParticipant & { user?: User }>;
  last_message?: MessageWithSender;
  unread_count?: number;
}

export interface NotificationWithUsers extends Notification {
  recipient?: User;
  related_user?: User;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// Filter/Query types
export interface UserSearchParams {
  query?: string;
  limit?: number;
  offset?: number;
  exclude_blocked?: boolean;
  only_active?: boolean;
}

export interface PostQueryParams {
  user_id?: string;
  post_type?: "video" | "image" | "text" | "carousel";
  visibility?: "public" | "followers" | "private";
  is_featured?: boolean;
  is_active?: boolean;
  tags?: string[];
  limit?: number;
  offset?: number;
  order_by?: "created_at" | "likes_count" | "views_count" | "comments_count";
  order?: "asc" | "desc";
}

export interface MessageQueryParams {
  conversation_id: string;
  limit?: number;
  before?: string;
  after?: string;
  include_deleted?: boolean;
}

export interface ConversationQueryParams {
  user_id: string;
  conversation_type?: "direct" | "group" | "location" | "broadcast";
  is_active?: boolean;
  is_archived?: boolean;
  limit?: number;
  offset?: number;
}

// Action Response types
export interface FollowResponse {
  success: boolean;
  following: boolean;
  follower_count?: number;
}

export interface LikeResponse {
  success: boolean;
  liked: boolean;
  likes_count?: number;
}

export interface SendMessageResponse {
  success: boolean;
  message?: ChatMessage;
  error?: string;
}

// Input types for mutations
export interface CreatePostInput {
  caption?: string;
  description?: string;
  title?: string;
  video_url?: string;
  thumbnail_url?: string;
  images?: string[];
  tags?: string[];
  post_type?: "video" | "image" | "text" | "carousel";
  visibility?: "public" | "followers" | "private";
  allow_comments?: boolean;
  allow_duets?: boolean;
  allow_stitches?: boolean;
  location_tag?: string;
  location_lat?: number;
  location_lng?: number;
}

export interface CreateCommentInput {
  video_id: string;
  content: string;
  parent_comment_id?: string;
}

export interface SendMessageInput {
  conversation_id: string;
  content: string;
  message_type?: "text" | "image" | "system";
  media_url?: string;
  media_type?: string;
  reply_to_id?: string;
  attachments?: unknown[];
}

export interface CreateConversationInput {
  name?: string;
  description?: string;
  avatar_url?: string;
  conversation_type: "direct" | "group" | "location" | "broadcast";
  participant_ids: string[];
}

export interface UpdateProfileInput {
  display_name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
  profile_image_url?: string;
  phone?: string;
  settings?: Record<string, unknown>;
}

// Constants from your database constraints
export const USER_ROLES = ["user", "admin"] as const;
export const ACCOUNT_STATUSES = [
  "active",
  "inactive",
  "pending",
  "suspended",
] as const;
export const POST_TYPES = ["video", "image", "text", "carousel"] as const;
export const VISIBILITY_LEVELS = ["public", "followers", "private"] as const;
export const CONVERSATION_TYPES = [
  "direct",
  "group",
  "location",
  "broadcast",
] as const;
export const MESSAGE_TYPES = ["text", "image", "system", "deleted"] as const;
export const INTERACTION_TYPES = ["like", "view", "share", "save"] as const;
export const NOTIFICATION_TYPES = [
  "info",
  "warning",
  "error",
  "success",
  "order_new",
  "order_ready",
  "order_cancelled",
  "follow",
  "unfollow",
  "like",
  "comment",
  "mention",
  "share",
  "post_like",
  "post_comment",
  "message",
  "friend_request",
  "system",
  "promotion",
  "achievement",
] as const;
export const NOTIFICATION_STATUSES = ["unread", "read", "dismissed"] as const;
export const NOTIFICATION_PRIORITIES = [
  "low",
  "normal",
  "high",
  "urgent",
] as const;
export const PLATFORM_TYPES = ["web", "ios", "android"] as const;
export const PARTICIPANT_ROLES = ["admin", "moderator", "member"] as const;
export const PROCESSING_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;
export const MENU_TYPES = ["food", "drink"] as const;

// Type guards
export function isUser(obj: unknown): obj is User {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "email" in obj &&
    "username" in obj
  );
}

export function isContentPost(obj: unknown): obj is ContentPost {
  return obj !== null && typeof obj === "object" && "id" in obj &&
    "post_type" in obj;
}

export function isMenuItem(obj: unknown): obj is MenuItem {
  return obj !== null && typeof obj === "object" && "id" in obj &&
    "price" in obj && "name" in obj;
}

export function isChatMessage(obj: unknown): obj is ChatMessage {
  return obj !== null && typeof obj === "object" && "id" in obj &&
    "conversation_id" in obj && "sender_id" in obj;
}

// Helper types
export type UserRole = typeof USER_ROLES[number];
export type AccountStatus = typeof ACCOUNT_STATUSES[number];
export type PostType = typeof POST_TYPES[number];
export type VisibilityLevel = typeof VISIBILITY_LEVELS[number];
export type ConversationType = typeof CONVERSATION_TYPES[number];
export type MessageType = typeof MESSAGE_TYPES[number];
export type InteractionType = typeof INTERACTION_TYPES[number];
export type NotificationType = typeof NOTIFICATION_TYPES[number];
export type NotificationStatus = typeof NOTIFICATION_STATUSES[number];
export type NotificationPriority = typeof NOTIFICATION_PRIORITIES[number];
export type PlatformType = typeof PLATFORM_TYPES[number];
export type ParticipantRole = typeof PARTICIPANT_ROLES[number];
export type ProcessingStatus = typeof PROCESSING_STATUSES[number];
export type MenuType = typeof MENU_TYPES[number];

// Default values
export const DEFAULT_AVATAR = "/icons/wolf-icon.png";
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_FILE_SIZE_MB = 100;
export const MAX_VIDEO_DURATION_SECONDS = 180;
export const MAX_IMAGE_COUNT = 10;
export const MAX_COMMENT_LENGTH = 500;
export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_BIO_LENGTH = 150;
export const MAX_USERNAME_LENGTH = 30;
export const MIN_USERNAME_LENGTH = 3;
