import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { WOLFPACK_TABLES, WolfpackErrorHandler } from '@/lib/services/wolfpack';

// Types for better type safety
interface ResetOperation {
  operation: string;
  success: boolean;
  error?: string;
  affected_rows?: number;
}

interface Location {
  id: string;
  [key: string]: unknown;
}

// Daily reset endpoint - typically called by a cron job at 2:30 AM
export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client early for admin verification
    const supabase = await createServerClient();
    
    // Verify admin access or cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'wolfpack-reset-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      // Try admin user verification
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized access', code: 'AUTH_ERROR' },
          { status: 401 }
        );
      }

      // Check if user is admin
      const { data: userData } = await supabase
        .from(WOLFPACK_TABLES.USERS) // Use the constant instead of string
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Admin access required', code: 'PERMISSION_ERROR' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { location_id, reset_type = 'daily' } = body;

    const resetTimestamp = new Date().toISOString();
    const results: ResetOperation[] = [];

    // If specific location provided, reset only that location
    const locationFilter = location_id ? { location_id } : {};

    // Mark old chat sessions as deleted (since is_archived doesn't exist)
    const { data: chatData, error: chatError } = await supabase
      .from(WOLFPACK_TABLES.WOLF_CHAT)
      .update({ 
        is_deleted: true,
        edited_at: resetTimestamp
      })
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .match(locationFilter)
      .select();
    
    results.push({
      operation: 'archive_old_chat',
      success: !chatError,
      error: chatError?.message || undefined,
      affected_rows: chatData?.length || 0
    });

    // Reset wolfpack memberships to inactive (but don't delete them)
    const { data: membershipData, error: membershipError } = await supabase
      .from('wolf_pack_members')
      .update({ 
        status: 'inactive',
        last_activity: resetTimestamp,
        updated_at: resetTimestamp
      })
      .eq('status', 'active')
      .match(locationFilter)
      .select();
    
    results.push({
      operation: 'reset_memberships',
      success: !membershipError,
      error: membershipError?.message || undefined,
      affected_rows: membershipData?.length || 0
    });

    // End active DJ events
    const { data: eventsData, error: eventsError } = await supabase
      .from(WOLFPACK_TABLES.EVENTS)
      .update({ 
        status: 'ended',
        updated_at: resetTimestamp
      })
      .eq('status', 'active')
      .match(locationFilter)
      .select();
    
    results.push({
      operation: 'end_dj_events',
      success: !eventsError,
      error: eventsError?.message || undefined,
      affected_rows: eventsData?.length || 0
    });

    // Clear old reactions (older than 7 days)
    const { data: reactionsData, error: reactionsError } = await supabase
      .from('wolfpack_chat_reactions') // Assuming this is the actual table name
      .delete()
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .select();
    
    results.push({
      operation: 'cleanup_old_reactions',
      success: !reactionsError,
      error: reactionsError?.message || undefined,
      affected_rows: reactionsData?.length || 0
    });

    // Create system reset announcement
    const resetMessage = location_id 
      ? `🌅 Good morning! The Wolf Pack has been reset for a new day at this location.`
      : `🌅 Good morning! All Wolf Packs have been reset for a new day. Join your pack to get started!`;

    // Get all locations to reset if no specific location
    let locationsToReset: Location[] = [];
    if (location_id) {
      locationsToReset = [{ id: location_id }];
    } else {
      const { data: locationsData } = await supabase
        .from(WOLFPACK_TABLES.LOCATIONS)
        .select('id')
        .eq('is_active', true);
      locationsToReset = (locationsData as Location[]) || [];
    }

    // Send reset announcements to each location
    for (const location of locationsToReset) {
      const { error: insertError } = await supabase
        .from(WOLFPACK_TABLES.WOLF_CHAT)
        .insert({
          session_id: `location_${location.id}`,
          user_id: '00000000-0000-0000-0000-000000000000', // System user
          display_name: 'Wolf Pack System',
          avatar_url: null,
          content: resetMessage,
          message_type: 'dj_broadcast',
          created_at: resetTimestamp,
          is_flagged: false
        });
      
      if (insertError) {
        console.error(`Failed to send reset announcement for location ${location.id}:`, insertError);
      }
    }

    results.push({
      operation: 'send_reset_announcements',
      success: true,
      affected_rows: locationsToReset.length
    });

    // Calculate summary
    const totalOperations = results.length;
    const successfulOperations = results.filter(r => r.success).length;
    const totalAffectedRows = results.reduce((sum, r) => sum + (r.affected_rows || 0), 0);

    return NextResponse.json({
      success: successfulOperations === totalOperations,
      reset_type,
      location_id: location_id || 'all',
      reset_timestamp: resetTimestamp,
      summary: {
        total_operations: totalOperations,
        successful_operations: successfulOperations,
        total_affected_rows: totalAffectedRows
      },
      operations: results
    });

  } catch (error) {
    console.error('Daily reset error:', error);
    
    // Type guard to ensure error is properly typed for WolfpackErrorHandler
    const typedError = error instanceof Error 
      ? error 
      : new Error(typeof error === 'string' ? error : 'Unknown error occurred');
    
    const userError = WolfpackErrorHandler.handleSupabaseError(typedError, {
      operation: 'daily_reset'
    });

    return NextResponse.json(
      { error: userError.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

// Get reset status and next scheduled reset
export async function GET() {
  try {
    const now = new Date();
    const nextReset = new Date();
    
    // Calculate next 2:30 AM
    nextReset.setHours(2, 30, 0, 0);
    if (nextReset <= now) {
      nextReset.setDate(nextReset.getDate() + 1);
    }

    // Get last reset info from system messages
    const supabase = await createServerClient();
    const { data: lastResetMessage } = await supabase
      .from(WOLFPACK_TABLES.WOLF_CHAT) // Using the correct property name
      .select('created_at, content')
      .eq('user_id', '00000000-0000-0000-0000-000000000000') // System user
      .eq('message_type', 'dj_broadcast')
      .like('content', '%Wolf Pack has been reset%')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      current_time: now.toISOString(),
      next_reset: nextReset.toISOString(),
      time_until_reset: Math.max(0, nextReset.getTime() - now.getTime()).toString(), // Fixed: convert to string
      last_reset: lastResetMessage?.created_at || null,
      reset_schedule: {
        time: '02:30:00',
        timezone: 'America/Los_Angeles', // Pacific Time
        frequency: 'daily'
      }
    });

  } catch (error) {
    console.error('Get reset status error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get reset status', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}