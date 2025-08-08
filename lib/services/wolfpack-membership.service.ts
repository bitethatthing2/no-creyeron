import { WolfpackService } from './wolfpack-auth.service';
import { WolfpackLocationService, type LocationKey, SIDE_HUSTLE_LOCATIONS } from './wolfpack-location.service';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface MembershipStatus {
  isActive: boolean;
  membershipId: string | null;
  locationId: string | null;
  locationKey: LocationKey | null;
  joinedAt: string | null;
  tableLocation: string | null;
  status: 'active' | 'inactive' | 'pending' | null;
  error?: string;
}

export interface JoinPackData {
  display_name?: string;
  emoji?: string;
  current_vibe?: string;
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

export class WolfpackMembershipService {
  /**
   * Check user's current membership status - consolidates multiple implementations
   */
  static async checkMembership(
    userId: string, 
    locationId?: string
  ): Promise<MembershipStatus> {
    try {
      let query = supabase
        .from("users")
        .select(`
          id,
          location_id,
          wolfpack_status,
          wolfpack_joined_at,
          created_at
        `)
        .eq('id', userId)
        .eq('is_wolfpack_member', true);

      // Add location filter if provided
      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;

      if (!data) {
        return {
          isActive: false,
          membershipId: null,
          locationId: null,
          locationKey: null,
          joinedAt: null,
          tableLocation: null,
          status: null
        };
      }

      const locationKey = data.location_id ? WolfpackService.location.getLocationKeyById(data.location_id) : null;

      return {
        isActive: true,
        membershipId: data.id,
        locationId: data.location_id,
        locationKey,
        joinedAt: data.wolfpack_joined_at || data.created_at,
        tableLocation: null,
        status: (data.wolfpack_status || 'active') as 'active'
      };
    } catch (error) {
      console.error('Error checking membership:', error);
      return {
        isActive: false,
        membershipId: null,
        locationId: null,
        locationKey: null,
        joinedAt: null,
        tableLocation: null,
        status: null,
        error: error instanceof Error ? error.message : 'Failed to check membership'
      };
    }
  }

  /**
   * Join wolfpack with comprehensive error handling
   */
  static async joinPack(
    user: User,
    data: JoinPackData,
    locationId?: string
  ): Promise<JoinResult> {
    try {
      // Verify user authentication
      const authResult = await WolfpackService.auth.verifyUser(user);
      if (!authResult.isVerified) {
        return {
          success: false,
          error: authResult.error || 'User verification failed'
        };
      }

      // Determine location if not provided
      let targetLocationId = locationId;

      if (!targetLocationId) {
        // VIP users can join from anywhere
        if (authResult.isVipUser) {
          targetLocationId = SIDE_HUSTLE_LOCATIONS.salem.id;
        } else {
          // Regular users need location verification
          const locationResult = await WolfpackService.location.verifyUserLocation();
          if (!locationResult.isAtLocation || !locationResult.locationId) {
            return {
              success: false,
              error: 'You must be at Side Hustle Bar to join the Wolf Pack'
            };
          }
          targetLocationId = locationResult.locationId;
        }
      }

      // Check for existing active membership
      const existingMembership = await this.checkMembership(user.id, targetLocationId);
      if (existingMembership.isActive && existingMembership.membershipId) {
        return {
          success: true,
          membershipId: existingMembership.membershipId,
          data: existingMembership
        };
      }

      // Ensure we have a valid location ID
      if (!targetLocationId) {
        return {
          success: false,
          error: 'Unable to determine location'
        };
      }

      // Use RPC function for joining (maintains existing backend logic)
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('join_wolfpack', {
          p_location_id: targetLocationId,
          p_latitude: data.latitude ?? undefined,
          p_longitude: data.longitude ?? undefined,
          p_table_location: data.table_location ?? undefined
        });

      if (rpcError) throw rpcError;

      // Check if RPC returned an error result
      if (rpcResult && typeof rpcResult === 'object' && 'success' in rpcResult && !rpcResult.success) {
        const errorMessage = 'error' in rpcResult ? String(rpcResult.error) : 'Failed to join wolfpack';
        throw new Error(errorMessage);
      }

      // Update member profile with additional data if provided
      if (Object.keys(data).length > 0 && targetLocationId) {
        await this.updateMemberProfile(user.id, targetLocationId, {
          display_name: data.display_name,
          wolf_emoji: data.emoji,
          vibe_status: data.current_vibe,
          favorite_drink: data.favorite_drink,
          looking_for: data.looking_for,
          instagram_handle: data.instagram_handle
        });
      }

      // Get the new membership
      const newMembership = await this.checkMembership(user.id, targetLocationId);

      if (!newMembership.membershipId) {
        return {
          success: false,
          error: 'Failed to create membership'
        };
      }

      return {
        success: true,
        membershipId: newMembership.membershipId,
        data: newMembership
      };
    } catch (error) {
      console.error('Error joining wolfpack:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to join pack'
      };
    }
  }

