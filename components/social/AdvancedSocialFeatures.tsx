'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  Share2, 
  Heart, 
  Star,
  Crown,
  Zap,
  Trophy,
  Target,
  Calendar,
  Gift,
  Sparkles,
  Activity
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SocialFeature {
  id: string;
  type: 'story' | 'poll' | 'challenge' | 'meetup' | 'collaboration';
  title: string;
  description: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
    level: number;
  };
  participants: number;
  likes: number;
  expires_at?: string;
  created_at: string;
  metadata?: any;
}

interface UserSocialProfile {
  id: string;
  display_name: string;
  avatar_url: string;
  social_level: number;
  badges: string[];
  followers: number;
  following: number;
  pack_influence: number;
  recent_activity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

interface AdvancedSocialFeaturesProps {
  currentUser: any;
  onFeatureCreated?: (feature: SocialFeature) => void;
  className?: string;
}

export default function AdvancedSocialFeatures({
  currentUser,
  onFeatureCreated,
  className = ''
}: AdvancedSocialFeaturesProps) {
  const [activeTab, setActiveTab] = useState('discover');
  const [socialFeatures, setSocialFeatures] = useState<SocialFeature[]>([]);
  const [userProfile, setUserProfile] = useState<UserSocialProfile | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load social features and user profile
  useEffect(() => {
    const loadSocialData = async () => {
      try {
        // Load social features
        const { data: featuresData, error: featuresError } = await supabase
          .from('social_features')
          .select(`
            *,
            creator:users!social_features_creator_id_fkey(
              id,
              first_name,
              last_name,
              avatar_url,
              social_level
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (featuresError) {
          console.error('Error loading social features:', featuresError);
        } else {
          // Transform data to match our interface
          const transformedFeatures = (featuresData || []).map((feature: any) => ({
            ...feature,
            creator: {
              id: feature.creator?.id || feature.creator_id,
              name: `${feature.creator?.first_name || ''} ${feature.creator?.last_name || ''}`.trim() || 'Unknown',
              avatar: feature.creator?.avatar_url || '/default-avatar.png',
              level: feature.creator?.social_level || 1
            }
          }));
          setSocialFeatures(transformedFeatures);
        }

        // Load user profile
        if (currentUser) {
          const { data: profileData, error: profileError } = await supabase
            .from('user_social_profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error loading user profile:', profileError);
          } else if (profileData) {
            setUserProfile(profileData);
          }
        }

        // Set trending topics
        setTrendingTopics(['Salem Events', 'Local Music', 'Food & Drinks', 'Art Scene', 'Nightlife']);
      } catch (error) {
        console.error('Error loading social data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSocialData();
  }, [currentUser]);

  // Create social feature
  const createSocialFeature = async (type: string, data: any) => {
    if (!currentUser) return;

    try {
      const { data: newFeature, error } = await supabase
        .from('social_features')
        .insert([{
          type,
          title: data.title,
          description: data.description,
          creator_id: currentUser.id,
          metadata: data.metadata || {},
          expires_at: data.expires_at,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating social feature:', error);
        return;
      }

      setSocialFeatures(prev => [newFeature, ...prev]);
      
      if (onFeatureCreated) {
        onFeatureCreated(newFeature);
      }
    } catch (error) {
      console.error('Error creating social feature:', error);
    }
  };

  // Join social feature
  const joinSocialFeature = async (featureId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('social_feature_participants')
        .insert([{
          feature_id: featureId,
          user_id: currentUser.id,
          joined_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error joining social feature:', error);
        return;
      }

      // Update local state
      setSocialFeatures(prev => prev.map(feature => 
        feature.id === featureId 
          ? { ...feature, participants: feature.participants + 1 }
          : feature
      ));
    } catch (error) {
      console.error('Error joining social feature:', error);
    }
  };

  // Get feature type info
  const getFeatureTypeInfo = (type: string) => {
    const types = {
      story: { color: 'bg-pink-600', icon: <Sparkles className="w-4 h-4" />, label: 'Story' },
      poll: { color: 'bg-blue-600', icon: <Target className="w-4 h-4" />, label: 'Poll' },
      challenge: { color: 'bg-orange-600', icon: <Trophy className="w-4 h-4" />, label: 'Challenge' },
      meetup: { color: 'bg-green-600', icon: <Calendar className="w-4 h-4" />, label: 'Meetup' },
      collaboration: { color: 'bg-purple-600', icon: <Users className="w-4 h-4" />, label: 'Collaboration' }
    };
    return types[type as keyof typeof types] || types.story;
  };

  // Quick feature creation templates
  const quickFeatureTemplates = [
    {
      type: 'poll',
      title: 'What should we do tonight?',
      description: 'Help the pack decide on tonight\'s activity!',
      icon: <Target className="w-5 h-5" />
    },
    {
      type: 'challenge',
      title: 'Pack Challenge',
      description: 'Start a fun challenge for the community',
      icon: <Trophy className="w-5 h-5" />
    },
    {
      type: 'meetup',
      title: 'Spontaneous Meetup',
      description: 'Organize a quick gathering',
      icon: <Calendar className="w-5 h-5" />
    },
    {
      type: 'story',
      title: 'Share Your Story',
      description: 'Tell the pack what you\'re up to',
      icon: <Sparkles className="w-5 h-5" />
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Social Hub</h2>
              <p className="text-gray-600">Connect and engage with the Wolf Pack</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Summary */}
      {userProfile && (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-4">
            <img
              src={userProfile.avatar_url}
              alt={userProfile.display_name}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-white"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-gray-900">{userProfile.display_name}</h3>
                <Badge className="bg-blue-600 text-white">
                  Level {userProfile.social_level}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{userProfile.followers} followers</span>
                </div>
                <div className="flex items-center gap-1">
                  <UserPlus className="w-4 h-4" />
                  <span>{userProfile.following} following</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  <span>{userProfile.pack_influence} influence</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickFeatureTemplates.map((template) => (
            <Button
              key={template.type}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => createSocialFeature(template.type, template)}
            >
              {template.icon}
              <span className="text-sm font-medium">{template.title}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending in Salem</h3>
        <div className="flex flex-wrap gap-2">
          {trendingTopics.map((topic, index) => (
            <Badge key={index} variant="outline" className="text-blue-600 border-blue-600">
              #{topic}
            </Badge>
          ))}
        </div>
      </div>

      {/* Social Features Feed */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Activity</h3>
        <div className="space-y-4">
          {socialFeatures.map((feature) => {
            const typeInfo = getFeatureTypeInfo(feature.type);
            
            return (
              <Card key={feature.id} className="border-l-4 border-l-pink-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={feature.creator.avatar}
                        alt={feature.creator.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{feature.creator.name}</span>
                          <Badge className="bg-gray-100 text-gray-800">
                            Level {feature.creator.level}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(feature.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <Badge className={`${typeInfo.color} text-white`}>
                      {typeInfo.icon}
                      <span className="ml-1">{typeInfo.label}</span>
                    </Badge>
                  </div>
                  
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{feature.participants} participants</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{feature.likes} likes</span>
                    </div>
                    {feature.expires_at && (
                      <div className="flex items-center gap-1">
                        <Activity className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Expires {new Date(feature.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => joinSocialFeature(feature.id)}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Join
                    </Button>
                    <Button variant="outline">
                      <Heart className="w-4 h-4 mr-2" />
                      Like
                    </Button>
                    <Button variant="outline">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Comment
                    </Button>
                    <Button variant="outline">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}