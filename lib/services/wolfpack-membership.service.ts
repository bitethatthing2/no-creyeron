/**
 * WOLFPACK MEMBERSHIP SERVICE
 * Handles Wolfpack membership operations including joining, leaving, and profile management
 *
 * VERIFIED DATABASE STRUCTURE:
 * - users table has all wolfpack columns (wolfpack_status, wolfpack_joined_at, is_wolfpack_member, etc.)
 * - join_wolfpack RPC function exists
 * - locations table exists with Salem and Portland locations
 */

import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Type aliases from database
type Tables = Database["public"]["Tables"];
type UserRow = Tables["users"]["Row"];

// Location configuration based on actual database
export const SIDE_HUSTLE_LOCATIONS = {
  salem: {
    id: "50d17782-3f4a-43a1-b6b6-608171ca3c7c",
    name: "THE SIDEHUSTLE BAR Salem",
    city: "Salem",
  },
  portland: {
    id: "ec1e8869-454a-49d2-93e5-ed05f49bb932",
    name: "THE SIDEHUSTLE BAR Portland",
    city: "Portland",
  },
} as const;

export type LocationKey = keyof typeof SIDE_HUSTLE_LOCATIONS;

export interface MembershipStatus {
  isActive: boolean;
  membershipId: string | null;
  locationId: string | null;
  locationKey: LocationKey | null;
  joinedAt: string | null;
  tableLocation: string | null;
  status: "active" | "inactive" | "pending" | "suspended" | null;
  tier: "basic" | "premium" | "vip" | "permanent" | null;
  error?: string;
}

export interface JoinPackData {
  display_name?: string;
  wolf_emoji?: string;
  vibe_status?: string;
  favorite_drink?: string;
  looking_for?: string;
  instagram_handle?: string;
  table_location?: string;
  latitude?: number;
  longitude?: number;
}

export interface JoinResult {
  success: boolean;
  membershipId?: string;
  error?: string;
  data?: MembershipStatus;
}

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
  is_profile_visible: boolean | null;
  allow_messages: boolean | null;
}

// RPC function parameter interface
interface JoinWolfpackParams {
  p_location_id: string;
  p_latitude?: number;
  p_longitude?: number;
  p_table_location?: string;
}