  /**
   * Leave wolfpack - consolidated implementation
   */
  static async leavePack(membershipId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("users")
        .update({ 
          wolfpack_status: 'inactive',
          is_wolfpack_member: false,
          last_activity: new Date().toISOString()
        })
        .eq('id', membershipId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error leaving wolfpack:', error);
      return false;
    }
  }

  /**
   * Update member profile information
   */
  static async updateMemberProfile(
    userId: string,
    locationId: string,
    profileData: Partial<MemberProfile>
  ): Promise<boolean> {
    try {
      // Update users table directly since wolf_profiles doesn't exist
      const { error: memberError } = await supabase
        .from('users')
        .update({
          display_name: profileData.display_name,
          favorite_drink: profileData.favorite_drink,
          looking_for: profileData.looking_for,
          instagram_handle: profileData.instagram_handle,
          last_activity: new Date().toISOString()
        })
        .eq('id', userId)
        .eq('is_wolfpack_member', true);

      if (memberError) throw memberError;

      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }

  /**
   * Get member profile by user ID
   */
  static async getMemberProfile(userId: string): Promise<MemberProfile | null> {
    try {
      // Use users table directly since wolf_profiles doesn't exist
      const { data: memberData, error: memberError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('is_wolfpack_member', true)
        .single();

      if (memberError) throw memberError;

      // Convert to MemberProfile format
      return memberData ? {
        id: memberData.id || '',
        display_name: memberData.display_name || null,
        wolf_emoji: null,
        favorite_drink: memberData.favorite_drink || null,
        vibe_status: null,
        looking_for: memberData.looking_for || null,
        instagram_handle: memberData.instagram_handle || null,
        bio: memberData.bio || null,
        profile_image_url: memberData.profile_image_url || null,
        is_profile_visible: memberData.is_profile_visible ?? true,
        allow_messages: memberData.allow_messages ?? true
      } : null;
    } catch (error) {
      console.error('Error fetching member profile:', error);
      return null;
    }
  }

  /**
   * Get all active members at a location
   */
  static async getLocationMembers(locationId: string) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(`
          *
        `)
        .eq('location_id', locationId)
        .eq('is_wolfpack_member', true)
        .eq('wolfpack_status', 'active')
        .order('wolfpack_joined_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching location members:', error);
      return [];
    }
  }

  /**
   * Check if user can join wolfpack (rate limiting, restrictions, etc.)
   */
  static async canUserJoin(userId: string): Promise<{ canJoin: boolean; reason?: string }> {
    try {
      // Check for recent membership activity
      const { data: recentMembership, error } = await supabase
        .from("users")
        .select('last_activity, wolfpack_joined_at')
        .eq('id', userId)
        .order('wolfpack_joined_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Check if user has recent activity (rate limiting)
      if (recentMembership?.last_activity) {
        try {
          const lastActivity = new Date(recentMembership.last_activity);
          const now = new Date();
          const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
          
          // Rate limit: prevent rejoining within 5 minutes
          if (minutesSinceActivity < 5) {
            return {
              canJoin: false,
              reason: 'Please wait a few minutes before rejoining the pack'
            };
          }
        } catch (dateError) {
          console.error('Error parsing last_activity date:', dateError);
          // Allow join if date parsing fails
        }
      }

      return { canJoin: true };
    } catch (error) {
      console.error('Error checking join eligibility:', error);
      return { canJoin: true }; // Default to allowing join on error
    }
  }

  /**
   * Get membership statistics for a location
   */
  static async getLocationStats(locationId: string) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select('id, wolfpack_joined_at, wolfpack_status, is_wolfpack_member')
        .eq('location_id', locationId);

      if (error) throw error;

      const stats = {
        totalMembers: data?.length || 0,
        activeMembers: data?.filter(m => m.is_wolfpack_member === true && m.wolfpack_status === 'active').length || 0,
        recentJoins: data?.filter(m => {
          if (!m.wolfpack_joined_at) return false;
          const joinedAt = new Date(m.wolfpack_joined_at);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return joinedAt > oneDayAgo;
        }).length || 0
      };

      return stats;
    } catch (error) {
      console.error('Error fetching location stats:', error);
      return {
        totalMembers: 0,
        activeMembers: 0,
        recentJoins: 0
      };
    }
  }
}
