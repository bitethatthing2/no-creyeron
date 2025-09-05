'use client';

import * as React from 'react';
import { Search, ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
// Define UserWithStats type locally if not exported from '@/types/supabase'
type UserWithStats = {
  id: string;
  username?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
  profile_image_url?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  is_following?: boolean;
  [key: string]: unknown;
};
import { toast } from '@/components/ui/use-toast';

interface FindFriendsProps {
  onCloseAction: () => void;
}

export default function FindFriends({ onCloseAction }: FindFriendsProps) {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [suggestedUsers, setSuggestedUsers] = React.useState<UserWithStats[]>([]);
  const [searchResults, setSearchResults] = React.useState<UserWithStats[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = React.useState(true);
  const [followingMap, setFollowingMap] = React.useState<Map<string, boolean>>(new Map());

  // Load suggested users
  React.useEffect(() => {
    const loadSuggestions = async () => {
      if (!currentUser) return;
      
      try {
        setLoadingSuggestions(true);
        
        // Get list of users current user is already following
        const { data: followingData, error: followError } = await supabase
          .from('social_follows')
          .select('following_id')
          .eq('follower_id', currentUser.id);
        
        if (followError) {
          console.error('Error fetching following list:', followError);
        }
        
        const followingIds = followingData?.map(f => f.following_id) || [];
        
        // Get random users excluding self and already following
        let query = supabase
          .from('users')
          .select('*')
          .neq('id', currentUser.id)
          .eq('account_status', 'active') // Only show active users
          .limit(10);
        
        // Exclude users already following
        if (followingIds.length > 0) {
          query = query.not('id', 'in', `(${followingIds.join(',')})`);
        }
        
        const { data: users, error: usersError } = await query;
        
        if (usersError) throw usersError;
        
        // Get follower counts for each user
        const usersWithStats: UserWithStats[] = await Promise.all(
          (users || []).map(async (user) => {
            // Get follower count
            const { count: followersCount } = await supabase
              .from('social_follows')
              .select('*', { count: 'exact', head: true })
              .eq('following_id', user.id);
            
            // Get following count
            const { count: followingCount } = await supabase
              .from('social_follows')
              .select('*', { count: 'exact', head: true })
              .eq('follower_id', user.id);
            
            // Get posts count
            const { count: postsCount } = await supabase
              .from('content_posts')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('is_active', true);
            
            return {
              ...user,
              followers_count: followersCount || 0,
              following_count: followingCount || 0,
              posts_count: postsCount || 0,
              is_following: false // Already filtered out following users
            };
          })
        );
        
        setSuggestedUsers(usersWithStats);
        
        // Create following map for quick lookup
        const map = new Map<string, boolean>();
        followingIds.forEach(id => map.set(id, true));
        setFollowingMap(map);
        
      } catch (error) {
        console.error('Error loading suggestions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load suggestions',
          variant: 'destructive'
        });
      } finally {
        setLoadingSuggestions(false);
      }
    };
    
    loadSuggestions();
  }, [currentUser]);

  // Search users
  const handleSearch = async (query: string) => {
    if (!query.trim() || !currentUser) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      // Search by username, display_name, first_name, last_name, or email
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', currentUser.id)
        .eq('account_status', 'active')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(20);
      
      if (error) throw error;
      
      // Get stats and following status for each user
      const usersWithStats: UserWithStats[] = await Promise.all(
        (users || []).map(async (user) => {
          // Check if current user follows this user
          const { data: followData } = await supabase
            .from('social_follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', user.id)
            .maybeSingle();
          
          // Get follower count
          const { count: followersCount } = await supabase
            .from('social_follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', user.id);
          
          // Get following count
          const { count: followingCount } = await supabase
            .from('social_follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', user.id);
          
          // Get posts count
          const { count: postsCount } = await supabase
            .from('content_posts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_active', true);
          
          return {
            ...user,
            followers_count: followersCount || 0,
            following_count: followingCount || 0,
            posts_count: postsCount || 0,
            is_following: !!followData
          };
        })
      );
      
      setSearchResults(usersWithStats);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Error',
        description: 'Search failed. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Follow/Unfollow user
  const handleFollowUser = async (userId: string, isCurrentlyFollowing: boolean) => {
    if (!currentUser) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to follow users',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('social_follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId);
        
        if (error) throw error;
        
        // Update local state
        const updateUsers = (users: UserWithStats[]) =>
          users.map(u => 
            u.id === userId 
              ? { 
                  ...u, 
                  is_following: false,
                  followers_count: Math.max(0, (u.followers_count || 1) - 1)
                }
              : u
          );
        
        setSuggestedUsers(prev => updateUsers(prev));
        setSearchResults(prev => updateUsers(prev));
        setFollowingMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
        
        toast({
          title: 'Unfollowed',
          description: 'You have unfollowed this user'
        });
        
      } else {
        // Follow
        const { error } = await supabase
          .from('social_follows')
          .insert({
            follower_id: currentUser.id,
            following_id: userId
          });
        
        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            toast({
              title: 'Already following',
              description: 'You are already following this user',
              variant: 'destructive'
            });
            return;
          }
          throw error;
        }
        
        // Update local state
        const updateUsers = (users: UserWithStats[]) =>
          users.map(u => 
            u.id === userId 
              ? { 
                  ...u, 
                  is_following: true,
                  followers_count: (u.followers_count || 0) + 1
                }
              : u
          );
        
        setSuggestedUsers(prev => updateUsers(prev));
        setSearchResults(prev => updateUsers(prev));
        setFollowingMap(prev => {
          const newMap = new Map(prev);
          newMap.set(userId, true);
          return newMap;
        });
        
        // Create notification for the followed user
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            recipient_id: userId,
            related_user_id: currentUser.id,
            type: 'follow',
            title: 'New Follower',
            message: `${currentUser.displayName || currentUser.username} started following you`,
            status: 'unread'
          });
        
        if (notifError) {
          console.error('Failed to create notification:', notifError);
        }
        
        toast({
          title: 'Following',
          description: 'You are now following this user'
        });
      }
    } catch (error: unknown) {
      console.error('Follow error:', error);
      toast({
        title: 'Error',
        description: (error instanceof Error ? error.message : 'Failed to update follow status'),
        variant: 'destructive'
      });
    }
  };

  // Render user card
  const renderUserCard = (user: UserWithStats) => {
    const displayName = user.display_name || 
                        (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : null) ||
                        user.username || 
                        'Anonymous User';
    const avatarUrl = user.avatar_url || user.profile_image_url || 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png';
    const isFollowing = user.is_following || followingMap.has(user.id);
    
    return (
      <div key={user.id} className="bg-gray-800/50 rounded-xl p-4 mb-3 border border-gray-700/50 hover:bg-gray-800/70 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
              <Image
                src={avatarUrl}
                alt={displayName}
                width={48}
                height={48}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm truncate">
                {displayName}
              </h3>
              {user.username && (
                <p className="text-xs text-gray-400 truncate">
                  @{user.username}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                {user.followers_count !== undefined && (
                  <span>{user.followers_count} followers</span>
                )}
                {user.posts_count !== undefined && user.posts_count > 0 && (
                  <span>{user.posts_count} posts</span>
                )}
              </div>
            </div>
          </div>
          
          <Button
            onClick={() => handleFollowUser(user.id, isFollowing)}
            size="sm"
            disabled={loading}
            className={`text-xs font-medium rounded-lg px-4 py-2 ml-2 ${
              isFollowing
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black text-white z-[100] flex flex-col backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-8 border-b border-gray-800 bg-black/95 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <button
            onClick={onCloseAction}
            className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-900/20 transition-colors"
            aria-label="Close"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Image
              src="https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png"
              alt="Wolf"
              width={32}
              height={32}
              className="inline-block"
            />
            Find Friends
          </h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-800 bg-black/95 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search by name, username, or email"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-full text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-400"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-black">
        {searchQuery ? (
          /* Search Results */
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Search Results
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                {searchResults.map(user => renderUserCard(user))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found for &quot;{searchQuery}&quot;</p>
                <p className="text-sm text-gray-500 mt-2">Try searching with different keywords</p>
              </div>
            )}
          </div>
        ) : (
          /* Suggested Users */
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Suggested Friends
            </h2>
            
            {loadingSuggestions ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : suggestedUsers.length > 0 ? (
              <div>
                {suggestedUsers.map(user => renderUserCard(user))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No suggestions available</p>
                <p className="text-sm text-gray-500 mt-2">
                  You might be following everyone already!
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Try searching for specific users above
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}