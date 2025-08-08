'use client';

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Music, 
  Users, 
  Zap, 
  Radio, 
  Volume2,
  Mic,
  Activity,
  TrendingUp,
  Heart
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface LiveDJStats {
  pack_members: number;
  energy_level: number;
  active_broadcasts: number;
  total_interactions: number;
  session_duration: number;
}

interface ActiveBroadcast {
  id: string;
  title: string;
  broadcast_type: string;
  priority: string;
  created_at: string;
  interaction_count: number;
  view_count: number;
}

interface LiveDJIndicatorProps {
  className?: string;
  onClick?: () => void;
  showDetails?: boolean;
}

export default function LiveDJIndicator({ 
  className = '', 
  onClick, 
  showDetails = false 
}: LiveDJIndicatorProps) {
  const [isLive, setIsLive] = useState(false);
  const [djName, setDJName] = useState<string>('');
  const [stats, setStats] = useState<LiveDJStats | null>(null);
  const [activeBroadcasts, setActiveBroadcasts] = useState<ActiveBroadcast[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  // Initialize live DJ status
  useEffect(() => {
    const initializeLiveStatus = async () => {
      try {
        // Check for active DJ sessions
        const { data: activeSessions, error } = await supabase
          .from('dj_sessions')
          .select(`
            *,
            dj_profile:users!dj_sessions_dj_id_fkey(
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('is_live', true)
          .eq('status', 'active')
          .limit(1);

        if (error) {
          console.error('Error checking DJ sessions:', error);
          return;
        }

        if (activeSessions && activeSessions.length > 0) {
          const session = activeSessions[0];
          setIsLive(true);
          setSessionId(session.id);
          const firstName = session.dj_profile?.first_name || '';
          const lastName = session.dj_profile?.last_name || '';
          setDJName(`${firstName} ${lastName}`.trim() || 'DJ');
          
          // Load session stats
          await loadLiveStats(session.id);
          await loadActiveBroadcasts(session.id);
        } else {
          setIsLive(false);
          setSessionId(null);
          setDJName('');
          setStats(null);
          setActiveBroadcasts([]);
        }
      } catch (error) {
        console.error('Error initializing live status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLiveStatus();
  }, []);

  // Load live stats
  const loadLiveStats = async (sessionId: string) => {
    try {
      const { data: statsData, error } = await supabase
        .from('wolfpack_live_stats')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading live stats:', error);
        return;
      }

      if (statsData) {
        setStats({
          pack_members: statsData.pack_members || 0,
          energy_level: statsData.energy_level || 0,
          active_broadcasts: statsData.active_broadcasts || 0,
          total_interactions: statsData.total_interactions || 0,
          session_duration: statsData.session_duration || 0
        });
      }
    } catch (error) {
      console.error('Error loading live stats:', error);
    }
  };

  // Load active broadcasts
  const loadActiveBroadcasts = async (sessionId: string) => {
    try {
      const { data: broadcasts, error } = await supabase
        .from('dj_broadcasts')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error loading broadcasts:', error);
        return;
      }

      setActiveBroadcasts(broadcasts || []);
    } catch (error) {
      console.error('Error loading active broadcasts:', error);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel('live_dj_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dj_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updatedSession = payload.new as any;
            setIsLive(updatedSession.is_live);
            if (!updatedSession.is_live) {
              setSessionId(null);
              setStats(null);
              setActiveBroadcasts([]);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wolfpack_live_stats',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const updatedStats = payload.new as any;
            setStats({
              pack_members: updatedStats.pack_members || 0,
              energy_level: updatedStats.energy_level || 0,
              active_broadcasts: updatedStats.active_broadcasts || 0,
              total_interactions: updatedStats.total_interactions || 0,
              session_duration: updatedStats.session_duration || 0
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dj_broadcasts',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newBroadcast = payload.new as ActiveBroadcast;
            setActiveBroadcasts(prev => [newBroadcast, ...prev.slice(0, 2)]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedBroadcast = payload.new as ActiveBroadcast;
            setActiveBroadcasts(prev => 
              prev.map(b => b.id === updatedBroadcast.id ? updatedBroadcast : b)
            );
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
  }, [sessionId]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-700 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
          <div className="w-16 h-4 bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isLive) {
    return (
      <div className={`bg-gray-800 rounded-lg p-3 opacity-50 ${className}`}>
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-gray-500" />
          <span className="text-gray-500 text-sm">No DJ Live</span>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getBroadcastIcon = (type: string) => {
    switch (type) {
      case 'poll': return '📊';
      case 'contest': return '🏆';
      case 'spotlight': return '✨';
      case 'announcement': return '📢';
      default: return '💬';
    }
  };

  const getBroadcastColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'normal': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div 
      className={`bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-3 cursor-pointer hover:from-purple-800 hover:to-blue-800 transition-colors ${className}`}
      onClick={onClick}
    >
      {/* Main Live Indicator */}
      <div className="flex items-center gap-3 mb-2">
        <div className="relative">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
        </div>
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-white" />
          <span className="text-white font-bold text-sm">DJ {djName} LIVE</span>
        </div>
        <Badge className="bg-red-600 text-white text-xs">
          LIVE
        </Badge>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="flex items-center gap-4 text-xs text-white/80">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{stats.pack_members}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>{stats.energy_level}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            <span>{formatDuration(stats.session_duration)}</span>
          </div>
        </div>
      )}

      {/* Detailed View */}
      {showDetails && (
        <div className="mt-3 space-y-2">
          {/* Active Broadcasts */}
          {activeBroadcasts.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-white/60 font-medium">Active Broadcasts:</div>
              {activeBroadcasts.map((broadcast) => (
                <div key={broadcast.id} className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${getBroadcastColor(broadcast.priority)}`}></div>
                  <span className="text-white/80">{getBroadcastIcon(broadcast.broadcast_type)}</span>
                  <span className="text-white/80 flex-1 truncate">{broadcast.title}</span>
                  <div className="flex items-center gap-1 text-white/60">
                    <Heart className="w-3 h-3" />
                    <span>{broadcast.interaction_count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
              <Volume2 className="w-3 h-3 mr-1" />
              Listen
            </Button>
            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              Join
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}