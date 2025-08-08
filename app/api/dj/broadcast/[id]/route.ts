import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { BroadcastStatusService } from '@/lib/services/broadcast-status.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: broadcastId } = await params;

    // Authenticate user
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Try to get broadcast (handles deletion gracefully)
    const result = await BroadcastStatusService.getBroadcast(broadcastId);

    if (!result.data) {
      // Check if it was deleted
      if (result.error?.isDeleted) {
        return NextResponse.json(
          { 
            error: 'This broadcast has been removed',
            isDeleted: true,
            message: 'Old broadcasts are automatically deleted to maintain performance'
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Broadcast not found' },
        { status: 404 }
      );
    }

    // Calculate days until deletion
    const daysUntilDeletion = BroadcastStatusService.getDaysUntilDeletion(result.data);

    return NextResponse.json({
      broadcast: result.data,
      daysUntilDeletion,
      deletionWarning: daysUntilDeletion !== null && daysUntilDeletion <= 7
    });

  } catch (error) {
    console.error('Error fetching broadcast:', error);
    return NextResponse.json(
      { error: 'Failed to fetch broadcast' },
      { status: 500 }
    );
  }
}