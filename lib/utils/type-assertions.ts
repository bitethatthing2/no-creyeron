// lib/utils/type-assertions.ts

/**
 * Type assertion helpers for Supabase type mismatches
 * These utilities help handle nullable fields and type conversions
 * from your Supabase database responses
 *
 * UPDATED: Aligned with NEW SIDEHUSTLE database schema
 */

// ============================================================================
// NULL HANDLING UTILITIES
// ============================================================================

/**
 * Asserts that a value is not null or undefined
 * Throws an error if the value is null/undefined
 * @template T The expected type of the value
 */
export function assertNotNull<T>(
  value: T | null | undefined,
  fieldName?: string,
): T {
  if (value == null) {
    throw new Error(`${fieldName || "Value"} cannot be null or undefined`);
  }
  return value;
}

/**
 * Safely converts nullable string to undefined
 * Database returns null, but TypeScript often prefers undefined
 */
export function safeStringOrNull(
  value: string | null | undefined,
): string | undefined {
  return value === null ? undefined : value;
}

/**
 * Provide a default value for nullable fields
 */
export function withDefault<T>(
  value: T | null | undefined,
  defaultValue: T,
): T {
  return value ?? defaultValue;
}

// ============================================================================
// JSON/JSONB FIELD HANDLERS - Based on actual database schema
// ============================================================================

/**
 * User settings JSONB field structure (users.settings)
 */
export interface UserSettings {
  theme?: "light" | "dark" | "auto";
  language?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    inApp?: boolean;
  };
  privacy?: {
    profileVisible?: boolean;
    showOnlineStatus?: boolean;
    allowMessages?: boolean;
  };
  preferences?: {
    autoPlayVideos?: boolean;
    soundEnabled?: boolean;
    showCaptions?: boolean;
  };
  [key: string]: unknown;
}

/**
 * Notification data JSONB field (notifications.data)
 */
export interface NotificationData {
  // For follow notifications
  follower_id?: string;
  follower_name?: string;
  follower_username?: string;
  follower_avatar?: string;

  // For post interactions
  post_id?: string;
  post_thumbnail?: string;
  post_caption?: string;
  liker_id?: string;
  liker_name?: string;
  commenter_id?: string;
  commenter_name?: string;
  comment_text?: string;

  // For messages
  conversation_id?: string;
  sender_id?: string;
  sender_name?: string;
  message_preview?: string;

  // For orders
  order_id?: string;
  order_number?: string;
  order_total?: number;
  items_count?: number;

  // Generic fields
  action_url?: string;
  image_url?: string;
  [key: string]: unknown;
}

/**
 * Chat conversation metadata (chat_conversations.metadata)
 */
export interface ConversationMetadata {
  created_from?: "app" | "web" | "api";
  is_support?: boolean;
  tags?: string[];
  custom_data?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Chat conversation settings (chat_conversations.settings)
 */
export interface ConversationSettings {
  muted?: boolean;
  notifications?: "all" | "mentions" | "none";
  theme?: string;
  encryption?: boolean;
  [key: string]: unknown;
}

/**
 * Chat message metadata (chat_messages.metadata)
 */
export interface MessageMetadata {
  edited_count?: number;
  forwarded_from?: string;
  reply_preview?: {
    id: string;
    content: string;
    sender_name: string;
  };
  mentions?: string[];
  [key: string]: unknown;
}

/**
 * Chat message attachments (chat_messages.attachments)
 */
export interface MessageAttachment {
  id: string;
  type: "image" | "video" | "audio" | "file" | "gif";
  url: string;
  thumbnail_url?: string;
  name?: string;
  size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  duration?: number;
}

/**
 * Chat participant notification settings (chat_participants.notification_settings)
 */
export interface ParticipantNotificationSettings {
  muted: boolean;
  muted_until?: string; // ISO timestamp
  mentions_only?: boolean;
  [key: string]: unknown;
}

/**
 * Push token device info (push_tokens.device_info)
 */
export interface DeviceInfo {
  screen?: {
    width: number;
    height: number;
  };
  vendor?: string;
  language?: string;
  platform?: string;
  userAgent?: string;
  app_version?: string;
  os_version?: string;
  [key: string]: unknown;
}

/**
 * Content post metadata (content_posts.metadata)
 */
export interface PostMetadata {
  source_platform?: "app" | "web" | "api";
  edit_history?: Array<{
    edited_at: string;
    changes: string[];
  }>;
  analytics?: {
    impressions?: number;
    reach?: number;
    engagement_rate?: number;
  };
  ai_tags?: string[];
  moderation?: {
    status: "pending" | "approved" | "rejected";
    reason?: string;
    reviewed_at?: string;
  };
  [key: string]: unknown;
}

/**
 * Safely parse JSONB value with type checking
 */
export function safeJsonValue<T extends Record<string, unknown>>(
  value: T | null | undefined,
): T {
  return (value || {}) as T;
}

/**
 * Parse user settings
 */
export function parseUserSettings(value: unknown): UserSettings {
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as UserSettings;
}

/**
 * Parse notification data
 */
export function parseNotificationData(value: unknown): NotificationData {
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as NotificationData;
}

/**
 * Parse message attachments array
 */
export function parseMessageAttachments(value: unknown): MessageAttachment[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is MessageAttachment =>
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "type" in item &&
      "url" in item,
  );
}

// ============================================================================
// USER DATA ASSERTIONS
// ============================================================================

