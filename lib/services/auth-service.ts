/**
 * Centralized Authentication & Authorization Service
 * Provides complete control over user security and permissions
 */

import { supabase } from '@/lib/supabase';
import { errorService, ErrorSeverity, ErrorCategory } from './error-service';
import { dataService } from './data-service';

export enum UserRole {
  GUEST = 'guest',
  MEMBER = 'member',
  WOLFPACK_MEMBER = 'wolfpack_member',
  VIP = 'vip',
  DJ = 'dj',
  BARTENDER = 'bartender',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum Permission {
  // Basic permissions
  VIEW_MENU = 'view_menu',
  PLACE_ORDER = 'place_order',
  VIEW_PROFILE = 'view_profile',
  EDIT_PROFILE = 'edit_profile',
  
  // Wolfpack permissions
  JOIN_WOLFPACK = 'join_wolfpack',
  VIEW_WOLF_PACK_MEMBERS = 'view_wolf-pack-members',
  SEND_PRIVATE_MESSAGES = 'send_private_messages',
  PARTICIPATE_IN_EVENTS = 'participate_in_events',
  VOTE_IN_EVENTS = 'vote_in_events',
  
  // DJ permissions
  CREATE_EVENTS = 'create_events',
  MANAGE_EVENTS = 'manage_events',
  SEND_MASS_MESSAGES = 'send_mass_messages',
  VIEW_MEMBER_DETAILS = 'view_member_details',
  
  // Bartender permissions
  MANAGE_ORDERS = 'manage_orders',
  VIEW_ORDER_DETAILS = 'view_order_details',
  UPDATE_ORDER_STATUS = 'update_order_status',
  
  // Admin permissions
  MANAGE_USERS = 'manage_users',
  MANAGE_MENU = 'manage_menu',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_LOCATIONS = 'manage_locations',
  
  // Super admin permissions
  MANAGE_ADMINS = 'manage_admins',
  SYSTEM_SETTINGS = 'system_settings',
  EMERGENCY_ACCESS = 'emergency_access'
}

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  isWolfpackMember: boolean;
  profile: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    wolfEmoji?: string;
    profileImageUrl?: string;
    vibeStatus?: string;
    bio?: string;
    favoriteDrink?: string;
  };
  session: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    sessionId: string;
  };
  metadata: {
    lastLoginAt: Date;
    loginCount: number;
    preferredLocation?: string;
    deviceInfo?: string;
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
  firstName: string;
  lastName: string;
  displayName?: string;
  agreeToTerms: boolean;
}

class AuthService {
  private client = supabase;
  private currentUser: AuthUser | null = null;
  private authListeners: ((user: AuthUser | null) => void)[] = [];
  private permissionCache = new Map<string, Permission[]>();
  private sessionRefreshTimer: NodeJS.Timeout | null = null;

