/**
 * Centralized Authentication & Authorization Service
 * Provides complete control over user security and permissions
 */

import { supabase } from "@/lib/supabase";
import { ErrorCategory, errorService, ErrorSeverity } from "./error-service";
import type { Database } from "@/types/supabase"; // Import generated types

// Type aliases from generated types
type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export enum Permission {
  // Basic permissions
  VIEW_MENU = "view_menu",
  PLACE_ORDER = "place_order",
  VIEW_PROFILE = "view_profile",
  EDIT_PROFILE = "edit_profile",

  // Social permissions
  FOLLOW_USERS = "follow_users",
  VIEW_FOLLOWERS = "view_followers",
  SEND_MESSAGES = "send_messages",
  VIEW_POSTS = "view_posts",
  CREATE_POSTS = "create_posts",
  LIKE_POSTS = "like_posts",
  COMMENT_ON_POSTS = "comment_on_posts",

  // Admin permissions (full access)
  MANAGE_POSTS = "manage_posts",
  SEND_MASS_MESSAGES = "send_mass_messages",
  VIEW_USER_DETAILS = "view_user_details",
  MANAGE_ORDERS = "manage_orders",
  VIEW_ORDER_DETAILS = "view_order_details",
  UPDATE_ORDER_STATUS = "update_order_status",
  MANAGE_USERS = "manage_users",
  MANAGE_MENU = "manage_menu",
  VIEW_ANALYTICS = "view_analytics",
  MANAGE_LOCATIONS = "manage_locations",

  // Super admin permissions
  MANAGE_ADMINS = "manage_admins",
  SYSTEM_SETTINGS = "system_settings",
  EMERGENCY_ACCESS = "emergency_access",
}

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  isVerified: boolean;
  isPrivate: boolean;
  profile: {
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    username: string;
    profileImageUrl?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    location?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    website?: string | null;
    occupation?: string | null;
    company?: string | null;
  };
  session: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    sessionId: string;
  };
  metadata: {
    lastSeenAt?: Date | null;
    accountStatus: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    settings: Database["public"]["Tables"]["users"]["Row"]["settings"];
  };
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface SignupData {
  email: string;
  password: string;
  username: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  agreeToTerms: boolean;
}

class AuthService {
  private client = supabase;
  private currentUser: AuthUser | null = null;
  private authListeners: ((user: AuthUser | null) => void)[] = [];
  private permissionCache = new Map<string, Permission[]>();
  private sessionRefreshTimer: NodeJS.Timeout | null = null;

  // Role-Permission mapping - Simplified 2-role system
  private rolePermissions: Record<UserRole, Permission[]> = {
    [UserRole.USER]: [
      Permission.VIEW_MENU,
      Permission.PLACE_ORDER,
      Permission.VIEW_PROFILE,
      Permission.EDIT_PROFILE,
      Permission.FOLLOW_USERS,
      Permission.VIEW_FOLLOWERS,
      Permission.SEND_MESSAGES,
      Permission.VIEW_POSTS,
      Permission.CREATE_POSTS,
      Permission.LIKE_POSTS,
      Permission.COMMENT_ON_POSTS,
    ],
    [UserRole.ADMIN]: Object.values(Permission),
  };

