'use client';

import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// =============================================================================
// INTERFACES
// =============================================================================

interface PackMember {
  id: string;
  user_id: string;
  displayName: string;
  profilePicture: string;
  vibeStatus: string;
  isOnline: boolean;
  lastSeen: string;
}

interface LocationStats {
  activeEvents: number;
  totalPackMembers: number;
  onlineMembers: number;
  recentBroadcasts: number;
  energyLevel: number;
}

interface RealtimeCallbacks {
  onEventUpdate?: () => void;
  onBroadcast?: (payload: any) => void;
  onChatMessage?: (payload: any) => void;
  onMemberUpdate?: () => void;
}

// =============================================================================
// WOLFPACK ENHANCED SERVICE
// =============================================================================

export class WolfpackEnhancedService {
  private static channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Get active pack members for a location
   */
  static async getActivePackMembers(locationId: string): Promise<PackMember[]> {
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
          wolfpack_status,
          is_online,
          last_activity,
          vibe_status
        `)
        .eq('location_id', locationId)
        .eq('is_wolfpack_member', true)
        .eq('wolfpack_status', 'active')
        .order('last_activity', { ascending: false });

      if (error) throw error;

      return (data || []).map(member => ({
        id: member.id,
        user_id: member.id,
        displayName: member.display_name || 
          `${member.first_name || ''} ${member.last_name || ''}`.trim() || 
          'Pack Member',
        profilePicture: member.profile_image_url || member.avatar_url || 
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`,
        vibeStatus: member.vibe_status || '🐺',
        isOnline: member.is_online ?? false,
        lastSeen: member.last_activity || new Date().toISOString()
      }));

    } catch (error) {
      console.error('Error fetching pack members:', error);
      return [];
    }
  }

  /**
   * Get location statistics
   */
  static async getLocationStats(locationId: string): Promise<LocationStats> {
    try {
      // Get active events count
      const { count: eventsCount } = await supabase
        .from('dj_events')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', locationId)
        .in('status', ['active', 'voting']);

      // Get total pack members
      const { count: totalMembers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', locationId)
        .eq('is_wolfpack_member', true)
        .eq('wolfpack_status', 'active');

      // Get online members
      const { count: onlineMembers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', locationId)
        .eq('is_wolfpack_member', true)
        .eq('wolfpack_status', 'active')
        .eq('is_online', true);

      // Get recent broadcasts (last 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count: broadcasts } = await supabase
        .from('dj_broadcasts')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', locationId)
        .gte('created_at', yesterday.toISOString());

      // Calculate energy level based on activity
      const energyLevel = Math.min(100, Math.max(0, 
        (onlineMembers || 0) * 10 + 
        (eventsCount || 0) * 20 + 
        (broadcasts || 0) * 5
      ));

      return {
        activeEvents: eventsCount || 0,
        totalPackMembers: totalMembers || 0,
        onlineMembers: onlineMembers || 0,
        recentBroadcasts: broadcasts || 0,
        energyLevel
      };

    } catch (error) {
      console.error('Error fetching location stats:', error);
      return {
        activeEvents: 0,
        totalPackMembers: 0,
        onlineMembers: 0,
        recentBroadcasts: 0,
        energyLevel: 0
      };
    }
  }

  /**
   * Format time remaining in minutes
   */
  static formatTimeRemaining(endTime: string): number {
    const now = new Date();
    const end = new Date(endTime);
    const diffMs = end.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  }

  /**
   * Setup realtime subscription for a location
   */
  static setupRealtimeSubscription(
    locationId: string, 
    callbacks: RealtimeCallbacks
  ): { unsubscribe: () => void } {
    const channelKey = `wolfpack_${locationId}`;
    
    // Clean up existing channel
    if (this.channels.has(channelKey)) {
      this.channels.get(channelKey)?.unsubscribe();
      this.channels.delete(channelKey);
    }

    try {
      // Create new channel
      const channel = supabase
        .channel(channelKey)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'dj_events',
            filter: `location_id=eq.${locationId}`
          },
          () => {
            callbacks.onEventUpdate?.();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users',
            filter: `location_id=eq.${locationId}`
          },
          () => {
            callbacks.onMemberUpdate?.();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'dj_broadcasts'
          },
          (payload) => {
            callbacks.onBroadcast?.(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'wolfpack_chat_messages'
          },
          (payload) => {
            callbacks.onChatMessage?.(payload);
          }
        )
        .subscribe((status) => {
          console.log(`Wolfpack subscription status: ${status}`);
        });

      this.channels.set(channelKey, channel);

      return {
        unsubscribe: () => {
          channel.unsubscribe();
          this.channels.delete(channelKey);
        }
      };

    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
      return {
        unsubscribe: () => {}
      };
    }
  }

  /**
   * Clean up all subscriptions
   */
  static cleanup(): void {
    this.channels.forEach(channel => channel.unsubscribe());
    this.channels.clear();
  }
}

// Export singleton instance
export const wolfpackEnhancedService = WolfpackEnhancedService;