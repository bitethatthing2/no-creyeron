'use client';

import { useState, useEffect } from 'react';
import { Search, ArrowLeft, Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { wolfpackService } from '@/lib/services/unified-wolfpack.service';
import { toast } from '@/components/ui/use-toast';

interface WolfpackUser {
  id: string;
  display_name: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  location: string | null;
  wolfpack_status: string | null;
  followers_count?: number;
  is_following?: boolean;
}

interface FindFriendsProps {
  onClose: () => void;
}

export default function FindFriends({ onClose }: FindFriendsProps) {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState<WolfpackUser[]>([]);
  const [searchResults, setSearchResults] = useState<WolfpackUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  // Load suggested users using unified service
  useEffect(() => {
    const loadSuggestions = async () => {
      if (!currentUser) return;
      
      try {
        setLoadingSuggestions(true);
        
        const response = await wolfpackService.getSuggestedUsers(currentUser.id, 10);
        
        if (response.success) {
          setSuggestedUsers(response.data || []);
        } else {
          toast({
            title: 'Error',
            description: response.error || 'Failed to load suggestions',
            variant: 'destructive'
          });
        }
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

  const handleSearch = async (query: string) => {
    if (!query.trim() || !currentUser) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await wolfpackService.searchUsers(query, currentUser.id, 20);
      
      if (response.success) {
        setSearchResults(response.data || []);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Search failed',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Error',
        description: 'Search failed',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUser = async (userId: string) => {
    if (!currentUser) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to follow users',
        variant: 'destructive'
      });
      return;
    }
    
    const response = await wolfpackService.toggleFollow(userId);
    
    if (response.success) {
      // Update local state
      const updateFollowStatus = (users: WolfpackUser[]) =>
        users.map(u => 
          u.id === userId 
            ? { ...u, is_following: response.data?.following }
            : u
        );
      
      setSuggestedUsers(prev => updateFollowStatus(prev));
      setSearchResults(prev => updateFollowStatus(prev));
      
      toast({
        title: response.data?.following ? 'Following' : 'Unfollowed',
        description: response.data?.following 
          ? 'You are now following this user' 
          : 'You have unfollowed this user'
      });
    } else {
      toast({
        title: 'Error',
        description: response.error || 'Failed to update follow status',
        variant: 'destructive'
      });
    }
  };

  const renderUserCard = (user: WolfpackUser) => {
    const displayName = wolfpackService.getDisplayName(user);
    
    return (
      <div key={user.id} className="bg-gray-800/50 rounded-xl p-4 mb-3 border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700">
              <Image
                src={wolfpackService.getAvatarUrl(user)}
                alt={displayName}
                width={48}
                height={48}
                className="w-full h-full object-cover"
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
              {user.location && (
                <p className="text-xs text-gray-500 truncate">
                  📍 {user.location}
                </p>
              )}
            </div>
          </div>
          
          <Button
            onClick={() => handleFollowUser(user.id)}
            size="sm"
            className={`text-xs font-medium rounded-lg px-4 py-2 ${
              user.is_following
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {user.is_following ? 'Following' : 'Follow'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black text-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-900/20 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Image
              src="/icons/wolf-icon.png"
              alt="Wolf"
              width={72}
              height={72}
              className="inline-block"
            />
            Find Pack Members
          </h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search by name or username"
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
      <div className="flex-1 overflow-y-auto p-4">
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
              searchResults.map(user => renderUserCard(user))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        ) : (
          /* Suggested Users */
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Suggested Pack Members
            </h2>
            
            {loadingSuggestions ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : suggestedUsers.length > 0 ? (
              suggestedUsers.map(user => renderUserCard(user))
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No suggestions available</p>
                <p className="text-sm text-gray-500 mt-1">Try searching for specific users</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}