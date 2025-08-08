// services/user.service.ts - Centralized user management

import { AuthUser, PublicUser, CurrentUser } from '@/types/user.types';

export class UserService {
  constructor(private supabase: any) {}

  /**
   * Get the current user with both auth and public profiles
   */
  async getCurrentUser(): Promise<CurrentUser | null> {
    try {
      // Get auth user
      const { data: { user: authUser }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError || !authUser) {
        return null;
      }

      // Get public user profile
      const { data: publicUser, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (userError || !publicUser) {
        console.error('No public profile found for auth user:', authUser.id);
        // Optionally create profile here
        return null;
      }

      return {
        authUser,
        publicUser
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get only the public user ID (for foreign keys)
   * This is what should ALWAYS be used for database foreign keys
   */
  async getPublicUserId(): Promise<string | null> {
    const user = await this.getCurrentUser();
    return user?.publicUser.id || null;
  }

  /**
   * Create or update user profile from auth user
   */
  async ensureUserProfile(authUser?: AuthUser): Promise<PublicUser | null> {
    try {
      let currentAuthUser = authUser;
      
      if (!currentAuthUser) {
        const { data: { user }, error } = await this.supabase.auth.getUser();
        if (error || !user) return null;
        currentAuthUser = user;
      }

      // Try to get existing profile
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('*')
        .eq('auth_id', currentAuthUser.id)
        .single();

      if (existingUser) {
        return existingUser;
      }

      // Create new profile
      const { data: newUser, error } = await this.supabase
        .from('users')
        .insert({
          auth_id: currentAuthUser.id,
          email: currentAuthUser.email,
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        return null;
      }

      return newUser;
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      return null;
    }
  }
}