class WolfpackMembershipService {
  private static instance: WolfpackMembershipService;

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
          created_at,
          is_wolfpack_member
        `)
        .eq("id", userId);

      // Add location filter if provided
      if (locationId) {
        query = query.eq("location_id", locationId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;

      if (!data || !data.is_wolfpack_member) {
        return {
          isActive: false,
          membershipId: null,
          locationId: null,
          locationKey: null,
          joinedAt: null,
          tableLocation: null,
          status: null,
          tier: null,
        };
      }

      const locationKey = data.location_id
        ? this.getLocationKeyById(data.location_id)
        : null;

      // Map wolfpack_status to our status type
      let status: MembershipStatus["status"] = null;
      if (data.wolfpack_status === "active") status = "active";
      else if (data.wolfpack_status === "inactive") status = "inactive";
      else if (data.wolfpack_status === "pending") status = "pending";
      else if (data.wolfpack_status === "suspended") status = "suspended";

      // Map wolfpack_tier to our tier type
      let tier: MembershipStatus["tier"] = null;
      if (data.wolfpack_tier === "basic") tier = "basic";
      else if (data.wolfpack_tier === "premium") tier = "premium";
      else if (data.wolfpack_tier === "vip") tier = "vip";
      else if (data.wolfpack_tier === "permanent") tier = "permanent";

      return {
        isActive: data.wolfpack_status === "active",
        membershipId: data.id,
        locationId: data.location_id,
        locationKey,
        joinedAt: data.wolfpack_joined_at || data.created_at,
        tableLocation: null,
        status,
        tier,
      };
    } catch (error) {
      console.error("Error checking membership:", error);
      return {
        isActive: false,
        membershipId: null,
        locationId: null,
        locationKey: null,
        joinedAt: null,
        tableLocation: null,
        status: null,
        tier: null,
        error: error instanceof Error
          ? error.message
          : "Failed to check membership",
      };
    }
  }

  /**
   * Join wolfpack with comprehensive error handling
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

      // Determine location if not provided
      const targetLocationId = locationId || SIDE_HUSTLE_LOCATIONS.salem.id;

      // Check for existing active membership
      const existingMembership = await this.checkMembership(
        user.id,
        targetLocationId,
      );
      if (existingMembership.isActive && existingMembership.membershipId) {
        return {
          success: true,
          membershipId: existingMembership.membershipId,
          data: existingMembership,
        };
      }

      // Prepare RPC parameters
      const rpcParams: JoinWolfpackParams = {
        p_location_id: targetLocationId,
        p_latitude: data.latitude,
        p_longitude: data.longitude,
        p_table_location: data.table_location,
      };

      // Use RPC function for joining
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc("join_wolfpack", rpcParams);

      if (rpcError) throw rpcError;

      // Check if RPC returned an error result
      if (
        rpcResult && typeof rpcResult === "object" && "success" in rpcResult &&
        !rpcResult.success
      ) {
        const errorMessage = "error" in rpcResult
          ? String(rpcResult.error)
          : "Failed to join wolfpack";
        throw new Error(errorMessage);
      }

      // Update member profile with additional data if provided
      if (Object.keys(data).length > 0) {
        await this.updateMemberProfile(user.id, {
          display_name: data.display_name || null,
          wolf_emoji: data.wolf_emoji || null,
          vibe_status: data.vibe_status || null,
          favorite_drink: data.favorite_drink || null,
          looking_for: data.looking_for || null,
          instagram_handle: data.instagram_handle || null,
        });
      }

      // Get the new membership
      const newMembership = await this.checkMembership(
        user.id,
        targetLocationId,
      );

      if (!newMembership.membershipId) {
        return {
          success: false,
          error: "Failed to create membership",
        };
      }

      return {
        success: true,
        membershipId: newMembership.membershipId,
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
      const { error } = await supabase
        .from("users")
        .update({
          wolfpack_status: "inactive",
          is_wolfpack_member: false,
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
   * Update member profile information
   */
  async updateMemberProfile(
    userId: string,
    profileData: Partial<MemberProfile>,
  ): Promise<boolean> {
    try {
      // Build update object with only defined values
      const updateData: Record<string, string | boolean | null> = {
        last_activity: new Date().toISOString(),
      };

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
        .eq("id", userId)
        .eq("is_wolfpack_member", true);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  }

  /**
   * Get member profile by user ID
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
          allow_messages
        `)
        .eq("id", userId)
        .eq("is_wolfpack_member", true)
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
        is_profile_visible: data.is_profile_visible,
        allow_messages: data.allow_messages,
      };
    } catch (error) {
      console.error("Error fetching member profile:", error);
      return null;
    }
  }

  /**
   * Get all active members at a location
   */
  async getLocationMembers(locationId: string): Promise<Partial<UserRow>[]> {
    try {
      const { data, error } = await supabase
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
          wolfpack_tier
        `)
        .eq("location_id", locationId)
        .eq("is_wolfpack_member", true)
        .eq("wolfpack_status", "active")
        .order("wolfpack_joined_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching location members:", error);
      return [];
    }
  }

  /**
   * Check if user can join wolfpack (rate limiting, restrictions, etc.)
   */
  async canUserJoin(
    userId: string,
  ): Promise<{ canJoin: boolean; reason?: string }> {
    try {
      // Check for recent membership activity
      const { data: userData, error } = await supabase
        .from("users")
        .select("last_activity, wolfpack_joined_at, wolfpack_status")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      // Check if already active
      if (userData?.wolfpack_status === "active") {
        return {
          canJoin: false,
          reason: "You are already an active member of the pack",
        };
      }

      // Check if user has recent activity (rate limiting)
      if (userData?.last_activity) {
        const lastActivity = new Date(userData.last_activity);
        const now = new Date();
        const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) /
          (1000 * 60);

        // Rate limit: prevent rejoining within 5 minutes
        if (minutesSinceActivity < 5) {
          return {
            canJoin: false,
            reason: "Please wait a few minutes before rejoining the pack",
          };
        }
      }

      return { canJoin: true };
    } catch (error) {
      console.error("Error checking join eligibility:", error);
      return { canJoin: true }; // Default to allowing join on error
    }
  }

  /**
   * Get membership statistics for a location
   */
  async getLocationStats(locationId: string) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, wolfpack_joined_at, wolfpack_status, is_wolfpack_member")
        .eq("location_id", locationId);

      if (error) throw error;

      const stats = {
        totalMembers: data?.length || 0,
        activeMembers: data?.filter((m) =>
          m.is_wolfpack_member === true && m.wolfpack_status === "active"
        ).length || 0,
        recentJoins: data?.filter((m) => {
          if (!m.wolfpack_joined_at) {
            return false;
          }
          const joinedAt = new Date(m.wolfpack_joined_at);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return joinedAt > oneDayAgo;
        }).length || 0,
      };

      return stats;
    } catch (error) {
      console.error("Error fetching location stats:", error);
      return {
        totalMembers: 0,
        activeMembers: 0,
        recentJoins: 0,
      };
    }
  }
}

// Export singleton instance
export const wolfpackMembershipService = WolfpackMembershipService
  .getInstance();
