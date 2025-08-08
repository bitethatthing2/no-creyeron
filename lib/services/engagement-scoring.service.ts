'use client';

import { supabase } from '@/lib/supabase';

// Define the WolfpackLiveStats type if not already defined
export interface WolfpackLiveStats {
  total_active: number;
  very_active: number;
  gender_breakdown: Record<string, number>;
  recent_interactions: {
    total_interactions: number;
    active_participants: number;
  };
  energy_level: number;
  top_vibers: TopViber[];
}

export interface TopViber {
  user_id: string;
  name: string;
  avatar: string | null;
  vibe: string | null;
  engagement_score: number;
}

interface EngagementData {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  broadcast_responses: number;
  chat_messages: number;
  interactions_sent: number;
  interactions_received: number;
  recent_activity: number;
  total_session_time: number;
  membership_tier: string | null;
}



// Define the structure for engagement metrics from the database
interface EngagementMetric {
  user_id: string;
  total_session_time_minutes: number | null;
  total_interactions: number | null;
}

// Define the structure for broadcast response data
interface BroadcastResponseData {
  user_id: string | null;
  broadcast_id?: string | null;
}

// Define the structure for chat message data
interface ChatMessageData {
  user_id: string | null;
}

// Define the structure for interaction data
interface InteractionData {
  sender_id: string | null;
  receiver_id: string | null;
}

/**
 * Engagement Scoring Service
 * Calculates real-time engagement scores for crowd members
 */
export class EngagementScoringService {
  private static readonly SCORING_WEIGHTS = {
    broadcast_responses: 0.4,    // 40% - Most valuable engagement
    chat_activity: 0.25,         // 25% - High engagement indicator
    social_interactions: 0.2,    // 20% - User-to-user engagement
    session_activity: 0.15       // 15% - Time spent and recency
  } as const;

  private static readonly VIBE_EMOJIS = ['🔥', '✨', '💃', '🎵', '⚡', '🌟', '🎯', '💯'] as const;

  /**
   * Get top crowd members with real-time engagement scoring
   */
  static async getTopCrowdMembers(locationId: string, limit: number = 10): Promise<TopViber[]> {
    try {
      // Get engagement data for all active users at this location
      const engagementData = await this.getEngagementData(locationId);
      
      // Calculate engagement scores
      const scoredUsers = engagementData.map(user => ({
        ...user,
        engagement_score: this.calculateEngagementScore(user)
      }));

      // Sort by engagement score and get top users
      const topUsers = scoredUsers
        .sort((a, b) => b.engagement_score - a.engagement_score)
        .slice(0, limit);

      // Convert to TopViber format
      return topUsers.map((user, index) => ({
        user_id: user.user_id,
        name: user.display_name,
        avatar: user.avatar_url,
        vibe: this.getVibeEmoji(user.engagement_score, index),
        engagement_score: user.engagement_score
      }));

    } catch (error) {
      console.error('Error getting top crowd members:', error);
      return [];
    }
  }

  /**
   * Get comprehensive engagement data for all users at a location
   */
  private static async getEngagementData(locationId: string): Promise<EngagementData[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    try {
      // Get active wolfpack members at this specific location with user info
      const { data: activeMembers, error: membersError } = await supabase
        .from('users')
        .select(`
          id,
          display_name,
          avatar_url
        `)
        .eq('location_id', locationId)
        .eq('wolfpack_status', 'active')
        .eq('is_wolfpack_member', true)
        .gte('updated_at', startOfDay.toISOString());

      if (membersError) throw membersError;
      if (!activeMembers || activeMembers.length === 0) return [];

      const userIds = activeMembers.map(member => member.id);

      // Get broadcast responses for this location (today)
      const { data: broadcastResponses, error: broadcastError } = await supabase
        .from('dj_broadcast_responses')
        .select('user_id, broadcast_id')
        .in('user_id', userIds)
        .gte('responded_at', startOfDay.toISOString())
        .lt('responded_at', endOfDay.toISOString())
        .returns<BroadcastResponseData[]>();

      if (broadcastError) console.warn('Broadcast responses error:', broadcastError);

      // Filter broadcast responses by location through dj_broadcasts join
      let locationFilteredBroadcasts: BroadcastResponseData[] = [];
      if (broadcastResponses && broadcastResponses.length > 0) {
        // Get valid broadcast IDs (filter out null/undefined)
        const validBroadcastIds = broadcastResponses
          .map(br => br.broadcast_id)
          .filter((id): id is string => id !== null && id !== undefined);

        if (validBroadcastIds.length > 0) {
          const { data: locationBroadcasts, error: locationBroadcastError } = await supabase
            .from('dj_broadcasts')
            .select('id')
            .eq('location_id', locationId)
            .in('id', validBroadcastIds)
            .returns<{ id: string }[]>();

          if (!locationBroadcastError && locationBroadcasts) {
            const locationBroadcastIds = new Set(locationBroadcasts.map(lb => lb.id));
            locationFilteredBroadcasts = broadcastResponses.filter(br => 
              br.broadcast_id && locationBroadcastIds.has(br.broadcast_id)
            );
          }
        }
      }

      // Get chat messages (today)
      const { data: chatMessages, error: chatError } = await supabase
        .from('wolfpack_chat_messages')
        .select('user_id')
        .in('user_id', userIds)
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString())
        .returns<ChatMessageData[]>();

      if (chatError) console.warn('Chat messages error:', chatError);

      // Get interactions at this location (today)
      const { data: interactionsSent, error: sentError } = await supabase
        .from('wolf_pack_interactions')
        .select('sender_id')
        .in('sender_id', userIds)
        .eq('location_id', locationId)
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString())
        .returns<{ sender_id: string | null }[]>();

