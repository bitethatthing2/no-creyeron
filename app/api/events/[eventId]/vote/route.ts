import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { WolfpackBackendService, WOLFPACK_TABLES, WolfpackErrorHandler } from '@/lib/services/wolfpack';
import { WolfpackService } from '@/lib/services/wolfpack';
import type { User } from '@supabase/supabase-js';

// =============================================================================
// TYPE DEFINITIONS - Database types
// =============================================================================

// If you have generated Supabase types, uncomment and update the import path:
// import { Database } from '@/lib/supabase/database.types';

// Temporary type definitions until proper database types are imported
type Json = 
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

interface Database {
  public: {
    Tables: {
      dj_events: {
        Row: {
          id: string;
          dj_id: string | null;
          location_id: string | null;
          event_type: string;
          title: string;
          description: string | null;
          status: string | null;
          voting_ends_at: string | null;
          created_at: string | null;
          started_at: string | null;
          ended_at: string | null;
          winner_id: string | null;
          winner_data: Json | null;
          event_config: Json | null;
          voting_format: string | null;
          options: Json | null;
        };
        Insert: {
          id?: string;
          dj_id?: string | null;
          location_id?: string | null;
          event_type: string;
          title: string;
          description?: string | null;
          status?: string | null;
          voting_ends_at?: string | null;
          created_at?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          winner_id?: string | null;
          winner_data?: Json | null;
          event_config?: Json | null;
          voting_format?: string | null;
          options?: Json | null;
        };
        Update: {
          id?: string;
          dj_id?: string | null;
          location_id?: string | null;
          event_type?: string;
          title?: string;
          description?: string | null;
          status?: string | null;
          voting_ends_at?: string | null;
          created_at?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          winner_id?: string | null;
          winner_data?: Json | null;
          event_config?: Json | null;
          voting_format?: string | null;
          options?: Json | null;
        };
      };
      wolf_pack_votes: {
        Row: {
          id: string;
          event_id: string | null;
          voter_id: string | null;
          contest_id: string | null;
          participant_id: string | null;
          voted_for_id: string | null;
          vote_value: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          event_id?: string | null;
          voter_id?: string | null;
          contest_id?: string | null;
          participant_id?: string | null;
          voted_for_id?: string | null;
          vote_value?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          event_id?: string | null;
          voter_id?: string | null;
          contest_id?: string | null;
          participant_id?: string | null;
          voted_for_id?: string | null;
          vote_value?: number | null;
          created_at?: string | null;
        };
      };
      wolfpack_chat_messages: {
        Row: {
          id: string;
          session_id: string;
          user_id: string | null;
          display_name: string;
          avatar_url: string | null;
          content: string;
          message_type: string;
          image_url: string | null;
          created_at: string | null;
          edited_at: string | null;
          is_flagged: boolean | null;
          is_deleted: boolean | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id?: string | null;
          display_name: string;
          avatar_url?: string | null;
          content: string;
          message_type?: string;
          image_url?: string | null;
          created_at?: string | null;
          edited_at?: string | null;
          is_flagged?: boolean | null;
          is_deleted?: boolean | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string | null;
          display_name?: string;
          avatar_url?: string | null;
          content?: string;
          message_type?: string;
          image_url?: string | null;
          created_at?: string | null;
          edited_at?: string | null;
          is_flagged?: boolean | null;
          is_deleted?: boolean | null;
        };
      };
    };
  };
}

// =============================================================================
// TYPE DEFINITIONS - Request/Response types
// =============================================================================

interface VoteRequest {
  option?: string;
  vote_value?: number;
  participant_id?: string;
}

// Using the actual database types from Supabase
type EventData = Database['public']['Tables']['dj_events']['Row'];
type VoteData = Database['public']['Tables']['wolf_pack_votes']['Row'];
type ChatMessageInsert = Database['public']['Tables']['wolfpack_chat_messages']['Insert'];

// Type for vote query results
interface VoteQueryResult {
  voted_for_id: string | null;
  vote_value: number | null;
  voter_id: string | null;
}

interface VoteCounts {
  [key: string]: number;
}

interface ContestVoteCounts {
  total_votes: number;
  average_rating: number;
}

interface VoteResponse {
  success: true;
  vote_id: string;
  event_id: string;
  vote_option: string | null;
  vote_value: number | null;
  vote_counts: VoteCounts | ContestVoteCounts;
  created_at: string;
}

