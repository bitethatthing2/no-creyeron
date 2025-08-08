import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { WolfpackService } from '@/lib/services/wolfpack';
import { BroadcastStatusService } from '@/lib/services/broadcast-status.service';
import type { User } from '@supabase/supabase-js';

// =============================================================================
// TABLE CONSTANTS
// =============================================================================

const WOLFPACK_TABLES = {
  DJ_BROADCASTS: 'dj_broadcasts',
  WOLFPACK_CHAT_MESSAGES: 'wolfpack_chat_messages',
  USERS: 'users',
  LOCATIONS: 'locations'
} as const;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface BroadcastRequest {
  message: string;
  location_id: string;
  broadcast_type?: 'announcement' | 'howl_request' | 'contest_announcement' | 'song_request' | 'general';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface UserData {
  id: string;
  role: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  email: string;
}

interface BroadcastData {
  id: string;
  dj_id: string;
  location_id: string;
  message: string;
  title: string;
  broadcast_type: string;
  created_at: string;
}

interface ChatData {
  id: string;
  session_id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  content: string;
  message_type: string;
  created_at: string;
  is_flagged: boolean;
  is_deleted: boolean;
}

interface BroadcastResponse {
  success: true;
  broadcast_id: string;
  chat_message_id: string | null;
  created_at: string;
  message: string;
  broadcast_type: string;
}

interface ErrorResponse {
  error: string;
  code: string;
}

interface BroadcastWithUser {
  id: string;
  message: string;
  broadcast_type: string;
  created_at: string;
  users: {
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface GetBroadcastsResponse {
  broadcasts: BroadcastWithUser[];
  total: number;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

const VALID_BROADCAST_TYPES = [
  'announcement', 
  'howl_request', 
  'contest_announcement', 
  'song_request', 
  'general'
] as const;

const VALID_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;

function validateBroadcastType(type: string): type is typeof VALID_BROADCAST_TYPES[number] {
  return VALID_BROADCAST_TYPES.includes(type as typeof VALID_BROADCAST_TYPES[number]);
}

function validatePriority(priority: string): priority is typeof VALID_PRIORITIES[number] {
  return VALID_PRIORITIES.includes(priority as typeof VALID_PRIORITIES[number]);
}

function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

function sanitizeMessage(message: string): string {
  return message
    .trim()
    .slice(0, 1000) // Max 1000 characters for broadcasts
    .replace(/[<>]/g, '') // Basic XSS prevention
    .replace(/\s+/g, ' '); // Normalize whitespace
}

// =============================================================================
// AUTHENTICATION & AUTHORIZATION
// =============================================================================

async function authenticateUser(supabase: Awaited<ReturnType<typeof createClient>>): Promise<User> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Authentication required');
  }

  return user;
}

async function verifyDJPermissions(supabase: Awaited<ReturnType<typeof createClient>>, user: User): Promise<UserData> {
  // Verify user through auth service
  const authResult = await WolfpackService.auth.verifyUser(user);
  if (!authResult.isVerified) {
    throw new Error('User verification failed');
  }

  // Get user data with proper typing
  const { data: userData, error } = await supabase
    .from(WOLFPACK_TABLES.USERS)
    .select('id, role, display_name, first_name, last_name, avatar_url, email')
    .eq('id', user.id)
    .single();

  if (error || !userData) {
    throw new Error('User data not found');
  }

  const typedUserData = userData as UserData;
  const isDJ = typedUserData.role === 'dj' || 
               typedUserData.role === 'admin' || 
               authResult.isVipUser;

  if (!isDJ) {
    throw new Error('DJ permissions required');
  }

  return typedUserData;
}

// =============================================================================
// BUSINESS LOGIC
// =============================================================================

function generateChatMessage(message: string, broadcastType: string, djName: string): string {
  const typeEmojis: Record<string, string> = {
    announcement: '📢',
    howl_request: '🐺',
    contest_announcement: '🏆',
    song_request: '🎵',
    general: '🎧'
  };

  const emoji = typeEmojis[broadcastType] || '🎧';
  
  switch (broadcastType) {
    case 'howl_request':
      return `${emoji} DJ ${djName} wants to hear your HOWL! ${message}`;
    case 'contest_announcement':
      return `${emoji} CONTEST ALERT from DJ ${djName}: ${message}`;
    case 'song_request':
      return `${emoji} DJ ${djName} is taking requests: ${message}`;
    case 'announcement':
      return `${emoji} DJ ANNOUNCEMENT from ${djName}: ${message}`;
    default:
      return `${emoji} DJ ${djName}: ${message}`;
  }
}

// =============================================================================
// ENHANCED ERROR HANDLING & LOGGING
// =============================================================================

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  code?: string;
}

class BroadcastService {
  static async createBroadcastRecord(
    userId: string, 
    locationId: string, 
    message: string, 
    broadcastType: string
  ): Promise<ServiceResult<BroadcastData>> {
    try {
      // Generate a title based on broadcast type
      const typeToTitle: Record<string, string> = {
        announcement: 'DJ Announcement',
        howl_request: 'Howl Request',
        contest_announcement: 'Contest Alert',
        song_request: 'Song Request',
        general: 'DJ Broadcast'
      };

      // Set default expiration time (5 minutes from now)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

      const broadcastData = {
        dj_id: userId,
        location_id: locationId,
        message: sanitizeMessage(message),
        title: typeToTitle[broadcastType] || 'DJ Broadcast',
        broadcast_type: broadcastType,
        status: 'active',
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        sent_at: now.toISOString()
      };

      const result = await WolfpackService.backend.insert(
        WOLFPACK_TABLES.DJ_BROADCASTS,
        broadcastData
      );

      if (result.error || !result.data?.[0]) {
        return {
          data: null,
          error: `Failed to create broadcast: ${result.error}`,
          code: 'DB_INSERT_ERROR'
        };
      }

      return {
        data: result.data[0] as BroadcastData,
        error: null
      };
    } catch (error) {
      console.error('Error creating broadcast record:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'SERVICE_ERROR'
      };
    }
  }

  static async createChatRecord(
    userId: string,
    locationId: string,
    message: string,
    broadcastType: string,
    djName: string,
    avatarUrl?: string
  ): Promise<ServiceResult<ChatData>> {
    try {
      const chatMessage = generateChatMessage(message, broadcastType, djName);
      
      const chatData = {
        session_id: `location_${locationId}`,
        user_id: userId,
        display_name: djName,
        avatar_url: avatarUrl || null,
        content: chatMessage,
        message_type: 'dj_broadcast',
        created_at: new Date().toISOString(),
        is_flagged: false,
        is_deleted: false
      };

      const result = await WolfpackService.backend.insert(
        WOLFPACK_TABLES.WOLFPACK_CHAT_MESSAGES,
        chatData
      );

      if (result.error || !result.data?.[0]) {
        return {
          data: null,
          error: `Failed to create chat message: ${result.error}`,
          code: 'DB_INSERT_ERROR'
        };
      }

      return {
        data: result.data[0] as ChatData,
        error: null
      };
    } catch (error) {
      console.error('Error creating chat record:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'SERVICE_ERROR'
      };
    }
  }
}

async function validateLocationAccess(supabase: Awaited<ReturnType<typeof createClient>>, locationId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(WOLFPACK_TABLES.LOCATIONS)
      .select('id, is_active')
      .eq('id', locationId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.is_active === true;
  } catch {
    return false;
  }
}

// =============================================================================
// RATE LIMITING
// =============================================================================

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_BROADCASTS_PER_MINUTE = 5;
const broadcastHistory = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userHistory = broadcastHistory.get(userId) || [];
  
  // Remove timestamps older than the window
  const recentBroadcasts = userHistory.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  // Update the history
  broadcastHistory.set(userId, recentBroadcasts);
  
  return recentBroadcasts.length < MAX_BROADCASTS_PER_MINUTE;
}