      if (sentError) console.warn('Interactions sent error:', sentError);

      // Get interactions received at this location (today)
      const { data: interactionsReceived, error: receivedError } = await supabase
        .from('wolf_pack_interactions')
        .select('receiver_id')
        .in('receiver_id', userIds)
        .eq('location_id', locationId)
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString())
        .returns<{ receiver_id: string | null }[]>();

      if (receivedError) console.warn('Interactions received error:', receivedError);

      // Get engagement metrics (today)
      const { data: engagementMetrics, error: engagementError } = await supabase
        .from('wolfpack_engagement')
        .select('user_id, total_session_time_minutes, total_interactions')
        .in('user_id', userIds)
        .gte('date', startOfDay.toISOString().split('T')[0])
        .lt('date', endOfDay.toISOString().split('T')[0])
        .returns<EngagementMetric[]>();

      if (engagementError) console.warn('Engagement metrics error:', engagementError);

      // Get user tiers from users table
      const { data: userTiers, error: tierError } = await supabase
        .from('users')
        .select('id, wolfpack_tier')
        .in('id', userIds)
        .returns<{ id: string; wolfpack_tier: string | null }[]>();

      if (tierError) console.warn('User tiers error:', tierError);

      // Aggregate data for each user
      const userDataPromises = activeMembers.map(async (member) => {
        const broadcastCount = locationFilteredBroadcasts?.filter(r => r.user_id === member.user_id).length || 0;
        const chatCount = chatMessages?.filter(m => m.user_id === member.user_id).length || 0;
        const sentCount = interactionsSent?.filter(i => i.sender_id === member.user_id).length || 0;
        const receivedCount = interactionsReceived?.filter(i => i.receiver_id === member.user_id).length || 0;
        const engagement = engagementMetrics?.find(e => e.user_id === member.user_id);
        const userTier = userTiers?.find(u => u.id === member.user_id);

        // Calculate recent activity using actual database data
        const recentActivity = await this.calculateRecentActivity(member.user_id);

        return {
          user_id: member.user_id,
          display_name: (member.users as any)?.display_name || 'Anonymous',
          avatar_url: (member.users as any)?.avatar_url,
          broadcast_responses: broadcastCount,
          chat_messages: chatCount,
          interactions_sent: sentCount,
          interactions_received: receivedCount,
          recent_activity: recentActivity,
          total_session_time: engagement?.total_session_time_minutes || 0,
          membership_tier: userTier?.wolfpack_tier || null
        };
      });

      return Promise.all(userDataPromises);

    } catch (error) {
      console.error('Error fetching engagement data:', error);
      return [];
    }
  }

  /**
   * Calculate engagement score based on weighted metrics
   */
  private static calculateEngagementScore(user: EngagementData): number {
    const weights = this.SCORING_WEIGHTS;
    
    // Normalize values (assuming max values for scaling)
    const normalizedBroadcasts = Math.min(user.broadcast_responses / 10, 1) * 100;
    const normalizedChat = Math.min(user.chat_messages / 20, 1) * 100;
    const normalizedInteractions = Math.min((user.interactions_sent + user.interactions_received) / 15, 1) * 100;
    const normalizedSession = Math.min(user.total_session_time / 120, 1) * 100; // 2 hours max

    // Calculate weighted score
    const score = (
      normalizedBroadcasts * weights.broadcast_responses +
      normalizedChat * weights.chat_activity +
      normalizedInteractions * weights.social_interactions +
      normalizedSession * weights.session_activity
    );

    // Add bonus for premium members
    const tierBonus = user.membership_tier === 'premium' ? 10 : 0;
    
    // Add recent activity bonus (decaying over time)
    const recentBonus = user.recent_activity * 5;

    return Math.round(score + tierBonus + recentBonus);
  }

  /**
   * Calculate recent activity bonus based on user's last activity
   */
  private static async calculateRecentActivity(userId: string): Promise<number> {
    try {
      // Get user's last activity from database
      const { data: userData, error } = await supabase
        .from('users')
        .select('last_activity, is_online')
        .eq('id', userId)
        .single()
        .returns<{ last_activity: string | null; is_online: boolean | null }>();

      if (error || !userData) {
        return 0;
      }

      const now = new Date();
      const lastActivity = userData.last_activity ? new Date(userData.last_activity) : null;
      
      // If user is currently online, give maximum bonus
      if (userData.is_online) {
        return 2;
      }

      // If no last activity recorded, give minimum bonus
      if (!lastActivity) {
        return 0;
      }

      // Calculate time since last activity in minutes
      const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60);

      // Apply time decay: full bonus within 5 minutes, linear decay to 0 over 60 minutes
      if (minutesSinceActivity <= 5) {
        return 2;
      } else if (minutesSinceActivity <= 60) {
        return 2 * (1 - (minutesSinceActivity - 5) / 55);
      } else {
        return 0;
      }
    } catch (error) {
      console.warn('Error calculating recent activity for user:', userId, error);
      return 0;
    }
  }

  /**
   * Get appropriate vibe emoji based on engagement score and ranking
   */
  private static getVibeEmoji(score: number, rank: number): string {
    if (rank === 0) return '🔥'; // Top performer always gets fire
    if (score >= 80) return '✨';
    if (score >= 60) return '💃';
    if (score >= 40) return '🎵';
    if (score >= 20) return '⚡';
    return '🌟';
  }

  /**
   * Get live stats with real engagement data
   */
  static async getLiveStats(locationId: string): Promise<WolfpackLiveStats> {
    try {
      // The RPC function has issues, so let's use manual calculation for now
      console.warn('🔄 Using manual calculation due to RPC function issues');
      return await this.calculateLiveStatsManually(locationId);

    } catch (error) {
      console.error('❌ Error getting live stats:', error);
      return this.getFallbackStats();
    }
  }

  /**
   * Manual calculation of live stats
   */
  private static async calculateLiveStatsManually(locationId: string): Promise<WolfpackLiveStats> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    try {
      // Get active wolfpack members at this location using the view
      const { data: activeMembers, error: membersError } = await supabase
        .from('active_wolfpack_members')
        .select('id, gender')
        .gte('last_activity', startOfDay.toISOString())
        .returns<{ id: string; gender: string | null }[]>();

      if (membersError) throw membersError;
      
      const totalActive = activeMembers?.length || 0;
      const veryActive = Math.floor(totalActive * 0.6); // Estimate 60% as very active

      // Calculate gender breakdown
      const genderBreakdown = activeMembers?.reduce<Record<string, number>>((acc, member) => {
        const gender = member.gender || 'unknown';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {}) || {};

      // Get recent interactions - using correct timestamp field
      const { data: recentInteractions, error: interactionsError } = await supabase
        .from('wolf_pack_interactions')
        .select('sender_id, receiver_id')
        .eq('location_id', locationId)
        .gte('created_at', startOfDay.toISOString())
        .returns<InteractionData[]>();

      if (interactionsError) console.warn('Interactions error:', interactionsError);

      const totalInteractions = recentInteractions?.length || 0;
      const uniqueParticipants = new Set<string>();
      
      recentInteractions?.forEach(interaction => {
        if (interaction.sender_id) uniqueParticipants.add(interaction.sender_id);
        if (interaction.receiver_id) uniqueParticipants.add(interaction.receiver_id);
      });
      
      const activeParticipants = uniqueParticipants.size;

      // Calculate energy level based on activity
      const energyLevel = Math.min(Math.floor((totalInteractions + (totalActive * 2)) / 10 * 100), 100);

      // Get top vibers
      const topVibers = await this.getTopCrowdMembers(locationId, 10);

      return {
        total_active: totalActive,
        very_active: veryActive,
        gender_breakdown: genderBreakdown,
        recent_interactions: {
          total_interactions: totalInteractions,
          active_participants: activeParticipants
        },
        energy_level: energyLevel,
        top_vibers: topVibers
      };

    } catch (error) {
      console.error('Error calculating live stats manually:', error);
      return this.getFallbackStats();
    }
  }

  /**
   * Fallback stats when all else fails
   */
  private static getFallbackStats(): WolfpackLiveStats {
    return {
      total_active: 0,
      very_active: 0,
      gender_breakdown: {},
      recent_interactions: {
        total_interactions: 0,
        active_participants: 0
      },
      energy_level: 0,
      top_vibers: []
    };
  }
}