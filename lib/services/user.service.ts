// services/user.service.ts - Centralized user management
import { SupabaseClient, User as AuthUser } from "@supabase/supabase-js";

// Import your generated database types
// Adjust this path to match your actual types file location
import { Database } from "@/types/supabase";

// Type aliases for clarity
type PublicUser = Database["public"]["Tables"]["users"]["Row"];
type PublicUserInsert = Database["public"]["Tables"]["users"]["Insert"];
type PublicUserUpdate = Database["public"]["Tables"]["users"]["Update"];

// Define the CurrentUser interface that combines both auth and public profiles
export interface CurrentUser {
  authUser: AuthUser;
  publicUser: PublicUser;
}

export class UserService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get the current user with both auth and public profiles
   */
  async getCurrentUser(): Promise<CurrentUser | null> {
    try {
      // Get auth user
      const { data: { user: authUser }, error: authError } = await this.supabase
        .auth.getUser();

      if (authError || !authUser) {
        return null;
      }

      // Get public user profile
      const { data: publicUser, error: userError } = await this.supabase
        .from("users")
        .select("*")
        .eq("auth_id", authUser.id)
        .single();

      if (userError || !publicUser) {
        console.error("No public profile found for auth user:", authUser.id);

        // Optionally create profile here
        const newProfile = await this.ensureUserProfile(authUser);
        if (newProfile) {
          return {
            authUser,
            publicUser: newProfile,
          };
        }

        return null;
      }

      return {
        authUser,
        publicUser,
      };
    } catch (error) {
      console.error("Error getting current user:", error);
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
   * Get public user by auth ID
   */
  async getPublicUserByAuthId(authId: string): Promise<PublicUser | null> {
    try {
      const { data, error } = await this.supabase
        .from("users")
        .select("*")
        .eq("auth_id", authId)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error getting public user by auth ID:", error);
      return null;
    }
  }

  /**
   * Create or update user profile from auth user
   * Only sets REQUIRED fields and lets database defaults handle the rest
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
        .from("users")
        .select("*")
        .eq("auth_id", currentAuthUser.id)
        .single();

      if (existingUser) {
        // Update last_login if user exists
        const { data: updatedUser } = await this.supabase
          .from("users")
          .update({
            last_login: new Date().toISOString(),
          } as PublicUserUpdate)
          .eq("id", existingUser.id)
          .select()
          .single();

        return updatedUser || existingUser;
      }

      // Create new profile with ONLY required fields
      // Let database defaults handle everything else
      const newUserData: PublicUserInsert = {
        auth_id: currentAuthUser.id,
        email: currentAuthUser.email || "",
        // id, created_at, and updated_at are handled by database defaults
      };

      const { data: newUser, error } = await this.supabase
        .from("users")
        .insert(newUserData)
        .select()
        .single();

      if (error) {
        console.error("Error creating user profile:", error);
        return null;
      }

      return newUser;
    } catch (error) {
      console.error("Error ensuring user profile:", error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<PublicUserUpdate>,
  ): Promise<PublicUser | null> {
    try {
      // Always update the updated_at timestamp
      const updateData: PublicUserUpdate = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating user profile:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error updating user profile:", error);
      return null;
    }
  }

  /**
   * Check if a user exists by email
   */
  async userExistsByEmail(email: string): Promise<boolean> {
    try {
      const { count, error } = await this.supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("email", email);

      if (error) {
        console.error("Error checking user existence:", error);
        return false;
      }

      return (count ?? 0) > 0;
    } catch (error) {
      console.error("Error checking user existence:", error);
      return false;
    }
  }

  /**
   * Update user's online status
   */
  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      const updates: PublicUserUpdate = {
        is_online: isOnline,
        last_activity: new Date().toISOString(),
      };

      if (!isOnline) {
        updates.last_seen_at = new Date().toISOString();
      }

      await this.supabase
        .from("users")
        .update(updates)
        .eq("id", userId);
    } catch (error) {
      console.error("Error updating online status:", error);
    }
  }

  /**
   * Get user by public ID
   */
  async getUserById(userId: string): Promise<PublicUser | null> {
    try {
      const { data, error } = await this.supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return null;
    }
  }

  /**
   * Cleanup method to handle auth user deletion
   */
  async handleAuthUserDeleted(authId: string): Promise<void> {
    try {
      // Soft delete the public profile
      await this.supabase
        .from("users")
        .update({
          deleted_at: new Date().toISOString(),
          status: "inactive",
        } as PublicUserUpdate)
        .eq("auth_id", authId);
    } catch (error) {
      console.error("Error handling auth user deletion:", error);
    }
  }
}

// Export a singleton instance if you prefer
export const createUserService = (supabase: SupabaseClient<Database>) => {
  return new UserService(supabase);
};
