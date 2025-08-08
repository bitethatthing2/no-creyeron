'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { wolfpackService } from '@/lib/services/unified-wolfpack.service';
import { ArrowLeft, Search, MessageCircle, User } from 'lucide-react';
import Image from 'next/image';

interface Conversation {
  id: string;
  conversation_type: string;
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
  other_participants?: any[];
  last_message_sender?: any;
  // Legacy format for backward compatibility
  user_id?: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  last_message?: string;
  last_message_time?: string;
  is_online?: boolean;
}

export default function MessagesInboxPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchUsers, setSearchUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    loadConversations();
  }, [currentUser, router]);

  // Search for users when search query changes or showAllMembers is true
  useEffect(() => {
    if (searchQuery.trim().length > 0 || showAllMembers) {
      searchForUsers();
    } else {
      setSearchUsers([]);
    }
  }, [searchQuery, showAllMembers]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/messages/conversations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchForUsers = async () => {
    if (!currentUser) return;

    try {
      setSearchingUsers(true);
      
      // Use the dedicated wolfpack-members API endpoint
      const response = await fetch('/api/messages/wolfpack-members', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('🐺 Wolfpack members API response:', data);
      
      if (response.ok) {
        let filteredMembers = data.members || [];
        
        // Show a message if database isn't set up yet
        if (data.error === 'Database access failed') {
          console.warn('⚠️ Database not fully configured:', data.message);
        }
        
        // If there's a search query, filter the results (but not when showing all members)
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
        console.error('❌ Failed to fetch wolfpack members:', response.status, data);
        setSearchUsers([]);
      }
    } catch (error) {
      console.error('Error fetching wolfpack members:', error);
      setSearchUsers([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const getDisplayName = (conversation: Conversation) => {
    // Handle new format
    if (conversation.other_user_name || conversation.other_user_username) {
      return conversation.other_user_name || 
             conversation.other_user_username || 
             'Wolf Pack Member';
    }
    // Handle legacy format
    return conversation.display_name || 
           conversation.username || 
           conversation.name ||
           'Anonymous';
  };

  const formatTime = (timestamp: string) => {
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
    conv.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.other_user_username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase())
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
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-800 bg-black sticky top-0 z-10">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Messages</h1>
        </div>
        
        <button 
          onClick={() => setShowAllMembers(true)}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <Search className="h-5 w-5 text-white" />
        </button>
      </div>

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

      {/* Browse Pack Members Button */}
      {!searchQuery && !showAllMembers && (
        <div className="p-4 border-b border-gray-800">
          <button
            onClick={() => setShowAllMembers(true)}
            className="w-full bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg py-3 px-4 flex items-center justify-center gap-2 transition-colors"
          >
            <span className="text-lg">🐺</span>
            <span className="font-medium">Browse All Pack Members</span>
          </button>
        </div>
      )}

      {/* User Search Results or Conversations List */}
      <div className="flex-1">
        {searchQuery.trim().length > 0 || showAllMembers ? (
          // Show search results
          <div>
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-400">
                {showAllMembers ? 'All Pack Members' : 'Search Results'}
              </h3>
              {showAllMembers && (
                <button
                  onClick={() => {
                    setShowAllMembers(false);
                    setSearchQuery('');
                  }}
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
                {searchUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => router.push(`/messages/${user.auth_id || user.id}`)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-900/50 transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800">
                      <Image
                        src={user.avatarUrl || user.avatar_url || '/icons/wolf-icon.png'}
                        alt={user.displayName || 'Wolf Pack Member'}
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
                        {user.wolfpack_status === 'active' && (
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
          // Show existing conversations or empty state
          filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No conversations yet</h3>
              <p className="text-gray-400 text-center mb-6">
                Search for Wolfpack members to start messaging
              </p>
              <button
                onClick={() => router.push('/wolfpack/feed')}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-medium transition-colors"
              >
                Explore Feed
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredConversations.map((conversation) => {
                const userId = conversation.other_user_id || conversation.user_id;
                const avatarUrl = conversation.other_user_avatar || conversation.avatar_url || '/icons/wolf-icon.png';
                const lastMessage = conversation.last_message_preview || conversation.last_message || 'Start a conversation...';
                const lastMessageTime = conversation.last_message_at || conversation.last_message_time;
                const isOnline = conversation.other_user_is_online || conversation.is_online;
                
                return (
                  <button
                    key={conversation.id || conversation.user_id}
                    onClick={() => router.push(`/messages/${userId}`)}
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
                        {lastMessage}
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