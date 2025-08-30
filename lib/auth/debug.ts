/**
 * Authentication debugging utilities
 * Use these during development to diagnose auth issues
 * Consider removing in production unless needed for support
 */

import { supabase } from "@/lib/supabase";

export interface AuthDebugInfo {
  environment: {
    hasSupabaseUrl: boolean;
    hasAnonKey: boolean;
    urlPrefix?: string;
  };
  connection: {
    isConnected: boolean;
    error?: string;
  };
  session: {
    hasSession: boolean;
    userId?: string;
    email?: string;
    error?: string;
  };
  publicProfile: {
    exists: boolean;
    profileId?: string;
    authIdMatch?: boolean;
    error?: string;
  };
  timestamp: string;
}

/**
 * Comprehensive auth debugging
 */
export async function debugAuthenticationIssue(): Promise<AuthDebugInfo> {
  const debugInfo: AuthDebugInfo = {
    environment: {
      hasSupabaseUrl: false,
      hasAnonKey: false,
    },
    connection: {
      isConnected: false,
    },
    session: {
      hasSession: false,
    },
    publicProfile: {
      exists: false,
    },
    timestamp: new Date().toISOString(),
  };

  // 1. Check environment variables
  debugInfo.environment.hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  debugInfo.environment.hasAnonKey = !!process.env
    .NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    debugInfo.environment.urlPrefix =
      process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + "...";
  }

  if (
    !debugInfo.environment.hasSupabaseUrl || !debugInfo.environment.hasAnonKey
  ) {
    console.error("[AUTH DEBUG] Missing environment variables");
    return debugInfo;
  }

  // 2. Test Supabase connection
  try {
    const { error } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    debugInfo.connection.isConnected = !error;
    if (error) {
      debugInfo.connection.error = error.message;
    }
  } catch (err) {
    debugInfo.connection.isConnected = false;
    debugInfo.connection.error = err instanceof Error
      ? err.message
      : "Unknown error";
  }

  // 3. Check current session
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (session) {
      debugInfo.session.hasSession = true;
      debugInfo.session.userId = session.user.id;
      debugInfo.session.email = session.user.email;
    } else if (error) {
      debugInfo.session.error = error.message;
    }
  } catch (err) {
    debugInfo.session.error = err instanceof Error
      ? err.message
      : "Unknown error";
  }

  // 4. Check public profile if session exists
  if (debugInfo.session.hasSession && debugInfo.session.userId) {
    try {
      const { data: profile, error } = await supabase
        .from("users")
        .select("id, auth_id")
        .eq("auth_id", debugInfo.session.userId)
        .single();

      if (profile) {
        debugInfo.publicProfile.exists = true;
        debugInfo.publicProfile.profileId = profile.id;
        debugInfo.publicProfile.authIdMatch =
          profile.auth_id === debugInfo.session.userId;
      } else if (error) {
        debugInfo.publicProfile.error = error.message;
      }
    } catch (err) {
      debugInfo.publicProfile.error = err instanceof Error
        ? err.message
        : "Unknown error";
    }
  }

  return debugInfo;
}

/**
 * Log authentication errors with context
 */
export function logAuthError(
  error: unknown,
  context: string,
  additionalData?: Record<string, unknown>,
) {
  const timestamp = new Date().toISOString();

  console.group(`🔐 Auth Error - ${context} [${timestamp}]`);

  if (error instanceof Error) {
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
  } else if (error && typeof error === "object") {
    const authError = error as Record<string, unknown>;
    console.error("Error object:", authError);

    if (authError.message) console.log("Message:", authError.message);
    if (authError.code) console.log("Code:", authError.code);
    if (authError.status) console.log("Status:", authError.status);
    if (authError.details) console.log("Details:", authError.details);
    if (authError.hint) console.log("Hint:", authError.hint);
  } else {
    console.error("Error:", error);
  }

  if (additionalData) {
    console.log("Additional data:", additionalData);
  }

  console.groupEnd();
}

/**
 * Get user-friendly error messages and suggestions
 */
