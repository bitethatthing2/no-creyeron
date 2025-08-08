import { supabase } from '@/lib/supabase';

interface BroadcastStatusUpdate {
  status: 'active' | 'completed' | 'expired';
  closed_at?: string;
}

interface CleanupStats {
  active_broadcasts: number;
  completed_broadcasts: number;
  expired_broadcasts: number;
  total_broadcasts: number;
  table_size: string;
  last_cleanup_date?: string;
  next_scheduled_cleanup?: string;
}

export class BroadcastStatusService {

  /**
   * Mark a broadcast as expired (will be deleted in 14 days)
   */
  static async expireBroadcast(broadcastId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('dj_broadcasts')
        .update({
          status: 'expired',
          closed_at: new Date().toISOString()
        } as BroadcastStatusUpdate)
        .eq('id', broadcastId);

      if (error) {
        console.error('Error expiring broadcast:', error);
        throw error;
      }

      console.log(`✅ Broadcast ${broadcastId} marked as expired (will be deleted in 14 days)`);
    } catch (error) {
      console.error('Failed to expire broadcast:', error);
      throw error;
    }
  }

  /**
   * Mark a broadcast as completed (will be deleted in 30 days)
   */
  static async completeBroadcast(broadcastId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('dj_broadcasts')
        .update({
          status: 'completed',
          closed_at: new Date().toISOString()
        } as BroadcastStatusUpdate)
        .eq('id', broadcastId);

      if (error) {
        console.error('Error completing broadcast:', error);
        throw error;
      }

      console.log(`✅ Broadcast ${broadcastId} marked as completed (will be deleted in 30 days)`);
    } catch (error) {
      console.error('Failed to complete broadcast:', error);
      throw error;
    }
  }

  /**
   * Check for expired broadcasts and update their status
   */
  static async checkAndUpdateExpiredBroadcasts(): Promise<void> {
    try {
      // Get all active broadcasts that have expired
      const { data: expiredBroadcasts, error: fetchError } = await this.supabase
        .from('dj_broadcasts')
        .select('id, expires_at')
        .eq('status', 'active')
        .not('expires_at', 'is', null);

      if (fetchError) {
        console.error('Error fetching broadcasts for expiration check:', fetchError);
        return;
      }

      if (!expiredBroadcasts || expiredBroadcasts.length === 0) {
        return;
      }

      const now = new Date();
      const expiredIds: string[] = [];

      expiredBroadcasts.forEach(broadcast => {
        if (broadcast.expires_at && new Date(broadcast.expires_at) <= now) {
          expiredIds.push(broadcast.id);
        }
      });

      if (expiredIds.length === 0) {
        return;
      }

      // Update all expired broadcasts
      const { error: updateError } = await this.supabase
        .from('dj_broadcasts')
        .update({
          status: 'expired',
          closed_at: now.toISOString()
        } as BroadcastStatusUpdate)
        .in('id', expiredIds);

      if (updateError) {
        console.error('Error updating expired broadcasts:', updateError);
        throw updateError;
      }

      console.log(`✅ Marked ${expiredIds.length} broadcasts as expired`);
    } catch (error) {
      console.error('Failed to check and update expired broadcasts:', error);
    }
  }

  /**
   * Get broadcast (handle deletion gracefully)
   */
  static async getBroadcast(broadcastId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('dj_broadcasts')
        .select('*')
        .eq('id', broadcastId)
        .single();

      if (error?.code === 'PGRST116') {
        // Broadcast not found - likely deleted
        return {
          data: null,
          error: {
            message: 'This broadcast has been removed',
            isDeleted: true
          }
        };
      }

      return { data, error };
    } catch (error) {
      console.error('Error getting broadcast:', error);
      return { data: null, error };
    }
  }

  /**
   * Calculate days until deletion for a broadcast
   */
  static getDaysUntilDeletion(broadcast: any): number | null {
    const now = new Date();
    let deletionDate: Date | null = null;
    
    switch (broadcast.status) {
      case 'expired':
        // Expired broadcasts are deleted 14 days after creation
        deletionDate = new Date(broadcast.created_at);
        deletionDate.setDate(deletionDate.getDate() + 14);
        break;
      case 'completed':
        // Completed broadcasts are deleted 30 days after creation
        deletionDate = new Date(broadcast.created_at);
        deletionDate.setDate(deletionDate.getDate() + 30);
        break;
      case 'active':
        // Active broadcasts are deleted 7 days after expiry (or 14 days if no expiry)
        if (broadcast.expires_at) {
          deletionDate = new Date(broadcast.expires_at);
          deletionDate.setDate(deletionDate.getDate() + 7);
        } else {
          deletionDate = new Date(broadcast.created_at);
          deletionDate.setDate(deletionDate.getDate() + 14);
        }
        break;
    }
    
    if (deletionDate) {
      const daysLeft = Math.ceil((deletionDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      return Math.max(0, daysLeft);
    }
    
    return null;
  }

  /**
   * Get cleanup status
   */
  static async getCleanupStatus(): Promise<CleanupStats | null> {
    try {
      const { data, error } = await supabase
        .from('broadcast_cleanup_status')
        .select('*')
        .single();

      if (error) {
        console.error('Error getting cleanup status:', error);
        return null;
      }

      return data as CleanupStats;
    } catch (error) {
      console.error('Failed to get cleanup status:', error);
      return null;
    }
  }

  /**
   * Get cleanup history
   */
  static async getCleanupHistory(limit: number = 7): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('broadcast_cleanup_log')
        .select('*')
        .order('cleanup_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting cleanup history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get cleanup history:', error);
      return [];
    }
  }

  /**
   * Trigger manual cleanup (admin only)
   */
  static async triggerManualCleanup(): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('broadcast-daily-cleanup');
      
      if (error) {
        return { success: false, message: error.message };
      }
      
      return { success: true, message: data?.message || 'Cleanup completed' };
    } catch (error) {
      console.error('Failed to trigger manual cleanup:', error);
      return { success: false, message: 'Failed to trigger cleanup' };
    }
  }

  /**
   * Export broadcast data before deletion
   */
  static async exportBroadcast(broadcastId: string): Promise<void> {
    try {
      // Get broadcast data with responses
      const { data: broadcast, error } = await this.supabase
        .from('dj_broadcasts')
        .select('*, dj_broadcast_responses(*)')
        .eq('id', broadcastId)
        .single();
        
      if (error || !broadcast) {
        throw new Error('Broadcast not found');
      }
      
      // Create downloadable JSON
      const json = JSON.stringify(broadcast, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `broadcast-${broadcastId}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export broadcast:', error);
      throw error;
    }
  }
}