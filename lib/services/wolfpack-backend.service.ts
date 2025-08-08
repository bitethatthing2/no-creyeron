import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { errorTracker } from '@/lib/utils/error-tracking';
import { captureError } from '@/lib/utils/error-utils';

// Define Json type for Supabase compatibility
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface UserFriendlyError {
  message: string;
  type: 'error' | 'warning' | 'info';
  code?: string;
  retryable: boolean;
  action?: string;
}

export interface ErrorContext {
  operation: string;
  userId?: string;
  locationId?: string;
  membershipId?: string;
  additional?: Record<string, unknown>;
}

// FIXED: Properly typed error interfaces
interface DatabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

interface AuthError {
  message: string;
  status?: number;
  error_description?: string;
}

interface GeolocationError {
  code: number;
  message: string;
  PERMISSION_DENIED?: number;
  POSITION_UNAVAILABLE?: number;
  TIMEOUT?: number;
}

// FIXED: Union type for all possible error types - now exported
export type WolfpackError = PostgrestError | Error | DatabaseError | AuthError | GeolocationError | { message: string; code?: string };

export class WolfpackErrorHandler {
  /**
   * Handle Supabase PostgrestError consistently across the app
   */
  static handleSupabaseError(
    error: WolfpackError,
    context?: ErrorContext
  ): UserFriendlyError {
    // Log error for debugging
    console.error('Wolfpack Error:', {
      error,
      context,
      timestamp: new Date().toISOString()
    });

    // Handle PostgrestError specifically
    if (this.isPostgrestError(error)) {
      return this.handlePostgrestError(error, context);
    }

    // Handle generic Error
    if (error instanceof Error) {
      return this.handleGenericError(error, context);
    }

    // Handle database errors
    if (this.isDatabaseError(error)) {
      return this.handleDatabaseError(error, context);
    }

    // Handle auth errors
    if (this.isAuthError(error)) {
      return this.handleAuthError(error);
    }

    // Handle geolocation errors
    if (this.isGeolocationError(error)) {
      return this.handleLocationError(error);
    }

    // Handle unknown error format
    return {
      message: 'An unexpected error occurred',
      type: 'error',
      retryable: true,
      action: 'Please try again'
    };
  }

