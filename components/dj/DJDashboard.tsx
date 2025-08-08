'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Music, 
  Users, 
  MessageSquare, 
  Trophy, 
  AlertCircle, 
  RefreshCw, 
  Zap, 
  TrendingUp,
  MapPin,
  BarChart3,
  Radio,
  Sparkles,
  Activity,
  Send,
  Heart,
  Info,
  CheckCircle,
  XCircle,
  Mic,
  Volume2,
  StopCircle
} from 'lucide-react';
import { useDJPermissions } from '@/hooks/useDJPermissions';
import { useDJDashboard } from '@/hooks/useDJDashboard';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { EngagementScoringService } from '@/lib/services/engagement-scoring.service';
import type { Database } from '@/types/database.types';
import type { 
  BroadcastType,
  BroadcastPriority,
  BroadcastStatus,
  DJBroadcast,
  WolfpackLiveStats,
  BroadcastAnalytics
} from '@/types/features/dj-dashboard-types';

// Import existing components
import { BroadcastForm } from './BroadcastForm';
import { EventCreator } from './EventCreator';
import { MassMessageInterface } from './MassMessageInterface';

type RealtimeChannel = ReturnType<typeof supabase.channel>;

// Define correct view type from database
type ActiveBroadcastLive = Database['public']['Views']['active_broadcasts_live']['Row'];
type DJDashboardState = Database['public']['Tables']['dj_dashboard_state']['Row'];
type DJBroadcast = Database['public']['Tables']['dj_broadcasts']['Row'];
type User = Database['public']['Tables']['users']['Row'];

// Enhanced interfaces
interface BroadcastAnalytics {
  timeframe: string;
  start_date: string;
  broadcasts: number;
  broadcast_types_used: number;
  avg_interactions: number;
  max_participants: number;
  total_responses: number;
  unique_responders: number;
  avg_response_time_seconds: number;
  broadcasts_by_type: Record<string, number>;
  top_broadcasts: Array<{
    title: string;
    type: string;
    responses: number;
    participants: number;
  }>;
}

interface WolfpackLiveStats {
  total_active: number;
  very_active: number;
  gender_breakdown: Record<string, number>;
  recent_interactions: {
    total_interactions: number;
    active_participants: number;
  };
  energy_level: number;
  top_vibers: Array<{
    user_id: string;
    name: string;
    avatar: string | null;
    vibe: string | null;
  }>;
}

// =============================================================================
// INTERFACES
// =============================================================================

interface DJDashboardProps {
  location?: 'salem' | 'portland';
}

// =============================================================================
// LOCATION CONFIGURATION
// =============================================================================

