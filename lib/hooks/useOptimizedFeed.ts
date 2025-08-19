/**
 * WOLFPACK MEMBERSHIP SERVICE
 * Core service for managing Wolfpack membership operations
 *
 * DATABASE STRUCTURE VERIFIED:
 * - users table with wolfpack columns (wolfpack_status, wolfpack_joined_at, etc.)
 * - is_wolfpack_member is a COMPUTED field (true when wolfpack_status = 'active')
 * - join_wolfpack RPC function exists (returns JSON)
 * - locations table with Salem and Portland bars
 * - 5 active members currently in the system
 */

import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Type aliases from database
type Tables = Database["public"]["Tables"];
type UserRow = Tables["users"]["Row"];

// Actual location IDs from your database
export const SIDE_HUSTLE_LOCATIONS = {
  salem: {
    id: "50d17782-3f4a-43a1-b6b6-608171ca3c7c",
    name: "THE SIDEHUSTLE BAR Salem",
    city: "Salem",
    coordinates: {
      latitude: 44.9429,
      longitude: -123.0351,
    },
  },
  portland: {
    id: "ec1e8869-454a-49d2-93e5-ed05f49bb932",
    name: "THE SIDEHUSTLE BAR Portland",
    city: "Portland",
    coordinates: {
      latitude: 45.5152,
      longitude: -122.6784,
    },
  },
} as const;

export type LocationKey = keyof typeof SIDE_HUSTLE_LOCATIONS;

// Membership status interface
export interface MembershipStatus {
  isActive: boolean;
  membershipId: string | null;
  userId: string | null;
  locationId: string | null;
  locationKey: LocationKey | null;
  joinedAt: string | null;
  status: "active" | "inactive" | "pending" | "suspended" | null;
  tier: "basic" | "premium" | "vip" | "permanent" | null;
  error?: string;
}

// Data for joining the pack
export interface JoinPackData {
  display_name?: string;
  wolf_emoji?: string;
  vibe_status?: string;
  favorite_drink?: string;
  looking_for?: string;
  instagram_handle?: string;
  bio?: string;
  latitude?: number;
  longitude?: number;
  table_location?: string;
}

// Result of join operation
export interface JoinResult {
  success: boolean;
  membershipId?: string;
  error?: string;
  data?: MembershipStatus;
}

// Member profile structure
export interface MemberProfile {
  id: string;
  display_name: string | null;
  wolf_emoji: string | null;
  favorite_drink: string | null;
  vibe_status: string | null;
  looking_for: string | null;
  instagram_handle: string | null;
  bio: string | null;
  profile_image_url: string | null;
  is_profile_visible: boolean;
  allow_messages: boolean;
  wolfpack_tier: string | null;
  wolfpack_status: string | null;
}

// RPC function parameters (version 1 - with location data)
interface JoinWolfpackRPCParams {
  p_location_id: string;
  p_latitude?: number;
  p_longitude?: number;
  p_table_location?: string;
}

// RPC function response
interface JoinWolfpackResponse {
  success?: boolean;
  membership_id?: string;
  message?: string;
  error?: string;
}

// Location stats interface
export interface LocationStats {
  totalMembers: number;
  activeMembers: number;
  recentJoins: number;
  onlineNow: number;
}

class WolfpackMembershipService {
  private static instance: WolfpackMembershipService;

  private constructor() {}

  static getInstance(): WolfpackMembershipService {
    if (!WolfpackMembershipService.instance) {
      WolfpackMembershipService.instance = new WolfpackMembershipService();
    }
    return WolfpackMembershipService.instance;
  }

  /**
   * Get location key by location ID
   */
  private getLocationKeyById(locationId: string): LocationKey | null {
    for (const [key, location] of Object.entries(SIDE_HUSTLE_LOCATIONS)) {
      if (location.id === locationId) {
        return key as LocationKey;
      }
    }
    return null;
  }

