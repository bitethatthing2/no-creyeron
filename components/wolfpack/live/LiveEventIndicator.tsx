'use client';

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Users, 
  Timer, 
  Vote, 
  Crown, 
  Zap,
  Activity,
  Star,
  Target,
  Award
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface LiveEvent {
  id: string;
  title: string;
  event_type: string;
  status: string;
  start_time: string;
  end_time: string | null;
  max_participants: number;
  current_participants: number;
  voting_enabled: boolean;
  prizes: any[];
  description: string;
  created_by: string;
  session_id: string;
}

interface EventParticipant {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string;
  score: number;
  votes_received: number;
  rank: number;
}

interface LiveEventIndicatorProps {
  className?: string;
  onClick?: () => void;
  showDetails?: boolean;
}

export default function LiveEventIndicator({ 
  className = '', 
  onClick, 
  showDetails = false 
}: LiveEventIndicatorProps) {
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<LiveEvent | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize live events
  useEffect(() => {
    const initializeLiveEvents = async () => {
      try {
        // Check for active live events
        const { data: events, error } = await supabase
          .from('live_events')
          .select('*')
          .eq('status', 'active')
          .order('start_time', { ascending: false });

        if (error) {
          console.error('Error loading live events:', error);
          return;
        }

        setLiveEvents(events || []);
        
        if (events && events.length > 0) {
          setActiveEvent(events[0]);
          await loadEventParticipants(events[0].id);
        }
      } catch (error) {
        console.error('Error initializing live events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLiveEvents();
  }, []);

  // Load event participants
  const loadEventParticipants = async (eventId: string) => {
    try {
      const { data: participantsData, error } = await supabase
        .from('event_participants')
        .select(`
          *,
          users!event_participants_user_id_fkey(
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .order('score', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading participants:', error);
        return;
      }

      const formattedParticipants = participantsData?.map((p, index) => ({
        id: p.id,
        user_id: p.user_id,
        display_name: `${p.users?.first_name || ''} ${p.users?.last_name || ''}`.trim() || 'Anonymous',
        avatar_url: p.users?.avatar_url || '/default-avatar.png',
        score: p.score || 0,
        votes_received: p.votes_received || 0,
        rank: index + 1
      })) || [];

      setParticipants(formattedParticipants);
    } catch (error) {
      console.error('Error loading event participants:', error);
    }
  };

  // Calculate time remaining
  useEffect(() => {
    if (!activeEvent || !activeEvent.end_time) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const endTime = new Date(activeEvent.end_time!).getTime();
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(Math.floor(remaining / 1000));
    };

    calculateTimeRemaining();
    timerRef.current = setInterval(calculateTimeRemaining, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeEvent]);

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('live_events_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_events'
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updatedEvent = payload.new as LiveEvent;
            setLiveEvents(prev => 
              prev.map(e => e.id === updatedEvent.id ? updatedEvent : e)
            );
            if (activeEvent && activeEvent.id === updatedEvent.id) {
              setActiveEvent(updatedEvent);
            }
          } else if (payload.eventType === 'INSERT') {
            const newEvent = payload.new as LiveEvent;
            if (newEvent.status === 'active') {
              setLiveEvents(prev => [newEvent, ...prev]);
              if (!activeEvent) {
                setActiveEvent(newEvent);
                loadEventParticipants(newEvent.id);
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_participants'
        },
        (payload) => {
          if (activeEvent && payload.eventType === 'UPDATE') {
            loadEventParticipants(activeEvent.id);
          }
        }
      );

    channel.subscribe();
    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [activeEvent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-700 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
          <div className="w-20 h-4 bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  if (!activeEvent) {
    return (
      <div className={`bg-gray-800 rounded-lg p-3 opacity-50 ${className}`}>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-gray-500" />
          <span className="text-gray-500 text-sm">No Live Events</span>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'dance_off': return '💃';
      case 'karaoke': return '🎤';
      case 'contest': return '🏆';
      case 'trivia': return '🧠';
      case 'voting': return '🗳️';
      default: return '✨';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'dance_off': return 'from-pink-900 to-purple-900';
      case 'karaoke': return 'from-blue-900 to-indigo-900';
      case 'contest': return 'from-yellow-900 to-orange-900';
      case 'trivia': return 'from-green-900 to-teal-900';
      case 'voting': return 'from-red-900 to-pink-900';
      default: return 'from-gray-900 to-gray-800';
    }
  };

  return (
    <div 
      className={`bg-gradient-to-r ${getEventColor(activeEvent.event_type)} rounded-lg p-3 cursor-pointer hover:scale-105 transition-transform ${className}`}
      onClick={onClick}
    >
      {/* Main Event Indicator */}
      <div className="flex items-center gap-3 mb-2">
        <div className="relative">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">{getEventIcon(activeEvent.event_type)}</span>
          <span className="text-white font-bold text-sm truncate">{activeEvent.title}</span>
        </div>
        <Badge className="bg-green-600 text-white text-xs">
          LIVE
        </Badge>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 text-xs text-white/80">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>{activeEvent.current_participants}/{activeEvent.max_participants}</span>
        </div>
        {timeRemaining > 0 && (
          <div className="flex items-center gap-1">
            <Timer className="w-3 h-3" />
            <span>{formatTime(timeRemaining)}</span>
          </div>
        )}
        {activeEvent.voting_enabled && (
          <div className="flex items-center gap-1">
            <Vote className="w-3 h-3" />
            <span>Voting Open</span>
          </div>
        )}
      </div>

      {/* Detailed View */}
      {showDetails && (
        <div className="mt-3 space-y-2">
          {/* Top Participants */}
          {participants.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-white/60 font-medium">Leaderboard:</div>
              {participants.slice(0, 3).map((participant) => (
                <div key={participant.id} className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    {participant.rank === 1 && <Crown className="w-3 h-3 text-yellow-400" />}
                    {participant.rank === 2 && <Star className="w-3 h-3 text-gray-400" />}
                    {participant.rank === 3 && <Award className="w-3 h-3 text-orange-400" />}
                    {participant.rank > 3 && <span className="text-white/60">#{participant.rank}</span>}
                  </div>
                  <span className="text-white/80 flex-1 truncate">{participant.display_name}</span>
                  <div className="flex items-center gap-1 text-white/60">
                    <Zap className="w-3 h-3" />
                    <span>{participant.score}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Event Progress */}
          {activeEvent.current_participants > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-white/60 mb-1">
                <span>Participation</span>
                <span>{Math.round((activeEvent.current_participants / activeEvent.max_participants) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${(activeEvent.current_participants / activeEvent.max_participants) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
              <Target className="w-3 h-3 mr-1" />
              Join
            </Button>
            {activeEvent.voting_enabled && (
              <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                <Vote className="w-3 h-3 mr-1" />
                Vote
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}