/**
 * User Profile Service
 * Centralizes all user profile operations with proper typing and error handling
 */

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Enhanced user profile type for Wolfpack functionality
export interface WolfpackProfile {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  bio?: string | null;
  wolf_emoji?: string | null;
  vibe_status?: string | null;
  favorite_drink?: string | null;
  favorite_song?: string | null;
  instagram_handle?: string | null;
  looking_for?: string | null;
  gender?: string | null;
  pronouns?: string | null;
  is_profile_visible?: boolean | null;
  allow_messages?: boolean | null;
  profile_pic_url?: string | null;
  profile_image_url?: string | null;
  custom_avatar_id?: string | null;
  is_wolfpack_member?: boolean | null;
  wolfpack_join_date?: string | null;
  last_seen_at?: string | null;
  is_online?: boolean | null;
  location_permissions_granted?: boolean | null;
  phone?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface UserProfileUpdate {
  display_name?: string | null;
  bio?: string | null;
  wolf_emoji?: string | null;
  vibe_status?: string | null;
  favorite_drink?: string | null;
  favorite_song?: string | null;
  instagram_handle?: string | null;
  looking_for?: string | null;
  gender?: string | null;
  pronouns?: string | null;
  is_profile_visible?: boolean | null;
  allow_messages?: boolean | null;
  profile_pic_url?: string | null;
  profile_image_url?: string | null;
  custom_avatar_id?: string | null;
}

export class UserProfileService {
  private supabase = supabase;

  /**
   * Get user profile by ID (internal database ID) or by auth ID
   */
  async getUserProfile(userId: string, isAuthId: boolean = false): Promise<WolfpackProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          id, email, first_name, last_name, display_name, bio,
          wolf_emoji, vibe_status, favorite_drink, favorite_song,
          instagram_handle, looking_for, gender, pronouns,
          is_profile_visible, allow_messages, profile_pic_url,
          profile_image_url, custom_avatar_id, is_wolfpack_member,
          wolfpack_join_date, last_seen_at, is_online,
          location_permissions_granted, phone, created_at, updated_at
        `)
        .eq(isAuthId ? 'auth_id' : 'id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Get user profile by auth ID (for cases where we only have the Supabase auth user ID)
   */
  async getUserProfileByAuthId(authId: string): Promise<WolfpackProfile | null> {
    return this.getUserProfile(authId, true);
  }

  /**
   * Update user profile by ID (internal database ID) or auth ID
   */
  async updateUserProfile(
    userId: string,
    updates: UserProfileUpdate,
    isAuthId: boolean = false
  ): Promise<WolfpackProfile> {
    try {
      // Validate required fields
      if (updates.display_name !== undefined && !updates.display_name?.trim()) {
        throw new Error('Display name is required');
      }

      // Clean up Instagram handle (remove @ if present)
      const cleanedUpdates = { ...updates };
      if (cleanedUpdates.instagram_handle) {
        cleanedUpdates.instagram_handle = cleanedUpdates.instagram_handle.replace('@', '');
      }

      const { data, error } = await this.supabase
        .from('users')
        .update({
          ...cleanedUpdates,
          updated_at: new Date().toISOString()
        })
        .eq(isAuthId ? 'auth_id' : 'id', userId)
        .select(`
          id, email, first_name, last_name, display_name, bio,
          wolf_emoji, vibe_status, favorite_drink, favorite_song,
          instagram_handle, looking_for, gender, pronouns,
          is_profile_visible, allow_messages, profile_pic_url,
          profile_image_url, custom_avatar_id, is_wolfpack_member,
          wolfpack_join_date, last_seen_at, is_online,
          location_permissions_granted, phone, created_at, updated_at
        `)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      
      // Handle specific error types
      if (error.code === '23505') {
        throw new Error('That display name is already taken');
      } else if (error.code === '42501') {
        throw new Error('You do not have permission to update this profile');
      } else if (error.code === '23503') {
        throw new Error('Invalid reference - please check your input');
      } else if (error.code === '22P02') {
        throw new Error('Invalid input format - please check your data');
      }
      
      throw error;
    }
  }

  /**
   * Update user profile by auth ID (for cases where we only have the Supabase auth user ID)
   */
  async updateUserProfileByAuthId(
    authId: string,
    updates: UserProfileUpdate
  ): Promise<WolfpackProfile> {
    return this.updateUserProfile(authId, updates, true);
  }

  /**
   * Get multiple user profiles (for member lists, etc.)
   */
  async getMultipleUserProfiles(userIds: string[]): Promise<WolfpackProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          id, email, first_name, last_name, display_name, bio,
          wolf_emoji, vibe_status, favorite_drink, favorite_song,
          instagram_handle, looking_for, gender, pronouns,
          is_profile_visible, allow_messages, profile_pic_url,
          profile_image_url, custom_avatar_id, is_wolfpack_member,
          wolfpack_join_date, last_seen_at, is_online,
          location_permissions_granted, phone, created_at, updated_at
        `)
        .in('id', userIds);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching multiple user profiles:', error);
      throw error;
    }
  }

  /**
   * Get Wolfpack members with filters
   */
  async getWolfpackMembers(options: {
    location?: string;
    limit?: number;
    isOnline?: boolean;
  } = {}): Promise<WolfpackProfile[]> {
    try {
      const { location, limit = 100, isOnline } = options;

      let query = this.supabase
        .from('users')
        .select(`
          id, email, first_name, last_name, display_name, bio,
          wolf_emoji, vibe_status, favorite_drink, favorite_song,
          instagram_handle, looking_for, gender, pronouns,
          is_profile_visible, allow_messages, profile_pic_url,
          profile_image_url, custom_avatar_id, is_wolfpack_member,
          wolfpack_join_date, last_seen_at, is_online,
          location_permissions_granted, phone, created_at, updated_at
        `)
        .eq('is_wolfpack_member', true)
        .order('last_seen_at', { ascending: false })
        .limit(limit);

      if (location) {
        query = query.eq('preferred_location', location);
      }

      if (isOnline !== undefined) {
        query = query.eq('is_online', isOnline);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching Wolfpack members:', error);
      throw error;
    }
  }

  /**
   * Update Wolfpack membership status
   */
  async updateWolfpackMembership(
    userId: string,
    isWolfpackMember: boolean
  ): Promise<WolfpackProfile> {
    try {
      const updates: UserProfileUpdate = {
        is_wolfpack_member: isWolfpackMember,
        ...(isWolfpackMember && { wolfpack_join_date: new Date().toISOString() })
      };

      return await this.updateUserProfile(userId, updates);
    } catch (error) {
      console.error('Error updating Wolfpack membership:', error);
      throw error;
    }
  }

  /**
   * Search users by display name or email
   */
  async searchUsers(query: string, limit: number = 20): Promise<WolfpackProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          id, email, first_name, last_name, display_name, bio,
          wolf_emoji, vibe_status, favorite_drink, favorite_song,
          instagram_handle, looking_for, gender, pronouns,
          is_profile_visible, allow_messages, profile_pic_url,
          profile_image_url, custom_avatar_id, is_wolfpack_member,
          wolfpack_join_date, last_seen_at, is_online,
          location_permissions_granted, phone, created_at, updated_at
        `)
        .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userProfileService = new UserProfileService();
export default userProfileService;