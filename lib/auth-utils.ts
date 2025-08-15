import { supabase } from "@/lib/supabase";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

// Type definitions for function returns
interface SessionStatusResponse {
  success: boolean;
  error?: string;
  user_id?: string;
  email?: string;
  name?: string;
  is_online?: boolean;
  last_login?: string;
  last_activity?: string;
  last_seen_at?: string;
  has_session_id?: boolean;
  active_auth_sessions?: number;
  appears_logged_in?: boolean;
}

interface AuthUserResponse {
  user: User | null;
  error: string | null;
}

interface LoginStatusResponse {
  isLoggedIn: boolean;
  user: User | null;
  session: Session | null;
  error: string | null;
}

interface LogoutResponse {
  success: boolean;
  message?: string;
  error?: string;
  logoutData?: unknown;
}

interface SessionRefreshResponse {
  session: Session | null;
  error: string | null;
}

/**
 * Check user session status - can check current user or specific user by email
 * @param email - Optional email to check specific user (admin function)
 * @returns Object with success status and user session data
 */
export async function checkUserSessionStatus(
  email?: string,
): Promise<SessionStatusResponse> {
  try {
    const { data, error } = await supabase.rpc("check_user_session_status", {
      p_email: email || null, // Function parameter name is p_email, not email
    });

    if (error) {
      console.error("Error checking session status:", error);
      return { success: false, error: error.message };
    }

    // The RPC function returns a JSON object that matches SessionStatusResponse
    // Cast it to the correct type since Supabase doesn't know our custom type
    return data as SessionStatusResponse;
  } catch (error) {
    console.error("Error in checkUserSessionStatus:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get the currently authenticated user from Supabase Auth
 * @returns Object with user data and potential error
 */
export async function getCurrentAuthUser(): Promise<AuthUserResponse> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error("Error getting current auth user:", error);
      return { user: null, error: error.message };
    }

    return { user, error: null };
  } catch (error) {
    console.error("Error in getCurrentAuthUser:", error);
    return {
      user: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Check if a user is currently logged in
 * @returns Object with login status, user data, and potential error
 */
export async function isUserLoggedIn(): Promise<LoginStatusResponse> {
  try {
    const { user, error } = await getCurrentAuthUser();

    // Also check session to ensure it's valid
    const { data: { session } } = await supabase.auth.getSession();

    return {
      isLoggedIn: !!user && !error && !!session,
      user,
      session,
      error,
    };
  } catch (error) {
    console.error("Error in isUserLoggedIn:", error);
    return {
      isLoggedIn: false,
      user: null,
      session: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Perform a complete logout - clears backend session, auth session, and local storage
 * @returns Object with success status and potential error
 */
export async function performCompleteLogout(): Promise<LogoutResponse> {
  try {
    // First call the backend logout function to clean up database state
    const { data: logoutData, error: rpcError } = await supabase.rpc(
      "handle_user_logout",
    );

    if (rpcError) {
      console.error("RPC logout error:", rpcError);
      // Continue with auth signout even if RPC fails
    }

    // Sign out from Supabase Auth
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error("Auth signout error:", signOutError);
      throw signOutError;
    }

    // Clear all local storage items related to the session
    const itemsToRemove = [
      "user_profile",
      "fcm_token",
      "supabase.auth.token", // Legacy token storage
      "sb-auth-token", // Current auth token storage
    ];

    itemsToRemove.forEach((item) => {
      localStorage.removeItem(item);
    });

    // Clear session storage
    sessionStorage.clear();

    // Clear any cached data in memory if your app uses a state management solution
    // This would be specific to your implementation (Redux, Zustand, etc.)

    return {
      success: true,
      message: "User logged out successfully",
      logoutData, // Include backend logout response for debugging
    };
  } catch (error) {
    console.error("Complete logout failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Refresh the current session if it exists
 * @returns Object with new session data and potential error
 */
export async function refreshSession(): Promise<SessionRefreshResponse> {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error("Error refreshing session:", error);
      return { session: null, error: error.message };
    }

    return { session, error: null };
  } catch (error) {
    console.error("Error in refreshSession:", error);
    return {
      session: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Set up an auth state change listener
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}
