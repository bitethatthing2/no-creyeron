'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Music, 
  Users, 
  Zap, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Heart, 
  MessageCircle,
  Trophy,
  Settings,
  X,
  Maximize2,
  Minimize2,
  Radio,
  Mic,
  Headphones,
  Activity
} from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';

interface LiveDJSession {
  id: string;
  dj_id: string;
  dj_name: string;
  dj_avatar: string;
  title: string;
  description: string;
  genre: string;
  start_time: string;
  is_live: boolean;
  stream_url?: string;
  participant_count: number;
  energy_level: number;
  current_song?: {
    title: string;
    artist: string;
    duration: number;
    elapsed: number;
  };
  queue: Array<{
    id: string;
    title: string;
    artist: string;
    requested_by: string;
    votes: number;
  }>;
  live_stats: {
    total_listeners: number;
    peak_listeners: number;
    average_energy: number;
    songs_played: number;
    requests_count: number;
  };
}

interface LiveDJOverlaySystemProps {
  isVisible: boolean;
  onClose: () => void;
  currentUser: any;
  className?: string;
}

export default function LiveDJOverlaySystem({
  isVisible,
  onClose,
  currentUser,
  className = ''
}: LiveDJOverlaySystemProps) {
  const [djSession, setDjSession] = useState<LiveDJSession | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [userEnergy, setUserEnergy] = useState(0);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [showControls, setShowControls] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const energyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load live DJ session
  useEffect(() => {
    const loadLiveSession = async () => {
      try {
        const { data: sessions, error } = await supabase
          .from('dj_sessions')
          .select(`
            *,
            dj_profile:users!dj_sessions_dj_id_fkey(
              first_name,
              last_name,
              avatar_url
            ),
            current_song:current_songs(*),
            session_queue:song_queue(*),
            live_stats:session_stats(*)
          `)
          .eq('is_live', true)
          .eq('status', 'active')
          .order('start_time', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error loading DJ session:', error);
          return;
        }

        if (sessions && sessions.length > 0) {
          const session = sessions[0];
          setDjSession({
            id: session.id,
            dj_id: session.dj_id,
            dj_name: `${session.dj_profile?.first_name || ''} ${session.dj_profile?.last_name || ''}`.trim() || 'DJ',
            dj_avatar: session.dj_profile?.avatar_url || '/default-avatar.png',
            title: session.title || 'Live DJ Session',
            description: session.description || 'Live music session',
            genre: session.genre || 'Mixed',
            start_time: session.start_time,
            is_live: session.is_live,
            stream_url: session.stream_url,
            participant_count: session.participant_count || 0,
            energy_level: session.energy_level || 0,
            current_song: session.current_song,
            queue: session.session_queue || [],
            live_stats: session.live_stats || {
              total_listeners: 0,
              peak_listeners: 0,
              average_energy: 0,
              songs_played: 0,
              requests_count: 0
            }
          });
        }
      } catch (error) {
        console.error('Error loading live DJ session:', error);
      }
    };

    if (isVisible) {
      loadLiveSession();
    }
  }, [isVisible]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!djSession) return;

    const channel = supabase
      .channel('dj_overlay_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dj_sessions',
          filter: `id=eq.${djSession.id}`
        },
        (payload) => {
          const updatedSession = payload.new as any;
          setDjSession(prev => prev ? {
            ...prev,
            participant_count: updatedSession.participant_count,
            energy_level: updatedSession.energy_level,
            is_live: updatedSession.is_live
          } : null);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'current_songs',
          filter: `session_id=eq.${djSession.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const song = payload.new as any;
            setDjSession(prev => prev ? {
              ...prev,
              current_song: {
                title: song.title,
                artist: song.artist,
                duration: song.duration,
                elapsed: song.elapsed
              }
            } : null);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dj_chat_messages',
          filter: `session_id=eq.${djSession.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const message = payload.new as any;
            setRecentMessages(prev => [message, ...prev.slice(0, 4)]);
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
  }, [djSession]);

  // Handle audio playback
  useEffect(() => {
    if (audioRef.current && djSession?.stream_url) {
      audioRef.current.volume = volume;
      
      if (isAudioPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isAudioPlaying, volume, djSession?.stream_url]);

  // Energy tracking
  useEffect(() => {
    if (isAudioPlaying && djSession) {
      energyIntervalRef.current = setInterval(() => {
        setUserEnergy(prev => Math.min(100, prev + Math.random() * 5));
      }, 1000);
    } else {
      if (energyIntervalRef.current) {
        clearInterval(energyIntervalRef.current);
      }
      setUserEnergy(prev => Math.max(0, prev - 2));
    }

    return () => {
      if (energyIntervalRef.current) {
        clearInterval(energyIntervalRef.current);
      }
    };
  }, [isAudioPlaying, djSession]);

  // Handle energy boost
  const handleEnergyBoost = async () => {
    if (!djSession || !currentUser) return;

    try {
      const { error } = await supabase
        .from('energy_boosts')
        .insert([{
          session_id: djSession.id,
          user_id: currentUser.id,
          boost_amount: 10,
          created_at: new Date().toISOString()
        }]);

      if (!error) {
        setUserEnergy(prev => Math.min(100, prev + 15));
      }
    } catch (error) {
      console.error('Error sending energy boost:', error);
    }
  };

  // Handle song request
  const handleSongRequest = async () => {
    if (!djSession || !currentUser) return;
    
    // This would open a song request modal
    console.log('Song request modal would open here');
  };

  // Handle DJ follow
  const handleFollowDJ = async () => {
    if (!djSession || !currentUser) return;

    try {
      const { error } = await supabase
        .from('dj_followers')
        .insert([{
          dj_id: djSession.dj_id,
          follower_id: currentUser.id,
          created_at: new Date().toISOString()
        }]);

      if (!error) {
        console.log('Following DJ');
      }
    } catch (error) {
      console.error('Error following DJ:', error);
    }
  };

  if (!isVisible || !djSession) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      {/* Audio Element */}
      {djSession.stream_url && (
        <audio
          ref={audioRef}
          src={djSession.stream_url}
          loop
          onLoadedData={() => console.log('Audio loaded')}
          onError={(e) => console.error('Audio error:', e)}
        />
      )}

      {/* Overlay Background */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Main Overlay Content */}
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900 to-blue-900">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={djSession.dj_avatar}
                alt={djSession.dj_name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-white"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{djSession.dj_name}</h2>
              <p className="text-white/80 text-sm">{djSession.title}</p>
            </div>
            <Badge className="bg-red-600 text-white animate-pulse">
              LIVE
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white hover:bg-white/20"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex">
          {/* Left Panel - Controls */}
          <div className="w-80 bg-black/50 backdrop-blur-sm border-r border-white/10 p-4 space-y-4">
            {/* Audio Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Audio</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowControls(!showControls)}
                  className="text-white hover:bg-white/20"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setIsAudioPlaying(!isAudioPlaying)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {isAudioPlaying ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Listen
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
                  className="text-white border-white/20 hover:bg-white/20"
                >
                  {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
              </div>

              {showControls && (
                <div className="space-y-2">
                  <label className="text-white text-sm">Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Current Song */}
            {djSession.current_song && (
              <div className="bg-white/10 rounded-lg p-3">
                <h4 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Now Playing
                </h4>
                <div className="text-white">
                  <p className="font-semibold">{djSession.current_song.title}</p>
                  <p className="text-sm text-white/80">{djSession.current_song.artist}</p>
                </div>
              </div>
            )}

            {/* Energy Meter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm">Your Energy</span>
                <span className="text-white text-sm">{Math.round(userEnergy)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${userEnergy}%` }}
                />
              </div>
              <Button
                onClick={handleEnergyBoost}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
                disabled={userEnergy >= 95}
              >
                <Zap className="w-4 h-4 mr-2" />
                Boost Energy!
              </Button>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                onClick={handleSongRequest}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Music className="w-4 h-4 mr-2" />
                Request Song
              </Button>
              <Button
                onClick={handleFollowDJ}
                variant="outline"
                className="w-full text-white border-white/20 hover:bg-white/20"
              >
                <Heart className="w-4 h-4 mr-2" />
                Follow DJ
              </Button>
            </div>
          </div>

          {/* Right Panel - Stats & Chat */}
          <div className="flex-1 bg-black/30 backdrop-blur-sm p-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{djSession.participant_count}</div>
                <div className="text-white/80 text-sm">Listeners</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{djSession.energy_level}%</div>
                <div className="text-white/80 text-sm">Energy</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{djSession.live_stats.songs_played}</div>
                <div className="text-white/80 text-sm">Songs</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{djSession.live_stats.requests_count}</div>
                <div className="text-white/80 text-sm">Requests</div>
              </div>
            </div>

            {/* Song Queue */}
            {djSession.queue.length > 0 && (
              <div className="mb-6">
                <h4 className="text-white font-medium mb-3">Up Next</h4>
                <div className="space-y-2">
                  {djSession.queue.slice(0, 3).map((song, index) => (
                    <div key={song.id} className="flex items-center gap-3 bg-white/10 rounded-lg p-2">
                      <div className="text-white/60 text-sm">#{index + 1}</div>
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium">{song.title}</div>
                        <div className="text-white/80 text-xs">{song.artist}</div>
                      </div>
                      <div className="flex items-center gap-1 text-white/60">
                        <Trophy className="w-3 h-3" />
                        <span className="text-xs">{song.votes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Messages */}
            <div>
              <h4 className="text-white font-medium mb-3">Live Chat</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {recentMessages.map((message, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-2">
                    <div className="text-white text-sm">{message.content}</div>
                    <div className="text-white/60 text-xs">{message.user_name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}