  /**
   * Type guards for different error types
   */
  private static isPostgrestError(error: WolfpackError): error is PostgrestError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error && 'details' in error;
  }

  private static isDatabaseError(error: WolfpackError): error is DatabaseError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error && !('details' in error);
  }

  private static isAuthError(error: WolfpackError): error is AuthError {
    return typeof error === 'object' && error !== null && 'message' in error && 
           (error.message.includes('auth') || error.message.includes('credentials') || error.message.includes('email'));
  }

  private static isGeolocationError(error: WolfpackError): error is GeolocationError {
    return typeof error === 'object' && error !== null && 'code' in error && typeof (error as GeolocationError).code === 'number';
  }

  /**
   * Handle specific PostgrestError codes
   */
  private static handlePostgrestError(
    error: PostgrestError,
    context?: ErrorContext
  ): UserFriendlyError {
    const errorMap: Record<string, UserFriendlyError> = {
      // Authentication errors
      'PGRST301': {
        message: 'Authentication required',
        type: 'warning',
        retryable: false,
        action: 'Please sign in to continue'
      },
      'PGRST302': {
        message: 'Access denied',
        type: 'error',
        retryable: false,
        action: 'You don\'t have permission for this action'
      },

      // Data errors
      'PGRST116': {
        message: 'No data found',
        type: 'info',
        retryable: false,
        action: 'The requested information is not available'
      },
      'PGRST204': {
        message: 'No content',
        type: 'info',
        retryable: false
      },

      // Database constraint errors
      '23505': {
        message: 'Duplicate entry',
        type: 'warning',
        retryable: false,
        action: 'This action has already been completed'
      },
      '23503': {
        message: 'Related data not found',
        type: 'error',
        retryable: false,
        action: 'Please ensure all required information is provided'
      },
      '23514': {
        message: 'Invalid data provided',
        type: 'error',
        retryable: false,
        action: 'Please check your input and try again'
      },

      // Network/connection errors
      'PGRST000': {
        message: 'Connection failed',
        type: 'error',
        retryable: true,
        action: 'Please check your internet connection and try again'
      },

      // Generic SQL errors
      '42P01': {
        message: 'Service temporarily unavailable',
        type: 'error',
        retryable: true,
        action: 'Please try again in a moment'
      }
    };

    const mappedError = errorMap[error.code];
    if (mappedError) {
      return {
        ...mappedError,
        code: error.code
      };
    }

    // Default handling for unmapped PostgrestError
    return {
      message: this.getGenericErrorMessage(error.message, context),
      type: 'error',
      code: error.code,
      retryable: true,
      action: 'Please try again'
    };
  }

  /**
   * Handle database errors
   */
  private static handleDatabaseError(
    error: DatabaseError,
    context?: ErrorContext
  ): UserFriendlyError {
    return {
      message: this.getGenericErrorMessage(error.message, context),
      type: 'error',
      code: error.code,
      retryable: true,
      action: 'Please try again'
    };
  }

  /**
   * Handle generic JavaScript errors
   */
  private static handleGenericError(
    error: Error,
    context?: ErrorContext
  ): UserFriendlyError {
    // Common error patterns
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        message: 'Network connection failed',
        type: 'error',
        retryable: true,
        action: 'Please check your internet connection and try again'
      };
    }

    if (error.message.includes('permission') || error.message.includes('denied')) {
      return {
        message: 'Permission denied',
        type: 'error',
        retryable: false,
        action: 'Please enable the required permissions and try again'
      };
    }

    if (error.message.includes('timeout')) {
      return {
        message: 'Request timed out',
        type: 'error',
        retryable: true,
        action: 'Please try again'
      };
    }

    // Location-specific errors
    if (context?.operation.includes('location')) {
      if (error.message.includes('geolocation')) {
        return {
          message: 'Location access required',
          type: 'warning',
          retryable: false,
          action: 'Please enable location services and try again'
        };
      }
    }

    // Membership-specific errors
    if (context?.operation.includes('membership') || context?.operation.includes('join')) {
      if (error.message.includes('location')) {
        return {
          message: 'You must be at Side Hustle Bar to join',
          type: 'warning',
          retryable: false,
          action: 'Visit one of our locations to join the Wolf Pack'
        };
      }
    }

    return {
      message: this.getGenericErrorMessage(error.message, context),
      type: 'error',
      retryable: true,
      action: 'Please try again'
    };
  }

  /**
   * Get user-friendly error message based on operation context
   */
  private static getGenericErrorMessage(
    originalMessage: string,
    context?: ErrorContext
  ): string {
    if (!context?.operation) {
      return 'An error occurred';
    }

    const operationMessages: Record<string, string> = {
      'auth': 'Authentication failed',
      'login': 'Login failed',
      'signup': 'Sign up failed',
      'location': 'Location verification failed',
      'membership': 'Membership operation failed',
      'join': 'Failed to join Wolf Pack',
      'leave': 'Failed to leave Wolf Pack',
      'profile': 'Profile update failed',
      'chat': 'Chat operation failed',
      'event': 'Event operation failed',
      'vote': 'Voting failed',
      'order': 'Order operation failed'
    };

    // Find matching operation
    for (const [key, message] of Object.entries(operationMessages)) {
      if (context.operation.toLowerCase().includes(key)) {
        return message;
      }
    }

    return 'Operation failed';
  }

  /**
   * Get error message for specific wolfpack operations
   */
  static getWolfpackErrorMessage(operation: string, error: WolfpackError): string {
    const context: ErrorContext = { operation };
    const userError = this.handleSupabaseError(error, context);
    return userError.message;
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: WolfpackError): boolean {
    const userError = this.handleSupabaseError(error);
    return userError.retryable;
  }

  /**
   * Get suggested action for error
   */
  static getErrorAction(error: WolfpackError): string | undefined {
    const userError = this.handleSupabaseError(error);
    return userError.action;
  }

  /**
   * Log error with context for monitoring
   */
  static logError(
    error: WolfpackError,
    context: ErrorContext,
    userId?: string
  ): void {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        message: this.getErrorMessage(error),
        code: this.getErrorCode(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      context,
      userId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };

    console.error('Wolfpack Error Log:', errorLog);

    // In production, you might want to send this to an error monitoring service
    // Example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // sendToErrorMonitoring(errorLog);
    }
  }

  /**
   * Helper to safely extract error message
   */
  private static getErrorMessage(error: WolfpackError): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String(error.message);
    }
    return 'Unknown error';
  }

  /**
   * Helper to safely extract error code
   */
  private static getErrorCode(error: WolfpackError): string {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      return String(error.code);
    }
    return 'UNKNOWN';
  }

  /**
   * Create error context for consistent logging
   */
  static createContext(
    operation: string,
    additionalData?: Record<string, unknown>
  ): ErrorContext {
    return {
      operation,
      additional: additionalData
    };
  }

  /**
   * Handle authentication specific errors
   */
  static handleAuthError(error: AuthError): UserFriendlyError {
    const authErrorMap: Record<string, string> = {
      'invalid_credentials': 'Invalid email or password',
      'email_not_confirmed': 'Please confirm your email address',
      'too_many_requests': 'Too many attempts. Please try again later',
      'weak_password': 'Password is too weak',
      'email_address_invalid': 'Invalid email address',
      'signup_disabled': 'Sign up is currently disabled',
      'email_address_not_authorized': 'This email is not authorized',
      'invalid_request': 'Invalid request format'
    };

    const message = authErrorMap[error.message] || 'Authentication failed';

    return {
      message,
      type: 'error',
      retryable: error.message !== 'email_address_not_authorized',
      action: error.message === 'email_not_confirmed' 
        ? 'Check your email for confirmation link' 
        : 'Please try again'
    };
  }

  /**
   * Handle location specific errors
   */
  static handleLocationError(error: GeolocationError): UserFriendlyError {
    if (error.code === 1) { // PERMISSION_DENIED
      return {
        message: 'Location access denied',
        type: 'warning',
        retryable: false,
        action: 'Please enable location services in your browser settings'
      };
    }

    if (error.code === 2) { // POSITION_UNAVAILABLE
      return {
        message: 'Location unavailable',
        type: 'error',
        retryable: true,
        action: 'Please try again or ensure GPS is enabled'
      };
    }

    if (error.code === 3) { // TIMEOUT
      return {
        message: 'Location request timed out',
        type: 'error',
        retryable: true,
        action: 'Please try again'
      };
    }

    return {
      message: 'Location verification failed',
      type: 'error',
      retryable: true,
      action: 'Please ensure location services are enabled'
    };
  }
}

