'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useMessaging } from '@/lib/hooks/messaging';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, MessageCircle, Search, Plus } from 'lucide-react';
import Image from 'next/image';
import { ConnectionStatus } from '@/components/shared/ConnectionStatus';

export default function MessagesListPage() {
  const router = useRouter();
  const { } = useAuth(); // currentUser unused, keeping for future use
  const { 
    conversations,
    loading, 
    error,
    currentUserId,
    loadConversations,
    getOrCreateDirectConversation
  } = useMessaging();
  
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<unknown[]>([]);
  const [searching, setSearching] = useState(false);
  const supabase = getSupabaseBrowserClient();

  // Load conversations when user is available
  useEffect(() => {
    if (currentUserId) {
      console.log('🔥 Loading conversations for user:', currentUserId);
      loadConversations();
    }
  }, [currentUserId, loadConversations]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getConversationName = (conversation: Record<string, unknown>): string => {
    if (conversation.type === 'direct') {
      // Find the other participant
      const participants = conversation.participants as Record<string, unknown>[] | undefined;
      const otherParticipant = participants?.find(
        (p: Record<string, unknown>) => p.user_id !== currentUserId
      );
      
      if (otherParticipant?.user) {
        const user = otherParticipant.user as Record<string, unknown>;
        return (user.display_name as string) || 
               `${(user.first_name as string) || ''} ${(user.last_name as string) || ''}`.trim() ||
               (user.username as string) ||
               'Wolf Pack Member';
      }
    }
    
    return (conversation.name as string) || 'Wolf Pack Chat';
  };

  const getConversationAvatar = (conversation: Record<string, unknown>): string => {
    if (conversation.type === 'direct') {
      const participants = conversation.participants as Record<string, unknown>[] | undefined;
      const otherParticipant = participants?.find(
        (p: Record<string, unknown>) => p.user_id !== currentUserId
      );
      
      if (otherParticipant?.user) {
        const user = otherParticipant.user as Record<string, unknown>;
        return (user.avatar_url as string) || 
               (user.profile_image_url as string) ||
               'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png';
      }
    }
    
    return (conversation.avatar_url as string) || 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png';
  };

  const handleStartChat = async (userId: string) => {
    if (!currentUserId) return;
    
    try {
      const conversationId = await getOrCreateDirectConversation(userId);
      if (conversationId) {
        router.push(`/messages/conversation/${conversationId}`);
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim() || !currentUserId) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, username, display_name, first_name, last_name, avatar_url, profile_image_url')
        .neq('id', currentUserId)
        .eq('account_status', 'active')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(10);
      
      if (error) throw error;
      
      setSearchResults(users || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <div className="flex items-center justify-between p-4 bg-black border-b border-gray-800">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-white font-semibold text-lg">Messages</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Connection Error</h2>
            <p className="text-gray-400 text-sm mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <ConnectionStatus />
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black border-b border-gray-900">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-white font-semibold text-lg">Messages</h1>
        </div>
        <button
          onClick={() => setShowSearch(true)}
          className="flex items-center justify-center w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
        >
          <Plus className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1">
        {conversations.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4 mx-auto">
                <MessageCircle className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-white text-lg mb-2">No conversations yet</p>
              <p className="text-gray-400 text-sm">
                Your messages will appear here when you start chatting!
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {conversations.map((conversation: any) => (
              <div
                key={conversation.id}
                onClick={() => router.push(`/messages/conversation/${conversation.id}`)}
                className="flex items-center p-4 hover:bg-gray-900/50 transition-colors cursor-pointer"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 mr-3 flex-shrink-0">
                  <Image
                    src={getConversationAvatar(conversation)}
                    alt={getConversationName(conversation)}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png';
                    }}
                  />
                </div>

                {/* Conversation Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-medium text-sm truncate">
                      {getConversationName(conversation)}
                    </h3>
                    {conversation.last_message_at && (
                      <span className="text-gray-400 text-xs flex-shrink-0">
                        {formatTime(conversation.last_message_at)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-sm truncate">
                      {conversation.last_message_preview || 'No messages yet'}
                    </p>
                    
                    {conversation.unread_count > 0 && (
                      <div className="bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
                        {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden">
            {/* Search Header */}
            <div className="flex items-center p-4 border-b border-gray-700">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-400 text-sm"
                  autoFocus
                />
              </div>
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="ml-3 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Search Results */}
            <div className="overflow-y-auto max-h-96">
              {searching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="p-2">
                  {searchResults.map((user) => {
                    const userObj = user as Record<string, unknown>;
                    const displayName = (userObj.display_name as string) || 
                      `${(userObj.first_name as string) || ''} ${(userObj.last_name as string) || ''}`.trim() ||
                      (userObj.username as string) || 
                      'Wolf Pack Member';
                    const avatarUrl = (userObj.avatar_url as string) || (userObj.profile_image_url as string) || 
                      'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png';
                    
                    return (
                      <div
                        key={userObj.id as string}
                        onClick={() => handleStartChat(userObj.id as string)}
                        className="flex items-center p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 mr-3 flex-shrink-0">
                          <Image
                            src={avatarUrl}
                            alt={displayName}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium text-sm truncate">
                            {displayName}
                          </h3>
                          {(userObj.username as string) && (
                            <p className="text-gray-400 text-xs truncate">
                              @{userObj.username as string}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : searchQuery ? (
                <div className="text-center py-8 px-4">
                  <p className="text-gray-400 text-sm">No users found</p>
                  <p className="text-gray-500 text-xs mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="text-center py-8 px-4">
                  <p className="text-gray-400 text-sm">Start typing to search for users</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}