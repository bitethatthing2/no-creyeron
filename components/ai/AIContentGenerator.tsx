'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UnifiedContentItem } from '@/components/wolfpack/feed/UnifiedContentRenderer';

interface AIContentTemplate {
  id: string;
  type: 'weather_based' | 'event_suggestion' | 'business_spotlight' | 'community_update' | 'trending_topic';
  title: string;
  content_template: string;
  conditions: {
    weather?: string[];
    time_of_day?: string[];
    day_of_week?: string[];
    user_interests?: string[];
    recent_activity?: string[];
  };
  media_suggestions: string[];
  pack_dollar_reward: number;
}

interface LocalData {
  weather: {
    condition: string;
    temperature: number;
    description: string;
  };
  events: any[];
  businesses: any[];
  trending_topics: string[];
  community_stats: {
    active_users: number;
    events_today: number;
    businesses_featured: number;
  };
}

interface AIContentGeneratorProps {
  currentUser: any;
  userPreferences: any;
  onContentGenerated: (content: UnifiedContentItem[]) => void;
  limit?: number;
}

export default function AIContentGenerator({
  currentUser,
  userPreferences,
  onContentGenerated,
  limit = 5
}: AIContentGeneratorProps) {
  const [localData, setLocalData] = useState<LocalData | null>(null);
  const [contentTemplates, setContentTemplates] = useState<AIContentTemplate[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);

  // Load content templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_content_templates')
          .select('*')
          .eq('active', true);

        if (error) {
          console.error('Error loading templates:', error);
          // Use default templates
          setContentTemplates(getDefaultTemplates());
        } else {
          setContentTemplates(data || getDefaultTemplates());
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        setContentTemplates(getDefaultTemplates());
      }
    };

    loadTemplates();
  }, []);

  // Load local data
  useEffect(() => {
    const loadLocalData = async () => {
      try {
        // Simulate weather data (in production, this would come from a weather API)
        const weather = {
          condition: getWeatherCondition(),
          temperature: Math.floor(Math.random() * 30) + 45, // 45-75F
          description: getWeatherDescription()
        };

        // Load recent events
        const { data: events } = await supabase
          .from('events')
          .select('*')
          .gte('event_date', new Date().toISOString())
          .limit(5);

        // Load featured businesses (fallback to empty since table doesn't exist)
        let businesses = [];
        try {
          const { data } = await supabase
            .from('businesses')
            .select('*')
            .eq('featured', true)
            .limit(5);
          businesses = data || [];
        } catch (error) {
          console.log('businesses table not found, using empty array');
          businesses = [];
        }

        // Get community stats
        const { data: users } = await supabase
          .from('users')
          .select('id')
          .gte('last_seen_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        setLocalData({
          weather,
          events: events || [],
          businesses: businesses || [],
          trending_topics: getTrendingTopics(),
          community_stats: {
            active_users: users?.length || 0,
            events_today: events?.length || 0,
            businesses_featured: businesses?.length || 0
          }
        });
      } catch (error) {
        console.error('Error loading local data:', error);
      }
    };

    loadLocalData();
  }, []);

  // Generate AI content
  const generateContent = useCallback(async () => {
    if (!localData || !currentUser) return;

    setIsGenerating(true);
    const generatedContent: UnifiedContentItem[] = [];

    try {
      // Filter templates based on current conditions
      const applicableTemplates = contentTemplates.filter(template => 
        isTemplateApplicable(template, localData, userPreferences)
      );

      // Generate content from applicable templates
      for (const template of applicableTemplates.slice(0, limit)) {
        const content = await generateFromTemplate(template, localData, currentUser);
        if (content) {
          generatedContent.push(content);
        }
      }

      setGeneratedCount(generatedContent.length);
      onContentGenerated(generatedContent);
    } catch (error) {
      console.error('Error generating AI content:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [localData, currentUser, contentTemplates, userPreferences, limit, onContentGenerated]);

  // Check if template is applicable
  const isTemplateApplicable = (template: AIContentTemplate, data: LocalData, preferences: any): boolean => {
    const conditions = template.conditions;
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    // Check weather conditions
    if (conditions.weather && !conditions.weather.includes(data.weather.condition)) {
      return false;
    }

    // Check time of day
    if (conditions.time_of_day) {
      const timeOfDay = getTimeOfDay(currentHour);
      if (!conditions.time_of_day.includes(timeOfDay)) {
        return false;
      }
    }

    // Check day of week
    if (conditions.day_of_week && !conditions.day_of_week.includes(dayNames[currentDay])) {
      return false;
    }

    // Check user interests
    if (conditions.user_interests && preferences?.interests) {
      const hasMatchingInterest = conditions.user_interests.some(interest => 
        preferences.interests.includes(interest)
      );
      if (!hasMatchingInterest) {
        return false;
      }
    }

    return true;
  };

  // Generate content from template
  const generateFromTemplate = async (
    template: AIContentTemplate, 
    data: LocalData, 
    user: any
  ): Promise<UnifiedContentItem | null> => {
    try {
      let content = template.content_template;
      
      // Replace template variables
      content = content.replace(/\{weather\}/g, data.weather.description);
      content = content.replace(/\{temperature\}/g, data.weather.temperature.toString());
      content = content.replace(/\{user_name\}/g, user.first_name || 'Wolf Pack Member');
      content = content.replace(/\{active_users\}/g, data.community_stats.active_users.toString());
      content = content.replace(/\{events_today\}/g, data.community_stats.events_today.toString());
      
      // Add specific content based on template type
      switch (template.type) {
        case 'weather_based':
          content = await generateWeatherContent(content, data);
          break;
        case 'event_suggestion':
          content = await generateEventSuggestion(content, data);
          break;
        case 'business_spotlight':
          content = await generateBusinessSpotlight(content, data);
          break;
        case 'community_update':
          content = await generateCommunityUpdate(content, data);
          break;
        case 'trending_topic':
          content = await generateTrendingContent(content, data);
          break;
      }

      // Select appropriate media
      const mediaUrl = selectMedia(template.media_suggestions, template.type);

      return {
        id: `ai_${template.id}_${Date.now()}`,
        type: 'ai_content',
        user_id: 'ai_curator',
        display_name: 'Salem AI Curator',
        avatar_url: '/icons/ai-icon.png',
        content,
        media_url: mediaUrl,
        created_at: new Date().toISOString(),
        likes_count: 0,
        wolfpack_comments_count: 0,
        shares_count: 0,
        reactions: [],
        ai_metadata: {
          confidence: 0.8,
          source: template.type,
          tags: [template.type, 'ai_generated', 'local_content']
        }
      };
    } catch (error) {
      console.error('Error generating content from template:', error);
      return null;
    }
  };

  // Generate weather-based content
  const generateWeatherContent = async (content: string, data: LocalData): Promise<string> => {
    const weatherTips = {
      sunny: "Perfect weather for outdoor events! Check out what's happening at local parks and patios.",
      cloudy: "Great indoor weather! Perfect time to discover cozy spots around Salem.",
      rainy: "Rainy day vibes! Find the best indoor activities and comfort food spots.",
      snowy: "Snow day fun! Warm up with hot drinks and indoor entertainment."
    };

    const tip = weatherTips[data.weather.condition as keyof typeof weatherTips] || 
                 "No matter the weather, there's always something great happening in Salem!";

    return `${content} ${tip}`;
  };

  // Generate event suggestion
  const generateEventSuggestion = async (content: string, data: LocalData): Promise<string> => {
    if (data.events.length > 0) {
      const randomEvent = data.events[Math.floor(Math.random() * data.events.length)];
      return `${content} Don't miss "${randomEvent.title}" - it's going to be amazing! 🎉`;
    }
    return `${content} Stay tuned for exciting events coming to Salem! 🎉`;
  };

  // Generate business spotlight
  const generateBusinessSpotlight = async (content: string, data: LocalData): Promise<string> => {
    if (data.businesses.length > 0) {
      const randomBusiness = data.businesses[Math.floor(Math.random() * data.businesses.length)];
      return `${content} Spotlight: ${randomBusiness.name} - ${randomBusiness.description || 'A local favorite!'} 🏪`;
    }
    return `${content} Discover amazing local businesses in Salem! 🏪`;
  };

  // Generate community update
  const generateCommunityUpdate = async (content: string, data: LocalData): Promise<string> => {
    const updates = [
      `${data.community_stats.active_users} pack members are active today!`,
      `${data.community_stats.events_today} events happening today!`,
      `${data.community_stats.businesses_featured} businesses featured this week!`
    ];
    
    const randomUpdate = updates[Math.floor(Math.random() * updates.length)];
    return `${content} ${randomUpdate} 🐺`;
  };

  // Generate trending content
  const generateTrendingContent = async (content: string, data: LocalData): Promise<string> => {
    if (data.trending_topics.length > 0) {
      const randomTopic = data.trending_topics[Math.floor(Math.random() * data.trending_topics.length)];
      return `${content} Trending now: ${randomTopic} 🔥`;
    }
    return `${content} Stay connected with what's trending in Salem! 🔥`;
  };

  // Select appropriate media for content
  const selectMedia = (suggestions: string[], type: string): string => {
    if (suggestions.length === 0) {
      return getDefaultMediaForType(type);
    }
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  };

  // Get default media for content type
  const getDefaultMediaForType = (type: string): string => {
    const mediaMap = {
      weather_based: '/images/salem-weather.jpg',
      event_suggestion: '/images/salem-events.jpg',
      business_spotlight: '/images/salem-business.jpg',
      community_update: '/images/salem-community.jpg',
      trending_topic: '/images/salem-trending.jpg'
    };
    return mediaMap[type as keyof typeof mediaMap] || '/images/salem-default.jpg';
  };

  // Generate content on mount and periodically
  useEffect(() => {
    generateContent();
    
    // Regenerate content every 30 minutes
    const interval = setInterval(generateContent, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [generateContent]);

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="flex items-center gap-3">
          <div className="animate-pulse w-4 h-4 bg-purple-600 rounded-full"></div>
          <span className="text-purple-600 text-sm">Generating AI Content...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden">
      {/* Stats for debugging */}
      <div className="text-xs text-gray-500 p-2">
        AI Generated: {generatedCount} items
      </div>
    </div>
  );
}

// Helper functions
function getWeatherCondition(): string {
  const conditions = ['sunny', 'cloudy', 'rainy', 'snowy'];
  return conditions[Math.floor(Math.random() * conditions.length)];
}

function getWeatherDescription(): string {
  const descriptions = [
    'Beautiful sunny day',
    'Partly cloudy skies',
    'Light rain showers',
    'Fresh snow falling'
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function getTimeOfDay(hour: number): string {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getTrendingTopics(): string[] {
  return [
    'Live Music at Side Hustle Bar',
    'Salem Food Festival',
    'Portland Coffee Scene',
    'Local Art Shows',
    'Craft Beer Tastings',
    'Outdoor Adventures',
    'Community Events'
  ];
}

function getDefaultTemplates(): AIContentTemplate[] {
  return [
    {
      id: 'weather_1',
      type: 'weather_based',
      title: 'Weather Update',
      content_template: "It's {temperature}°F and {weather} in Salem today! Perfect weather for the Wolf Pack to get together.",
      conditions: {
        weather: ['sunny', 'cloudy', 'rainy'],
        time_of_day: ['morning', 'afternoon']
      },
      media_suggestions: ['/images/salem-weather.jpg'],
      pack_dollar_reward: 5
    },
    {
      id: 'event_1',
      type: 'event_suggestion',
      title: 'Event Suggestion',
      content_template: "Hey {user_name}! Looking for something fun to do? The Salem Wolf Pack has amazing events coming up!",
      conditions: {
        time_of_day: ['afternoon', 'evening'],
        user_interests: ['events', 'social', 'entertainment']
      },
      media_suggestions: ['/images/salem-events.jpg'],
      pack_dollar_reward: 3
    },
    {
      id: 'business_1',
      type: 'business_spotlight',
      title: 'Business Spotlight',
      content_template: "Discover the best local businesses in Salem! Support your community and earn Pack Dollars.",
      conditions: {
        time_of_day: ['morning', 'afternoon'],
        user_interests: ['food', 'shopping', 'local']
      },
      media_suggestions: ['/images/salem-business.jpg'],
      pack_dollar_reward: 4
    },
    {
      id: 'community_1',
      type: 'community_update',
      title: 'Community Update',
      content_template: "Wolf Pack Update: {active_users} members are active today! The community is growing strong.",
      conditions: {
        time_of_day: ['morning', 'evening']
      },
      media_suggestions: ['/images/salem-community.jpg'],
      pack_dollar_reward: 2
    },
    {
      id: 'trending_1',
      type: 'trending_topic',
      title: 'Trending Now',
      content_template: "What's hot in Salem right now? Stay connected with the latest trends and happenings!",
      conditions: {
        time_of_day: ['afternoon', 'evening']
      },
      media_suggestions: ['/images/salem-trending.jpg'],
      pack_dollar_reward: 3
    }
  ];
}