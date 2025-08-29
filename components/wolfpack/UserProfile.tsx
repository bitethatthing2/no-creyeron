'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { 
  X, 
  Edit, 
  MapPin, 
  Calendar,
  Heart,
  MessageCircle,
  Share,
  Star,
  Users,
  Camera,
  Settings,
  Crown,
  User 
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { User as UserType, ContentPost } from '@/types/supabase';
import { toast } from '@/components/ui/use-toast';

interface UserStats {
  followers: number;
  following: number;
  posts: number;
  likes: number;
}

interface UserProfileProps {
  isOpen: boolean;
  onCloseAction: () => void;
  userId?: string; // Changed from conversationid to userId for clarity
}

export default function UserProfile({ isOpen, onCloseAction, userId }: UserProfileProps) {
  const { currentUser } = useAuth();
  const [profileUser, setProfileUser] = React.useState<UserType | null>(null);
  const [stats, setStats] = React.useState<UserStats>({
    followers: 0,
    following: 0,
    posts: 0,
    likes: 0
  });
  const [recentPosts, setRecentPosts] = React.useState<ContentPost[]>([]);
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const isOwnProfile = !userId || userId === currentUser?.id;
  const displayUserId = userId || currentUser?.id;

  // Load user profile and stats
  React.useEffect(() => {
    const loadProfile = async () => {
      if (!displayUserId) return;

      setLoading(true);
      try {
        // Get user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', displayUserId)
          .single();

        if (userError) throw userError;
        setProfileUser(userData);

        // Get follower count
        const { count: followersCount } = await supabase
          .from('social_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', displayUserId);

        // Get following count
        const { count: followingCount } = await supabase
          .from('social_follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', displayUserId);

        // Get posts count
        const { count: postsCount } = await supabase
          .from('content_posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', displayUserId)
          .eq('is_active', true);

        // Get total likes on user's posts
        const { data: postsData } = await supabase
          .from('content_posts')
          .select('likes_count')
          .eq('user_id', displayUserId)
          .eq('is_active', true);

        const totalLikes = postsData?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;

        setStats({
          followers: followersCount || 0,
          following: followingCount || 0,
          posts: postsCount || 0,
          likes: totalLikes
        });

        // Check if current user follows this user
        if (currentUser && !isOwnProfile) {
          const { data: followData } = await supabase
            .from('social_follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', displayUserId)
            .maybeSingle();

          setIsFollowing(!!followData);
        }

        // Get recent posts
        const { data: posts } = await supabase
          .from('content_posts')
          .select('*')
          .eq('user_id', displayUserId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(9);

        setRecentPosts(posts || []);

      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && displayUserId) {
      loadProfile();
    }
  }, [isOpen, displayUserId, currentUser, isOwnProfile]);

  const handleFollow = async () => {
    if (!currentUser || !profileUser) return;

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('social_follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profileUser.id);

        if (error) throw error;
        
        setIsFollowing(false);
        setStats(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
        
        toast({
          title: 'Unfollowed',
          description: `You unfollowed @${profileUser.username}`
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('social_follows')
          .insert({
            follower_id: currentUser.id,
            following_id: profileUser.id
          });

        if (error) throw error;
        
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));

        // Create notification
        await supabase
          .from('notifications')
          .insert({
            recipient_id: profileUser.id,
            related_user_id: currentUser.id,
            type: 'follow',
            title: 'New Follower',
            message: `${currentUser.display_name || currentUser.username} started following you`,
            status: 'unread'
          });
        
        toast({
          title: 'Following',
          description: `You are now following @${profileUser.username}`
        });
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update follow status',
        variant: 'destructive'
      });
    }
  };

  const handleShare = async () => {
    if (!profileUser) return;
    
    const profileUrl = `${window.location.origin}/profile/${profileUser.username}`;
    
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: 'Link copied!',
        description: 'Profile link has been copied to clipboard'
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!isOpen) return null;
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!profileUser) return null;

  const displayName = profileUser.display_name || 
                      (profileUser.first_name && profileUser.last_name ? 
                        `${profileUser.first_name} ${profileUser.last_name}` : 
                        profileUser.username);
  const avatarUrl = profileUser.avatar_url || profileUser.profile_image_url || '/icons/wolf-icon.png';

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-md border-b border-gray-800 p-4 z-10">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCloseAction}
            className="text-white hover:bg-gray-800 rounded-full p-2"
          >
            <X className="h-6 w-6" />
          </Button>
          <h1 className="text-white text-lg font-semibold">
            {isOwnProfile ? 'Your Profile' : `@${profileUser.username}`}
          </h1>
          {isOwnProfile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/settings'}
              className="text-white hover:bg-gray-800 rounded-full p-2"
            >
              <Settings className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
              <Image
                src={avatarUrl}
                alt="Profile"
                width={96}
                height={96}
                className="rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/icons/wolf-icon.png';
                }}
              />
            </Avatar>
            {profileUser.role === 'admin' && (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-white">
                <Crown className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          
          <h2 className="text-white text-2xl font-bold mb-1">
            {displayName}
          </h2>
          <p className="text-gray-400 text-lg mb-2">@{profileUser.username}</p>
          
          {profileUser.email && (
            <p className="text-gray-500 text-sm mb-4">{profileUser.email}</p>
          )}
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-400 text-sm">
              Joined {new Date(profileUser.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {isOwnProfile ? (
          <div className="flex gap-2">
            <Button 
              onClick={() => window.location.href = '/profile/edit'}
              className="flex-1 bg-white hover:bg-gray-200 text-black"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-gray-700 text-white hover:bg-gray-800"
              onClick={handleShare}
            >
              <Share className="h-4 w-4 mr-2" />
              Share Profile
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button 
              className={`flex-1 ${isFollowing ? 'bg-gray-600 hover:bg-gray-700' : 'bg-white hover:bg-gray-200 text-black'}`}
              onClick={handleFollow}
            >
              <User className="h-4 w-4 mr-2" />
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-gray-700 text-white hover:bg-gray-800"
              onClick={() => {
                // Navigate to chat
                window.location.href = `/chat/${profileUser.id}`;
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">{stats.followers}</div>
              <div className="text-gray-400 text-sm">Followers</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">{stats.following}</div>
              <div className="text-gray-400 text-sm">Following</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">{stats.posts}</div>
              <div className="text-gray-400 text-sm">Posts</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">{stats.likes}</div>
              <div className="text-gray-400 text-sm">Likes</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Posts */}
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg">Recent Posts</h3>
          
          {recentPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {recentPosts.map((post) => (
                <div 
                  key={post.id} 
                  className="aspect-square bg-gray-900 rounded-lg overflow-hidden relative cursor-pointer"
                  onClick={() => window.location.href = `/post/${post.id}`}
                >
                  {post.thumbnail_url && (
                    <Image
                      src={post.thumbnail_url}
                      alt="Post thumbnail"
                      fill
                      className="object-cover"
                    />
                  )}
                  <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-black/50 px-1 rounded">
                    <Heart className="h-3 w-3 text-white" />
                    <span className="text-white text-xs">{post.likes_count || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No posts yet</p>
              {isOwnProfile && (
                <Button 
                  className="bg-red-500 text-white hover:bg-red-600 rounded-lg px-8 py-3 mt-4"
                  onClick={() => window.location.href = '/create'}
                >
                  Create First Post
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}