interface EventDetailsResponse {
  event: {
    id: string;
    title: string;
    event_type: string;
    status: string | null;
    voting_ends_at: string | null;
    options: string[] | null;
    voting_format: string | null;
    description: string | null;
  };
  vote_counts: VoteCounts | ContestVoteCounts;
  user_vote: {
    vote_option: string | null;
    vote_value: number | null;
  } | null;
  has_voted: boolean;
  total_votes: number;
}

interface ErrorResponse {
  error: string;
  code: string;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

function parseEventOptions(options: unknown): string[] {
  if (typeof options === 'string') {
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? parsed.filter(opt => typeof opt === 'string') : [];
    } catch {
      return [];
    }
  }
  if (Array.isArray(options)) {
    return options.filter(opt => typeof opt === 'string');
  }
  return [];
}

// =============================================================================
// AUTHENTICATION & AUTHORIZATION
// =============================================================================

async function authenticateUser(supabase: Awaited<ReturnType<typeof createClient>>): Promise<User> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Authentication required');
  }

  const authResult = await WolfpackService.auth.verifyUser(user);
  if (!authResult.isVerified) {
    throw new Error('User verification failed');
  }

  return user;
}

// =============================================================================
// BUSINESS LOGIC
// =============================================================================

async function getEventDetails(eventId: string): Promise<EventData> {
  const eventResult = await WolfpackService.backend.select(
    WOLFPACK_TABLES.EVENTS,
    '*',
    { id: eventId },
    { single: true }
  );

  if (eventResult.error || !eventResult.data) {
    throw new Error('Event not found');
  }

  return eventResult.data as EventData;
}

async function validateVote(event: EventData, voteData: VoteRequest): Promise<void> {
  // Check if event is still active
  if (event.status !== 'active') {
    throw new Error('Event is no longer active');
  }

  // Check if voting period has ended
  if (event.voting_ends_at && new Date(event.voting_ends_at) < new Date()) {
    throw new Error('Voting period has ended');
  }

  // Validate vote based on event type
  switch (event.event_type) {
    case 'poll':
    case 'next_song_vote':
      if (!voteData.option?.trim()) {
        throw new Error('Poll option is required');
      }

      const validOptions = parseEventOptions(event.options);
      if (validOptions.length > 0 && !validOptions.includes(voteData.option)) {
        throw new Error('Invalid poll option');
      }
      break;

    case 'contest':
    case 'dance_battle':
    case 'hottest_person':
    case 'best_costume':
      if (voteData.vote_value === undefined || voteData.vote_value < 1 || voteData.vote_value > 10) {
        throw new Error('Contest vote must be between 1-10');
      }
      break;

    case 'name_that_tune':
    case 'trivia':
      if (!voteData.option?.trim()) {
        throw new Error('Answer is required');
      }
      break;

    case 'song_request':
      if (!voteData.option?.trim()) {
        throw new Error('Song request is required');
      }
      break;

    default:
      // For custom events, allow either option or vote_value
      if (!voteData.option?.trim() && voteData.vote_value === undefined) {
        throw new Error('Either option or vote value is required');
      }
  }
}

async function checkExistingVote(eventId: string, userId: string): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('wolf_pack_votes')
      .select('id')
      .eq('event_id', eventId)
      .eq('voter_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing vote:', error);
      return false;
    }

    return !!data;
  } catch (error: unknown) {
    console.error('Error checking existing vote:', error);
    return false;
  }
}

