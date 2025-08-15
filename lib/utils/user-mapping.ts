// lib/utils/user-mapping.ts
import { createServerClient } from "@/lib/supabase/server";

/**
 * Utility functions for handling user ID mapping between auth and database
 */

export interface DatabaseUser {
  id: string;
  auth_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

/**
 * Get database user ID from auth user ID
 * Handles both direct auth_id mapping and fallback scenarios
 */
export async function getDatabaseUserId(
  authUserId: string,
): Promise<string | null> {
  const supabase = await createServerClient();

  try {
    // First try to find by auth_id
    const { data: userByAuth, error: authError } = await supabase
      .from("users")
      .select("id, auth_id, email")
      .eq("auth_id", authUserId)
      .maybeSingle();

    if (!authError && userByAuth) {
      return userByAuth.id;
    }

    // Fallback: try to find by id directly (for cases where auth_id might not be set)
    const { data: userById, error: idError } = await supabase
      .from("users")
      .select("id, auth_id, email")
      .eq("id", authUserId)
      .maybeSingle();

    if (!idError && userById) {
      return userById.id;
    }

    console.warn("User not found in database:", { authUserId });
    return null;
  } catch (error) {
    console.error("Error getting database user ID:", error);
    return null;
  }
}

/**
 * Get full database user info from auth user ID
 */
export async function getDatabaseUser(
  authUserId: string,
): Promise<DatabaseUser | null> {
  const supabase = await createServerClient();

  try {
    // First try to find by auth_id
    const { data: userByAuth, error: authError } = await supabase
      .from("users")
      .select("id, auth_id, email, first_name, last_name, avatar_url")
      .eq("auth_id", authUserId)
      .maybeSingle();

    if (!authError && userByAuth) {
      return userByAuth as DatabaseUser;
    }

    // Fallback: try to find by id directly
    const { data: userById, error: idError } = await supabase
      .from("users")
      .select("id, auth_id, email, first_name, last_name, avatar_url")
      .eq("id", authUserId)
      .maybeSingle();

    if (!idError && userById) {
      return userById as DatabaseUser;
    }

    return null;
  } catch (error) {
    console.error("Error getting database user:", error);
    return null;
  }
}

/**
 * Create a new user record if it doesn't exist
 * This is useful for new signups
 */
export async function ensureUserExists(
  authUser: { id: string; email?: string },
): Promise<string | null> {
  const supabase = await createServerClient();

  try {
    // Check if user already exists
    const existingId = await getDatabaseUserId(authUser.id);
    if (existingId) {
      return existingId;
    }

    // Create new user record with required fields
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        auth_id: authUser.id,
        email: authUser.email || `${authUser.id}@temp.user`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Set default values for other fields
        role: "user",
        wolfpack_status: "pending",
        is_approved: false,
        status: "active",
      })
      .select("id")
      .single();

    if (error) {
      // Check if it's a duplicate email error
      if (error.code === "23505" && error.message?.includes("email")) {
        // Try to find the existing user by email
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("email", authUser.email!)
          .single();

        if (existingUser) {
          // Update the auth_id for this user
          await supabase
            .from("users")
            .update({ auth_id: authUser.id })
            .eq("id", existingUser.id);

          return existingUser.id;
        }
      }

      console.error("Error creating user:", error);
      return null;
    }

    return newUser.id;
  } catch (error) {
    console.error("Error ensuring user exists:", error);
    return null;
  }
}

/**
 * Middleware function to get database user ID in API routes
 * Returns the database user ID, not the auth user ID
 */
export async function getAuthenticatedDatabaseUserId(): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  const supabase = await createServerClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    const databaseUserId = await getDatabaseUserId(user.id);

    if (!databaseUserId) {
      // Try to create the user if they don't exist
      const newUserId = await ensureUserExists({
        id: user.id,
        email: user.email,
      });

      if (!newUserId) {
        return { success: false, error: "User not found in database" };
      }

      return { success: true, userId: newUserId };
    }

    return { success: true, userId: databaseUserId };
  } catch (error) {
    console.error("Error in getAuthenticatedDatabaseUserId:", error);
    return { success: false, error: "Authentication error" };
  }
}

/**
 * Update user's auth_id if missing
 * Useful for migrating existing users
 */
export async function linkAuthToUser(
  email: string,
  authId: string,
): Promise<boolean> {
  const supabase = await createServerClient();

  try {
    const { error } = await supabase
      .from("users")
      .update({ auth_id: authId })
      .eq("email", email)
      .is("auth_id", null); // Only update if auth_id is not set

    return !error;
  } catch (error) {
    console.error("Error linking auth to user:", error);
    return false;
  }
}
