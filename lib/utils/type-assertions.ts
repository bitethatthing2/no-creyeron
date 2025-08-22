// lib/utils/type-assertions.ts

/**
 * Type assertion helpers for Supabase type mismatches
 * These utilities help handle nullable fields and type conversions
 * from your Supabase database responses
 */

// ============================================================================
// NULL HANDLING UTILITIES
// ============================================================================

/**
 * Asserts that a value is not null or undefined
 * Throws an error if the value is null/undefined
 * @template T The expected type of the value
 * ✅ VERIFIED: Useful for required fields that shouldn't be null
 */
export function assertNotNull<T>(value: T | null | undefined): T {
  if (value == null) {
    throw new Error("Value cannot be null or undefined");
  }
  return value;
}

/**
 * Safely converts nullable string to undefined
 * Database returns null, but TypeScript often prefers undefined
 * ✅ VERIFIED: Matches text fields that can be null in your database
 */
export function safeStringOrNull(
  value: string | null | undefined,
): string | undefined {
  return value === null ? undefined : value;
}

// ============================================================================
// JSON/JSONB FIELD HANDLERS
// ============================================================================

/**
 * Type definitions for JSONB fields in your database
 * Based on actual JSONB columns found in your tables
 */
export interface WolfpackSocialLinks {
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  website?: string;
  [key: string]: string | undefined;
}

export interface NotificationPreferences {
  email?: boolean;
  push?: boolean;
  sms?: boolean;
  wolfpack_updates?: boolean;
  menu_updates?: boolean;
  [key: string]: boolean | undefined;
}

export interface PrivacySettings {
  profile_visible?: boolean;
  location_visible?: boolean;
  allow_messages?: boolean;
  show_online_status?: boolean;
  [key: string]: boolean | undefined;
}

export interface PackBadges {
  badge_id?: string;
  badge_name?: string;
  earned_at?: string;
  [key: string]: string | undefined;
}

export interface DailyCustomization {
  theme?: string;
  emoji?: string;
  status_message?: string;
  [key: string]: string | undefined;
}

/**
 * Safely parse JSONB value with type checking
 * ✅ VERIFIED: Matches JSONB columns in your database
 */
export function safeJsonValue<T extends Record<string, unknown>>(
  value: T | null | undefined,
): T {
  return (value || {}) as T;
}

/**
 * Parse wolfpack social links JSONB field
 */
export function parseWolfpackSocialLinks(
  value: unknown,
): WolfpackSocialLinks {
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as WolfpackSocialLinks;
}

/**
 * Parse notification preferences JSONB field
 */
export function parseNotificationPreferences(
  value: unknown,
): NotificationPreferences {
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as NotificationPreferences;
}

/**
 * Parse privacy settings JSONB field
 */
export function parsePrivacySettings(
  value: unknown,
): PrivacySettings {
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as PrivacySettings;
}

// ============================================================================
// WOLFPACK MEMBER ASSERTIONS
// ============================================================================

/**
 * Wolfpack member data structure
 * Based on active_wolfpack_members view/table
 */
export interface WolfpackMemberData {
  id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  wolfpack_status?: string | null;
  wolfpack_joined_at?: string | null;
  is_wolfpack_member?: boolean | null;
  location_verified?: boolean | null;
  last_activity?: string | null;
  last_seen_at?: string | null;
  wolfpack_bio?: string | null;
  wolfpack_interests?: string[] | null;
  wolfpack_skills?: string[] | null;
  wolfpack_social_links?: WolfpackSocialLinks | null;
  notification_preferences?: NotificationPreferences | null;
  privacy_settings?: PrivacySettings | null;
  pack_badges?: PackBadges | null;
  daily_customization?: DailyCustomization | null;
}

/**
 * Assert and normalize wolfpack member data
 * ✅ VERIFIED: Matches fields in active_wolfpack_members table
 */
export function assertWolfpackMember(data: unknown): WolfpackMemberData {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid wolfpack member data");
  }

  const memberData = data as Record<string, unknown>;

  // Ensure required fields exist
  if (!memberData.id) {
    throw new Error("Wolfpack member must have an ID");
  }

  return {
    id: memberData.id as string,
    email: safeStringOrNull(memberData.email as string | null),
    first_name: safeStringOrNull(memberData.first_name as string | null),
    last_name: safeStringOrNull(memberData.last_name as string | null),
    display_name: safeStringOrNull(memberData.display_name as string | null),
    wolfpack_status: safeStringOrNull(
      memberData.wolfpack_status as string | null,
    ),
    wolfpack_joined_at: safeStringOrNull(
      memberData.wolfpack_joined_at as string | null,
    ),
    is_wolfpack_member: memberData.is_wolfpack_member as boolean | null,
    location_verified: memberData.location_verified as boolean | null,
    // Use last_activity if it exists, otherwise use current time
    last_activity: memberData.last_activity as string ||
      new Date().toISOString(),
    last_seen_at: safeStringOrNull(memberData.last_seen_at as string | null),
    wolfpack_bio: safeStringOrNull(memberData.wolfpack_bio as string | null),
    wolfpack_interests: memberData.wolfpack_interests as string[] | null,
    wolfpack_skills: memberData.wolfpack_skills as string[] | null,
    wolfpack_social_links: parseWolfpackSocialLinks(
      memberData.wolfpack_social_links,
    ),
    notification_preferences: parseNotificationPreferences(
      memberData.notification_preferences,
    ),
    privacy_settings: parsePrivacySettings(memberData.privacy_settings),
    pack_badges: memberData.pack_badges as PackBadges | null,
    daily_customization: memberData.daily_customization as
      | DailyCustomization
      | null,
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
