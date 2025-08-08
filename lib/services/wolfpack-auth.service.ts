import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// VIP users configuration - centralized from previous scattered definitions
const VIP_USERS = [
  'mkahler599@gmail.com',
  'admin@sidehustlebar.com'
];

export interface UserVerificationResult {
  isVerified: boolean;
  isVipUser: boolean;
  isPermanentPackMember: boolean;
  userId: string;
  userExists: boolean;
  error?: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

export class WolfpackAuthService {
  /**
   * Comprehensive user verification - consolidates all auth checks
   */
  static async verifyUser(user: User | null): Promise<UserVerificationResult> {
    if (!user) {
      return {
        isVerified: false,
        isVipUser: false,
        isPermanentPackMember: false,
        userId: '',
        userExists: false,
        error: 'No user provided'
      };
    }

    try {
      // Check if user is VIP
      const isVipUser = this.isVipUser(user.email || '');

      // Ensure user exists in database
      const userExists = await this.ensureUserExists(user);

      // Check if user is permanent pack member
      const isPermanentPackMember = await this.isPermanentPackMember(user.id);

      return {
        isVerified: true,
        isVipUser,
        isPermanentPackMember,
        userId: user.id,
        userExists,
        error: undefined
      };
    } catch (error) {
      console.error('User verification failed:', error);
      return {
        isVerified: false,
        isVipUser: false,
        isPermanentPackMember: false,
        userId: user.id,
        userExists: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  /**
   * Check if user is VIP - centralized from multiple implementations
   */
  static isVipUser(email: string): boolean {
    return VIP_USERS.includes(email.toLowerCase());
  }

  /**
   * Check if user is permanent pack member
   */
  static async isPermanentPackMember(userId: string): Promise<boolean> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('wolfpack_status, role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking permanent pack member status:', error);
        return false;
      }

      return user?.wolfpack_status === 'active' && user?.role === 'admin';
    } catch (error) {
      console.error('Error checking permanent pack member status:', error);
      return false;
    }
  }

  /**
   * Ensure user exists in database - consolidated from wolfpack-utils
   */
  static async ensureUserExists(user: AuthUser): Promise<boolean> {
    try {
      // Check if user already exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // If user exists, return true
      if (existingUser) {
        return true;
      }

      // Create user if doesn't exist
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: user.id,
          email: user.email || '',
          first_name: (user.user_metadata?.first_name as string) || null,
          last_name: (user.user_metadata?.last_name as string) || null,
          avatar_url: (user.user_metadata?.avatar_url as string) || null,
          role: this.isVipUser(user.email || '') ? 'admin' : 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (insertError) {
        // If it's a unique constraint violation, user was created by another process
        if (insertError.code === '23505') {
          return true;
        }
        throw insertError;
      }

      return true;
    } catch (error) {
      console.error('Error ensuring user exists:', error);
      throw error;
    }
  }

  /**
   * Get user display name - standardized across all components
   */
  static getUserDisplayName(user: User | null): string {
    if (!user) return 'Anonymous';
    
    return (
      user.user_metadata?.display_name ||
      user.user_metadata?.first_name ||
      user.email?.split('@')[0] ||
      'Wolf'
    );
  }

  /**
   * Get user avatar URL - standardized getter
   */
  static getUserAvatarUrl(user: User | null): string | null {
    return user?.user_metadata?.avatar_url || null;
  }

  /**
   * Check if user has required permissions for wolfpack access
   */
  static async hasWolfpackAccess(user: User | null): Promise<boolean> {
    if (!user) return false;
    
    // VIP users always have access
    if (this.isVipUser(user.email || '')) return true;
    
    // Permanent pack members always have access
    if (await this.isPermanentPackMember(user.id)) return true;
    
    // Regular users need to be authenticated
    return !!user.id;
  }

  /**
   * Check if user can bypass location verification
   */
  static async canBypassLocationVerification(user: User | null): Promise<boolean> {
    if (!user) return false;
    
    // VIP users can bypass location verification
    if (this.isVipUser(user.email || '')) return true;
    
    // Permanent pack members can bypass location verification
    if (await this.isPermanentPackMember(user.id)) return true;
    
    return false;
  }

  /**
   * Validate user session and refresh if needed
   */
  static async validateSession(): Promise<{ user: User | null; session: unknown }> {
    try {
      const response = await supabase.auth.getSession();
      
      if (response.error) throw response.error;
      
      return { 
        user: response.data?.session?.user || null, 
        session: response.data?.session || null 
      };
    } catch (error) {
      console.error('Session validation failed:', error);
      return { user: null, session: null };
    }
  }

  /**
   * Handle authentication errors consistently
   */
  static getAuthErrorMessage(error: unknown): string {
    if (!error) return 'Unknown authentication error';
    
    const errorMap: Record<string, string> = {
      'invalid_credentials': 'Invalid email or password',
      'email_not_confirmed': 'Please check your email and confirm your account',
      'too_many_requests': 'Too many attempts. Please try again later',
      'weak_password': 'Password is too weak',
      'email_address_invalid': 'Invalid email address',
      'signup_disabled': 'Sign up is currently disabled'
    };
    
    // Safely check if error has a message property
    const errorMessage = (error && typeof error === 'object' && 'message' in error) 
      ? String((error as { message: unknown }).message)
      : String(error);
      
    return errorMap[errorMessage] || errorMessage || 'Authentication failed';
  }
}