export interface UserData {
  id: string;
  email: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  profile_image_url?: string | null;
  role?: "admin" | "user" | null;
  account_status?: "active" | "inactive" | "pending" | "suspended" | null;
  is_verified?: boolean | null;
  is_private?: boolean | null;
  email_notifications?: boolean | null;
  push_notifications?: boolean | null;
  settings?: UserSettings | null;
  created_at?: string;
  updated_at?: string;
  last_seen_at?: string | null;
}

/**
 * Assert and normalize user data
 */
export function assertUserData(data: unknown): UserData {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid user data");
  }

  const userData = data as Record<string, unknown>;

  // Ensure required fields exist
  if (!userData.id || !userData.email || !userData.username) {
    throw new Error("User must have id, email, and username");
  }

  return {
    id: userData.id as string,
    email: userData.email as string,
    username: userData.username as string,
    first_name: safeStringOrNull(userData.first_name as string | null),
    last_name: safeStringOrNull(userData.last_name as string | null),
    display_name: safeStringOrNull(userData.display_name as string | null),
    bio: safeStringOrNull(userData.bio as string | null),
    avatar_url: safeStringOrNull(userData.avatar_url as string | null),
    profile_image_url: safeStringOrNull(
      userData.profile_image_url as string | null,
    ),
    role: userData.role as "admin" | "user" | null,
    account_status: userData.account_status as
      | "active"
      | "inactive"
      | "pending"
      | "suspended"
      | null,
    is_verified: userData.is_verified as boolean | null,
    is_private: userData.is_private as boolean | null,
    email_notifications: userData.email_notifications as boolean | null,
    push_notifications: userData.push_notifications as boolean | null,
    settings: parseUserSettings(userData.settings),
    created_at: userData.created_at as string,
    updated_at: userData.updated_at as string,
    last_seen_at: safeStringOrNull(userData.last_seen_at as string | null),
  };
}

// ============================================================================
// POST DATA ASSERTIONS
// ============================================================================

export interface PostData {
  id: string;
  user_id?: string | null;
  post_type?: "video" | "image" | "text" | "carousel" | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  images?: string[] | null;
  caption?: string | null;
  title?: string | null;
  description?: string | null;
  tags?: string[] | null;
  likes_count?: number;
  comments_count?: number;
  views_count?: number;
  shares_count?: number;
  is_active?: boolean;
  is_featured?: boolean;
  visibility?: "public" | "followers" | "private" | null;
  allow_comments?: boolean;
  metadata?: PostMetadata | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Assert and normalize post data
 */
export function assertPostData(data: unknown): PostData {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid post data");
  }

  const postData = data as Record<string, unknown>;

  if (!postData.id) {
    throw new Error("Post must have an id");
  }

  return {
    id: postData.id as string,
    user_id: postData.user_id as string | null,
    post_type: postData.post_type as
      | "video"
      | "image"
      | "text"
      | "carousel"
      | null,
    video_url: safeStringOrNull(postData.video_url as string | null),
    thumbnail_url: safeStringOrNull(postData.thumbnail_url as string | null),
    images: postData.images as string[] | null,
    caption: safeStringOrNull(postData.caption as string | null),
    title: safeStringOrNull(postData.title as string | null),
    description: safeStringOrNull(postData.description as string | null),
    tags: postData.tags as string[] | null,
    likes_count: withDefault(postData.likes_count as number | null, 0),
    comments_count: withDefault(postData.comments_count as number | null, 0),
    views_count: withDefault(postData.views_count as number | null, 0),
    shares_count: withDefault(postData.shares_count as number | null, 0),
    is_active: withDefault(postData.is_active as boolean | null, true),
    is_featured: withDefault(postData.is_featured as boolean | null, false),
    visibility: postData.visibility as
      | "public"
      | "followers"
      | "private"
      | null,
    allow_comments: withDefault(
      postData.allow_comments as boolean | null,
      true,
    ),
    metadata: postData.metadata as PostMetadata | null,
    created_at: postData.created_at as string,
    updated_at: postData.updated_at as string,
  };
}

// ============================================================================
// SUPABASE RESPONSE HELPERS
// ============================================================================

/**
 * Type guard to check if a value is an error response
 */
export function isSupabaseError(value: unknown): value is { error: Error } {
  return (
    value !== null &&
    typeof value === "object" &&
    "error" in value &&
    value.error instanceof Error
  );
}

/**
 * Assert that a Supabase response contains data
 */
export function assertSupabaseData<T>(
  response: { data: T | null; error: Error | null },
): T {
  if (response.error) {
    throw response.error;
  }
  if (!response.data) {
    throw new Error("No data returned from Supabase");
  }
  return response.data;
}

// ============================================================================
// ARRAY HELPERS
// ============================================================================

/**
 * Ensure value is an array (for ARRAY columns in Postgres)
 */
export function ensureArray<T>(value: T[] | null | undefined): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
}

/**
 * Parse string array from database
 */
export function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

// ============================================================================
// DATE/TIME HELPERS
// ============================================================================

/**
 * Parse timestamp from database
 * Your DB uses 'timestamp with time zone' type
 */
export function parseTimestamp(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

/**
 * Format timestamp for database insertion
 */
export function formatTimestamp(date: Date | string | null): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Check if a timestamp is recent (within X minutes)
 */
export function isRecent(
  timestamp: string | Date | null,
  minutes: number = 5,
): boolean {
  if (!timestamp) return false;
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return diffMs < minutes * 60 * 1000;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if a value is a valid UUID
 */
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Check if a value is a valid email
 */
export function isValidEmail(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(value);
}

/**
 * Check if a value is a valid phone number (US format)
 */
export function isValidPhone(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const phoneRegex =
    /^\+?1?\d{10}$|^\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
  return phoneRegex.test(value);
}
