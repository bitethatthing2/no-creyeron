'use client';

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  AlertTriangle, 
  Info, 
  Megaphone, 
  Users, 
  Eye,
  Heart,
  Timer,
  Zap,
  TrendingUp,
  Activity
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { BroadcastStatusService } from '@/lib/services/broadcast-status.service';

interface LiveBroadcast {
  id: string;
  title: string;
  message: string;
  broadcast_type: string;
  priority: string;
  category: string;
  created_at: string;
  expires_at: string | null;
  view_count: number;
  interaction_count: number;
  unique_participants: number;
  status: string;
  dj_id: string;
  session_id: string;
  emoji_burst: string[];
  background_color: string;
  text_color: string;
  accent_color: string;
  animation_type: string;
}

interface BroadcastResponse {
  id: string;
  broadcast_id: string;
  user_id: string;
  response_type: string;
  response_data: any;
  created_at: string;
}

interface LiveBroadcastIndicatorProps {
  className?: string;
  onClick?: () => void;
  showDetails?: boolean;
}

export default function LiveBroadcastIndicator({ 
  className = '', 
  onClick, 
  showDetails = false 
}: LiveBroadcastIndicatorProps) {
  const [activeBroadcasts, setActiveBroadcasts] = useState<LiveBroadcast[]>([]);
  const [currentBroadcast, setCurrentBroadcast] = useState<LiveBroadcast | null>(null);
  const [recentResponses, setRecentResponses] = useState<BroadcastResponse[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize live broadcasts
  useEffect(() => {
    const initializeLiveBroadcasts = async () => {
      try {
        // Check for expired broadcasts first
        await BroadcastStatusService.checkAndUpdateExpiredBroadcasts();

        // Check for active broadcasts
        const { data: broadcasts, error } = await supabase
          .from('dj_broadcasts')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading live broadcasts:', error);
          return;
        }

        setActiveBroadcasts(broadcasts || []);
        
        if (broadcasts && broadcasts.length > 0) {
          // Show the highest priority broadcast
          const priorityOrder = { 'urgent': 4, 'high': 3, 'normal': 2, 'low': 1 };
          const sortedBroadcasts = broadcasts.sort((a, b) => 
            (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) - 
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 0)
          );
          
          setCurrentBroadcast(sortedBroadcasts[0]);
          await loadBroadcastResponses(sortedBroadcasts[0].id);
        }
      } catch (error) {
        console.error('Error initializing live broadcasts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLiveBroadcasts();

    // Set up periodic cleanup for expired broadcasts every 30 seconds
    const cleanupInterval = setInterval(() => {
      BroadcastStatusService.checkAndUpdateExpiredBroadcasts();
    }, 30000);

    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  // Load broadcast responses
  const loadBroadcastResponses = async (broadcastId: string) => {
    try {
      const { data: responses, error } = await supabase
        .from('broadcast_responses')
        .select(`
          *,
          users!broadcast_responses_user_id_fkey(
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('broadcast_id', broadcastId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error loading broadcast responses:', error);
        return;
      }

      setRecentResponses(responses || []);
    } catch (error) {
      console.error('Error loading broadcast responses:', error);
    }
  };

  // Calculate time remaining for broadcast and handle expiration
  useEffect(() => {
    if (!currentBroadcast || !currentBroadcast.expires_at) return;

    const calculateTimeRemaining = async () => {
      const now = new Date().getTime();
      const expiresAt = new Date(currentBroadcast.expires_at!).getTime();
      const remaining = Math.max(0, expiresAt - now);
      const remainingSeconds = Math.floor(remaining / 1000);
      
      setTimeRemaining(remainingSeconds);
      
      // Handle broadcast expiration
      if (remainingSeconds === 0 && currentBroadcast.status === 'active') {
        try {
          await BroadcastStatusService.expireBroadcast(currentBroadcast.id);
          // Remove from active broadcasts
          setActiveBroadcasts(prev => prev.filter(b => b.id !== currentBroadcast.id));
          setCurrentBroadcast(null);
        } catch (error) {
          console.error('Failed to expire broadcast:', error);
        }
      }
    };

    calculateTimeRemaining();
    timerRef.current = setInterval(calculateTimeRemaining, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentBroadcast]);

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('live_broadcasts_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dj_broadcasts'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newBroadcast = payload.new as LiveBroadcast;
            if (newBroadcast.status === 'active') {
              setActiveBroadcasts(prev => [newBroadcast, ...prev]);
              // Update current broadcast if this is higher priority
              if (!currentBroadcast || getPriorityWeight(newBroadcast.priority) > getPriorityWeight(currentBroadcast.priority)) {
                setCurrentBroadcast(newBroadcast);
                loadBroadcastResponses(newBroadcast.id);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedBroadcast = payload.new as LiveBroadcast;
            
            // If broadcast is no longer active, remove it from the list
            if (updatedBroadcast.status !== 'active') {
              setActiveBroadcasts(prev => prev.filter(b => b.id !== updatedBroadcast.id));
              if (currentBroadcast && currentBroadcast.id === updatedBroadcast.id) {
                setCurrentBroadcast(null);
              }
            } else {
              // Update the broadcast if still active
              setActiveBroadcasts(prev => 
                prev.map(b => b.id === updatedBroadcast.id ? updatedBroadcast : b)
              );
              if (currentBroadcast && currentBroadcast.id === updatedBroadcast.id) {
                setCurrentBroadcast(updatedBroadcast);
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'broadcast_responses'
        },
        (payload) => {
          if (currentBroadcast && payload.new.broadcast_id === currentBroadcast.id) {
            loadBroadcastResponses(currentBroadcast.id);
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
  }, [currentBroadcast]);

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

  const getPriorityWeight = (priority: string) => {
    const weights = { 'urgent': 4, 'high': 3, 'normal': 2, 'low': 1 };
    return weights[priority as keyof typeof weights] || 0;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getBroadcastIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Megaphone className="w-4 h-4" />;
      case 'poll': return <TrendingUp className="w-4 h-4" />;
      case 'contest': return <Activity className="w-4 h-4" />;
      case 'spotlight': return <Zap className="w-4 h-4" />;
      case 'urgent': return <AlertTriangle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getBroadcastColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'from-red-900 to-red-700';
      case 'high': return 'from-orange-900 to-orange-700';
      case 'normal': return 'from-blue-900 to-blue-700';
      case 'low': return 'from-gray-900 to-gray-700';
      default: return 'from-gray-900 to-gray-700';
    }
  };

  const getBroadcastEmoji = (type: string) => {
    switch (type) {
      case 'announcement': return '📢';
      case 'poll': return '📊';
      case 'contest': return '🏆';
      case 'spotlight': return '✨';
      case 'general': return '💬';
      default: return '📢';
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-700 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
          <div className="w-24 h-4 bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  if (!currentBroadcast) {
    return (
      <div className={`bg-gray-800 rounded-lg p-3 opacity-50 ${className}`}>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-500" />
          <span className="text-gray-500 text-sm">No Active Broadcasts</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-gradient-to-r ${getBroadcastColor(currentBroadcast.priority)} rounded-lg p-3 cursor-pointer hover:scale-105 transition-transform ${className}`}
      onClick={onClick}
    >
      {/* Main Broadcast Indicator */}
      <div className="flex items-center gap-3 mb-2">
        <div className="relative">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">{getBroadcastEmoji(currentBroadcast.broadcast_type)}</span>
          <span className="text-white font-bold text-sm truncate">{currentBroadcast.title}</span>
        </div>
        <Badge className={`text-white text-xs ${
          currentBroadcast.priority === 'urgent' ? 'bg-red-600' : 
          currentBroadcast.priority === 'high' ? 'bg-orange-600' : 
          currentBroadcast.priority === 'normal' ? 'bg-blue-600' : 'bg-gray-600'
        }`}>
          {currentBroadcast.priority.toUpperCase()}
        </Badge>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 text-xs text-white/80">
        <div className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          <span>{currentBroadcast.view_count}</span>
        </div>
        <div className="flex items-center gap-1">
          <Heart className="w-3 h-3" />
          <span>{currentBroadcast.interaction_count}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>{currentBroadcast.unique_participants}</span>
        </div>
        {timeRemaining > 0 && (
          <div className="flex items-center gap-1">
            <Timer className="w-3 h-3" />
            <span>{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>

      {/* Deletion Warning */}
      {(() => {
        const daysUntilDeletion = BroadcastStatusService.getDaysUntilDeletion(currentBroadcast);
        if (daysUntilDeletion !== null && daysUntilDeletion <= 7) {
          return (
            <div className="mt-2 flex items-center gap-2 bg-red-900/30 border border-red-500/50 rounded-lg p-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-red-200 text-xs font-medium">
                ⚠️ Will be deleted in {daysUntilDeletion} day{daysUntilDeletion !== 1 ? 's' : ''}
              </span>
            </div>
          );
        }
        return null;
      })()}

      {/* Broadcast Message */}
      <div className="mt-2 text-white/90 text-sm">
        {currentBroadcast.message.length > 60 ? 
          `${currentBroadcast.message.substring(0, 60)}...` : 
          currentBroadcast.message
        }
      </div>

      {/* Detailed View */}
      {showDetails && (
        <div className="mt-3 space-y-2">
          {/* Recent Responses */}
          {recentResponses.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-white/60 font-medium">Recent Responses:</div>
              {recentResponses.slice(0, 3).map((response) => (
                <div key={response.id} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-white/80 flex-1 truncate">
                    {response.response_type === 'emoji' ? response.response_data.emoji : 
                     response.response_type === 'text' ? response.response_data.text : 
                     'Response'}
                  </span>
                  <span className="text-white/60 text-xs">
                    {new Date(response.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Emoji Burst */}
          {currentBroadcast.emoji_burst && currentBroadcast.emoji_burst.length > 0 && (
            <div className="flex gap-1 mt-2">
              {currentBroadcast.emoji_burst.map((emoji, index) => (
                <span key={index} className="text-lg animate-bounce" style={{ animationDelay: `${index * 0.1}s` }}>
                  {emoji}
                </span>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
              <Heart className="w-3 h-3 mr-1" />
              React
            </Button>
            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
              <MessageSquare className="w-3 h-3 mr-1" />
              Respond
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}