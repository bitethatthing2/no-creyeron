'use client';

import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { formatMessageTime } from '@/lib/utils/date-utils';

interface Message {
  id: string;
  content: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
  is_flagged?: boolean;
  reactions?: Array<{
    id: string;
    emoji: string;
    user_id: string;
  }>;
}

interface MessageItemProps {
  message: Message;
  currentUserId?: string;
  isNewMessage?: boolean;
  variant?: 'default' | 'mobile';
  onAvatarClick?: (userId: string, displayName: string, avatarUrl?: string) => void;
  onReactionToggle?: (messageId: string, emoji: string, reactionId?: string) => void;
  className?: string;
}

const getAvatarFallback = (displayName: string): string => {
  return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export function MessageItem({
  message,
  currentUserId,
  isNewMessage = false,
  variant = 'default',
  onAvatarClick,
  onReactionToggle,
  className = ''
}: MessageItemProps) {
  const isCurrentUser = message.user_id === currentUserId;
  const isPrivate = message.content.includes('[PRIVATE]:');

  // Mobile variant styling
  if (variant === 'mobile') {
    return (
      <div className={`message-item group flex gap-3 py-3 px-4 rounded-xl transition-colors w-full max-w-full box-border ${
        isPrivate ? 'bg-purple-900/20 border-l-2 border-purple-500' : 'bg-white/5 hover:bg-white/10'
      } ${className}`}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Image 
            src={message.avatar_url || '/default-avatar.png'}
            alt={message.display_name}
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-600"
            unoptimized={message.avatar_url?.includes('dicebear.com')}
          />
        </div>
        
        {/* Message content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-semibold text-xs truncate ${isPrivate ? 'text-purple-400' : 'text-blue-400'}`}>
              {message.display_name}
            </span>
            {isPrivate && (
              <span className="text-purple-300 text-xs bg-purple-500/20 px-1.5 py-0.5 rounded">Private</span>
            )}
            <span className="text-gray-500 text-xs flex-shrink-0">
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="text-white text-sm leading-relaxed break-words">{message.content}</div>
          
          {/* Message Reactions Display */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {Object.entries(
                message.reactions.reduce((acc: Record<string, { count: number; userReacted: boolean; reactionId?: string }>, reaction) => {
                  const isCurrentUserReaction = reaction.user_id === currentUserId;
                  if (!acc[reaction.emoji]) {
                    acc[reaction.emoji] = { count: 0, userReacted: false };
                  }
                  acc[reaction.emoji].count += 1;
                  if (isCurrentUserReaction) {
                    acc[reaction.emoji].userReacted = true;
                    acc[reaction.emoji].reactionId = reaction.id;
                  }
                  return acc;
                }, {})
              ).map(([emoji, data]) => (
                <button
                  key={emoji}
                  onClick={() => onReactionToggle?.(message.id, emoji, data.reactionId)}
                  className={`text-xs px-2 py-1 rounded-full transition-colors ${
                    data.userReacted 
                      ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50' 
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  {emoji} {data.count}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant styling
  return (
    <div className={`flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ${
      isCurrentUser ? 'flex-row-reverse' : ''
    } ${className}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <button
          onClick={() => onAvatarClick?.(message.user_id, message.display_name, message.avatar_url)}
          className={`h-8 w-8 rounded-full overflow-hidden transition-all duration-200 ${
            isCurrentUser 
              ? 'cursor-default ring-2 ring-blue-500/30' 
              : 'cursor-pointer hover:ring-2 hover:ring-primary/50 hover:scale-105'
          } ${isCurrentUser && isNewMessage ? 'animate-pulse' : ''}`}
          disabled={isCurrentUser}
        >
          {message.avatar_url ? (
            <img
              src={message.avatar_url}
              alt={message.display_name}
              className="h-full w-full object-cover rounded-full"
            />
          ) : (
            <div className={`h-full w-full flex items-center justify-center text-white text-xs font-medium rounded-full ${
              isCurrentUser ? 'bg-blue-600' : 'bg-gray-600'
            }`}>
              {getAvatarFallback(message.display_name)}
            </div>
          )}
        </button>
      </div>

      {/* Message Content */}
      <div className={`flex-1 min-w-0 ${isCurrentUser ? 'text-right' : ''}`}>
        <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'justify-end' : ''}`}>
          <span className={`font-medium text-sm ${
            isCurrentUser ? 'text-blue-700' : 'text-gray-900'
          }`}>
            {message.display_name}
          </span>
          <span className="text-xs text-gray-500">
            {formatMessageTime(message.created_at)}
          </span>
          {isCurrentUser && (
            <Badge variant="outline" className="text-xs px-1 py-0 bg-blue-50 border-blue-200 text-blue-700">
              You
            </Badge>
          )}
          {message.is_flagged && (
            <Badge variant="destructive" className="text-xs px-1 py-0">
              Flagged
            </Badge>
          )}
        </div>
        <div className={`inline-block px-3 py-2 rounded-lg text-sm break-words max-w-xs md:max-w-md lg:max-w-lg ${
          isCurrentUser 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
            : 'bg-gray-100 text-gray-800'
        } ${isCurrentUser && isNewMessage ? 'animate-in slide-in-from-right-2 duration-300' : ''}`}>
          {message.content}
        </div>
        
        {/* Message Reactions Display for Default Variant */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={`flex gap-1 mt-2 flex-wrap ${isCurrentUser ? 'justify-end' : ''}`}>
            {Object.entries(
              message.reactions.reduce((acc: Record<string, { count: number; userReacted: boolean; reactionId?: string }>, reaction) => {
                const isCurrentUserReaction = reaction.user_id === currentUserId;
                if (!acc[reaction.emoji]) {
                  acc[reaction.emoji] = { count: 0, userReacted: false };
                }
                acc[reaction.emoji].count += 1;
                if (isCurrentUserReaction) {
                  acc[reaction.emoji].userReacted = true;
                  acc[reaction.emoji].reactionId = reaction.id;
                }
                return acc;
              }, {})
            ).map(([emoji, data]) => (
              <button
                key={emoji}
                onClick={() => onReactionToggle?.(message.id, emoji, data.reactionId)}
                className={`text-xs px-2 py-1 rounded-full transition-colors ${
                  data.userReacted 
                    ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {emoji} {data.count}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}