import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface CreateEventRequest {
  title: string;
  event_type: 'poll' | 'contest' | 'dance_battle' | 'hottest_person' | 'best_costume' | 'name_that_tune' | 'song_request' | 'next_song_vote' | 'trivia' | 'custom';
  options?: string[];
  location_id: string;
  duration?: number;
  description?: string;
  voting_format?: 'binary' | 'multiple_choice' | 'participant';
}

interface EventData {
  id: string;
  dj_id: string;
  location_id: string;
  event_type: string;
  title: string;
  description: string | null;
  status: string;
  voting_ends_at: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  winner_id: string | null;
  winner_data: unknown | null;
  event_config: unknown | null;
  voting_format: string | null;
  options: unknown | null;
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

interface CreateEventResponse {
  success: true;
  event_id: string;
  event_type: string;
  title: string;
  voting_ends_at: string;
  created_at: string;
  options: string[] | null;
  status: string;
}

interface ErrorResponse {
  error: string;
  code: string;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

const VALID_EVENT_TYPES = [
  'poll', 'contest', 'dance_battle', 'hottest_person', 'best_costume',
  'name_that_tune', 'song_request', 'next_song_vote', 'trivia', 'custom'
] as const;

const VALID_VOTING_FORMATS = ['binary', 'multiple_choice', 'participant'] as const;

function validateEventType(eventType: string): eventType is typeof VALID_EVENT_TYPES[number] {
  return VALID_EVENT_TYPES.includes(eventType as typeof VALID_EVENT_TYPES[number]);
}

function validateVotingFormat(format: string): format is typeof VALID_VOTING_FORMATS[number] {
  return VALID_VOTING_FORMATS.includes(format as typeof VALID_VOTING_FORMATS[number]);
}

function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

function sanitizeString(input: string, maxLength = 500): string {
  return input.trim().slice(0, maxLength).replace(/[<>]/g, '');
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
  // Get user data with proper typing
  const { data: userData, error } = await supabase
    .from('users')
    .select('id, role, display_name, first_name, last_name, avatar_url, email')
    .eq('id', user.id)
    .single();

  if (error || !userData) {
    throw new Error('User data not found');
  }

  const typedUserData = userData as UserData;
  const isDJ = typedUserData.role === 'dj' || 
               typedUserData.role === 'admin';

  if (!isDJ) {
    throw new Error('DJ permissions required');
  }

  return typedUserData;
}

// =============================================================================
// BUSINESS LOGIC
// =============================================================================

function generateEventDescription(eventType: string, title: string, djName: string): string {
  const descriptions: Record<string, string> = {
    poll: `🗳️ Join this poll created by DJ ${djName}!`,
    contest: `🏆 Join this contest created by DJ ${djName}!`,
    dance_battle: `💃 Dance battle time! DJ ${djName} wants to see your moves!`,
    hottest_person: `🔥 Vote for the hottest person! Event by DJ ${djName}`,
    best_costume: `👗 Best costume contest! Show off your style! By DJ ${djName}`,
    name_that_tune: `🎵 Name that tune! Test your music knowledge with DJ ${djName}`,
    song_request: `🎶 Song request event! Tell DJ ${djName} what you want to hear!`,
    next_song_vote: `🎧 Vote for the next song! DJ ${djName} needs your input!`,
    trivia: `🧠 Trivia time! Test your knowledge with DJ ${djName}`,
    custom: `✨ ${title} - Special event by DJ ${djName}!`
  };

  return descriptions[eventType] || `Join this ${eventType} created by DJ ${djName}!`;
}

function generateChatAnnouncement(eventType: string, title: string): string {
  const announcements: Record<string, string> = {
    poll: `🗳️ NEW POLL: ${title} - Vote now!`,
    contest: `🏆 NEW CONTEST: ${title} - Join the competition!`,
    dance_battle: `💃 DANCE BATTLE: ${title} - Show your moves!`,
    hottest_person: `🔥 HOTTEST PERSON: ${title} - Cast your votes!`,
    best_costume: `👗 COSTUME CONTEST: ${title} - Show off your style!`,
    name_that_tune: `🎵 NAME THAT TUNE: ${title} - Test your music knowledge!`,
    song_request: `🎶 SONG REQUESTS: ${title} - Tell us what you want to hear!`,
    next_song_vote: `🎧 VOTE FOR NEXT SONG: ${title} - Help choose the music!`,
    trivia: `🧠 TRIVIA TIME: ${title} - Test your knowledge!`,
    custom: `✨ NEW EVENT: ${title} - Join in!`
  };

  return announcements[eventType] || `🎉 NEW EVENT: ${title} - Join now!`;
}

// =============================================================================
// MAIN API HANDLER
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<CreateEventResponse | ErrorResponse>> {
  try {
    const supabase = await createServerClient();
    
    // 1. Authentication
    const user = await authenticateUser(supabase);
    
    // 2. Parse and validate request body
    const body = await request.json() as CreateEventRequest;
    const { 
      title, 
      event_type, 
      options = [], 
      location_id, 
      duration = 600,
      description,
      voting_format = 'multiple_choice'
    } = body;

    // 3. Input validation
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!event_type?.trim()) {
      return NextResponse.json(
        { error: 'Event type is required', code: 'VALIDATION_ERROR' },
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

    if (!validateEventType(event_type)) {
      return NextResponse.json(
        { error: `Event type must be one of: ${VALID_EVENT_TYPES.join(', ')}`, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!validateVotingFormat(voting_format)) {
      return NextResponse.json(
        { error: `Voting format must be one of: ${VALID_VOTING_FORMATS.join(', ')}`, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate poll-specific requirements
    if ((event_type === 'poll' || event_type === 'next_song_vote') && options.length < 2) {
      return NextResponse.json(
        { error: 'Polls require at least 2 options', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate duration
    if (duration < 60 || duration > 3600) {
      return NextResponse.json(
        { error: 'Duration must be between 60 seconds and 1 hour', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // 4. Authorization
    const userData = await verifyDJPermissions(supabase, user);

    // 5. Get display name for DJ
    const djDisplayName = userData.display_name || 
                         `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 
                         userData.email.split('@')[0] || 
                         'DJ';

    // 6. Create event data
    const now = new Date();
    const votingEndsAt = new Date(now.getTime() + duration * 1000);

    const eventData = {
      dj_id: user.id,
      location_id: sanitizeString(location_id),
      event_type,
      title: sanitizeString(title, 200),
      description: description ? sanitizeString(description, 1000) : generateEventDescription(event_type, title, djDisplayName),
      status: 'active',
      voting_ends_at: votingEndsAt.toISOString(),
      created_at: now.toISOString(),
      started_at: now.toISOString(),
      voting_format,
      event_config: {
        duration,
        created_by: user.id,
        options: options.map(opt => sanitizeString(opt, 100)),
        dj_name: djDisplayName
      },
      options: options.length > 0 ? options.map(opt => sanitizeString(opt, 100)) : null
    };

    // 7. Insert event into database
    const { data: eventRecords, error: insertError } = await supabase
      .from('dj_events')
      .insert(eventData)
      .select('*');

    if (insertError) {
      console.error('Event creation failed:', insertError);
      throw new Error(`Failed to create event: ${insertError.message}`);
    }

    const eventRecord = eventRecords?.[0] as EventData | undefined;
    if (!eventRecord) {
      throw new Error('Event was created but no data returned');
    }

    // 8. Create announcement in chat
    const announcementMessage = generateChatAnnouncement(event_type, title);

    try {
      // Use direct Supabase client instead of service layer for chat
      const { error: chatError } = await supabase
        .from('wolfpack_chat_messages')
        .insert({
          session_id: `location_${location_id}`,
          user_id: user.id,
          display_name: djDisplayName,
          avatar_url: userData.avatar_url,
          content: announcementMessage,
          message_type: 'dj_broadcast',
          is_flagged: false,
          is_deleted: false
        });

      if (chatError) {
        console.warn('Failed to create chat announcement:', chatError);
      }
    } catch (chatError: unknown) {
      // Log but don't fail the event creation
      console.warn('Failed to create chat announcement:', chatError);
    }

    // 9. Return success response
    return NextResponse.json({
      success: true,
      event_id: eventRecord.id,
      event_type: eventRecord.event_type,
      title: eventRecord.title,
      voting_ends_at: eventRecord.voting_ends_at || votingEndsAt.toISOString(),
      created_at: eventRecord.created_at,
      options: options.length > 0 ? options : null,
      status: eventRecord.status
    });

  } catch (error: unknown) {
    console.error('DJ event creation error:', error);
    
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
    }

    // Create a proper error object
    const errorToHandle = error instanceof Error ? error : new Error(
      typeof error === 'string' ? error : 'Unknown error occurred'
    );

    return NextResponse.json(
      { error: errorToHandle.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}