import { supabase } from "@/lib/supabase";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { debugLog } from "@/lib/debug";

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

// ==========================================
// AUTH ERROR HANDLING AND DEBUGGING UTILS
// ==========================================

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * Log authentication errors with context
 */
export function logAuthError(error: any, context: string): void {
  const errorMessage = error?.message || "Unknown auth error";
  const errorCode = error?.code || error?.status || "unknown";

  debugLog.error(`Auth Error - ${context}`, error, {
    action: context,
    errorMessage,
  });
}

/**
 * Get helpful suggestions for common auth errors
 */
export function getAuthErrorSuggestions(errorMessage: string): string[] {
  const suggestions: string[] = [];
  const lowerMessage = errorMessage.toLowerCase();

  if (
    lowerMessage.includes("invalid login credentials") ||
    lowerMessage.includes("invalid email or password")
  ) {
    suggestions.push("Double-check your email and password");
    suggestions.push("Make sure Caps Lock is off");
    suggestions.push("Try resetting your password if you forgot it");
  }

  if (lowerMessage.includes("email not confirmed")) {
    suggestions.push("Check your email for a confirmation link");
    suggestions.push("Look in your spam/junk folder");
    suggestions.push("Try requesting a new confirmation email");
  }

  if (lowerMessage.includes("too many requests")) {
    suggestions.push("Wait a few minutes before trying again");
    suggestions.push("You may have attempted to sign in too many times");
  }

  if (lowerMessage.includes("network") || lowerMessage.includes("connection")) {
    suggestions.push("Check your internet connection");
    suggestions.push("Try refreshing the page");
  }

  if (
    lowerMessage.includes("user not found") ||
    lowerMessage.includes("user does not exist")
  ) {
    suggestions.push("Make sure you entered the correct email");
    suggestions.push("Try signing up if you don't have an account yet");
  }

  if (lowerMessage.includes("password")) {
    suggestions.push("Password must be at least 6 characters long");
    suggestions.push(
      "Try using a stronger password with letters, numbers, and symbols",
    );
  }

  if (lowerMessage.includes("email")) {
    suggestions.push("Make sure you entered a valid email address");
    suggestions.push("Check for typos in your email");
  }

  // If no specific suggestions, provide general ones
  if (suggestions.length === 0) {
    suggestions.push("Please try again");
    suggestions.push("If the problem persists, contact support");
  }

  return suggestions;
}

/**
 * Test Supabase authentication setup
 */
export async function testSupabaseAuth(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Test 1: Check if supabase client is initialized
    if (!supabase) {
      return {
        success: false,
        message: "Supabase client is not initialized",
      };
    }

    // Test 2: Check connection to auth service
    const { data: { session }, error: sessionError } = await supabase.auth
      .getSession();

    if (sessionError) {
      return {
        success: false,
        message: "Failed to connect to Supabase auth service",
        details: sessionError,
      };
    }

    // Test 3: Try to get user (this should work even without authentication)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError && userError.message !== "No user") {
      return {
        success: false,
        message: "Auth service error when getting user",
        details: userError,
      };
    }

    // Test 4: Check if we can query the users table (basic connectivity test)
    const { error: dbError } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    if (dbError) {
      return {
        success: false,
        message: "Database connection test failed",
        details: dbError,
      };
    }

    return {
      success: true,
      message: "Supabase auth is working correctly",
      details: {
        hasSession: !!session,
        hasUser: !!user,
        userId: user?.id,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Unexpected error during auth test",
      details: error,
    };
  }
}

/**
 * Debug user session information
 */
export async function debugUserSession(): Promise<void> {
  const { data: { session }, error } = await supabase.auth.getSession();

  debugLog.custom("🔍", "User Session Debug", {
    hasSession: !!session,
    sessionError: error,
    userId: session?.user?.id,
    userEmail: session?.user?.email,
    expiresAt: session?.expires_at,
    tokenType: session?.token_type,
    accessTokenLength: session?.access_token?.length,
    refreshTokenLength: session?.refresh_token?.length,
  });
}

/**
 * Test Supabase connection (used in login page)
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from("users").select("count").limit(
      1,
    );
    console.log("Supabase connection test:", { data, error });
    return !error;
  } catch (err) {
    console.error("Supabase connection test failed:", err);
    return false;
  }
}
