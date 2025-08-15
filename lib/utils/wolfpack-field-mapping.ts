// Auto-generated wolfpack type mappings
// Maps database fields to component interface fields

import type { Database } from "@/types/supabase"; // Import your generated types

// Type for the users table row
type UserRow = Database["public"]["Tables"]["users"]["Row"];

// Interface for wolfpack member data used in components
export interface WolfpackMemberInterface {
  id: string;
  display_name: string | null;
  wolf_emoji: string | null;
  vibe_status: string | null;
  bio: string | null;
  is_profile_visible: boolean;
  allow_messages: boolean;
  location_permissions_granted: boolean;
  last_active: string | null;
  avatar_url: string | null;
  instagram_handle: string | null;
  looking_for: string | null;
  favorite_drink: string | null;
  location_id: string | null;
  status: string | null;
  joined_at: string | null;
}

export const WOLFPACK_FIELD_MAPPING = {
  // Actual database field mappings from the users table
  database: {
    // These fields exist directly in the users table
    emoji: "wolf_emoji",
    current_vibe: "vibe_status",
    last_active: "last_seen_at",
    bio: "bio",
    is_profile_visible: "is_profile_visible",
    allow_messages: "allow_messages",
    phone: "phone",
  },

  // Fields that are computed or have different names
  computed_fields: {
    is_wolfpack_member: 'Generated from wolfpack_status = "active"',
    online_status: "Based on is_online && last_activity > 30 minutes ago",
  },
};

/**
 * Transform database row to component interface
 * @param dbRow - Row from the users table
 * @returns Transformed data for components
 */
export function transformDatabaseToInterface(
  dbRow: Partial<UserRow>,
): WolfpackMemberInterface {
  return {
    id: dbRow.id || "",
    display_name: dbRow.display_name || null,
    wolf_emoji: dbRow.wolf_emoji || "🐺",
    vibe_status: dbRow.vibe_status || null,
    bio: dbRow.bio || null,
    is_profile_visible: dbRow.is_profile_visible ?? true,
    allow_messages: dbRow.allow_messages ?? true,
    location_permissions_granted: dbRow.location_permissions_granted ?? false,
    last_active: dbRow.last_seen_at || null,
    avatar_url: dbRow.avatar_url || "/icons/wolf-icon.png",
    instagram_handle: dbRow.instagram_handle || null,
    looking_for: dbRow.looking_for || null,
    favorite_drink: dbRow.favorite_drink || null,
    location_id: dbRow.location_id || null,
    status: dbRow.wolfpack_status || null,
    joined_at: dbRow.wolfpack_joined_at || null,
  };
}

/**
 * Transform component interface back to database format
 * @param interfaceData - Data from component
 * @returns Data ready for database update
 */
export function transformInterfaceToDatabase(
  interfaceData: Partial<WolfpackMemberInterface>,
): Partial<UserRow> {
  const dbData: Partial<UserRow> = {};

  if (interfaceData.id !== undefined) dbData.id = interfaceData.id;
  if (interfaceData.display_name !== undefined) {
    dbData.display_name = interfaceData.display_name;
  }
  if (interfaceData.wolf_emoji !== undefined) {
    dbData.wolf_emoji = interfaceData.wolf_emoji;
  }
  if (interfaceData.vibe_status !== undefined) {
    dbData.vibe_status = interfaceData.vibe_status;
  }
  if (interfaceData.bio !== undefined) dbData.bio = interfaceData.bio;
  if (interfaceData.is_profile_visible !== undefined) {
    dbData.is_profile_visible = interfaceData.is_profile_visible;
  }
  if (interfaceData.allow_messages !== undefined) {
    dbData.allow_messages = interfaceData.allow_messages;
  }
  if (interfaceData.location_permissions_granted !== undefined) {
    dbData.location_permissions_granted =
      interfaceData.location_permissions_granted;
  }
  if (interfaceData.last_active !== undefined) {
    dbData.last_seen_at = interfaceData.last_active;
  }
  if (interfaceData.avatar_url !== undefined) {
    dbData.avatar_url = interfaceData.avatar_url;
  }
  if (interfaceData.instagram_handle !== undefined) {
    dbData.instagram_handle = interfaceData.instagram_handle;
  }
  if (interfaceData.looking_for !== undefined) {
    dbData.looking_for = interfaceData.looking_for;
  }
  if (interfaceData.favorite_drink !== undefined) {
    dbData.favorite_drink = interfaceData.favorite_drink;
  }
  if (interfaceData.location_id !== undefined) {
    dbData.location_id = interfaceData.location_id;
  }
  if (interfaceData.status !== undefined) {
    dbData.wolfpack_status = interfaceData.status;
  }
  if (interfaceData.joined_at !== undefined) {
    dbData.wolfpack_joined_at = interfaceData.joined_at;
  }

  return dbData;
}

/**
 * Get wolfpack member data from users table
 * @param supabase - Supabase client
 * @param userId - User ID to fetch
 * @returns Transformed wolfpack member data
 */
export async function getWolfpackMember(
  supabase: ReturnType<typeof import("@/lib/supabase").createClient>,
  userId: string,
): Promise<WolfpackMemberInterface | null> {
  const { data, error } = await supabase
    .from("users")
    .select(`
      id,
      display_name,
      wolf_emoji,
      vibe_status,
      bio,
      is_profile_visible,
      allow_messages,
      location_permissions_granted,
      last_seen_at,
      avatar_url,
      instagram_handle,
      looking_for,
      favorite_drink,
      location_id,
      wolfpack_status,
      wolfpack_joined_at
    `)
    .eq("id", userId)
    .eq("wolfpack_status", "active")
    .single();

  if (error || !data) {
    console.error("Error fetching wolfpack member:", error);
    return null;
  }

  return transformDatabaseToInterface(data);
}
