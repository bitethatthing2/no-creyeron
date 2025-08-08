/**
 * Supabase Query Helpers
 * 
 * This file contains utility functions to handle common Supabase query patterns,
 * particularly for dealing with NULL location filters that can cause PostgREST errors.
 */

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
export function applyLocationFilter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any, 
  locationId: string | null | undefined
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if (locationId === null || locationId === undefined) {
    return query.is('location_id', null);
  } else if (locationId === 'null' || locationId === '') {
    // Handle string "null" that might come from URL params or localStorage
    return query.is('location_id', null);
  } else {
    // Validate UUID format before querying
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (locationId && !uuidRegex.test(locationId)) {
      console.warn('Invalid UUID format for locationId:', locationId);
      return query.is('location_id', null);
    }
    return query.eq('location_id', locationId);
  }
}

/**
 * Sanitize location ID values that might come from various sources
 * 
 * @param locationId - The raw location ID value
 * @returns Sanitized location ID (null if invalid)
 */
export function sanitizeLocationId(locationId: string | null | undefined): string | null {
  if (locationId === null || locationId === undefined) {
    return null;
  }
  
  if (locationId === 'null' || locationId === '' || locationId === 'undefined') {
    return null;
  }
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(locationId)) {
    console.warn('Invalid UUID format for locationId:', locationId);
    return null;
  }
  
  return locationId;
}

/**
 * Helper function to load wolfpack members with proper location filtering
 * 
 * @param supabase - Supabase client
 * @param locationId - Location ID to filter by
 * @param includeProfiles - Whether to include wolf_profiles relation
 * @returns Promise with member data
 */
export async function loadWolfpackMembers(
  supabase: ReturnType<typeof import('@/lib/supabase/client').getSupabaseBrowserClient>,
  locationId: string | null | undefined,
  includeProfiles: boolean = true
) {
  console.log('Loading wolfpack members for location:', locationId);
  
  const sanitizedLocationId = sanitizeLocationId(locationId);
  
  // Build base query - wolfpack membership is now tracked in users table
  let query = supabase
    .from("users")
    .select('*')
    .eq('is_wolfpack_member', true)
    .eq('wolfpack_status', 'active');

  // Apply location filter correctly
  query = applyLocationFilter(query, sanitizedLocationId);

  // Order by join date
  query = query.order('wolfpack_joined_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error loading wolfpack members:', error);
    
    // If there's a relationship error, try without profiles
    if (error.code === 'PGRST200' && includeProfiles) {
      console.log('Retrying without wolf_profiles relation...');
      return loadWolfpackMembers(supabase, locationId, false);
    }
    
    return { data: null, error };
  }

  // Transform data - users table directly contains wolfpack member info
  if (data) {
    const transformedData = data.map((user: Record<string, unknown>) => ({
      id: user.id,
      user_id: user.id,
      location_id: user.location_id,
      status: user.wolfpack_status,
      tier: user.wolfpack_tier,
      joined_at: user.wolfpack_joined_at,
      user: {
        ...user,
        wolf_profile: {
          display_name: user.display_name || 'Anonymous Wolf',
          wolf_emoji: user.wolf_emoji || '🐺',
          wolfpack_status: user.wolfpack_status || 'Just joined',
          favorite_drink: user.favorite_drink || null,
          instagram_handle: user.instagram_handle || null,
          looking_for: user.looking_for || null,
          bio: user.bio || null,
          is_profile_visible: user.is_profile_visible ?? true,
          profile_image_url: user.profile_image_url || null,
          allow_messages: user.allow_messages ?? true
        }
      }
    }));
    
    return { data: transformedData, error: null };
  }

  return { data, error };
}

/**
 * Helper function to count wolfpack members with proper location filtering
 * 
 * @param supabase - Supabase client
 * @param locationId - Location ID to filter by
 * @param activeOnly - Whether to count only active members
 * @returns Promise with count
 */
export async function countWolfpackMembers(
  supabase: ReturnType<typeof import('@/lib/supabase/client').getSupabaseBrowserClient>,
  locationId: string | null | undefined,
  activeOnly: boolean = false
) {
  const sanitizedLocationId = sanitizeLocationId(locationId);
  
  let query = supabase
    .from("users")
    .select('id', { count: 'exact', head: true })
    .eq('is_wolfpack_member', true);

  if (activeOnly) {
    query = query.eq('wolfpack_status', 'active');
  }

  // Apply location filter correctly
  query = applyLocationFilter(query, sanitizedLocationId);

  const { count, error } = await query;

  if (error) {
    console.error('Error counting wolfpack members:', error);
    return { count: 0, error };
  }

  return { count: count || 0, error: null };
}

/**
 * Debug helper to log query parameters for troubleshooting
 * 
 * @param functionName - Name of the calling function
 * @param locationId - Location ID being used
 */
export function debugLocationQuery(functionName: string, locationId: string | null | undefined) {
  const sanitized = sanitizeLocationId(locationId);
  
  console.log(`🔍 DEBUG ${functionName}:`);
  console.log('  Original locationId:', locationId);
  console.log('  Sanitized locationId:', sanitized);
  console.log('  Type check:', typeof locationId);
  console.log('  Is null?', locationId === null);
  console.log('  Is undefined?', locationId === undefined);
  console.log('  Is "null" string?', locationId === 'null');
  console.log('  Query strategy:', sanitized === null ? 'Using .is("location_id", null)' : `Using .eq("location_id", "${sanitized}")`);
}

export default {
  applyLocationFilter,
  sanitizeLocationId,
  loadWolfpackMembers,
  countWolfpackMembers,
  debugLocationQuery
};