  // Role-Permission mapping
  private rolePermissions: Record<UserRole, Permission[]> = {
    [UserRole.GUEST]: [
      Permission.VIEW_MENU
    ],
    [UserRole.MEMBER]: [
      Permission.VIEW_MENU,
      Permission.PLACE_ORDER,
      Permission.VIEW_PROFILE,
      Permission.EDIT_PROFILE,
      Permission.JOIN_WOLFPACK
    ],
    [UserRole.WOLFPACK_MEMBER]: [
      Permission.VIEW_MENU,
      Permission.PLACE_ORDER,
      Permission.VIEW_PROFILE,
      Permission.EDIT_PROFILE,
      Permission.VIEW_WOLF_PACK_MEMBERS,
      Permission.SEND_PRIVATE_MESSAGES,
      Permission.PARTICIPATE_IN_EVENTS,
      Permission.VOTE_IN_EVENTS
    ],
    [UserRole.VIP]: [
      Permission.VIEW_MENU,
      Permission.PLACE_ORDER,
      Permission.VIEW_PROFILE,
      Permission.EDIT_PROFILE,
      Permission.VIEW_WOLF_PACK_MEMBERS,
      Permission.SEND_PRIVATE_MESSAGES,
      Permission.PARTICIPATE_IN_EVENTS,
      Permission.VOTE_IN_EVENTS,
      Permission.VIEW_MEMBER_DETAILS
    ],
    [UserRole.DJ]: [
      Permission.VIEW_MENU,
      Permission.PLACE_ORDER,
      Permission.VIEW_PROFILE,
      Permission.EDIT_PROFILE,
      Permission.VIEW_WOLF_PACK_MEMBERS,
      Permission.SEND_PRIVATE_MESSAGES,
      Permission.PARTICIPATE_IN_EVENTS,
      Permission.VOTE_IN_EVENTS,
      Permission.CREATE_EVENTS,
      Permission.MANAGE_EVENTS,
      Permission.SEND_MASS_MESSAGES,
      Permission.VIEW_MEMBER_DETAILS
    ],
    [UserRole.BARTENDER]: [
      Permission.VIEW_MENU,
      Permission.VIEW_PROFILE,
      Permission.EDIT_PROFILE,
      Permission.MANAGE_ORDERS,
      Permission.VIEW_ORDER_DETAILS,
      Permission.UPDATE_ORDER_STATUS
    ],
    [UserRole.ADMIN]: [
      ...Object.values(Permission).filter(p => 
        p !== Permission.MANAGE_ADMINS && 
        p !== Permission.EMERGENCY_ACCESS
      )
    ],
    [UserRole.SUPER_ADMIN]: Object.values(Permission)
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
        if (event === 'SIGNED_IN' && session?.user) {
          await this.loadUserProfile(session.user.id);
          this.setupSessionRefresh();
        } else if (event === 'SIGNED_OUT') {
          this.clearUserSession();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          await this.loadUserProfile(session.user.id);
        }
      });

    } catch (error) {
      errorService.handleAuthError(error as Error, {
        action: 'initialize'
      });
    }
  }

  /**
   * Sign in user
   */
  async signIn(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const { email, password, rememberMe = false } = credentials;

      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw errorService.handleAuthError(error, {
          action: 'signIn',
          email
        });
      }

      if (!data.user) {
        throw new Error('No user returned from sign in');
      }

      // Try to load user profile, create one if it doesn't exist
      let user: AuthUser;
      try {
        user = await this.loadUserProfile(data.user.id);
      } catch (error) {
        console.log('User profile not found, creating one for existing user...');
        // This handles users who signed up before the trigger was implemented
        await this.createMissingUserProfile(data.user);
        user = await this.loadUserProfile(data.user.id);
      }
      
      // Update login metadata
      await this.updateLoginMetadata(user.id);

      this.setupSessionRefresh();
      this.notifyAuthListeners(user);

      return user;
    } catch (error) {
      throw errorService.handleAuthError(error as Error, {
        action: 'signIn',
        email: credentials.email
      });
    }
  }

  /**
   * Sign up new user
   */
  async signUp(signupData: SignupData): Promise<AuthUser> {
    try {
      const { email, password, firstName, lastName, displayName, agreeToTerms } = signupData;

      if (!agreeToTerms) {
        throw errorService.handleValidationError(
          'agreeToTerms',
          false,
          'Must agree to terms and conditions'
        );
      }

      // Sign up with Supabase Auth
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            display_name: displayName || `${firstName} ${lastName}`
          }
        }
      });

      if (error) {
        throw errorService.handleAuthError(error, {
          action: 'signUp',
          email
        });
      }

      if (!data.user) {
        throw new Error('No user returned from sign up');
      }

      // User profile will be created automatically by database trigger
      console.log('Sign up successful - user profile will be created automatically by database trigger');

      // Wait a moment for the trigger to complete, then load the profile
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const user = await this.loadUserProfile(data.user.id);
      this.notifyAuthListeners(user);

      return user;
    } catch (error) {
      throw errorService.handleAuthError(error as Error, {
        action: 'signUp',
        email: signupData.email
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
          action: 'signOut'
        });
      }

      this.clearUserSession();
    } catch (error) {
      errorService.handleAuthError(error as Error, {
        action: 'signOut'
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
  hasPermission(permission: Permission, userId?: string): boolean {
    const user = userId ? null : this.currentUser; // For now, only check current user
    if (!user) return false;

    return user.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: Permission[]): boolean {
    if (!this.currentUser) return false;

    return permissions.some(permission => 
      this.currentUser!.permissions.includes(permission)
    );
  }

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(permissions: Permission[]): boolean {
    if (!this.currentUser) return false;

    return permissions.every(permission => 
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
        'Insufficient permissions to update user role',
        'You don\'t have permission to perform this action',
        ErrorSeverity.HIGH,
        ErrorCategory.AUTHORIZATION,
        { action: 'updateUserRole', targetUserId: userId, newRole }
      );
    }

    try {
      await dataService.updateUser(userId, { role: newRole });
      
      // Update permissions cache
      this.permissionCache.delete(userId);
      
      // If updating current user, reload profile
      if (userId === this.currentUser?.id) {
        await this.loadUserProfile(userId);
      }
    } catch (error) {
      throw errorService.handleDatabaseError(
        error as Error,
        'updateUserRole',
        { userId, newRole }
      );
    }
  }

  /**
   * Join Wolfpack
   */
  async joinWolfpack(): Promise<void> {
    if (!this.currentUser) {
      throw errorService.handleAuthError(new Error('Not authenticated'));
    }

    if (!this.hasPermission(Permission.JOIN_WOLFPACK)) {
      throw errorService.createError(
        'Cannot join Wolfpack',
        'You need to be a member to join the Wolfpack',
        ErrorSeverity.MEDIUM,
        ErrorCategory.AUTHORIZATION,
        { action: 'joinWolfpack' }
      );
    }

    try {
      await dataService.updateUser(this.currentUser.id, {
        is_wolfpack_member: true,
        wolfpack_join_date: new Date().toISOString(),
        role: UserRole.WOLFPACK_MEMBER
      });

      // Reload user profile with new permissions
      await this.loadUserProfile(this.currentUser.id);
    } catch (error) {
      throw errorService.handleDatabaseError(
        error as Error,
        'joinWolfpack'
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
  private async loadUserProfile(userId: string): Promise<AuthUser> {
    try {
      const userData = await dataService.getUser(userId);
      
      if (!userData) {
        throw new Error('User profile not found');
      }

      const role = userData.role || UserRole.MEMBER;
      const permissions = this.getRolePermissions(role);

      const user: AuthUser = {
        id: userId,
        email: userData.email,
        role,
        permissions,
        isWolfpackMember: userData.is_wolfpack_member || false,
        profile: {
          displayName: userData.display_name,
          firstName: userData.first_name,
          lastName: userData.last_name,
          wolfEmoji: userData.wolf_emoji,
          profileImageUrl: userData.profile_image_url,
          vibeStatus: userData.vibe_status,
          bio: userData.bio,
          favoriteDrink: userData.favorite_drink
        },
        session: {
          accessToken: '', // Will be set by Supabase
          refreshToken: '',
          expiresAt: new Date(Date.now() + 3600000), // 1 hour
          sessionId: `session_${Date.now()}`
        },
        metadata: {
          lastLoginAt: new Date(userData.last_login_at || Date.now()),
          loginCount: userData.login_count || 0,
          preferredLocation: userData.preferred_location,
          deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
        }
      };

      this.currentUser = user;
      this.permissionCache.set(userId, permissions);

      return user;
    } catch (error) {
      throw errorService.handleDatabaseError(
        error as Error,
        'loadUserProfile',
        { userId }
      );
    }
  }

  // Note: createUserProfile removed - user profiles are now created automatically by database trigger
  
  private async createMissingUserProfile(authUser: any): Promise<void> {
    try {
      const displayName = authUser.user_metadata?.display_name || 
                          authUser.user_metadata?.full_name || 
                          authUser.email?.split('@')[0] || 
                          'User';
      
      await dataService.executeQuery(
        () => this.client
          .from('users')
          .insert({
            auth_id: authUser.id,
            email: authUser.email || '',
            first_name: displayName.split(' ')[0] || '',
            last_name: displayName.split(' ').slice(1).join(' ') || '',
            display_name: displayName,
            role: UserRole.MEMBER,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }),
        'createMissingUserProfile'
      );
    } catch (error) {
      throw errorService.handleDatabaseError(
        error as Error,
        'createMissingUserProfile',
        { userId: authUser.id }
      );
    }
  }

  private async updateLoginMetadata(userId: string): Promise<void> {
    try {
      await dataService.executeQuery(
        () => this.client
          .from('users')
          .update({
            last_login: new Date().toISOString()
            // login_count field not available in schema
          })
          .eq('id', userId),
        'updateLoginMetadata'
      );
    } catch (error) {
      console.warn('Failed to update login metadata:', error);
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
    this.authListeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('Auth listener error:', error);
      }
    });
  }
}

// Create singleton instance
export const authService = new AuthService();

// Initialize on module load
if (typeof window !== 'undefined') {
  authService.initialize();
}

// Export types
export type {
  AuthUser,
  LoginCredentials,
  SignupData
};