  /**
   * Verify if user is at a valid location (within radius)
   */
  async verifyUserLocation(
    userLat?: number,
    userLng?: number,
  ): Promise<
    { isAtLocation: boolean; locationId?: string; locationKey?: LocationKey }
  > {
    if (!userLat || !userLng) {
      return { isAtLocation: false };
    }

    // Check each location
    for (const [key, location] of Object.entries(SIDE_HUSTLE_LOCATIONS)) {
      const distance = this.calculateDistance(
        userLat,
        userLng,
        location.coordinates.latitude,
        location.coordinates.longitude,
      );

      // Within 0.25 miles (default radius)
      if (distance <= 0.25) {
        return {
          isAtLocation: true,
          locationId: location.id,
          locationKey: key as LocationKey,
        };
      }
    }

    return { isAtLocation: false };
  }

  /**
   * Calculate distance between two coordinates in miles
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 3959; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check user's current membership status
   */
  async checkMembership(
    userId: string,
    locationId?: string,
  ): Promise<MembershipStatus> {
    try {
      let query = supabase
        .from("users")
        .select(`
          id,
          location_id,
          wolfpack_status,
          wolfpack_joined_at,
          wolfpack_tier,
          created_at
        `)
        .eq("id", userId);

      // Add location filter if provided
      if (locationId) {
        query = query.eq("location_id", locationId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;

      // Check if user has active membership (wolfpack_status = 'active')
      if (!data || data.wolfpack_status !== "active") {
        return {
          isActive: false,
          membershipId: null,
          userId: null,
          locationId: null,
          locationKey: null,
          joinedAt: null,
          status: data?.wolfpack_status as MembershipStatus["status"] || null,
          tier: null,
        };
      }

      const locationKey = data.location_id
        ? this.getLocationKeyById(data.location_id)
        : null;

      return {
        isActive: true,
        membershipId: data.id,
        userId: data.id,
        locationId: data.location_id,
        locationKey,
        joinedAt: data.wolfpack_joined_at || data.created_at,
        status: data.wolfpack_status as MembershipStatus["status"],
        tier: data.wolfpack_tier as MembershipStatus["tier"],
      };
    } catch (error) {
      console.error("Error checking membership:", error);
      return {
        isActive: false,
        membershipId: null,
        userId: null,
        locationId: null,
        locationKey: null,
        joinedAt: null,
        status: null,
        tier: null,
        error: error instanceof Error
          ? error.message
          : "Failed to check membership",
      };
    }
  }

  /**
   * Join wolfpack - main entry point
   */
  async joinPack(
    user: User,
    data: JoinPackData,
    locationId?: string,
  ): Promise<JoinResult> {
    try {
      // Verify user is authenticated
      if (!user.id) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      // Check if user can join (rate limiting)
      const canJoinResult = await this.canUserJoin(user.id);
      if (!canJoinResult.canJoin) {
        return {
          success: false,
          error: canJoinResult.reason || "Cannot join at this time",
        };
      }

      // Determine location
      const targetLocationId = locationId || (
        data.latitude && data.longitude
          ? (await this.verifyUserLocation(data.latitude, data.longitude))
            .locationId
          : SIDE_HUSTLE_LOCATIONS.salem.id
      );

      if (!targetLocationId) {
        return {
          success: false,
          error:
            "Unable to determine location. Please enable location services or specify a location.",
        };
      }

      // Check for existing active membership
      const existingMembership = await this.checkMembership(user.id);
      if (existingMembership.isActive) {
        return {
          success: true,
          membershipId: existingMembership.membershipId!,
          data: existingMembership,
        };
      }

      // Call RPC function to join
      const rpcParams: JoinWolfpackRPCParams = {
        p_location_id: targetLocationId,
        p_latitude: data.latitude,
        p_longitude: data.longitude,
        p_table_location: data.table_location,
      };

      const { data: rpcResult, error: rpcError } = await supabase
        .rpc("join_wolfpack", rpcParams);

      if (rpcError) {
        console.error("RPC error:", rpcError);
        throw rpcError;
      }

      // Parse RPC response
      const response = rpcResult as JoinWolfpackResponse;
      if (response && !response.success) {
        throw new Error(
          response.error || response.message || "Failed to join wolfpack",
        );
      }

      // Update member profile with additional data
      if (
        data.display_name || data.wolf_emoji || data.vibe_status ||
        data.favorite_drink || data.looking_for || data.instagram_handle ||
        data.bio
      ) {
        await this.updateMemberProfile(user.id, {
          display_name: data.display_name || null,
          wolf_emoji: data.wolf_emoji || null,
          vibe_status: data.vibe_status || null,
          favorite_drink: data.favorite_drink || null,
          looking_for: data.looking_for || null,
          instagram_handle: data.instagram_handle || null,
          bio: data.bio || null,
          profile_image_url: null,
          is_profile_visible: true,
          allow_messages: true,
          wolfpack_tier: null,
          wolfpack_status: "active",
        });
      }

      // Get the updated membership status
      const newMembership = await this.checkMembership(user.id);

      return {
        success: true,
        membershipId: response?.membership_id || newMembership.membershipId ||
          user.id,
        data: newMembership,
      };
    } catch (error) {
      console.error("Error joining wolfpack:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to join pack",
      };
    }
  }

  /**
   * Leave wolfpack
   */
  async leavePack(userId: string): Promise<boolean> {
    try {
      // Update wolfpack_status to 'inactive' (is_wolfpack_member will automatically become false)
      const { error } = await supabase
        .from("users")
        .update({
          wolfpack_status: "inactive",
          last_activity: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error leaving wolfpack:", error);
      return false;
    }
  }

  /**
   * Update member profile
   */
  async updateMemberProfile(
    userId: string,
    profileData: Partial<MemberProfile>,
  ): Promise<boolean> {
    try {
      // Build update object with only defined non-null values
      const updateData: Record<string, unknown> = {
        last_activity: new Date().toISOString(),
      };

      // Only update fields that are provided
      if (profileData.display_name !== undefined) {
        updateData.display_name = profileData.display_name;
      }
      if (profileData.wolf_emoji !== undefined) {
        updateData.wolf_emoji = profileData.wolf_emoji;
      }
      if (profileData.vibe_status !== undefined) {
        updateData.vibe_status = profileData.vibe_status;
      }
      if (profileData.favorite_drink !== undefined) {
        updateData.favorite_drink = profileData.favorite_drink;
      }
      if (profileData.looking_for !== undefined) {
        updateData.looking_for = profileData.looking_for;
      }
      if (profileData.instagram_handle !== undefined) {
        updateData.instagram_handle = profileData.instagram_handle;
      }
      if (profileData.bio !== undefined) updateData.bio = profileData.bio;
      if (profileData.profile_image_url !== undefined) {
        updateData.profile_image_url = profileData.profile_image_url;
      }
      if (profileData.is_profile_visible !== undefined) {
        updateData.is_profile_visible = profileData.is_profile_visible;
      }
      if (profileData.allow_messages !== undefined) {
        updateData.allow_messages = profileData.allow_messages;
      }

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  }

  /**
   * Get member profile
   */
  async getMemberProfile(userId: string): Promise<MemberProfile | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(`
          id,
          display_name,
          wolf_emoji,
          favorite_drink,
          vibe_status,
          looking_for,
          instagram_handle,
          bio,
          profile_image_url,
          is_profile_visible,
          allow_messages,
          wolfpack_tier,
          wolfpack_status
        `)
        .eq("id", userId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        display_name: data.display_name,
        wolf_emoji: data.wolf_emoji,
        favorite_drink: data.favorite_drink,
        vibe_status: data.vibe_status,
        looking_for: data.looking_for,
        instagram_handle: data.instagram_handle,
        bio: data.bio,
        profile_image_url: data.profile_image_url,
        is_profile_visible: data.is_profile_visible ?? true,
        allow_messages: data.allow_messages ?? true,
        wolfpack_tier: data.wolfpack_tier,
        wolfpack_status: data.wolfpack_status,
      };
    } catch (error) {
      console.error("Error fetching member profile:", error);
      return null;
    }
  }

  /**
   * Get all active members at a location
   */
  async getLocationMembers(
    locationId: string,
    includeOffline = false,
  ): Promise<Partial<UserRow>[]> {
    try {
      let query = supabase
        .from("users")
        .select(`
          id,
          display_name,
          wolf_emoji,
          vibe_status,
          favorite_drink,
          looking_for,
          instagram_handle,
          profile_image_url,
          wolfpack_joined_at,
          wolfpack_status,
          wolfpack_tier,
          is_online,
          last_seen_at
        `)
        .eq("location_id", locationId)
        .eq("wolfpack_status", "active")
        .order("wolfpack_joined_at", { ascending: false });

      // Filter online only if requested
      if (!includeOffline) {
        query = query.eq("is_online", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching location members:", error);
      return [];
    }
  }

  /**
   * Check if user can join wolfpack
   */
  async canUserJoin(
    userId: string,
  ): Promise<{ canJoin: boolean; reason?: string }> {
    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("last_activity, wolfpack_joined_at, wolfpack_status")
        .eq("id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      // Check if already active
      if (userData?.wolfpack_status === "active") {
        return {
          canJoin: false,
          reason: "You are already an active member of the Wolf Pack",
        };
      }

      // Check if suspended
      if (userData?.wolfpack_status === "suspended") {
        return {
          canJoin: false,
          reason: "Your membership has been suspended. Please contact support.",
        };
      }

      // Rate limiting: prevent rejoining within 5 minutes
      if (userData?.last_activity) {
        const lastActivity = new Date(userData.last_activity);
        const now = new Date();
        const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) /
          (1000 * 60);

        if (minutesSinceActivity < 5) {
          const waitTime = Math.ceil(5 - minutesSinceActivity);
          return {
            canJoin: false,
            reason: `Please wait ${waitTime} more minute${
              waitTime > 1 ? "s" : ""
            } before rejoining`,
          };
        }
      }

      return { canJoin: true };
    } catch (error) {
      console.error("Error checking join eligibility:", error);
      // Default to allowing join on error
      return { canJoin: true };
    }
  }

  /**
   * Get membership statistics for a location
   */
  async getLocationStats(locationId: string): Promise<LocationStats> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, wolfpack_joined_at, wolfpack_status, is_online")
        .eq("location_id", locationId);

      if (error) throw error;

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const stats: LocationStats = {
        totalMembers: data?.length || 0,
        activeMembers: data?.filter((m) =>
          m.wolfpack_status === "active"
        ).length || 0,
        recentJoins: data?.filter((m) => {
          if (!m.wolfpack_joined_at) return false;
          const joinedAt = new Date(m.wolfpack_joined_at);
          return joinedAt > oneDayAgo;
        }).length || 0,
        onlineNow: data?.filter((m) => m.is_online === true).length || 0,
      };

      return stats;
    } catch (error) {
      console.error("Error fetching location stats:", error);
      return {
        totalMembers: 0,
        activeMembers: 0,
        recentJoins: 0,
        onlineNow: 0,
      };
    }
  }

  /**
   * Search for members by name or username
   */
  async searchMembers(
    searchTerm: string,
    locationId?: string,
  ): Promise<Partial<UserRow>[]> {
    try {
      let query = supabase
        .from("users")
        .select(`
          id,
          display_name,
          username,
          wolf_emoji,
          profile_image_url,
          wolfpack_status,
          is_online
        `)
        .eq("wolfpack_status", "active")
        .or(`display_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
        .limit(20);

      if (locationId) {
        query = query.eq("location_id", locationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error searching members:", error);
      return [];
    }
  }
}

// Export singleton instance
export const wolfpackMembershipService = WolfpackMembershipService
  .getInstance();
