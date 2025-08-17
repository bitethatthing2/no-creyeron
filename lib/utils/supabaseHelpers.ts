/**
 * Supabase Query Helpers
 *
 * Utility functions to handle common Supabase query patterns,
 * particularly for dealing with NULL location filters that can cause PostgREST errors.
 * ✅ VERIFIED: All fields match your database schema
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";

// ============================================================================
// TYPE DEFINITIONS - FROM YOUR ACTUAL DATABASE
// ============================================================================

/**
 * Database user type for wolfpack members
 * ✅ VERIFIED: These are the ACTUAL columns from your users table
 */
interface DatabaseWolfpackUser {
  id: string;
  location_id: string | null;
  is_wolfpack_member: boolean | null; // This is a computed column
  wolfpack_status: string | null;
  wolfpack_tier: string | null;
  wolfpack_joined_at: string | null;
  display_name: string | null;
  wolf_emoji: string | null;
  bio: string | null;
  favorite_drink: string | null;
  instagram_handle: string | null;
  looking_for: string | null;
  is_profile_visible: boolean | null;
  profile_image_url: string | null;
  allow_messages: boolean | null;
}

/**
 * Transformed wolfpack member data for UI
 */
export interface WolfpackMemberData {
  id: string;
  user_id: string;
  location_id: string | null;
  status: string | null;
  tier: string | null;
  joined_at: string | null;
  user: DatabaseWolfpackUser & {
    wolf_profile: {
      display_name: string;
      wolf_emoji: string;
      wolfpack_status: string;
      favorite_drink: string | null;
      instagram_handle: string | null;
      looking_for: string | null;
      bio: string | null;
      is_profile_visible: boolean;
      profile_image_url: string | null;
      allow_messages: boolean;
    };
  };
}

/**
 * Query result type
 */
export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Count result type
 */