  /**
   * Initialize authentication service
   */
  async initialize(): Promise<void> {
    try {
      // Get current session
      const { data: { session }, error } = await this.client.auth.getSession();

      if (error) {
        throw errorService.handleAuthError(error);
      }

      if (session?.user) {
        await this.loadUserProfile(session.user.id);
        this.setupSessionRefresh();
      }

      // Listen for auth changes
      this.client.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await this.loadUserProfile(session.user.id);
          this.setupSessionRefresh();
        } else if (event === "SIGNED_OUT") {
          this.clearUserSession();
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          await this.loadUserProfile(session.user.id);
        }
      });
    } catch (error) {
      errorService.handleAuthError(error as Error, {
        action: "initialize",
      });
    }
  }

  /**
   * Sign in user
   */
  async signIn(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const { email, password } = credentials;
      // rememberMe could be used for session persistence in the future

      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw errorService.handleAuthError(error, {
          action: "signIn",
          email,
        });
      }

      if (!data.user) {
        throw new Error("No user returned from sign in");
      }

      // Try to load user profile, create one if it doesn't exist
      let user: AuthUser;
      try {
        user = await this.loadUserProfile(data.user.id);
      } catch (error) {
        console.log(
          "User profile not found, creating one for existing user...",
        );
        // This handles users who signed up before the trigger was implemented
        await this.createMissingUserProfile(data.user);
        user = await this.loadUserProfile(data.user.id);
      }

      // Update last seen
      await this.updateLastSeen(user.id);

      this.setupSessionRefresh();
      this.notifyAuthListeners(user);

      return user;
    } catch (error) {
      throw errorService.handleAuthError(error as Error, {
        action: "signIn",
        email: credentials.email,
      });
    }
  }

  /**
   * Sign up new user
   */
  async signUp(signupData: SignupData): Promise<AuthUser> {
    try {
      const {
        email,
        password,
        username,
        firstName,
        lastName,
        displayName,
        agreeToTerms,
      } = signupData;

      if (!agreeToTerms) {
        throw errorService.handleValidationError(
          "agreeToTerms",
          false,
          "Must agree to terms and conditions",
        );
      }

      // Sign up with Supabase Auth
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            first_name: firstName,
            last_name: lastName,
            display_name: displayName || `${firstName} ${lastName}`.trim() ||
              username,
          },
        },
      });

      if (error) {
        throw errorService.handleAuthError(error, {
          action: "signUp",
          email,
        });
      }

      if (!data.user) {
        throw new Error("No user returned from sign up");
      }

      // User profile will be created automatically by database trigger
      console.log(
        "Sign up successful - user profile will be created automatically by database trigger",
      );

      // Wait a moment for the trigger to complete, then load the profile
      await new Promise((resolve) => setTimeout(resolve, 100));

      const user = await this.loadUserProfile(data.user.id);
      this.notifyAuthListeners(user);

      return user;
    } catch (error) {
      throw errorService.handleAuthError(error as Error, {
        action: "signUp",
        email: signupData.email,
      });
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await this.client.auth.signOut();

      if (error) {
        throw errorService.handleAuthError(error, {
          action: "signOut",
        });
      }

      this.clearUserSession();
    } catch (error) {
      errorService.handleAuthError(error as Error, {
        action: "signOut",
      });
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: Permission): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: Permission[]): boolean {
    if (!this.currentUser) return false;

    return permissions.some((permission) =>
      this.currentUser!.permissions.includes(permission)
    );
  }

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(permissions: Permission[]): boolean {
    if (!this.currentUser) return false;

    return permissions.every((permission) =>
      this.currentUser!.permissions.includes(permission)
    );
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: UserRole): boolean {
    return this.currentUser?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: UserRole[]): boolean {
    if (!this.currentUser) return false;
    return roles.includes(this.currentUser.role);
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    if (!this.hasPermission(Permission.MANAGE_USERS)) {
      throw errorService.createError(
        "Insufficient permissions to update user role",
        "You don't have permission to perform this action",
        ErrorSeverity.HIGH,
        ErrorCategory.AUTHORIZATION,
      );
    }

    try {
      // Use Supabase client directly for update
      const { error } = await this.client
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      // Update permissions cache
      this.permissionCache.delete(userId);

      // If updating current user, reload profile
      if (userId === this.currentUser?.id) {
        await this.loadUserProfile(userId);
      }
    } catch (error) {
      throw errorService.handleDatabaseError(
        error as Error,
        "updateUserRole",
      );
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    updates: Partial<Omit<UserUpdate, "id" | "created_at" | "updated_at">>,
  ): Promise<void> {
    if (!this.currentUser) {
      throw errorService.handleAuthError(new Error("Not authenticated"));
    }

    try {
      // Filter out any null values and ensure we're only updating allowed fields
      const safeUpdates: UserUpdate = {};

      // Type-safe key iteration
      (Object.keys(updates) as Array<keyof typeof updates>).forEach((key) => {
        const value = updates[key];
        if (value !== null && value !== undefined) {
          // Type assertion is safe here because we know the key exists in UserUpdate
          (safeUpdates as Record<
            keyof UserUpdate,
            UserUpdate[keyof UserUpdate]
          >)[key] = value;
        }
      });

      // Always update the updated_at timestamp
      safeUpdates.updated_at = new Date().toISOString();

      const { error } = await this.client
        .from("users")
        .update(safeUpdates)
        .eq("id", this.currentUser.id);

      if (error) {
        throw error;
      }

      await this.loadUserProfile(this.currentUser.id);
    } catch (error) {
      throw errorService.handleDatabaseError(
        error as Error,
        "updateProfile",
      );
    }
  }

  /**
   * Add authentication listener
   */
  addAuthListener(listener: (user: AuthUser | null) => void): () => void {
    this.authListeners.push(listener);
    return () => {
      const index = this.authListeners.indexOf(listener);
      if (index > -1) {
        this.authListeners.splice(index, 1);
      }
    };
  }

  /**
   * Private methods
   */
  private async loadUserProfile(authId: string): Promise<AuthUser> {
    try {
      // First, try to get user by auth_id
      const { data: userData, error } = await this.client
        .from("users")
        .select("*")
        .eq("auth_id", authId)
        .single();

      if (error || !userData) {
        throw new Error("User profile not found");
      }

      const role = (userData.role as UserRole) || UserRole.USER;
      const permissions = this.getRolePermissions(role);

      const user: AuthUser = {
        id: userData.id,
        email: userData.email,
        role,
        permissions,
        isVerified: userData.is_verified || false,
        isPrivate: userData.is_private || false,
        profile: {
          displayName: userData.display_name,
          firstName: userData.first_name,
          lastName: userData.last_name,
          username: userData.username,
          profileImageUrl: userData.profile_image_url,
          avatarUrl: userData.avatar_url,
          bio: userData.bio,
          location: userData.location,
          city: userData.city,
          state: userData.state,
          country: userData.country,
          website: userData.website,
          occupation: userData.occupation,
          company: userData.company,
        },
        session: {
          accessToken: "", // Will be set by Supabase
          refreshToken: "",
          expiresAt: new Date(Date.now() + 3600000), // 1 hour
          sessionId: `session_${Date.now()}`,
        },
        metadata: {
          lastSeenAt: userData.last_seen_at
            ? new Date(userData.last_seen_at)
            : null,
          accountStatus: userData.account_status || "active",
          emailNotifications: userData.email_notifications ?? true,
          pushNotifications: userData.push_notifications ?? true,
          settings: userData.settings || {},
        },
      };

      this.currentUser = user;
      this.permissionCache.set(userData.id, permissions);

      return user;
    } catch (error) {
      throw errorService.handleDatabaseError(
        error as Error,
        "loadUserProfile",
      );
    }
  }

  private async createMissingUserProfile(
    authUser: {
      id: string;
      email?: string;
      user_metadata?: {
        display_name?: string;
        full_name?: string;
        username?: string;
        first_name?: string;
        last_name?: string;
      };
    },
  ): Promise<void> {
    try {
      const metadata = authUser.user_metadata || {};
      const email = authUser.email || "";
      const username = metadata.username || email.split("@")[0] ||
        `user_${Date.now()}`;
      const displayName = metadata.display_name ||
        metadata.full_name ||
        username;

      const userInsert: UserInsert = {
        auth_id: authUser.id,
        email,
        username,
        first_name: metadata.first_name || displayName.split(" ")[0] || "",
        last_name: metadata.last_name ||
          displayName.split(" ").slice(1).join(" ") || "",
        display_name: displayName,
        role: UserRole.USER,
        account_status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await this.client
        .from("users")
        .insert(userInsert)
        .select()
        .single();

      if (error) {
        throw error;
      }
    } catch (error) {
      throw errorService.handleDatabaseError(
        error as Error,
        "createMissingUserProfile",
      );
    }
  }

  private async updateLastSeen(userId: string): Promise<void> {
    try {
      await this.client
        .from("users")
        .update({
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", userId);
    } catch (error) {
      console.warn("Failed to update last seen:", error);
    }
  }

  private getRolePermissions(role: UserRole): Permission[] {
    return [...(this.rolePermissions[role] || [])];
  }

  private setupSessionRefresh(): void {
    if (this.sessionRefreshTimer) {
      clearInterval(this.sessionRefreshTimer);
    }

    // Refresh session every 30 minutes
    this.sessionRefreshTimer = setInterval(() => {
      this.client.auth.refreshSession();
    }, 30 * 60 * 1000);
  }

  private clearUserSession(): void {
    this.currentUser = null;
    this.permissionCache.clear();

    if (this.sessionRefreshTimer) {
      clearInterval(this.sessionRefreshTimer);
      this.sessionRefreshTimer = null;
    }

    this.notifyAuthListeners(null);
  }

  private notifyAuthListeners(user: AuthUser | null): void {
    this.authListeners.forEach((listener) => {
      try {
        listener(user);
      } catch (error) {
        console.error("Auth listener error:", error);
      }
    });
  }
}

// Create singleton instance
export const authService = new AuthService();

// Initialize on module load
if (typeof window !== "undefined") {
  authService.initialize();
}

// Export types
export type { AuthUser, LoginCredentials, SignupData };
