'use client';

import { supabase } from '@/lib/supabase';

// =============================================================================
// INTERFACES
// =============================================================================

interface ActiveEvent {
  id: string;
  title: string;
  event_type: string;
  status: string;
  created_at: string;
  voting_ends_at: string | null;
  options: string[] | null;
  dj_id: string | null;
  location_id: string | null;
  description: string | null;
  dj?: {
    display_name?: string;
    first_name?: string;
    last_name?: string;
  };
}

// =============================================================================
// WOLFPACK SERVICE
// =============================================================================

export class WolfpackService {
  /**
   * Get active events for a location
   */
  static async getActiveEvents(locationId: string): Promise<ActiveEvent[]> {
    try {
      const { data, error } = await supabase
        .from('dj_events')
        .select(`
          id,
          title,
          event_type,
          status,
          created_at,
          voting_ends_at,
          options,
          dj_id,
          location_id,
          description,
          users:dj_id (
            display_name,
            first_name,
            last_name
          )
        `)
        .eq('location_id', locationId)
        .in('status', ['active', 'voting'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(event => ({
        id: event.id,
        title: event.title,
        event_type: event.event_type,
        status: event.status || 'pending',
        created_at: event.created_at || new Date().toISOString(),
        voting_ends_at: event.voting_ends_at,
        options: Array.isArray(event.options) ? event.options.map(o => String(o)) : [],
        dj_id: event.dj_id,
        location_id: event.location_id,
        description: event.description,
        dj: Array.isArray(event.users) ? event.users[0] : event.users
      }));

    } catch (error) {
      console.error('Error fetching active events:', error);
      return [];
    }
  }

  /**
   * Create a new event
   */
  static async createEvent(eventData: {
    title: string;
    event_type: string;
    location_id: string;
    description?: string;
    voting_ends_at?: string;
    options?: string[];
  }): Promise<{ success: boolean; event?: ActiveEvent; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Authentication required' };
      }

      const { data, error } = await supabase
        .from('dj_events')
        .insert({
          ...eventData,
          dj_id: user.id,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return { 
        success: true, 
        event: {
          id: data.id,
          title: data.title,
          event_type: data.event_type,
          status: data.status || 'pending',
          created_at: data.created_at || new Date().toISOString(),
          voting_ends_at: data.voting_ends_at,
          options: (Array.isArray(data.options) ? data.options : []) as string[],
          dj_id: data.dj_id,
          location_id: data.location_id,
          description: data.description
        }
      };

    } catch (error) {
      console.error('Error creating event:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create event' 
      };
    }
  }

  /**
   * End an event
   */
  static async endEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('dj_events')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (error) throw error;

      return { success: true };

    } catch (error) {
      console.error('Error ending event:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to end event' 
      };
    }
  }

  /**
   * Send broadcast message
   */
  static async sendBroadcast(
    locationId: string, 
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Authentication required' };
      }

      const { error } = await supabase
        .from('dj_broadcasts')
        .insert({
          title: 'DJ Broadcast',
          dj_id: user.id,
          location_id: locationId,
          message: message,
          broadcast_type: 'general',
          status: 'sent',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      return { success: true };

    } catch (error) {
      console.error('Error sending broadcast:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send broadcast' 
      };
    }
  }
}

// Export singleton instance
export const wolfpackService = WolfpackService;