export interface CountResult {
  count: number;
  error: Error | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * UUID validation regex
 * ✅ VERIFIED: Matches UUID format used in your database
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ============================================================================
// LOCATION FILTER UTILITIES
// ============================================================================

/**
 * Apply location filter to a Supabase query, handling NULL values correctly
 *
 * PostgREST requires different operators for NULL checks:
 * - .eq('column', value) for equality checks with non-null values
 * - .is('column', null) for NULL checks
 *
 * @param query - The Supabase query builder
 * @param locationId - The location ID to filter by (can be null/undefined)
 * @returns The query with location filter applied
 */
export function applyLocationFilter<T extends Record<string, unknown>>(
  query: PostgrestFilterBuilder<unknown, T, T[]>,
  locationId: string | null | undefined,
): PostgrestFilterBuilder<unknown, T, T[]> {
  if (locationId === null || locationId === undefined) {
    return query.is("location_id", null);
  }

  if (locationId === "null" || locationId === "") {
    // Handle string "null" that might come from URL params or localStorage
    return query.is("location_id", null);
  }

  // Validate UUID format before querying
  if (!UUID_REGEX.test(locationId)) {
    console.warn("Invalid UUID format for locationId:", locationId);
    return query.is("location_id", null);
  }

  return query.eq("location_id", locationId);
}

/**
 * Sanitize location ID values that might come from various sources
 *
 * @param locationId - The raw location ID value
 * @returns Sanitized location ID (null if invalid)
 */
export function sanitizeLocationId(
  locationId: string | null | undefined,
): string | null {
  if (locationId === null || locationId === undefined) {
    return null;
  }

  if (
    locationId === "null" || locationId === "" || locationId === "undefined"
  ) {
    return null;
  }

  // Validate UUID format
  if (!UUID_REGEX.test(locationId)) {
    console.warn("Invalid UUID format for locationId:", locationId);
    return null;
  }

  return locationId;
}

// ============================================================================
// WOLFPACK MEMBER QUERIES
// ============================================================================

/**
 * Helper function to load wolfpack members with proper location filtering
 * ✅ VERIFIED: Queries users table with correct wolfpack fields
 *
 * @param supabase - Supabase client
 * @param locationId - Location ID to filter by
 * @param includeProfiles - Whether to include wolf_profiles relation (deprecated)
 * @returns Promise with member data
 */
export async function loadWolfpackMembers(
  supabase: SupabaseClient,
  locationId: string | null | undefined,
  // includeProfiles: boolean = true,
): Promise<QueryResult<WolfpackMemberData[]>> {
  console.log("Loading wolfpack members for location:", locationId);

  const sanitizedLocationId = sanitizeLocationId(locationId);

  try {
    // Build base query - wolfpack membership is now tracked in users table
    let query = supabase
      .from("users")
      .select(`
        id,
        location_id,
        is_wolfpack_member,
        wolfpack_status,
        wolfpack_tier,
        wolfpack_joined_at,
        display_name,
        wolf_emoji,
        bio,
        favorite_drink,
        instagram_handle,
        looking_for,
        is_profile_visible,
        profile_image_url,
        allow_messages
      `)
      .eq("is_wolfpack_member", true)
      .eq("wolfpack_status", "active");

    // Apply location filter correctly
    query = applyLocationFilter(query, sanitizedLocationId);

    // Order by join date
    query = query.order("wolfpack_joined_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error loading wolfpack members:", error);
      return { data: null, error: error as Error };
    }

    // Transform data to match expected interface
    if (data) {
      const transformedData: WolfpackMemberData[] =
        (data as DatabaseWolfpackUser[]).map((user) => ({
          id: user.id,
          user_id: user.id,
          location_id: user.location_id,
          status: user.wolfpack_status,
          tier: user.wolfpack_tier,
          joined_at: user.wolfpack_joined_at,
          user: {
            ...user,
            wolf_profile: {
              display_name: user.display_name || "Anonymous Wolf",
              wolf_emoji: user.wolf_emoji || "🐺",
              wolfpack_status: user.wolfpack_status || "Just joined",
              favorite_drink: user.favorite_drink,
              instagram_handle: user.instagram_handle,
              looking_for: user.looking_for,
              bio: user.bio,
              is_profile_visible: user.is_profile_visible ?? true,
              profile_image_url: user.profile_image_url,
              allow_messages: user.allow_messages ?? true,
            },
          },
        }));

      return { data: transformedData, error: null };
    }

    return { data: null, error: null };
  } catch (error) {
    console.error("Exception in loadWolfpackMembers:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Helper function to count wolfpack members with proper location filtering
 * ✅ VERIFIED: Correctly counts from users table
 *
 * @param supabase - Supabase client
 * @param locationId - Location ID to filter by
 * @param activeOnly - Whether to count only active members
 * @returns Promise with count
 */
export async function countWolfpackMembers(
  supabase: SupabaseClient,
  locationId: string | null | undefined,
  activeOnly: boolean = false,
): Promise<CountResult> {
  const sanitizedLocationId = sanitizeLocationId(locationId);

  try {
    let query = supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("is_wolfpack_member", true);

    if (activeOnly) {
      query = query.eq("wolfpack_status", "active");
    }

    // Apply location filter correctly
    query = applyLocationFilter(query, sanitizedLocationId);

    const { count, error } = await query;

    if (error) {
      console.error("Error counting wolfpack members:", error);
      return { count: 0, error: error as Error };
    }

    return { count: count || 0, error: null };
  } catch (error) {
    console.error("Exception in countWolfpackMembers:", error);
    return {
      count: 0,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

/**
 * Debug helper to log query parameters for troubleshooting
 *
 * @param functionName - Name of the calling function
 * @param locationId - Location ID being used
 */
export function debugLocationQuery(
  functionName: string,
  locationId: string | null | undefined,
): void {
  const sanitized = sanitizeLocationId(locationId);

  console.log(`🔍 DEBUG ${functionName}:`);
  console.log("  Original locationId:", locationId);
  console.log("  Sanitized locationId:", sanitized);
  console.log("  Type check:", typeof locationId);
  console.log("  Is null?", locationId === null);
  console.log("  Is undefined?", locationId === undefined);
  console.log('  Is "null" string?', locationId === "null");
  console.log(
    "  Query strategy:",
    sanitized === null
      ? 'Using .is("location_id", null)'
      : `Using .eq("location_id", "${sanitized}")`,
  );
}

// ============================================================================
// ADDITIONAL QUERY HELPERS
// ============================================================================

/**
 * Check if a value is a valid UUID
 */
export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Build a query for active wolfpack members
 */
export function buildActiveWolfpackQuery(
  supabase: SupabaseClient,
  locationId?: string | null,
) {
  let query = supabase
    .from("users")
    .select("*")
    .eq("is_wolfpack_member", true)
    .eq("wolfpack_status", "active");

  if (locationId !== undefined) {
    query = applyLocationFilter(query, locationId);
  }

  return query.order("wolfpack_joined_at", { ascending: false });
}

/**
 * Get wolfpack member by user ID
 */
export async function getWolfpackMemberById(
  supabase: SupabaseClient,
  userId: string,
): Promise<QueryResult<WolfpackMemberData>> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        location_id,
        is_wolfpack_member,
        wolfpack_status,
        wolfpack_tier,
        wolfpack_joined_at,
        display_name,
        wolf_emoji,
        bio,
        favorite_drink,
        instagram_handle,
        looking_for,
        is_profile_visible,
        profile_image_url,
        allow_messages
      `)
      .eq("id", userId)
      .eq("is_wolfpack_member", true)
      .single();

    if (error) {
      console.error("Error getting wolfpack member:", error);
      return { data: null, error: error as Error };
    }

    if (data) {
      const user = data as DatabaseWolfpackUser;
      const transformedData: WolfpackMemberData = {
        id: user.id,
        user_id: user.id,
        location_id: user.location_id,
        status: user.wolfpack_status,
        tier: user.wolfpack_tier,
        joined_at: user.wolfpack_joined_at,
        user: {
          ...user,
          wolf_profile: {
            display_name: user.display_name || "Anonymous Wolf",
            wolf_emoji: user.wolf_emoji || "🐺",
            wolfpack_status: user.wolfpack_status || "Just joined",
            favorite_drink: user.favorite_drink,
            instagram_handle: user.instagram_handle,
            looking_for: user.looking_for,
            bio: user.bio,
            is_profile_visible: user.is_profile_visible ?? true,
            profile_image_url: user.profile_image_url,
            allow_messages: user.allow_messages ?? true,
          },
        },
      };

      return { data: transformedData, error: null };
    }

    return { data: null, error: null };
  } catch (error) {
    console.error("Exception in getWolfpackMemberById:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// ============================================================================
// MODULE EXPORT
// ============================================================================

/**
 * Supabase query helpers module
 * Centralized export of all query utilities
 */
const supabaseHelpers = {
  // Location utilities
  applyLocationFilter,
  sanitizeLocationId,
  isValidUUID,

  // Wolfpack queries
  loadWolfpackMembers,
  countWolfpackMembers,
  buildActiveWolfpackQuery,
  getWolfpackMemberById,

  // Debug utilities
  debugLocationQuery,
};

export default supabaseHelpers;
