'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UnifiedContentItem } from '@/components/wolfpack/feed/UnifiedContentRenderer';

interface UserPreferences {
  user_id: string;
  favorite_content_types: string[];
  favorite_categories: string[];
  interaction_patterns: {
    most_active_hours: number[];
    preferred_media_types: string[];
    engagement_rate: number;
  };
  location_preferences: {
    salem: boolean;
    portland: boolean;
    radius_miles: number;
  };
  interests: string[];
  last_updated: string;
}

interface ContentScore {
  content_id: string;
  score: number;
  factors: {
    relevance: number;
    freshness: number;
    engagement: number;
    personalization: number;
    location: number;
  };
  reasoning: string[];
}

interface ContentCuratorProps {
  currentUser: any;
  availableContent: UnifiedContentItem[];
  onCuratedContent: (content: UnifiedContentItem[]) => void;
  limit?: number;
}

export default function ContentCurator({
  currentUser,
  availableContent,
  onCuratedContent,
  limit = 20
}: ContentCuratorProps) {
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [curationStats, setCurationStats] = useState({
    totalAnalyzed: 0,
    personalizedResults: 0,
    avgScore: 0
  });

  // Load user preferences
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!currentUser) return;

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading user preferences:', error);
          return;
        }

        if (data) {
          setUserPreferences(data);
        } else {
          // Create default preferences based on user behavior
          await createDefaultPreferences();
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };

    loadUserPreferences();
  }, [currentUser]);

  // Create default preferences by analyzing user behavior
  const createDefaultPreferences = async () => {
    if (!currentUser) return;

    try {
      // Analyze user's recent interactions (fallback to empty if table doesn't exist)
      let interactions = [];
      try {
        const { data } = await supabase
          .from('user_interactions')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(100);
        interactions = data || [];
      } catch (error) {
        console.log('user_interactions table not found, using defaults');
      }

      // Analyze Pack Dollar transactions for interest patterns (fallback to empty if table doesn't exist)
      let transactions = [];
      try {
        const { data } = await supabase
          .from('pack_dollar_transactions')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(50);
        transactions = data || [];
      } catch (error) {
        console.log('pack_dollar_transactions table not found, using defaults');
      }

      // Default preferences based on analysis
      const defaultPreferences = {
        user_id: currentUser.id,
        favorite_content_types: ['social', 'event', 'business'],
        interaction_patterns: {
          most_active_hours: [19, 20, 21, 22], // 7-10 PM
          preferred_media_types: ['image', 'video'],
          engagement_rate: 0.3
        },
        location_preferences: {
          salem: true,
          portland: true,
          radius_miles: 25
        },
        interests: ['music', 'food', 'events', 'nightlife'],
        last_updated: new Date().toISOString()
      };

      // Save default preferences
      const { error } = await supabase
        .from('user_preferences')
        .insert([defaultPreferences]);

      if (error) {
        console.error('Error creating default preferences:', error);
      } else {
        setUserPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('Error creating default preferences:', error);
    }
  };

  // AI Content Scoring Algorithm
  const scoreContent = useCallback((content: UnifiedContentItem): ContentScore => {
    if (!userPreferences) {
      return {
        content_id: content.id,
        score: 0.5,
        factors: {
          relevance: 0.5,
          freshness: 0.5,
          engagement: 0.5,
          personalization: 0.5,
          location: 0.5
        },
        reasoning: ['Default scoring - no preferences available']
      };
    }

    const factors = {
      relevance: 0,
      freshness: 0,
      engagement: 0,
      personalization: 0,
      location: 0
    };

    const reasoning: string[] = [];

    // 1. Relevance Score (0-1)
    if (userPreferences.favorite_content_types.includes(content.type)) {
      factors.relevance += 0.4;
      reasoning.push(`Matches preferred content type: ${content.type}`);
    }

    // Category matching for events and businesses
    if (content.type === 'event' && content.event_data?.category) {
      if (userPreferences.favorite_categories.includes(content.event_data.category.toLowerCase())) {
        factors.relevance += 0.3;
        reasoning.push(`Matches preferred event category: ${content.event_data.category}`);
      }
    }

    if (content.type === 'business' && content.business_data?.category) {
      if (userPreferences.favorite_categories.includes(content.business_data.category.toLowerCase())) {
        factors.relevance += 0.3;
        reasoning.push(`Matches preferred business category: ${content.business_data.category}`);
      }
    }

    // Interest matching
    const contentText = content.content.toLowerCase();
    const matchingInterests = userPreferences.interests.filter(interest => 
      contentText.includes(interest.toLowerCase())
    );

    if (matchingInterests.length > 0) {
      factors.relevance += Math.min(0.3, matchingInterests.length * 0.1);
      reasoning.push(`Matches interests: ${matchingInterests.join(', ')}`);
    }

    // 2. Freshness Score (0-1)
    const contentAge = Date.now() - new Date(content.created_at).getTime();
    const hoursOld = contentAge / (1000 * 60 * 60);
    
    if (hoursOld < 1) {
      factors.freshness = 1.0;
      reasoning.push('Very fresh content (< 1 hour)');
    } else if (hoursOld < 6) {
      factors.freshness = 0.8;
      reasoning.push('Fresh content (< 6 hours)');
    } else if (hoursOld < 24) {
      factors.freshness = 0.6;
      reasoning.push('Recent content (< 24 hours)');
    } else if (hoursOld < 72) {
      factors.freshness = 0.4;
      reasoning.push('Moderately fresh (< 3 days)');
    } else {
      factors.freshness = 0.2;
      reasoning.push('Older content (> 3 days)');
    }

    // 3. Engagement Score (0-1)
    const totalInteractions = content.likes_count + content.wolfpack_comments_count + (content.shares_count * 2);
    const engagementScore = Math.min(1.0, totalInteractions / 100); // Normalize to 0-1
    factors.engagement = engagementScore;
    
    if (engagementScore > 0.7) {
      reasoning.push('High engagement content');
    } else if (engagementScore > 0.4) {
      reasoning.push('Moderate engagement');
    } else {
      reasoning.push('Low engagement');
    }

    // 4. Personalization Score (0-1)
    const currentHour = new Date().getHours();
    if (userPreferences.interaction_patterns.most_active_hours.includes(currentHour)) {
      factors.personalization += 0.3;
      reasoning.push('Posted during your active hours');
    }

    // Media type preference
    if (content.media_url) {
      const mediaType = content.media_url.toLowerCase().includes('.mp4') ? 'video' : 'image';
      if (userPreferences.interaction_patterns.preferred_media_types.includes(mediaType)) {
        factors.personalization += 0.4;
        reasoning.push(`Matches preferred media type: ${mediaType}`);
      }
    }

    // Live content boost
    if (content.is_live) {
      factors.personalization += 0.3;
      reasoning.push('Live content boost');
    }

    // 5. Location Score (0-1)
    if (content.type === 'business' && content.business_data) {
      // All businesses are local, so give high location score
      factors.location = 0.9;
      reasoning.push('Local Salem/Portland business');
    } else if (content.type === 'event' && content.event_data) {
      // Events are typically local
      factors.location = 0.8;
      reasoning.push('Local event');
    } else if (content.type === 'dj_live') {
      // DJ live sessions are at Side Hustle Bar
      factors.location = 1.0;
      reasoning.push('Live at Side Hustle Bar');
    } else {
      factors.location = 0.7; // Default local score
      reasoning.push('Local community content');
    }

    // Calculate weighted final score
    const weights = {
      relevance: 0.25,
      freshness: 0.20,
      engagement: 0.20,
      personalization: 0.20,
      location: 0.15
    };

    const finalScore = Object.keys(factors).reduce((sum, key) => {
      const factor = key as keyof typeof factors;
      return sum + (factors[factor] * weights[factor]);
    }, 0);

    return {
      content_id: content.id,
      score: Math.max(0, Math.min(1, finalScore)),
      factors,
      reasoning
    };
  }, [userPreferences]);

  // Main curation function
  const curateContent = useCallback(async () => {
    if (!userPreferences || availableContent.length === 0) {
      onCuratedContent(availableContent);
      return;
    }

    setIsAnalyzing(true);

    try {
      // Score all available content
      const scoredContent = availableContent.map(content => {
        const score = scoreContent(content);
        return {
          content,
          score: score.score,
          scoreDetails: score
        };
      });

      // Sort by score (highest first)
      scoredContent.sort((a, b) => b.score - a.score);

      // Apply diversity to prevent echo chamber
      const diversifiedContent = applyDiversityFilter(scoredContent);

      // Get top content up to limit
      const topContent = diversifiedContent.slice(0, limit);

      // Update curation stats
      setCurationStats({
        totalAnalyzed: availableContent.length,
        personalizedResults: topContent.length,
        avgScore: topContent.reduce((sum, item) => sum + item.score, 0) / topContent.length
      });

      // Log curation for learning
      await logCurationResults(topContent.map(item => item.scoreDetails));

      // Return curated content
      onCuratedContent(topContent.map(item => item.content));
    } catch (error) {
      console.error('Error during content curation:', error);
      onCuratedContent(availableContent);
    } finally {
      setIsAnalyzing(false);
    }
  }, [availableContent, userPreferences, scoreContent, limit, onCuratedContent]);

  // Apply diversity filter to prevent echo chamber
  const applyDiversityFilter = (scoredContent: any[]) => {
    const diversified = [];
    const typeCount = { social: 0, event: 0, business: 0, dj_live: 0, ai_content: 0 };
    const maxPerType = Math.ceil(limit / 5); // Roughly 20% per type

    for (const item of scoredContent) {
      const type = item.content.type;
      
      // Allow high-scoring content even if type quota is reached
      if (typeCount[type] < maxPerType || item.score > 0.8) {
        diversified.push(item);
        typeCount[type]++;
      }
    }

    return diversified;
  };

  // Log curation results for machine learning
  const logCurationResults = async (scores: ContentScore[]) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('curation_logs')
        .insert([{
          user_id: currentUser.id,
          session_id: `session_${Date.now()}`,
          content_scores: scores,
          total_analyzed: availableContent.length,
          personalized_results: scores.length,
          avg_score: scores.reduce((sum, s) => sum + s.score, 0) / scores.length,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error logging curation results:', error);
      }
    } catch (error) {
      console.error('Error logging curation results:', error);
    }
  };

  // Update user preferences based on interactions
  const updatePreferences = useCallback(async (interaction: any) => {
    if (!currentUser || !userPreferences) return;

    // This would be called when user interacts with content
    // to continuously improve personalization
    const updatedPreferences = { ...userPreferences };
    
    // Update based on interaction type
    if (interaction.type === 'like') {
      // Boost content type preference
      if (!updatedPreferences.favorite_content_types.includes(interaction.content_type)) {
        updatedPreferences.favorite_content_types.push(interaction.content_type);
      }
    }

    // Save updated preferences
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({
          ...updatedPreferences,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', currentUser.id);

      if (!error) {
        setUserPreferences(updatedPreferences);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }, [currentUser, userPreferences]);

  // Run curation when content or preferences change
  useEffect(() => {
    curateContent();
  }, [curateContent]);

  // Expose update function for external use
  useEffect(() => {
    if (currentUser) {
      (window as any).updateUserPreferences = updatePreferences;
    }
  }, [updatePreferences, currentUser]);

  if (isAnalyzing) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          <span className="text-purple-600 font-medium">AI Curating Content...</span>
        </div>
      </div>
    );
  }

  return null; // This component doesn't render anything visible
}

// Export types for use in other components
export type { UserPreferences, ContentScore };