'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { 
  ChatConversation,
  User,
  ConversationWithParticipants,
  ConversationListProps 
} from '@/types/chat';


function formatLastMessageTime(timestamp: string | null): string {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

function getConversationName(conversation: ConversationWithParticipants, currentUserId: string): string {
  // Use explicit conversation name if set
  if (conversation.name) return conversation.name;
  
  // For DMs, show the other participant's name
  if (!conversation.is_group) {
    const otherParticipant = conversation.participants.find(p => p.user.id !== currentUserId);
    if (otherParticipant) {
      return otherParticipant.user.display_name || otherParticipant.user.username || 'Unknown User';
    }
  }
  
  // For groups, show participant names or fallback
  if (conversation.is_group && conversation.participants.length > 0) {
    const names = conversation.participants
      .filter(p => p.user.id !== currentUserId)
      .slice(0, 2)
      .map(p => p.user.display_name || p.user.username)
      .filter(Boolean);
    
    if (names.length > 0) {
      return names.join(', ') + (conversation.participant_count && conversation.participant_count > 3 ? ` +${conversation.participant_count - 3}` : '');
    }
  }
  
  return 'Chat';
}

function getConversationAvatar(conversation: ConversationWithParticipants, currentUserId: string): string | null {
  // Use conversation avatar if set
  if (conversation.avatar_url) return conversation.avatar_url;
  
  // For DMs, use other participant's avatar
  if (!conversation.is_group) {
    const otherParticipant = conversation.participants.find(p => p.user.id !== currentUserId);
    return otherParticipant?.user.avatar_url || null;
  }
  
  // For groups, use first other participant's avatar
  const otherParticipant = conversation.participants.find(p => p.user.id !== currentUserId);
  return otherParticipant?.user.avatar_url || null;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ConversationList({
  conversations,
  currentUserId,
  onStartNewChat,
  loading = false,
  className
}: ConversationListProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter conversations by search query
  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    const query = searchQuery.toLowerCase();
    return conversations.filter(conv => {
      const name = getConversationName(conv, currentUserId).toLowerCase();
      const preview = conv.last_message_preview?.toLowerCase() || '';
      return name.includes(query) || preview.includes(query);
    });
  }, [conversations, searchQuery, currentUserId]);

  // Sort conversations by last message time
  const sortedConversations = React.useMemo(() => {
    return [...filteredConversations].sort((a, b) => {
      const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return timeB - timeA; // Most recent first
    });
  }, [filteredConversations]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-gray-900", className)}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Messages</h1>
          {onStartNewChat && (
            <button
              onClick={onStartNewChat}
              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
              aria-label="Start new chat"
            >
              <Plus className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-center">
            <div>
              <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              {!searchQuery && onStartNewChat && (
                <button
                  onClick={onStartNewChat}
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  Start your first conversation
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {sortedConversations.map((conversation) => {
              const conversationName = getConversationName(conversation, currentUserId);
              const avatarUrl = getConversationAvatar(conversation, currentUserId);
              const hasUnread = conversation.last_message_sender_id !== currentUserId && 
                               conversation.last_message_at;
              const isActive = conversation.is_active !== false;

              return (
                <Link
                  key={conversation.id}
                  href={`/messages/${conversation.id}`}
                  className="block hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 p-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt={conversationName}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-medium text-sm">
                            {getInitials(conversationName)}
                          </div>
                        )}
                      </div>
                      
                      {/* Group indicator */}
                      {conversation.is_group && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-700 border-2 border-gray-900 rounded-full flex items-center justify-center">
                          <span className="text-xs text-gray-300">{conversation.participant_count || 0}</span>
                        </div>
                      )}
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={cn(
                          "font-medium truncate",
                          hasUnread ? "text-white" : "text-gray-300"
                        )}>
                          {conversationName}
                          {conversation.is_group && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({conversation.participant_count || 0})
                            </span>
                          )}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatLastMessageTime(conversation.last_message_at)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          "text-sm truncate",
                          hasUnread ? "text-gray-300" : "text-gray-500"
                        )}>
                          {conversation.last_message_preview || 'No messages yet'}
                        </p>
                        
                        <div className="flex items-center gap-2 ml-2">
                          {hasUnread && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                          {!isActive && (
                            <div className="text-xs text-gray-600 bg-gray-800 px-1 rounded">
                              Archived
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}