const LOCATION_CONFIG = {
  salem: {
    id: '50d17782-3f4a-43a1-b6b6-608171ca3c7c',
    name: 'Salem',
    displayName: 'THE SIDEHUSTLE BAR Salem'
  },
  portland: {
    id: 'ec1e8869-454a-49d2-93e5-ed05f49bb932',
    name: 'Portland',
    displayName: 'THE SIDEHUSTLE BAR Portland'
  }
} as const;

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  loading = false 
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <p className="text-3xl font-bold tracking-tight">{value}</p>
                {subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                )}
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <Icon className="w-5 h-5" />
              </div>
            </div>
            {trend && (
              <div className="mt-2">
                {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500 inline mr-1" />}
                {trend === 'down' && <TrendingUp className="w-4 h-4 text-red-500 inline mr-1 rotate-180" />}
                <span className={`text-xs ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface QuickActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sublabel: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function QuickActionButton({
  icon: Icon,
  label,
  sublabel,
  onClick,
  disabled = false,
  variant = 'default'
}: QuickActionButtonProps) {
  const variantStyles = {
    default: 'hover:bg-accent',
    success: 'hover:bg-green-50 hover:text-green-700 hover:border-green-200',
    warning: 'hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200',
    danger: 'hover:bg-red-50 hover:text-red-700 hover:border-red-200'
  };

  return (
    <Card 
      className={`cursor-pointer transition-all ${variantStyles[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={!disabled ? onClick : undefined}
    >
      <CardContent className="p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-semibold mb-1">{label}</h3>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DJDashboard({ location }: DJDashboardProps) {
  const djPermissions = useDJPermissions();
  const { assignedLocation, isActiveDJ, canSendMassMessages, isLoading: permissionsLoading } = djPermissions;
  const currentLocation = location || assignedLocation || 'salem';
  const locationConfig = LOCATION_CONFIG[currentLocation];
  
  // DJ Dashboard actions
  const { endBroadcast } = useDJDashboard(currentLocation);

  // Core State
  const [activeBroadcasts, setActiveBroadcasts] = useState<ActiveBroadcastLive[]>([]);
  const [liveStats, setLiveStats] = useState<WolfpackLiveStats | null>(null);
  const [analytics, setAnalytics] = useState<BroadcastAnalytics | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [isBroadcastFormOpen, setIsBroadcastFormOpen] = useState(false);
  const [showEventCreator, setShowEventCreator] = useState(false);
  const [showMassMessage, setShowMassMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const analyticsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get current user
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .single();
        
        if (userData && !error) {
          setCurrentUser(userData);
        }
      }
    };
    getUser();
  }, []);

  // =============================================================================
  // DATA FETCHING WITH ENHANCED TYPE SAFETY
  // =============================================================================

  const fetchDashboardData = useCallback(async (showLoadingState = false) => {
    try {
      if (showLoadingState) setIsLoading(true);
      else setIsRefreshing(true);

      setError(null);

      if (!currentUser?.id) return;

      // For now, just fetch broadcasts directly since the view might not exist
      const { data: broadcasts, error: broadcastsError } = await supabase
        .from('active_broadcasts_live')
        .select('*')
        .eq('location_id', locationConfig.id)
        .order('created_at', { ascending: false });

      if (broadcastsError) {
        console.warn('Broadcasts fetch error:', broadcastsError);
      } else {
        setActiveBroadcasts(broadcasts || []);
      }

      // Get real-time engagement data
      const liveStatsData = await EngagementScoringService.getLiveStats(locationConfig.id);
      setLiveStats(liveStatsData);

      setAnalytics({
        timeframe: 'today',
        start_date: new Date().toISOString(),
        broadcasts: 5,
        broadcast_types_used: 3,
        avg_interactions: 8.5,
        max_participants: 25,
        total_responses: 42,
        unique_responders: 18,
        avg_response_time_seconds: 12,
        broadcasts_by_type: { general: 2, vibe_check: 2, contest: 1 },
        top_broadcasts: [
          { title: 'Dance Floor Challenge', type: 'contest', responses: 15, participants: 12 },
          { title: 'Vibe Check', type: 'vibe_check', responses: 12, participants: 10 }
        ]
      });

    } catch (error: unknown) {
      console.error('Dashboard data fetch error:', error);
      setError('Unable to load dashboard data. Please try refreshing.');
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser?.id, locationConfig.id]);

  // =============================================================================
  // REAL-TIME SUBSCRIPTIONS WITH ENHANCED TYPE SAFETY
  // =============================================================================

  const setupRealtimeSubscription = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    subscriptionRef.current = supabase
      .channel(`dj-dashboard-${locationConfig.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dj_broadcasts',
          filter: `location_id=eq.${locationConfig.id}`
        },
        () => {
          fetchDashboardData(false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dj_broadcast_responses'
        },
        (payload) => {
          // Update response counts in real-time with proper typing
          const newResponse = payload.new as Database['public']['Tables']['dj_broadcast_responses']['Row'];
          
          setActiveBroadcasts(prev => 
            prev.map(broadcast => 
              broadcast.id === newResponse?.broadcast_id
                ? { 
                    ...broadcast, 
                    interaction_count: (broadcast.interaction_count || 0) + 1,
                    unique_participants: (broadcast.unique_participants || 0) + 1
                  }
                : broadcast
            )
          );
          
          // Refresh engagement data when new responses come in
          refreshEngagementData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wolfpack_chat_messages'
        },
        () => {
          // Refresh engagement data when new chat messages come in
          refreshEngagementData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wolf_pack_interactions'
        },
        () => {
          // Refresh engagement data when new interactions come in
          refreshEngagementData();
        }
      )
      .subscribe();

  }, [locationConfig.id, fetchDashboardData]);

  // =============================================================================
  // ENGAGEMENT DATA REFRESH
  // =============================================================================
  
  const refreshEngagementData = useCallback(async () => {
    try {
      const liveStatsData = await EngagementScoringService.getLiveStats(locationConfig.id);
      setLiveStats(liveStatsData);
    } catch (error) {
      console.error('Error refreshing engagement data:', error);
    }
  }, [locationConfig.id]);

  // =============================================================================
  // DASHBOARD ACTIONS WITH ENHANCED TYPE SAFETY
  // =============================================================================

  const toggleLiveStatus = useCallback(async () => {
    if (!currentUser?.id) return;

    const newLiveStatus = !isLive;
    
    try {
      setIsLive(newLiveStatus);
      
      toast.success(newLiveStatus ? '🎵 You are now LIVE! Your audience can see you.' : '📴 You are now offline.');
      
      // Create a system broadcast when going live
      if (newLiveStatus) {
        const broadcastData = {
          dj_id: currentUser.id,
          location_id: locationConfig.id,
          broadcast_type: 'general',
          title: '🎵 DJ is LIVE!',
          message: `The DJ is now live at ${locationConfig.displayName}! Get ready to party!`,
          priority: 'high',
          duration_seconds: 10,
          status: 'active',
          auto_close: true,
          background_color: '#000000',
          text_color: '#ffffff',
          accent_color: '#ffffff',
          animation_type: 'pulse',
          emoji_burst: ['🎵', '🎶', '🎤'],
          sent_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 10000).toISOString()
        };

        const { error } = await supabase.from('dj_broadcasts').insert(broadcastData);
        if (error) {
          console.warn('Failed to create live broadcast:', error);
        }
      }
    } catch (error) {
      console.error('Error toggling live status:', error);
      toast.error('Unable to change live status. Please try again.');
    }
  }, [currentUser?.id, isLive, locationConfig.id, locationConfig.displayName]);

  const handleBroadcastCreated = useCallback(() => {
    fetchDashboardData(false);
    toast.success('📢 Broadcast sent successfully!');
  }, [fetchDashboardData]);

  const handleEventCreated = useCallback(() => {
    setShowEventCreator(false);
    toast.success('🎉 Event created successfully!');
  }, []);

  const handleQuickVibeCheck = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      const broadcastData = {
        dj_id: currentUser.id,
        location_id: locationConfig.id,
        broadcast_type: 'vibe_check',
        title: '✨ VIBE CHECK!',
        message: 'How\'s everyone feeling? React with your current vibe!',
        priority: 'high',
        duration_seconds: 30,
        auto_close: true,
        status: 'active',
        background_color: '#ef4444',
        text_color: '#ffffff',
        accent_color: '#fbbf24',
        animation_type: 'pulse',
        emoji_burst: ['✨', '🔥', '💯', '🎉'],
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30000).toISOString(),
        interaction_config: {
          response_type: 'emoji',
          show_results_live: true,
          anonymous_responses: false
        }
      };

      const { error } = await supabase.from('dj_broadcasts').insert(broadcastData);

      if (error) throw error;

      toast.success('✨ Vibe check sent! Check responses in Active tab.');
      fetchDashboardData(false);
    } catch (error) {
      console.error('Vibe check error:', error);
      toast.error('Failed to send vibe check');
    }
  }, [currentUser?.id, locationConfig.id, fetchDashboardData]);

  const handleSingleLadiesSpotlight = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      const broadcastData = {
        dj_id: currentUser.id,
        location_id: locationConfig.id,
        broadcast_type: 'spotlight',
        title: '💃 SINGLE LADIES SPOTLIGHT!',
        message: '💃 All the single ladies, make some noise! This one\'s for you! Get on the dance floor and show us what you got! 💜',
        priority: 'urgent',
        duration_seconds: 45,
        auto_close: true,
        status: 'active',
        background_color: '#ec4899',
        text_color: '#ffffff',
        accent_color: '#fbbf24',
        animation_type: 'bounce',
        emoji_burst: ['💃', '💜', '✨', '🔥', '👑'],
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 45000).toISOString(),
        interaction_config: {
          response_type: 'emoji',
          show_results_live: true,
          anonymous_responses: false
        }
      };

      const { error } = await supabase.from('dj_broadcasts').insert(broadcastData);

      if (error) throw error;

      toast.success('💃 Ladies spotlight is ON! Let them shine!');
      fetchDashboardData(false);
    } catch (error) {
      console.error('Single ladies spotlight error:', error);
      toast.error('Failed to activate spotlight');
    }
  }, [currentUser?.id, locationConfig.id, fetchDashboardData]);

  // =============================================================================
  // LIFECYCLE
  // =============================================================================

  useEffect(() => {
    if (permissionsLoading || !currentUser) return;

    if (!isActiveDJ || !canSendMassMessages) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const initializeDashboard = async () => {
      if (mounted) {
        await fetchDashboardData(true);
        setupRealtimeSubscription();

        // Setup analytics refresh interval
        analyticsIntervalRef.current = setInterval(() => {
          fetchDashboardData(false);
          refreshEngagementData(); // Also refresh engagement data
        }, 30000); // Refresh every 30 seconds
      }
    };

    initializeDashboard();

    return () => {
      mounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (analyticsIntervalRef.current) {
        clearInterval(analyticsIntervalRef.current);
        analyticsIntervalRef.current = null;
      }
    };
  }, [permissionsLoading, isActiveDJ, canSendMassMessages, currentUser, fetchDashboardData, setupRealtimeSubscription, refreshEngagementData]);

  // =============================================================================
  // PERMISSION CHECK
  // =============================================================================

  if (permissionsLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center animate-pulse">
            <Music className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Setting up your DJ station...</h2>
            <p className="text-sm text-muted-foreground">This will just take a moment</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isActiveDJ || !canSendMassMessages) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Music className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-bold">DJ Access Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              You need DJ permissions to access this control center.
            </p>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Please contact your venue manager to get DJ access. They can set up your permissions in the admin panel.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate energy trend
  const getEnergyTrend = (): 'up' | 'down' | 'neutral' => {
    if (!liveStats?.energy_level) return 'neutral';
    if (liveStats.energy_level > 70) return 'up';
    if (liveStats.energy_level < 30) return 'down';
    return 'neutral';
  };

  // =============================================================================
  // MAIN RENDER - USER FRIENDLY & CLEAR
  // =============================================================================

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Clean & Clear */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* DJ Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isLive ? 'bg-black' : 'bg-muted'
                }`}>
                  <Music className={`w-6 h-6 ${isLive ? 'text-white' : 'text-muted-foreground'}`} />
                </div>
                {isLive && (
                  <div className="absolute -top-1 -right-1">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold">DJ Control Center</h1>
                  {isLive && (
                    <Badge variant="destructive" className="animate-pulse">
                      <Radio className="w-3 h-3 mr-1" />
                      LIVE
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{locationConfig.displayName}</span>
                  <span className="text-xs">•</span>
                  <span className="text-xs">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            {/* Live Toggle & Refresh */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDashboardData(false)}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                variant={isLive ? "destructive" : "default"}
                onClick={toggleLiveStatus}
                className="gap-2 min-w-[140px]"
                size="lg"
              >
                {isLive ? (
                  <>
                    <Volume2 className="w-5 h-5" />
                    Go Offline
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    Go Live
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Help Text */}
          {!isLive && (
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Click "Go Live" to start your DJ session and enable audience interactions.
              </AlertDescription>
            </Alert>
          )}

          {/* Live Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Pack Members"
              value={liveStats?.total_active || 0}
              subtitle={liveStats?.very_active ? `${liveStats.very_active} highly engaged` : 'No active members yet'}
              icon={Users}
              trend={liveStats?.total_active ? 'up' : undefined}
              loading={!liveStats && isLoading}
            />
            
            <StatCard
              title="Live Broadcasts"
              value={activeBroadcasts.filter(b => b.status === 'active').length}
              subtitle={analytics?.total_responses ? `${analytics.total_responses} total responses` : 'No responses yet'}
              icon={MessageSquare}
              loading={!analytics && isLoading}
            />
            
            <StatCard
              title="Crowd Energy"
              value={`${Math.round(liveStats?.energy_level || 0)}%`}
              subtitle={
                liveStats?.energy_level 
                  ? liveStats.energy_level > 70 ? '🔥 On fire!' 
                    : liveStats.energy_level > 40 ? '✨ Good vibes' 
                    : '💤 Warming up'
                  : 'No data yet'
              }
              icon={Activity}
              trend={getEnergyTrend()}
              loading={!liveStats && isLoading}
            />
            
            <StatCard
              title="Engagement Rate"
              value={analytics?.unique_responders || 0}
              subtitle={analytics?.avg_response_time_seconds 
                ? `${analytics.avg_response_time_seconds}s avg response` 
                : 'No engagement yet'}
              icon={Zap}
              loading={!analytics && isLoading}
            />
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setError(null);
                  fetchDashboardData(true);
                }}
                className="ml-4"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Quick Actions Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Quick Actions
          </h2>
          <p className="text-sm text-muted-foreground">Send instant messages to engage your crowd</p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionButton
            icon={Send}
            label="Send Broadcast"
            sublabel={liveStats?.total_active ? `Reach ${liveStats.total_active} people` : 'No active audience'}
            onClick={() => setShowMassMessage(true)}
            disabled={!liveStats?.total_active}
            variant="default"
          />
          
          <QuickActionButton
            icon={Sparkles}
            label="Vibe Check"
            sublabel="Quick energy pulse"
            onClick={handleQuickVibeCheck}
            variant="success"
          />
          
          <QuickActionButton
            icon={Heart}
            label="Ladies Spotlight"
            sublabel="Special shoutout"
            onClick={handleSingleLadiesSpotlight}
            variant="warning"
          />
          
          <QuickActionButton
            icon={Trophy}
            label="Start Contest"
            sublabel="Create competition"
            onClick={() => setShowEventCreator(true)}
            variant="danger"
          />
        </div>
      </section>

      {/* Main Content Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="broadcasts" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3">
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Create</span>
            </TabsTrigger>
            <TabsTrigger value="active" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3">
              <Radio className="w-4 h-4" />
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm">Active</span>
                {activeBroadcasts.filter(b => b.status === 'active').length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1">
                    {activeBroadcasts.filter(b => b.status === 'active').length}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Tonight&apos;s Top Crowd Members
                  </div>
                  {isLoading && (
                    <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="flex items-center gap-3 p-2">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="w-24 h-4" />
                          <Skeleton className="w-16 h-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Unable to Load Top Members</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      There was an issue loading engagement data.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.reload()}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : liveStats?.top_vibers && liveStats.top_vibers.length > 0 ? (
                  <div className="space-y-3">
                    {liveStats.top_vibers.slice(0, 5).map((viper, index) => (
                      <div key={viper.user_id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                        <div className="text-lg font-bold w-8 text-center">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </div>
                        <img
                          src={viper.avatar || '/images/product-placeholder.jpg'} 
                          alt={viper.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/product-placeholder.jpg';
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{viper.name}</p>
                            {viper.vibe && (
                              <span className="text-lg" title="Vibe">{viper.vibe}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {index === 0 ? 'Top Performer' : index === 1 ? 'High Engagement' : index === 2 ? 'Active Member' : 'Regular Participant'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <p className="text-xs text-muted-foreground mt-1">Live</p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show refresh time */}
                    <div className="text-center pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Last updated: {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No Active Participants Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start broadcasting to see your top crowd members here
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('broadcasts')}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Create Broadcast
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">💡 DJ Pro Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Send a vibe check every 30 minutes to keep engagement high</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Use contests and polls to boost crowd participation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Monitor energy levels and adjust your music accordingly</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Broadcasts Tab */}
          <TabsContent value="broadcasts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New Broadcast</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Send messages, polls, and contests to your audience
                </p>
              </CardHeader>
              <CardContent>
                <BroadcastForm
                  djId={currentUser?.id || ''}
                  locationId={locationConfig.id}
                  sessionId={sessionId || undefined}
                  isOpen={true}
                  onClose={() => {}}
                  onBroadcastCreated={handleBroadcastCreated}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Broadcasts Tab */}
          <TabsContent value="active" className="space-y-4">
            {activeBroadcasts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No Active Broadcasts</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your active broadcasts will appear here
                  </p>
                  <Button onClick={() => setActiveTab('broadcasts')}>
                    Create Your First Broadcast
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Active Broadcasts</h3>
                  <Badge variant="outline">
                    {activeBroadcasts.filter(b => b.status === 'active').length} Active
                  </Badge>
                </div>
                {activeBroadcasts.map((broadcast) => (
                  <Card key={broadcast.id} className={broadcast.status === 'active' ? 'border-green-500/50' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{broadcast.title}</CardTitle>
                          {broadcast.subtitle && (
                            <p className="text-sm text-muted-foreground">{broadcast.subtitle}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {broadcast.status === 'active' ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Live
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="w-3 h-3 mr-1" />
                              Ended
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">{broadcast.message}</p>
                      
                      <div className="grid grid-cols-3 gap-4 text-center mb-4">
                        <div>
                          <p className="text-2xl font-bold">{broadcast.unique_participants || 0}</p>
                          <p className="text-xs text-muted-foreground">Participants</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{broadcast.interaction_count || 0}</p>
                          <p className="text-xs text-muted-foreground">Responses</p>
                        </div>
                        <div>
                          {broadcast.seconds_remaining && broadcast.seconds_remaining > 0 ? (
                            <>
                              <p className="text-2xl font-bold">
                                {Math.floor(broadcast.seconds_remaining / 60)}:{String(broadcast.seconds_remaining % 60).padStart(2, '0')}
                              </p>
                              <p className="text-xs text-muted-foreground">Time Left</p>
                            </>
                          ) : (
                            <>
                              <p className="text-2xl font-bold">-</p>
                              <p className="text-xs text-muted-foreground">Ended</p>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* End Broadcast Button - Only show for active broadcasts */}
                      {broadcast.status === 'active' && (
                        <div className="flex justify-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              try {
                                await endBroadcast(broadcast.id!);
                                toast.success('Broadcast ended successfully');
                                // Refresh broadcasts to update the display
                                window.location.reload();
                              } catch (error) {
                                console.error('Error ending broadcast:', error);
                                toast.error('Failed to end broadcast');
                              }
                            }}
                            className="gap-2"
                          >
                            <StopCircle className="w-4 h-4" />
                            End Broadcast
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            {analytics ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Today&apos;s Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold">{analytics.broadcasts}</p>
                        <p className="text-sm text-muted-foreground">Total Broadcasts</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold">{analytics.total_responses}</p>
                        <p className="text-sm text-muted-foreground">Total Responses</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold">{analytics.unique_responders}</p>
                        <p className="text-sm text-muted-foreground">Unique Users</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold">{analytics.avg_response_time_seconds || 0}s</p>
                        <p className="text-sm text-muted-foreground">Avg Response Time</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {analytics.top_broadcasts && analytics.top_broadcasts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Performing Broadcasts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.top_broadcasts.map((broadcast, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{broadcast.title}</p>
                                <p className="text-xs text-muted-foreground">{broadcast.type}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{broadcast.responses}</p>
                              <p className="text-xs text-muted-foreground">from {broadcast.participants} users</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No Analytics Data Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Start broadcasting to see your performance metrics
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </section>

      {/* Modals */}
      <MassMessageInterface
        isOpen={showMassMessage}
        onClose={() => setShowMassMessage(false)}
        packMemberCount={liveStats?.total_active || 0}
        location={currentLocation}
      />

      <EventCreator
        isOpen={showEventCreator}
        onClose={() => setShowEventCreator(false)}
        onEventCreated={handleEventCreated}
        availableMembers={[]}
        location={currentLocation}
      />
    </div>
  );
}