async function createVote(eventId: string, userId: string, voteData: VoteRequest): Promise<VoteData> {
  const supabase = await createServerClient();
  
  const voteRecord: Database['public']['Tables']['wolf_pack_votes']['Insert'] = {
    event_id: eventId,
    voter_id: userId,
    contest_id: null,
    participant_id: voteData.participant_id || null,
    voted_for_id: voteData.option || null,
    vote_value: voteData.vote_value || null,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('wolf_pack_votes')
    .insert(voteRecord)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create vote: ${error?.message || 'Unknown error'}`);
  }

  return data;
}

async function getVoteCounts(supabase: Awaited<ReturnType<typeof createClient>>, event: EventData): Promise<VoteCounts | ContestVoteCounts> {
  const { data: votes, error } = await supabase
    .from('wolf_pack_votes')
    .select('voted_for_id, vote_value')
    .eq('event_id', event.id);

  if (error) {
    console.error('Error fetching vote counts:', error);
    return {};
  }

  if (!votes || votes.length === 0) {
    return event.event_type === 'contest' || 
           event.event_type === 'dance_battle' || 
           event.event_type === 'hottest_person' || 
           event.event_type === 'best_costume'
      ? { total_votes: 0, average_rating: 0 }
      : {};
  }

  // Handle contest-type events (with ratings)
  if (event.event_type === 'contest' || 
      event.event_type === 'dance_battle' || 
      event.event_type === 'hottest_person' || 
      event.event_type === 'best_costume') {
    
    const validVotes = votes.filter(vote => vote.vote_value !== null);
    const totalVotes = validVotes.length;
    const averageRating = totalVotes > 0 
      ? validVotes.reduce((sum, vote) => sum + (vote.vote_value || 0), 0) / totalVotes
      : 0;

    return {
      total_votes: totalVotes,
      average_rating: Math.round(averageRating * 100) / 100 // Round to 2 decimal places
    };
  }

  // Handle poll-type events (count votes per option)
  const voteCounts: VoteCounts = {};
  votes.forEach(vote => {
    if (vote.voted_for_id) {
      voteCounts[vote.voted_for_id] = (voteCounts[vote.voted_for_id] || 0) + 1;
    }
  });

  return voteCounts;
}

async function sendConfirmationMessage(
  event: EventData, 
  user: User, 
  voteData: VoteRequest
): Promise<void> {
  try {
    const supabase = await createServerClient();
    const displayName = WolfpackService.auth.getUserDisplayName(user);
    
    let confirmationMessage: string;
    switch (event.event_type) {
      case 'poll':
      case 'next_song_vote':
        confirmationMessage = `${displayName} voted on: ${event.title}`;
        break;
      case 'contest':
      case 'dance_battle':
      case 'hottest_person':
      case 'best_costume':
        confirmationMessage = `${displayName} rated: ${event.title} (${voteData.vote_value}/10)`;
        break;
      case 'song_request':
        confirmationMessage = `${displayName} requested: ${voteData.option}`;
        break;
      case 'name_that_tune':
      case 'trivia':
        confirmationMessage = `${displayName} answered: ${event.title}`;
        break;
      default:
        confirmationMessage = `${displayName} participated in: ${event.title}`;
    }

    const chatMessage = {
      session_id: `location_${event.location_id}`,
      user_id: user.id,
      display_name: displayName,
      avatar_url: WolfpackService.auth.getUserAvatarUrl(user),
      content: confirmationMessage,
      message_type: 'text',
      is_flagged: false,
      is_deleted: false
    };

    await supabase
      .from('wolfpack_chat_messages')
      .insert(chatMessage);
      
  } catch (error: unknown) {
    // Log but don't fail the vote
    console.warn('Failed to send confirmation message:', error);
  }
}

// =============================================================================
// API HANDLERS
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
): Promise<NextResponse<VoteResponse | ErrorResponse>> {
  let eventId: string | undefined;
  
  try {
    const supabase = await createServerClient();
    
    // 1. Authentication
    const user = await authenticateUser(supabase);
    
    // 2. Validate event ID
    const resolvedParams = await params;
    eventId = resolvedParams.eventId;
    
    if (!eventId || !validateUUID(eventId)) {
      return NextResponse.json(
        { error: 'Valid event ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // 3. Parse request body
    const body = await request.json() as VoteRequest;

    // 4. Get event details
    const event = await getEventDetails(eventId);

    // 5. Validate vote
    await validateVote(event, body);

    // 6. Check for existing vote
    const hasVoted = await checkExistingVote(eventId, user.id);
    if (hasVoted) {
      return NextResponse.json(
        { error: 'You have already voted on this event', code: 'ALREADY_VOTED' },
        { status: 400 }
      );
    }

    // 7. Create vote
    const voteRecord = await createVote(eventId, user.id, body);

    // 8. Get updated vote counts
    const voteCounts = await getVoteCounts(supabase, event);

    // 9. Send confirmation message
    await sendConfirmationMessage(event, user, body);

    // 10. Return success response
    return NextResponse.json({
      success: true,
      vote_id: voteRecord.id,
      event_id: eventId,
      vote_option: body.option || null,
      vote_value: body.vote_value || null,
      vote_counts: voteCounts,
      created_at: voteRecord.created_at || new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('Event voting error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Authentication required' || error.message === 'User verification failed') {
        return NextResponse.json(
          { error: error.message, code: 'AUTH_ERROR' },
          { status: 401 }
        );
      }
      
      if (error.message === 'Event not found') {
        return NextResponse.json(
          { error: 'Event not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('no longer active') || 
          error.message.includes('period has ended') ||
          error.message.includes('required') ||
          error.message.includes('Invalid') ||
          error.message.includes('must be between')) {
        return NextResponse.json(
          { error: error.message, code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      
      if (error.message === 'You have already voted on this event') {
        return NextResponse.json(
          { error: error.message, code: 'ALREADY_VOTED' },
          { status: 400 }
        );
      }
    }

    // Create a proper error object for WolfpackErrorHandler
    const errorToHandle = error instanceof Error ? error : new Error(
      typeof error === 'string' ? error : 'Unknown error occurred'
    );

    const userError = WolfpackErrorHandler.handleSupabaseError(errorToHandle, {
      operation: 'event_voting'
    });

    return NextResponse.json(
      { error: userError.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
): Promise<NextResponse<EventDetailsResponse | ErrorResponse>> {
  let eventId: string | undefined;
  
  try {
    const supabase = await createServerClient();
    
    // 1. Authentication
    const user = await authenticateUser(supabase);
    
    // 2. Validate event ID
    const resolvedParams = await params;
    eventId = resolvedParams.eventId;
    
    if (!eventId || !validateUUID(eventId)) {
      return NextResponse.json(
        { error: 'Valid event ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // 3. Get event details and vote counts in parallel
    const [event, voteCountsResult] = await Promise.all([
      getEventDetails(eventId),
      supabase
        .from('wolf_pack_votes')
        .select('voted_for_id, vote_value, voter_id')
        .eq('event_id', eventId)
    ]);

    if (voteCountsResult.error) {
      console.error('Error fetching votes:', voteCountsResult.error);
      throw new Error('Failed to fetch vote data');
    }

    const votes = voteCountsResult.data || [];

    // 4. Check if current user has voted
    const userVote = votes.find((vote: VoteQueryResult) => vote.voter_id === user.id);

    // 5. Calculate vote counts
    let voteCounts: VoteCounts | ContestVoteCounts;
    
    if (event.event_type === 'contest' || 
        event.event_type === 'dance_battle' || 
        event.event_type === 'hottest_person' || 
        event.event_type === 'best_costume') {
      
      const validVotes = votes.filter((vote: VoteQueryResult): vote is VoteQueryResult & { vote_value: number } => 
        vote.vote_value !== null
      );
      const totalVotes = validVotes.length;
      const averageRating = totalVotes > 0 
        ? validVotes.reduce((sum: number, vote: VoteQueryResult & { vote_value: number }) => sum + vote.vote_value, 0) / totalVotes
        : 0;

      voteCounts = {
        total_votes: totalVotes,
        average_rating: Math.round(averageRating * 100) / 100
      };
    } else {
      // Poll-type events
      const pollCounts: VoteCounts = {};
      votes.forEach((vote: VoteQueryResult) => {
        if (vote.voted_for_id) {
          pollCounts[vote.voted_for_id] = (pollCounts[vote.voted_for_id] || 0) + 1;
        }
      });
      voteCounts = pollCounts;
    }

    // 6. Return event details
    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        event_type: event.event_type,
        status: event.status,
        voting_ends_at: event.voting_ends_at,
        voting_format: event.voting_format,
        description: event.description,
        options: parseEventOptions(event.options)
      },
      vote_counts: voteCounts,
      user_vote: userVote ? {
        vote_option: userVote.voted_for_id,
        vote_value: userVote.vote_value
      } : null,
      has_voted: !!userVote,
      total_votes: votes.length
    });

  } catch (error: unknown) {
    console.error('Get event votes error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Authentication required' || error.message === 'User verification failed') {
        return NextResponse.json(
          { error: error.message, code: 'AUTH_ERROR' },
          { status: 401 }
        );
      }
      
      if (error.message === 'Event not found') {
        return NextResponse.json(
          { error: 'Event not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
    }

    // Create a proper error object for WolfpackErrorHandler
    const errorToHandle = error instanceof Error ? error : new Error(
      typeof error === 'string' ? error : 'Unknown error occurred'
    );

    const userError = WolfpackErrorHandler.handleSupabaseError(errorToHandle, {
      operation: 'get_event_votes'
    });

    return NextResponse.json(
      { error: userError.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}