// =============================================================================
// TABLE CONSTANTS
// =============================================================================

export const WOLFPACK_TABLES = {
  DJ_BROADCASTS: 'dj_broadcasts',
  WOLF_CHAT: 'wolfpack_chat_messages',
  USERS: 'users',
  LOCATIONS: 'locations',
  EVENTS: 'dj_events',
  ORDERS: 'orders'
} as const;

// =============================================================================
// TYPED INTERFACES FOR DATABASE OPERATIONS
// =============================================================================

// FIXED: Added missing title field and made all fields match database schema
interface DJBroadcastInsert {
  dj_id: string;
  location_id: string;
  message: string;
  title: string; // REQUIRED field - was missing
  broadcast_type: string;
  created_at: string;
}

// FIXED: Corrected field name to match database schema
interface ChatMessageInsert {
  session_id: string;
  user_id: string; // FIXED: Changed from 'id' to 'user_id'
  display_name: string;
  avatar_url: string | null;
  content: string;
  message_type: string;
  created_at: string;
  is_flagged: boolean;
  is_deleted: boolean;
}

interface DJEventInsert {
  dj_id: string;
  location_id: string;
  event_type: string;
  title: string;
  description: string | null;
  status: string;
  voting_ends_at: string | null;
  created_at: string;
  started_at: string;
  voting_format: string | null;
  options?: Json | null;
}

interface UserData {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  profile_image_url: string | null;
  wolf_emoji: string | null;
  vibe_status: string | null;
  last_activity: string | null;
  is_online: boolean | null;
  wolfpack_status: string | null;
  is_wolfpack_member: boolean | null;
}