function recordBroadcast(userId: string): void {
  const now = Date.now();
  const userHistory = broadcastHistory.get(userId) || [];
  userHistory.push(now);
  broadcastHistory.set(userId, userHistory);
}

// =============================================================================
// MAIN API HANDLER
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<BroadcastResponse | ErrorResponse>> {
  try {
    const supabase = await createServerClient();
    
    // 1. Authentication
    const user = await authenticateUser(supabase);
    
    // 2. Rate limiting check
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 5 broadcasts per minute.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }
    
    // 3. Parse and validate request body
    const body = await request.json() as BroadcastRequest;
    const { 
      message, 
      location_id, 
      broadcast_type = 'general',
      priority = 'normal'
    } = body;

    // 4. Input validation
    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (message.trim().length < 3) {
      return NextResponse.json(
        { error: 'Message must be at least 3 characters long', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!location_id?.trim()) {
      return NextResponse.json(
        { error: 'Location ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!validateUUID(location_id)) {
      return NextResponse.json(
        { error: 'Invalid location ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!validateBroadcastType(broadcast_type)) {
      return NextResponse.json(
        { error: `Broadcast type must be one of: ${VALID_BROADCAST_TYPES.join(', ')}`, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!validatePriority(priority)) {
      return NextResponse.json(
        { error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // 5. Authorization
    const userData = await verifyDJPermissions(supabase, user);

    // 6. Validate location access
    const hasLocationAccess = await validateLocationAccess(supabase, location_id);
    if (!hasLocationAccess) {
      return NextResponse.json(
        { error: 'Location not found or inactive', code: 'LOCATION_ERROR' },
        { status: 404 }
      );
    }

    // 7. Get DJ display name
    const djDisplayName = WolfpackService.auth.getUserDisplayName(user) || 
                         userData.display_name || 
                         `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 
                         userData.email.split('@')[0] || 
                         'DJ';

    // 8. Create broadcast record
    const broadcastResult = await BroadcastService.createBroadcastRecord(
      user.id, 
      location_id, 
      message, 
      broadcast_type
    );

    if (broadcastResult.error || !broadcastResult.data) {
      throw new Error(broadcastResult.error || 'Failed to create broadcast');
    }

    const broadcastRecord = broadcastResult.data;

    // 9. Create chat message (non-blocking)
    const chatResult = await BroadcastService.createChatRecord(
      user.id,
      location_id,
      message,
      broadcast_type,
      djDisplayName,
      WolfpackService.auth.getUserAvatarUrl(user) || userData.avatar_url
    );

    // Log chat creation issues but don't fail the broadcast
    if (chatResult.error) {
      console.warn('Chat message creation failed:', chatResult.error);
    }

    // 10. Record broadcast for rate limiting
    recordBroadcast(user.id);

    // 11. Return success response
    return NextResponse.json({
      success: true,
      broadcast_id: broadcastRecord.id,
      chat_message_id: chatResult.data?.id || null,
      created_at: broadcastRecord.created_at,
      message: broadcastRecord.message,
      broadcast_type: broadcastRecord.broadcast_type
    });

  } catch (error: unknown) {
    console.error('DJ broadcast error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required', code: 'AUTH_ERROR' },
          { status: 401 }
        );
      }
      
      if (error.message === 'User verification failed') {
        return NextResponse.json(
          { error: 'User verification failed', code: 'AUTH_ERROR' },
          { status: 401 }
        );
      }
      
      if (error.message === 'DJ permissions required') {
        return NextResponse.json(
          { error: 'DJ permissions required', code: 'PERMISSION_ERROR' },
          { status: 403 }
        );
      }

      if (error.message === 'User data not found') {
        return NextResponse.json(
          { error: 'User profile not found', code: 'USER_ERROR' },
          { status: 404 }
        );
      }
    }

    // Create a proper error object for WolfpackErrorHandler
    const errorToHandle = error instanceof Error ? error : new Error(
      typeof error === 'string' ? error : 'Unknown error occurred'
    );

    // Handle Supabase errors
    const userError = WolfpackErrorHandler.handleSupabaseError(errorToHandle, {
      operation: 'dj_broadcast'
    });

    return NextResponse.json(
      { error: userError.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET BROADCASTS (Optional endpoint for fetching recent broadcasts)
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<GetBroadcastsResponse | ErrorResponse>> {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('location_id');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Authentication
    await authenticateUser(supabase);

    if (!locationId || !validateUUID(locationId)) {
      return NextResponse.json(
        { error: 'Valid location ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Get recent broadcasts
    const { data: broadcasts, error } = await supabase
      .from(WOLFPACK_TABLES.DJ_BROADCASTS)
      .select(`
        id,
        message,
        broadcast_type,
        created_at,
        users:dj_id (
          display_name,
          first_name,
          last_name
        )
      `)
      .eq('location_id', locationId)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 50)); // Cap at 50

    if (error) {
      throw error;
    }

    // Safely type the response data
    const typedBroadcasts: BroadcastWithUser[] = [];
    
    if (broadcasts) {
      for (const broadcast of broadcasts) {
        // Type guard to ensure the data matches our expected structure
        if (
          broadcast &&
          typeof broadcast === 'object' &&
          'id' in broadcast &&
          'message' in broadcast &&
          'broadcast_type' in broadcast &&
          'created_at' in broadcast
        ) {
          typedBroadcasts.push({
            id: broadcast.id as string,
            message: broadcast.message as string,
            broadcast_type: broadcast.broadcast_type as string,
            created_at: broadcast.created_at as string,
            users: broadcast.users as {
              display_name: string | null;
              first_name: string | null;
              last_name: string | null;
            } | null
          });
        }
      }
    }

    return NextResponse.json({
      broadcasts: typedBroadcasts,
      total: typedBroadcasts.length
    });

  } catch (error: unknown) {
    console.error('Get broadcasts error:', error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch broadcasts', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}