export function getAuthErrorMessage(error: unknown): {
  message: string;
  suggestions: string[];
} {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const suggestions: string[] = [];
  let userMessage = "An authentication error occurred";

  // Invalid credentials
  if (errorMessage.includes("Invalid login credentials")) {
    userMessage = "Invalid email or password";
    suggestions.push("Double-check your email address");
    suggestions.push("Verify your password is correct");
    suggestions.push("Try resetting your password if you forgot it");
  } // Email not confirmed
  else if (errorMessage.includes("Email not confirmed")) {
    userMessage = "Please confirm your email address";
    suggestions.push("Check your inbox for a confirmation email");
    suggestions.push("Check your spam/junk folder");
    suggestions.push("Request a new confirmation email");
  } // Rate limiting
  else if (
    errorMessage.includes("Too many requests") ||
    errorMessage.includes("rate limit")
  ) {
    userMessage = "Too many attempts. Please wait a moment";
    suggestions.push("Wait 5-10 minutes before trying again");
    suggestions.push("Clear your browser cache if the issue persists");
  } // Network/connection issues
  else if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
    userMessage = "Connection error";
    suggestions.push("Check your internet connection");
    suggestions.push("Try refreshing the page");
    suggestions.push("Disable VPN if you're using one");
  } // User already exists
  else if (
    errorMessage.includes("already registered") ||
    errorMessage.includes("unique constraint")
  ) {
    userMessage = "This email is already registered";
    suggestions.push("Try logging in instead");
    suggestions.push("Use the password reset if you forgot your password");
  } // Session expired
  else if (errorMessage.includes("session") || errorMessage.includes("JWT")) {
    userMessage = "Your session has expired";
    suggestions.push("Please log in again");
    suggestions.push("Clear your browser cookies and try again");
  }

  return { message: userMessage, suggestions };
}

/**
 * Test critical auth flows
 */
export async function runAuthDiagnostics() {
  console.group("🔍 Running Auth Diagnostics");

  const results = {
    environment: false,
    connection: false,
    session: false,
    publicProfile: false,
  };

  // Test environment
  results.environment = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  console.log(
    "✓ Environment variables:",
    results.environment ? "OK" : "MISSING",
  );

  // Test connection
  try {
    const { error } = await supabase.from("users").select("count").limit(1);
    results.connection = !error;
    console.log(
      "✓ Database connection:",
      results.connection ? "OK" : error?.message,
    );
  } catch (err) {
    console.log("✗ Database connection:", err);
  }

  // Test session
  try {
    const { data: { session } } = await supabase.auth.getSession();
    results.session = !!session;
    console.log("✓ Auth session:", results.session ? "ACTIVE" : "NONE");
  } catch (err) {
    console.log("✗ Auth session:", err);
  }

  // Test public profile
  if (results.session) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", user.id)
          .single();

        results.publicProfile = !!profile;
        console.log(
          "✓ Public profile:",
          results.publicProfile ? "EXISTS" : "MISSING",
        );
      }
    } catch (err) {
      console.log("✗ Public profile:", err);
    }
  }

  console.groupEnd();

  return results;
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
    // Test basic connection
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      return {
        success: true,
        message: 'Auth test successful - user is logged in',
        details: { userId: session.user.id, email: session.user.email }
      };
    } else {
      return {
        success: true,
        message: 'Auth test successful - no active session',
        details: { hasSession: false }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Auth test failed',
      details: { error: error instanceof Error ? error.message : error }
    };
  }
}

/**
 * Get error suggestions for auth issues
 */
export function getAuthErrorSuggestions(error: unknown): string[] {
  const { suggestions } = getAuthErrorMessage(error);
  return suggestions;
}

// Development-only auto-diagnostics
if (process.env.NODE_ENV === "development") {
  if (typeof window !== "undefined") {
    // Add debug function to window for easy console access
    type AuthDebugWindow = typeof window & {
      authDebug: {
        run: typeof runAuthDiagnostics;
        debug: typeof debugAuthenticationIssue;
        testConnection: () => Promise<string>;
      };
    };
    (window as AuthDebugWindow).authDebug = {
      run: runAuthDiagnostics,
      debug: debugAuthenticationIssue,
      testConnection: async () => {
        const { error } = await supabase.from("users").select("count").limit(1);
        return !error ? "Connected" : `Failed: ${error.message}`;
      },
    };

    console.log("Auth debug tools available: window.authDebug.run()");
  }
}