// =============================================================================
// WOLFPACK BACKEND SERVICE - PROPERLY TYPED
// =============================================================================

export class WolfpackBackendService {
  
  /**
   * DJ Broadcast operations - properly typed
   */
  static async createDJBroadcast(
    djId: string,
    locationId: string,
    message: string,
    broadcastType: string = 'general'
  ) {
    try {
      // Generate title based on broadcast type
      const typeToTitle: Record<string, string> = {
        announcement: 'DJ Announcement',
        howl_request: 'Howl Request',
        contest_announcement: 'Contest Alert',
        song_request: 'Song Request',
        general: 'DJ Broadcast'
      };

      const insertData: DJBroadcastInsert = {
        dj_id: djId,
        location_id: locationId,
        message,
        title: typeToTitle[broadcastType] || 'DJ Broadcast', // FIXED: Added required title
        broadcast_type: broadcastType,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('dj_broadcasts')
        .insert(insertData)
        .select('*');

      if (error) {
        const userError = WolfpackErrorHandler.handleSupabaseError(error, {
          operation: 'create_dj_broadcast'
        });
        
        errorTracker.logError(error, {
          feature: 'database',
          action: 'create_dj_broadcast',
          component: 'WolfpackBackendService'
        });
        
        return { data: null, error: userError.message };
      }

      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create DJ broadcast';
      
      errorTracker.logError(error as Error, {
        feature: 'database',
        action: 'create_dj_broadcast',
        component: 'WolfpackBackendService'
      });
      
      captureError(error instanceof Error ? error : new Error(errorMessage), {
        source: 'WolfpackService.backend.createDJBroadcast',
        context: { djId, locationId, message, broadcastType }
      });

      return { data: null, error: errorMessage };
    }
  }

  static async getDJBroadcasts(locationId: string, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('dj_broadcasts')
        .select(`
          *,
          dj:users!dj_broadcasts_dj_id_fkey(
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('location_id', locationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        const userError = WolfpackErrorHandler.handleSupabaseError(error, {
          operation: 'get_dj_broadcasts'
        });
        
        errorTracker.logError(error, {
          feature: 'database',
          action: 'get_dj_broadcasts',
          component: 'WolfpackBackendService'
        });
        
        return { data: null, error: userError.message };
      }

      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get DJ broadcasts';
      
      errorTracker.logError(error as Error, {
        feature: 'database',
        action: 'get_dj_broadcasts',
        component: 'WolfpackBackendService'
      });

      return { data: null, error: errorMessage };
    }
  }

  /**
   * Chat message operations - properly typed
   */
  static async createChatMessage(
    sessionId: string,
    userId: string,
    displayName: string,
    content: string,
    messageType: string = 'text',
    avatarUrl?: string
  ) {
    try {
      const insertData: ChatMessageInsert = {
        session_id: sessionId,
        user_id: userId, // FIXED: Use user_id instead of id
        display_name: displayName,
        avatar_url: avatarUrl || null,
        content: content,
        message_type: messageType,
        created_at: new Date().toISOString(),
        is_flagged: false,
        is_deleted: false
      };

      const { data, error } = await supabase
        .from('wolfpack_chat_messages')
        .insert(insertData)
        .select('*');

      if (error) {
        const userError = WolfpackErrorHandler.handleSupabaseError(error, {
          operation: 'create_chat_message'
        });
        
        errorTracker.logError(error, {
          feature: 'database',
          action: 'create_chat_message',
          component: 'WolfpackBackendService'
        });
        
        return { data: null, error: userError.message };
      }

      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create chat message';
      
      errorTracker.logError(error as Error, {
        feature: 'database',
        action: 'create_chat_message',
        component: 'WolfpackBackendService'
      });
      
      captureError(error instanceof Error ? error : new Error(errorMessage), {
        source: 'WolfpackService.backend.createChatMessage',
        context: { sessionId, userId, displayName, content, messageType }
      });

      return { data: null, error: errorMessage };
    }
  }

  /**
   * DJ Event operations - properly typed with fixed interface
   */
  static async createDJEvent(
    djId: string,
    locationId: string,
    eventType: string,
    title: string,
    description?: string,
    votingEndsAt?: string,
    options?: Json | null,
    votingFormat?: string
  ) {
    try {
      const insertData: DJEventInsert = {
        dj_id: djId,
        location_id: locationId,
        event_type: eventType,
        title,
        description: description || null,
        status: 'active',
        voting_ends_at: votingEndsAt || null,
        created_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        voting_format: votingFormat || null,
        options: options || null
      };

      const { data, error } = await supabase
        .from('dj_events')
        .insert(insertData)
        .select('*');

      if (error) {
        const userError = WolfpackErrorHandler.handleSupabaseError(error, {
          operation: 'create_dj_event'
        });
        
        errorTracker.logError(error, {
          feature: 'database',
          action: 'create_dj_event',
          component: 'WolfpackBackendService'
        });
        
        return { data: null, error: userError.message };
      }

      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create DJ event';
      
      errorTracker.logError(error as Error, {
        feature: 'database',
        action: 'create_dj_event',
        component: 'WolfpackBackendService'
      });
      
      captureError(error instanceof Error ? error : new Error(errorMessage), {
        source: 'WolfpackService.backend.createDJEvent',
        context: { djId, locationId, eventType, title }
      });

      return { data: null, error: errorMessage };
    }
  }

  static async getDJEvents(locationId: string, status?: string[]) {
    try {
      let query = supabase
        .from('dj_events')
        .select(`
          *,
          dj:users!dj_events_dj_id_fkey(
            id,
            display_name,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('location_id', locationId);

      if (status && status.length > 0) {
        query = query.in('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        const userError = WolfpackErrorHandler.handleSupabaseError(error, {
          operation: 'get_dj_events'
        });
        
        errorTracker.logError(error, {
          feature: 'database',
          action: 'get_dj_events',
          component: 'WolfpackBackendService'
        });
        
        return { data: null, error: userError.message };
      }

      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get DJ events';
      
      errorTracker.logError(error as Error, {
        feature: 'database',
        action: 'get_dj_events',
        component: 'WolfpackBackendService'
      });

      return { data: null, error: errorMessage };
    }
  }

  /**
   * User/Pack member operations - properly typed
   */
  static async getWolfpackMembers(locationId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          display_name,
          first_name,
          last_name,
          avatar_url,
          profile_image_url,
          wolf_emoji,
          vibe_status,
          last_activity,
          is_online,
          wolfpack_status,
          is_wolfpack_member
        `)
        .eq('location_id', locationId)
        .eq('is_wolfpack_member', true)
        .eq('wolfpack_status', 'active')
        .order('last_activity', { ascending: false });

      if (error) {
        const userError = WolfpackErrorHandler.handleSupabaseError(error, {
          operation: 'get_wolf-pack-members'
        });
        
        errorTracker.logError(error, {
          feature: 'database',
          action: 'get_wolf-pack-members',
          component: 'WolfpackBackendService'
        });
        
        return { data: null, error: userError.message };
      }

      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get wolfpack members';
      
      errorTracker.logError(error as Error, {
        feature: 'database',
        action: 'get_wolf-pack-members',
        component: 'WolfpackBackendService'
      });

      return { data: null, error: errorMessage };
    }
  }

  /**
   * DEPRECATED: Generic operations - use specific methods above instead
   * These are kept for backwards compatibility but should not be used in new code
   */
  static async insert(
    table: string,
    data: Record<string, unknown>
  ): Promise<{ data: unknown[] | null; error: string | null }> {
    console.warn(`[DEPRECATED] Using generic insert for table ${table}. Use specific methods instead.`);
    
    // Route to specific methods for known tables
    switch (table) {
      case 'dj_broadcasts':
      case WOLFPACK_TABLES.DJ_BROADCASTS:
        return this.createDJBroadcast(
          data.dj_id as string,
          data.location_id as string,
          data.message as string,
          data.broadcast_type as string
        );
      
      case 'wolfpack_chat_messages':
      case WOLFPACK_TABLES.WOLF_CHAT: // FIXED: Removed syntax error
        return this.createChatMessage(
          data.session_id as string,
          data.user_id as string, // FIXED: Use user_id
          data.display_name as string,
          (data.content as string) || (data.message as string), // Handle both field names
          data.message_type as string,
          data.avatar_url as string
        );
      
      case 'dj_events':
      case WOLFPACK_TABLES.EVENTS:
        return this.createDJEvent(
          data.dj_id as string,
          data.location_id as string,
          data.event_type as string,
          data.title as string,
          data.description as string,
          data.voting_ends_at as string,
          data.options as Json,
          data.voting_format as string
        );
      
      default:
        return {
          data: null,
          error: `Table ${table} not supported. Please use specific methods.`
        };
    }
  }

  static async select(
    table: string,
    columns?: string,
    filters?: Record<string, unknown>,
    options?: {
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
      single?: boolean;
    }
  ): Promise<{ data: unknown[] | unknown | null; error: string | null }> {
    console.warn(`[DEPRECATED] Using generic select for table ${table}. Use specific methods instead.`);
    
    // Note: columns parameter available for future use but not currently implemented
    // This avoids the unused parameter warning while keeping the API consistent
    
    // Route to specific methods for known tables
    switch (table) {
      case 'dj_broadcasts':
      case WOLFPACK_TABLES.DJ_BROADCASTS:
        if (filters?.location_id) {
          return this.getDJBroadcasts(
            filters.location_id as string,
            options?.limit || 10
          );
        }
        break;
      
      case 'dj_events':
      case WOLFPACK_TABLES.EVENTS:
        if (filters?.location_id) {
          return this.getDJEvents(filters.location_id as string);
        }
        break;
      
      case 'users':
      case WOLFPACK_TABLES.USERS:
        if (filters?.location_id && filters?.is_wolfpack_member) {
          return this.getWolfpackMembers(filters.location_id as string);
        }
        break;
      
      default:
        return {
          data: null,
          error: `Table ${table} not supported. Please use specific methods.`
        };
    }
    
    return {
      data: null,
      error: `Invalid query parameters for table ${table}`
    };
  }
}

/**
 * SIMPLIFIED ENHANCED SERVICE
 * If you need simpler methods without extensive error handling, use these
 */
export class WolfpackSimpleService {
  static async createEvent(params: {
    dj_id: string;
    location_id: string;
    event_type: string;
    title: string;
    description?: string;
    duration: number;
    options?: string[];
    voting_format?: string;
  }) {
    const now = new Date();
    const voting_ends_at = new Date(now.getTime() + params.duration * 60 * 1000);
    
    return WolfpackService.backend.createDJEvent(
      params.dj_id,
      params.location_id,
      params.event_type,
      params.title,
      params.description,
      voting_ends_at.toISOString(),
      { options: params.options },
      params.voting_format
    );
  }

  static async createBroadcast(params: {
    dj_id: string;
    location_id: string;
    message: string;
    broadcast_type: string;
  }) {
    return WolfpackService.backend.createDJBroadcast(
      params.dj_id,
      params.location_id,
      params.message,
      params.broadcast_type
    );
  }

  static async createChatMessage(params: {
    session_id: string;
    user_id: string; // FIXED: Changed from 'id' to 'user_id'
    display_name: string;
    avatar_url?: string;
    content: string;
    message_type: string;
  }) {
    return WolfpackService.backend.createChatMessage(
      params.session_id,
      params.user_id, // FIXED: Use user_id
      params.display_name,
      params.content,
      params.message_type,
      params.avatar_url
    );
  }

  static async getActivePackMembers(location_id: string) {
    const result = await WolfpackService.backend.getWolfpackMembers(location_id);
    
    if (result.error || !result.data) {
      return { data: [], error: result.error };
    }

    // Transform to match frontend interface
    const transformedData = (result.data as UserData[]).map(user => ({
      id: user.id,
      displayName: user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Pack Member',
      profilePicture: user.profile_image_url || user.avatar_url || '/images/avatar-placeholder.png',
      vibeStatus: user.wolf_emoji || '🐺',
      isOnline: user.is_online || this.isRecentlyActive(user.last_activity ?? undefined),
      lastSeen: user.last_activity || new Date().toISOString()
    }));

    return { data: transformedData, error: null };
  }

  private static isRecentlyActive(lastActivity?: string | null): boolean {
    if (!lastActivity) return false;
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return new Date(lastActivity).getTime() > fiveMinutesAgo;
  }
}