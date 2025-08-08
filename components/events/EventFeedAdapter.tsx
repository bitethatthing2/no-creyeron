'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Event } from '@/types/features/event';

interface EventFeedData {
  id: string;
  type: 'event';
  user_id: string;
  display_name: string;
  avatar_url?: string;
  content: string;
  media_url?: string;
  created_at: string;
  likes_count: number;
  wolfpack_comments_count: number;
  shares_count: number;
  event_data: {
    title: string;
    date: string;
    location: string;
    rsvp_count: number;
    price?: number;
    category?: string;
    is_cancelled?: boolean;
    featured?: boolean;
    external_ticket_link?: string;
  };
  reactions?: Array<{
    id: string;
    user_id: string;
    emoji: string;
    created_at: string;
  }>;
}

interface EventFeedAdapterProps {
  onEventsLoaded: (events: EventFeedData[]) => void;
  limit?: number;
}

export default function EventFeedAdapter({ 
  onEventsLoaded, 
  limit = 10 
}: EventFeedAdapterProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);

        // Load regular events
        const { data: regularEvents, error: regularError } = await supabase
          .from('events')
          .select(`
            *,
            event_rsvps(count),
            event_likes(count),
            users!events_created_by_fkey(
              first_name,
              last_name,
              avatar_url
            )
          `)
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(limit);

        // Load DJ events (interactive events)
        const { data: djEvents, error: djError } = await supabase
          .from('dj_events')
          .select(`
            *,
            dj_event_participants(count),
            wolf_pack_votes(count),
            users!dj_events_dj_id_fkey(
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('status', 'scheduled')
          .order('start_time', { ascending: true })
          .limit(limit);

        if (regularError) {
          console.error('Error loading regular events:', regularError);
        }

        if (djError) {
          console.error('Error loading DJ events:', djError);
        }

        // Transform regular events
        const transformedRegularEvents: EventFeedData[] = (regularEvents || []).map(event => ({
          id: event.id,
          type: 'event' as const,
          user_id: event.created_by || 'system',
          display_name: event.users ? 
            `${event.users.first_name || ''} ${event.users.last_name || ''}`.trim() || 'Event Organizer' :
            'Side Hustle Bar',
          avatar_url: event.users?.avatar_url,
          content: event.description || `Join us for ${event.title}!`,
          media_url: event.image_url,
          created_at: event.created_at,
          likes_count: event.event_likes?.[0]?.count || 0,
          wolfpack_comments_count: 0, // Regular events don't have wolfpack_comments yet
          shares_count: 0,
          event_data: {
            title: event.title,
            date: event.event_date,
            location: event.location || 'Side Hustle Bar',
            rsvp_count: event.event_rsvps?.[0]?.count || 0,
            price: event.price,
            category: event.category,
            is_cancelled: false,
            featured: event.featured,
            external_ticket_link: event.external_url
          },
          reactions: []
        }));

        // Transform DJ events
        const transformedDJEvents: EventFeedData[] = (djEvents || []).map(event => ({
          id: event.id,
          type: 'event' as const,
          user_id: event.created_by || 'dj',
          display_name: event.users ? 
            `${event.users.first_name || ''} ${event.users.last_name || ''}`.trim() || 'DJ' :
            'DJ Event',
          avatar_url: event.users?.avatar_url,
          content: event.description || `${event.title} - Interactive ${event.event_type} event!`,
          media_url: event.image_url,
          created_at: event.created_at,
          likes_count: event.wolf_pack_votes?.[0]?.count || 0,
          wolfpack_comments_count: 0,
          shares_count: 0,
          event_data: {
            title: event.title,
            date: event.start_time,
            location: 'Side Hustle Bar',
            rsvp_count: event.dj_event_participants?.[0]?.count || 0,
            category: event.event_type,
            is_cancelled: event.status === 'cancelled',
            featured: event.prizes && event.prizes.length > 0
          },
          reactions: []
        }));

        // Combine and sort events
        const allEvents = [...transformedRegularEvents, ...transformedDJEvents];
        allEvents.sort((a, b) => new Date(a.event_data.date).getTime() - new Date(b.event_data.date).getTime());

        onEventsLoaded(allEvents.slice(0, limit));
      } catch (error) {
        console.error('Error loading events for feed:', error);
        onEventsLoaded([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [onEventsLoaded, limit]);

  // Set up real-time subscriptions for event updates
  useEffect(() => {
    const channel = supabase
      .channel('event_feed_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        () => {
          // Reload events when there are changes
          // This is a simple approach - in production you might want more granular updates
          window.location.reload();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dj_events'
        },
        () => {
          // Reload events when there are changes
          window.location.reload();
        }
      );

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return null; // This component doesn't render anything, it just loads data
}