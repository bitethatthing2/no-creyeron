import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/types/database.types";

/**
 * Create a Supabase client for server-side operations
 * This includes proper cookie handling for auth
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookie setting errors in middleware context
            console.error("[SERVER AUTH] Cookie set error:", error);
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            console.error("[SERVER AUTH] Cookie remove error:", error);
          }
        },
      },
    },
  );
}

/**
 * Get the current session on the server side
 * Use this in server components and API routes
 */
export async function getServerSession() {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error("[SERVER AUTH] Error getting session:", {
        message: error.message,
        code: error.status,
        timestamp: new Date().toISOString(),
      });
      return null;
    }

    return session;
  } catch (error) {
    console.error("[SERVER AUTH] Unexpected error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      context: "getServerSession",
    });
    return null;
  }
}

/**
 * Get the current auth user on the server side
 * Returns the Supabase Auth user
 */
export async function getServerAuthUser() {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("[SERVER AUTH] Error getting auth user:", error);
    return null;
  }
}

/**
 * Get the current user from the session
 * @deprecated Use getServerAuthUser() for auth user or getServerUserProfile() for public profile
 */
export async function getServerUser() {
  const session = await getServerSession();
  return session?.user ?? null;
}

/**
 * Get public user profile with auth verification on server side
 * This returns the user from the public 'users' table
 */
export async function getServerUserProfile() {
  try {
    const supabase = createServerSupabaseClient();

    // Get auth user first
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // Get public profile using auth_id
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (profileError) {
      console.error("[SERVER AUTH] Error fetching user profile:", {
        message: profileError.message,
        code: profileError.code,
        hint: profileError.hint,
        details: profileError.details,
        timestamp: new Date().toISOString(),
        auth_id: user.id,
      });
      return null;
    }

    return profile;
  } catch (error) {
    console.error("[SERVER AUTH] Unexpected error fetching profile:", {
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      context: "getServerUserProfile",
    });
    return null;
  }
}

/**
 * Get public user ID from auth user
 * Useful when you only need the public user ID for foreign key relationships
 */
export async function getServerPublicUserId(): Promise<string | null> {
  try {
    const profile = await getServerUserProfile();
    return profile?.id ?? null;
  } catch (error) {
    console.error("[SERVER AUTH] Error getting public user ID:", error);
    return null;
  }
}

/**
 * Check if user is authenticated on server side
 */
export async function isServerAuthenticated(): Promise<boolean> {
  const session = await getServerSession();
  return !!session;
}

/**
 * Check if user has a specific role on server side
 */
export async function serverUserHasRole(
  role: "admin" | "user",
): Promise<boolean> {
  try {
    const profile = await getServerUserProfile();
    return profile?.role === role;
  } catch (error) {
    console.error("[SERVER AUTH] Error checking user role:", error);
    return false;
  }
}

/**
 * Require authentication for server-side operations
 * Throws an error if not authenticated
 */
export async function requireServerAuth() {
  const session = await getServerSession();

  if (!session) {
    throw new Error("Authentication required");
  }

  return session;
}

/**
 * Require a specific role for server-side operations
 * Throws an error if user doesn't have the required role
 */
export async function requireServerRole(role: "admin" | "user") {
  const profile = await getServerUserProfile();

  if (!profile) {
    throw new Error("Authentication required");
  }

  if (profile.role !== role) {
    throw new Error(`Insufficient permissions. Required role: ${role}`);
  }

  return profile;
}

/**
 * Get server-side Supabase client with automatic auth context
 * Use this when you need to make database queries with user context
 */
export async function getAuthenticatedServerClient() {
  const supabase = createServerSupabaseClient();
  const session = await getServerSession();

  if (!session) {
    throw new Error("No authenticated session");
  }

  return supabase;
}
