'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Search, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { ConnectionStatus } from '@/components/shared/ConnectionStatus';

// Defines the structure for a conversation.
// Includes properties for both the new and legacy API formats.
interface Conversation {
  id: string;
  conversation_id: string;
  conversation_type: string;
  conversation_name?: string;
  name: string;
  last_message_at: string;
  last_message_preview: string;
  created_at: string;
  updated_at: string;
  unread_count: number;
  other_user_id?: string;
  other_user_name?: string;
  other_user_avatar?: string;
  other_user_username?: string;
  other_user_is_online?: boolean;
  other_participants?: { id: string; name: string; avatar_url?: string }[];
  last_message_sender?: { id: string; name: string; avatar_url?: string };
  // Legacy format for backward compatibility
  user_id?: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  last_message?: string;
  last_message_time?: string;
  is_online?: boolean;
}

// Defines the structure for a user returned from the search API.
interface UserSearchResult {
  id: string;
  auth_id?: string;
  displayName?: string;
  display_name?: string;
  username?: string;
  avatarUrl?: string;
  avatar_url?: string;
  account_status?: string;
  location?: string;
  first_name?: string;
  last_name?: string;
}

export default function MessagesInboxPage() {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchUsers, setSearchUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const loadConversations = useCallback(async (isRetry = false) => {
    if (!currentUser) {
      console.log('⚠️ loadConversations called without currentUser');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      if (isRetry) setRetrying(true);

      console.log('📞 Calling conversations API...');
      const response = await fetch('/api/messages/conversations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 500) {
          setError('Server error. The messaging system may be temporarily unavailable.');
        } else if (response.status === 401) {
          setError('Please log in to view messages');
          router.push('/login');
          return;
        } else if (response.status === 404) {
          setError('Your profile was not found. Please try refreshing the page.');
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || `Failed to load conversations (${response.status})`);
        }
        return;
      }

      const data = await response.json();
      console.log('📱 Messages page received data:', data);
      console.log('📱 Number of conversations:', data.conversations?.length || 0);
      
      setConversations(data.conversations || []);

      setError(null);
    } catch (err) {
      console.error('Error loading conversations:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Connection error. Please check your internet connection.');
      } else {
        setError('An unexpected error occurred while loading conversations.');
      }
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [currentUser, router]);

  const retryLoadConversations = () => {
    loadConversations(true);
  };

  const searchForUsers = useCallback(async () => {
    if (!currentUser) return;

    try {
      setSearchingUsers(true);

      const response = await fetch('/api/users/current', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('🐺 Wolfpack members API response:', data);

      if (response.ok) {
        let filteredMembers: UserSearchResult[] = data.members || [];

        if (data.error === 'Database access failed') {
          console.warn('⚠️ Database not fully configured:', data.message);
        }

        if (searchQuery.trim() && !showAllMembers) {
          const query = searchQuery.toLowerCase();
          filteredMembers = filteredMembers.filter(member =>
            (member.displayName || '').toLowerCase().includes(query) ||
            (member.username || '').toLowerCase().includes(query) ||
            (member.first_name || '').toLowerCase().includes(query) ||
            (member.last_name || '').toLowerCase().includes(query)
          );
        }

        setSearchUsers(filteredMembers);
      } else {
        console.error('❌ Failed to fetch social members:', response.status, data);
        setSearchUsers([]);
      }
    } catch (error) {
      console.error('Error fetching social members:', error);
      setSearchUsers([]);
    } finally {
      setSearchingUsers(false);
    }
  }, [currentUser, searchQuery, showAllMembers]);

  useEffect(() => {
    if (!currentUser) {
      console.log('❌ No current user, redirecting to login');
      router.push('/login');
      return;
    }

    console.log('🚀 Messages page loading conversations for user:', currentUser.id);
    loadConversations();
  }, [currentUser, router, loadConversations]);

  useEffect(() => {
    if (searchQuery.trim().length > 0 || showAllMembers) {
      searchForUsers();
    } else {
      setSearchUsers([]);
    }
  }, [searchQuery, showAllMembers, searchForUsers]);

  const getDisplayName = (conversation: Conversation): string => {
    // Skip generic placeholders and ID-based names
    const invalidNames = ['chat participant', 'unknown user', 'wolf pack member', 'new message', 'new conversation', ''];
    
    // Try to get a valid display name
    const possibleNames = [
      conversation.other_user_name,
      conversation.display_name,
      conversation.name,
      conversation.other_user_username,
      conversation.username
    ];
    
    for (const name of possibleNames) {
      if (name && !invalidNames.includes(name.toLowerCase().trim())) {
        // Also reject names that look like "Wolf Pack Chat" with an ID
        if (name.startsWith('Wolf Pack Chat ') && name.length > 20) {
          console.log(`Rejecting ID-based name: ${name}`);
          continue;
        }
        return name;
      }
    }
    
    // Check if this is a new conversation without messages
    if (!conversation.last_message || conversation.last_message === '') {
      return 'New Conversation';
    }
    
    // We have messages but couldn't get the name - this is an error state
    console.error(`Failed to get name for conversation ${conversation.id} with message: ${conversation.last_message}`);
    return 'Unknown User';
  };

  const formatTime = (timestamp: string | undefined): string => {
    if (!timestamp) return '';
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const filteredConversations = conversations.filter(conv =>
    getDisplayName(conv).toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.conversation_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <ConnectionStatus />

      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-800 bg-black sticky top-0 z-10">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>

        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Messages</h1>
        </div>

        <button
          type="button"
          onClick={() => setShowAllMembers(true)}
          aria-label="Search members"
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <Search className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <span className="text-red-400 text-lg">⚠️</span>
            </div>
            <div className="flex-1">
              <p className="text-red-200 text-sm font-medium">Connection Error</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
              <button
                type="button"
                onClick={retryLoadConversations}
                disabled={retrying}
                aria-label="Retry loading conversations"
                className="mt-3 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white text-xs rounded-md transition-colors flex items-center gap-1"
              >
                {retrying ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                    Retrying...
                  </>
                ) : (
                  'Try Again'
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Close error message"
              className="text-red-400 hover:text-red-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="p-4 border-b border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (showAllMembers && e.target.value.trim()) {
                setShowAllMembers(false);
              }
            }}
            placeholder="Search Wolfpack members..."
            className="w-full bg-gray-800 border border-gray-700 rounded-full py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Browse Pack Members Button - Only show when no conversations exist */}
      {!searchQuery && !showAllMembers && conversations.length === 0 && (
        <div className="p-4 border-b border-gray-800">
          <button
            type="button"
            onClick={() => setShowAllMembers(true)}
            aria-label="Browse all pack members to start a conversation"
            className="w-full bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg py-3 px-4 flex items-center justify-center gap-2 transition-colors"
          >
            <span className="text-lg">🐺</span>
            <span className="font-medium">Browse All Pack Members</span>
          </button>
        </div>
      )}

      {/* User Search Results or Conversations List */}
      <div className="flex-1">
        {(searchQuery.trim().length > 0 || showAllMembers) ? (
          <div>
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-400">
                {showAllMembers ? 'All Pack Members' : 'Search Results'}
              </h3>
              {showAllMembers && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAllMembers(false);
                    setSearchQuery('');
                  }}
                  aria-label="Clear search and return to conversations"
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {searchingUsers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
              </div>
            ) : searchUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No users found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {searchUsers.map((user: UserSearchResult) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      console.log('🔍 Clicking on user:', {
                        id: user.id,
                        auth_id: user.auth_id,
                        displayName: user.displayName || user.display_name,
                        navigating_to: `/messages/user/${user.id}`
                      });
                      router.push(`/messages/user/${user.id}`);
                    }}
                    aria-label={`Start conversation with ${user.displayName || user.display_name || user.username || 'Wolf Pack Member'}`}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-900/50 transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800">
                      <Image
                        src={user.avatarUrl || user.avatar_url || 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png'}
                        alt={user.displayName || user.display_name || user.username || 'Wolf Pack Member'}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white truncate">
                          {user.displayName || user.display_name || user.username || 'Wolf Pack Member'}
                        </h3>
                        {user.account_status === 'active' && (
                          <span className="text-xs bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full">
                            🐺 Pack
                          </span>
                        )}
                      </div>
                      {user.username && (
                        <p className="text-sm text-gray-400">@{user.username}</p>
                      )}
                      {user.location && (
                        <p className="text-xs text-gray-500">{user.location}</p>
                      )}
                    </div>

                    <div className="text-xs bg-red-600 text-white px-3 py-1 rounded-full">
                      Message
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {conversations.length === 0 ? 'No conversations yet' : 'No matching conversations'}
              </h3>
              <p className="text-gray-400 text-center mb-6">
                {conversations.length === 0 
                  ? 'Start a conversation with a Wolfpack member'
                  : 'Try a different search term'}
              </p>
              {conversations.length === 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllMembers(true)}
                  aria-label="Browse pack members to start a new conversation"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-medium transition-colors"
                >
                  Browse Pack Members
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredConversations.map((conversation) => {
                const avatarUrl = conversation.other_user_avatar || conversation.avatar_url || 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png';
                const lastMessage = conversation.last_message_preview || conversation.last_message || '';
                const lastMessageTime = conversation.last_message_at || conversation.last_message_time;
                const isOnline = conversation.other_user_is_online || conversation.is_online || false;

                return (
                  <button
                    key={conversation.conversation_id || conversation.id}
                    type="button"
                    onClick={() => router.push(`/messages/conversation/${conversation.conversation_id || conversation.id}`)}
                    aria-label={`Open conversation with ${getDisplayName(conversation)}`}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-900/50 transition-colors text-left"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800">
                        <Image
                          src={avatarUrl}
                          alt={getDisplayName(conversation)}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-white truncate">
                          {getDisplayName(conversation)}
                        </h3>
                        <span className="text-xs text-gray-400">
                          {formatTime(lastMessageTime)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-400 truncate">
                          {lastMessage || <span className="italic">No messages yet</span>}
                        </p>
                        {conversation.unread_count > 0 && (
                          <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-2 flex-shrink-0">
                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}