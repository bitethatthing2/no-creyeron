// contexts/AuthContext.tsx

'use client';

import React, { useState, useCallback, useEffect, useContext, createContext, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Database user schema - matches your Supabase users table exactly
 */
interface DatabaseUser {
  id: string;
  email: string;
  auth_id: string | null;
  role: 'admin' | 'user' | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  profile_image_url: string | null;
  phone: string | null;
  account_status: 'active' | 'inactive' | 'pending' | 'suspended' | null;
  settings: {
    notifications?: {
      push?: boolean;
      email?: boolean;
      sms?: boolean;
      marketing?: boolean;
      orderUpdates?: boolean;
      socialUpdates?: boolean;
    };
    privacy?: {
      profileVisible?: boolean;
      showActivity?: boolean;
      allowMessages?: boolean;
    };
    preferences?: {
      theme?: 'light' | 'dark' | 'system';
      language?: string;
      timezone?: string;
    };
  } | null;
  created_at: string;
  updated_at: string;
}

/**
 * Application user type - clean interface for frontend usage
 */
export interface CurrentUser {
  // Core identity
  id: string;
  email: string;
  authId: string;
  role: 'admin' | 'user';
  
  // Profile information
  firstName?: string;
  lastName?: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  phone?: string;
  
  // Account status
  accountStatus: 'active' | 'inactive' | 'pending' | 'suspended';
  isAdmin: boolean;
  
  // Settings (stored as JSONB in database)
  settings: {
    notifications?: {
      push?: boolean;
      email?: boolean;
      sms?: boolean;
      marketing?: boolean;
      orderUpdates?: boolean;
      socialUpdates?: boolean;
    };
    privacy?: {
      profileVisible?: boolean;
      showActivity?: boolean;
      allowMessages?: boolean;
    };
    preferences?: {
      theme?: 'light' | 'dark' | 'system';
      language?: string;
      timezone?: string;
    };
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Auth context type with all methods and state
 */
interface AuthContextType {
  // State
  user: User | null;
  session: Session | null;
  currentUser: CurrentUser | null;
  loading: boolean;
  error: Error | null;
  
  // Methods
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateProfile: (updates: Partial<DatabaseUser>) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  
  // Computed helpers
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasProfile: boolean;
  isReady: boolean;
  
  // Guards
  requireAuth: () => { user: User; session: Session };
  requireProfile: () => CurrentUser;
  requireAdmin: () => CurrentUser;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Transform database user to application user format
 */
const transformDatabaseUser = (dbUser: DatabaseUser, authUser: User): CurrentUser => {
  return {
    // Core identity
    id: dbUser.id,
    email: dbUser.email,
    authId: dbUser.auth_id || authUser.id,
    role: dbUser.role || 'user',
    
    // Profile information
    firstName: dbUser.first_name || undefined,
    lastName: dbUser.last_name || undefined,
    displayName: dbUser.display_name || undefined,
    username: dbUser.username || undefined,
    avatarUrl: dbUser.avatar_url || dbUser.profile_image_url || undefined,
    phone: dbUser.phone || undefined,
    
    // Account status
    accountStatus: dbUser.account_status || 'active',
    isAdmin: dbUser.role === 'admin',
    
    // Settings with proper defaults
    settings: {
      notifications: {
        push: true,
        email: true,
        sms: false,
        marketing: false,
        orderUpdates: true,
        socialUpdates: true,
        ...dbUser.settings?.notifications
      },
      privacy: {
        profileVisible: true,
        showActivity: true,
        allowMessages: true,
        ...dbUser.settings?.privacy
      },
      preferences: {
        theme: 'system',
        language: 'en',
        timezone: 'America/Los_Angeles',
        ...dbUser.settings?.preferences
      }
    },
    
    // Timestamps
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at
  };
};

/**
 * Create a default user profile for new signups
 */
const createDefaultProfile = (authUser: User): Partial<DatabaseUser> => {
  return {
    auth_id: authUser.id,
    email: authUser.email!,
    role: 'user', // Default to 'user' role for production
    account_status: 'active',
    settings: {
      notifications: {
        push: true,
        email: true,
        sms: false,
        marketing: false,
        orderUpdates: true,
        socialUpdates: true
      },
      privacy: {
        profileVisible: true,
        showActivity: true,
        allowMessages: true
      },
      preferences: {
        theme: 'system',
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

// ============================================================================
// Context & Provider
// ============================================================================

/**
 * Create the auth context with default values
 */
const AuthContext = createContext<AuthContextType>({
  // State
  user: null,
  session: null,
  currentUser: null,
  loading: true,
  error: null,
  
  // Methods (no-ops by default)
  signIn: async () => { throw new Error('AuthProvider not mounted'); },
  signUp: async () => { throw new Error('AuthProvider not mounted'); },
  signOut: async () => { throw new Error('AuthProvider not mounted'); },
  resetPassword: async () => { throw new Error('AuthProvider not mounted'); },
  updatePassword: async () => { throw new Error('AuthProvider not mounted'); },
  updateProfile: async () => { throw new Error('AuthProvider not mounted'); },
  refreshUser: async () => { throw new Error('AuthProvider not mounted'); },
  clearError: () => {},
  
  // Computed
  isAuthenticated: false,
  isAdmin: false,
  hasProfile: false,
  isReady: false,
  
  // Guards
  requireAuth: () => { throw new Error('Not authenticated'); },
  requireProfile: () => { throw new Error('No profile found'); },
  requireAdmin: () => { throw new Error('Admin access required'); }
});

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Core state
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);

  // ============================================================================
  // User Profile Management
  // ============================================================================

  /**
   * Fetch user profile from database
   */
  const fetchUserProfile = useCallback(async (authUser: User): Promise<CurrentUser | null> => {
    if (!authUser?.id) {
      console.warn('[Auth] No auth user provided to fetchUserProfile');
      return null;
    }

    try {
      // Try to fetch existing profile
      const { data: profile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('[Auth] Error fetching profile:', fetchError);
        throw fetchError;
      }

      // If profile exists, transform and return it
      if (profile) {
        console.log('[Auth] Profile found for user:', authUser.email);
        return transformDatabaseUser(profile as DatabaseUser, authUser);
      }

      // No profile exists, create one
      console.log('[Auth] No profile found, creating new profile for:', authUser.email);
      
      const newProfileData = createDefaultProfile(authUser);
      
      const { data: newProfile, error: insertError } = await supabase
        .from('users')
        .insert(newProfileData)
        .select()
        .single();

      if (insertError) {
        console.error('[Auth] Error creating profile:', insertError);
        throw insertError;
      }

      console.log('[Auth] Profile created successfully');
      return transformDatabaseUser(newProfile as DatabaseUser, authUser);
      
    } catch (err) {
      console.error('[Auth] Error in fetchUserProfile:', err);
      
      // Return a minimal user object as fallback
      return {
        id: authUser.id,
        email: authUser.email!,
        authId: authUser.id,
        role: 'user',
        accountStatus: 'active',
        isAdmin: false,
        settings: {
          notifications: {},
          privacy: {},
          preferences: {}
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }, []);

  // ============================================================================
  // Authentication Methods
  // ============================================================================

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Profile will be fetched automatically via auth state change listener
      console.log('[Auth] Sign in successful');
    } catch (err) {
      console.error('[Auth] Sign in failed:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    metadata?: Record<string, unknown>
  ) => {
    setError(null);
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      
      if (error) throw error;
      
      console.log('[Auth] Sign up successful');
      // Profile will be created automatically via auth state change listener
    } catch (err) {
      console.error('[Auth] Sign up failed:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sign out the current user
   */
  const signOut = useCallback(async () => {
    setError(null);
    
    try {
      // Call logout RPC if it exists (for cleanup)
      try {
        await supabase.rpc('handle_user_logout');
      } catch {
        // Ignore RPC errors - function might not exist
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local storage
      localStorage.removeItem('user_profile');
      localStorage.removeItem('fcm_token');
      sessionStorage.clear();
      
      // Clear state
      setSession(null);
      setCurrentUser(null);
      
      console.log('[Auth] Sign out successful');
    } catch (err) {
      console.error('[Auth] Sign out failed:', err);
      setError(err as Error);
      throw err;
    }
  }, []);

  /**
   * Send password reset email
   */
  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      
      if (error) throw error;
      console.log('[Auth] Password reset email sent');
    } catch (err) {
      console.error('[Auth] Password reset failed:', err);
      setError(err as Error);
      throw err;
    }
  }, []);

  /**
   * Update user password
   */
  const updatePassword = useCallback(async (newPassword: string) => {
    setError(null);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      console.log('[Auth] Password updated successfully');
    } catch (err) {
      console.error('[Auth] Password update failed:', err);
      setError(err as Error);
      throw err;
    }
  }, []);

  /**
   * Refresh user session and profile
   */
  const refreshUser = useCallback(async () => {
    setError(null);
    
    try {
      // Get fresh session
      const { data: { session: freshSession }, error: sessionError } = 
        await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      setSession(freshSession);
      
      if (freshSession?.user) {
        const profile = await fetchUserProfile(freshSession.user);
        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
      }
      
      console.log('[Auth] User refreshed');
    } catch (err) {
      console.error('[Auth] Refresh failed:', err);
      setError(err as Error);
      setCurrentUser(null);
    }
  }, [fetchUserProfile]);

  /**
   * Update user profile in database
   */
  const updateProfile = useCallback(async (updates: Partial<DatabaseUser>) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    
    setError(null);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) throw error;
      
      // Refresh the user profile
      await refreshUser();
      console.log('[Auth] Profile updated successfully');
    } catch (err) {
      console.error('[Auth] Profile update failed:', err);
      setError(err as Error);
      throw err;
    }
  }, [currentUser, refreshUser]);

  /**
   * Clear any auth errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================================================
  // Auth State Initialization & Listeners
  // ============================================================================

  useEffect(() => {
    let mounted = true;

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        console.log('[Auth] Initializing auth state...');
        
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = 
          await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[Auth] Session error:', sessionError);
          throw sessionError;
        }
        
        if (!mounted) return;
        
        setSession(initialSession);
        
        // If we have a session, fetch the user profile
        if (initialSession?.user) {
          console.log('[Auth] Session found, fetching profile...');
          const profile = await fetchUserProfile(initialSession.user);
          
          if (!mounted) return;
          
          setCurrentUser(profile);
        } else {
          console.log('[Auth] No session found');
          setCurrentUser(null);
        }
        
      } catch (err) {
        console.error('[Auth] Initialization error:', err);
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setIsReady(true);
          console.log('[Auth] Initialization complete');
        }
      }
    };

    // Run initialization
    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[Auth] Auth state changed:', event);
        
        if (!mounted) return;
        
        setSession(newSession);
        setError(null);
        
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            if (newSession?.user) {
              const profile = await fetchUserProfile(newSession.user);
              if (mounted) {
                setCurrentUser(profile);
              }
            }
            break;
            
          case 'SIGNED_OUT':
            setCurrentUser(null);
            break;
            
          case 'USER_UPDATED':
            if (newSession?.user) {
              const profile = await fetchUserProfile(newSession.user);
              if (mounted) {
                setCurrentUser(profile);
              }
            }
            break;
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // ============================================================================
  // Computed Values & Guards
  // ============================================================================

  const user = session?.user ?? null;
  const isAuthenticated = !!user && !!session;
  const isAdmin = currentUser?.role === 'admin';
  const hasProfile = !!currentUser;

  /**
   * Require authenticated user
   */
  const requireAuth = useCallback(() => {
    if (!isAuthenticated || !user || !session) {
      throw new Error('Authentication required');
    }
    return { user, session };
  }, [isAuthenticated, user, session]);

  /**
   * Require user with profile
   */
  const requireProfile = useCallback(() => {
    if (!isAuthenticated || !hasProfile || !currentUser) {
      throw new Error('User profile required');
    }
    return currentUser;
  }, [isAuthenticated, hasProfile, currentUser]);

  /**
   * Require admin user
   */
  const requireAdmin = useCallback(() => {
    if (!isAuthenticated || !hasProfile || !currentUser || !isAdmin) {
      throw new Error('Admin access required');
    }
    return currentUser;
  }, [isAuthenticated, hasProfile, currentUser, isAdmin]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue = useMemo<AuthContextType>(() => ({
    // State
    user,
    session,
    currentUser,
    loading,
    error,
    
    // Methods
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshUser,
    clearError,
    
    // Computed
    isAuthenticated,
    isAdmin,
    hasProfile,
    isReady,
    
    // Guards
    requireAuth,
    requireProfile,
    requireAdmin
  }), [
    user,
    session,
    currentUser,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshUser,
    clearError,
    isAuthenticated,
    isAdmin,
    hasProfile,
    isReady,
    requireAuth,
    requireProfile,
    requireAdmin
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// Hook Export
// ============================================================================

/**
 * Hook to use auth context
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook that throws if user is not authenticated
 */
export const useRequireAuth = () => {
  const { requireAuth } = useAuth();
  return requireAuth();
};

/**
 * Hook that throws if user doesn't have a profile
 */
export const useRequireProfile = () => {
  const { requireProfile } = useAuth();
  return requireProfile();
};

/**
 * Hook that throws if user is not an admin
 */
export const useRequireAdmin = () => {
  const { requireAdmin } = useAuth();
  return requireAdmin();
};

/**
 * Hook to check if user has a specific role
 */
export const useHasRole = (role: 'admin' | 'user') => {
  const { currentUser } = useAuth();
  return currentUser?.role === role;
};

/**
 * Hook to get user display name
 */
export const useUserDisplayName = () => {
  const { currentUser } = useAuth();
  
  if (!currentUser) return null;
  
  return (
    currentUser.displayName || 
    currentUser.username || 
    `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() ||
    currentUser.email.split('@')[0]
  );
};