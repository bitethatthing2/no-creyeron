'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { 
  MessageWithSender,
  MessageItemProps as BaseMessageItemProps 
} from '@/types/chat';

// Extend the base props if needed for this specific component
interface MessageItemProps extends Omit<BaseMessageItemProps, 'onEdit' | 'onDelete' | 'onReply' | 'showReadReceipts' | 'isHighlighted'> {
  onMessageEdit?: (messageId: string, content: string) => Promise<void>;
  onMessageDelete?: (messageId: string) => Promise<void>;
  showFullName?: boolean; // Option to show full name instead of display name
  showUsername?: boolean; // Option to show username alongside real name
}

/**
 * Formats a timestamp into a human-readable relative time
 */
function formatMessageTime(timestamp: string | null): string {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Gets the full real name from first_name and last_name
 */
function getFullName(sender: MessageWithSender['sender']): string | null {
  if (!sender) return null;
  
  const firstName = sender.first_name?.trim() || '';
  const lastName = sender.last_name?.trim() || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  return fullName || null;
}

/**
 * Gets the display name with proper fallback priority:
 * 1. display_name (if user has set a preferred display name)
 * 2. full name (first_name + last_name)
 * 3. username
 * 4. email prefix (if email exists)
 * 5. 'Anonymous' as last resort
 */
function getDisplayName(sender: MessageWithSender['sender']): string {
  if (!sender) return 'Unknown User';
  
  // Priority 1: User's preferred display name
  if (sender.display_name?.trim()) {
    return sender.display_name.trim();
  }
  
  // Priority 2: Real name (first + last)
  const fullName = getFullName(sender);
  if (fullName) {
    return fullName;
  }
  
  // Priority 3: Username
  if (sender.username?.trim()) {
    return sender.username.trim();
  }
  
  // Priority 4: Email prefix (if email exists)
  if (sender.email) {
    return sender.email.split('@')[0];
  }
  
  // Priority 5: Fallback
  return 'Anonymous';
}

/**
 * Gets the user's username with @ prefix if available
 */
function getUsername(sender: MessageWithSender['sender']): string | null {
  if (!sender?.username) return null;
  return `@${sender.username}`;
}

/**
 * Gets the appropriate avatar URL
 */
function getAvatarUrl(sender: MessageWithSender['sender']): string | null {
  if (!sender) return null;
  return sender.avatar_url || sender.profile_image_url || null;
}

/**
 * Generates initials from a name
 * Handles both single names and multiple word names
 */
function getInitials(name: string): string {
  const words = name.split(' ').filter(word => word.length > 0);
  
  if (words.length === 0) return '?';
  if (words.length === 1) {
    // For single word, take first two characters
    return words[0].substring(0, 2).toUpperCase();
  }
  
  // For multiple words, take first character of first two words
  return words
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase();
}

/**
 * Determines if we should show additional name info
 * Shows username when display name is different from username
 */
function shouldShowUsername(sender: MessageWithSender['sender']): boolean {
  if (!sender?.username) return false;
  
  const displayName = getDisplayName(sender);
  const username = sender.username;
  
  // Show username if it's different from what's being displayed
  return displayName.toLowerCase() !== username.toLowerCase() && 
         !displayName.includes(username);
}

export function MessageItem({
  message,
  currentUserId,
  onReactionAdd,
  onReactionRemove,
  onMessageEdit,
  onMessageDelete,
  showFullName = false,
  showUsername = false,
  className
}: MessageItemProps): React.ReactElement | null {
  // Group reactions by reaction type
  const groupedReactions = React.useMemo(() => {
    if (!message.reactions?.length) return {};

    return message.reactions.reduce((acc, reaction) => {
      const reactionText = reaction.reaction;
      if (!reactionText) return acc;
      
      if (!acc[reactionText]) {
        acc[reactionText] = {
          count: 0,
          users: [],
          userReacted: false,
          reactionId: undefined as string | undefined
        };
      }
      
      acc[reactionText].count++;
      if (reaction.user_id) {
        acc[reactionText].users.push(reaction.user_id);
      }
      
      if (reaction.user_id === currentUserId) {
        acc[reactionText].userReacted = true;
        acc[reactionText].reactionId = reaction.id;
      }
      
      return acc;
    }, {} as Record<string, {
      count: number;
      users: string[];
      userReacted: boolean;
      reactionId?: string;
    }>);
  }, [message.reactions, currentUserId]);

  const handleReactionClick = React.useCallback(async (reaction: string) => {
    const reactionData = groupedReactions[reaction];
    
    try {
      if (reactionData?.userReacted && reactionData.reactionId) {
        await onReactionRemove?.(reactionData.reactionId);
      } else {
        await onReactionAdd?.(message.id, reaction);
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  }, [groupedReactions, message.id, onReactionAdd, onReactionRemove]);

  const [showActions, setShowActions] = React.useState(false);

  // Don't render deleted messages unless showing deletion notice
  if (message.deleted_at) {
    return (
      <div className={cn("flex gap-3 p-4 opacity-50", className)}>
        <div className="text-sm text-gray-500 italic">
          This message was deleted
        </div>
      </div>
    );
  }

  // Don't render empty messages
  if (!message.content) return null;

  const isCurrentUser = message.sender_id === currentUserId;
  
  // Get name information
  const displayName = showFullName ? getFullName(message.sender) || getDisplayName(message.sender) : getDisplayName(message.sender);
  const username = getUsername(message.sender);
  const shouldShowUsernameTag = (showUsername || shouldShowUsername(message.sender)) && username;
  const avatarUrl = getAvatarUrl(message.sender);
  
  // Check if user is verified (blue checkmark)
  const isVerified = message.sender?.is_verified;

  return (
    <div 
      className={cn(
        "flex gap-3 p-4 group hover:bg-gray-800/30 transition-colors",
        isCurrentUser ? "flex-row-reverse" : "flex-row",
        className
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600 relative">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-xs font-medium bg-gradient-to-br from-gray-600 to-gray-700">
              {getInitials(displayName)}
            </div>
          )}
          {/* Verified badge on avatar */}
          {isVerified && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className={cn("flex-1 min-w-0 max-w-md", isCurrentUser ? "text-right" : "text-left")}>
        {/* Message Header */}
        <div className={cn(
          "flex items-center gap-2 mb-1",
          isCurrentUser ? "justify-end" : "justify-start"
        )}>
          {/* Name and username */}
          <div className={cn(
            "flex items-center gap-1",
            isCurrentUser ? "flex-row-reverse" : "flex-row"
          )}>
            <span className="text-sm font-medium text-gray-300">
              {displayName}
            </span>
            {/* Inline verified badge next to name */}
            {isVerified && !avatarUrl && (
              <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {shouldShowUsernameTag && (
              <span className="text-xs text-gray-500">
                {username}
              </span>
            )}
          </div>
          
          <span className="text-xs text-gray-500">
            {formatMessageTime(message.created_at)}
          </span>
          {message.edited_at && (
            <span className="text-xs text-gray-500 italic">(edited)</span>
          )}
        </div>

        {/* Message Bubble */}
        <div className={cn(
          "inline-block max-w-full px-4 py-2 rounded-2xl text-sm break-words",
          isCurrentUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-gray-700 text-gray-100 rounded-bl-md"
        )}>
          {message.content}
        </div>

        {/* Media Attachments */}
        {message.media_url && (
          <div className="mt-2">
            {message.media_type?.startsWith('image') ? (
              <div className="rounded-lg overflow-hidden max-w-sm">
                <Image
                  src={message.media_url}
                  alt="Shared image"
                  width={300}
                  height={200}
                  className="object-cover w-full h-auto"
                />
              </div>
            ) : message.media_type?.startsWith('video') ? (
              <video
                src={message.media_url}
                controls
                className="rounded-lg max-w-sm"
                poster={message.media_thumbnail_url || undefined}
              >
                Your browser does not support video playback.
              </video>
            ) : (
              <a
                href={message.media_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm underline"
              >
                View attachment
              </a>
            )}
            
            {/* Media metadata */}
            {message.media_size && (
              <div className="text-xs text-gray-500 mt-1">
                {(Number(message.media_size) / 1024 / 1024).toFixed(1)} MB
                {message.media_duration && ` • ${Math.floor(message.media_duration / 60)}:${(message.media_duration % 60).toString().padStart(2, '0')}`}
              </div>
            )}
          </div>
        )}

        {/* Existing Reactions */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className={cn(
            "flex gap-1 mt-2 flex-wrap",
            isCurrentUser ? "justify-end" : "justify-start"
          )}>
            {Object.entries(groupedReactions).map(([reaction, data]) => (
              <button
                key={reaction}
                onClick={() => handleReactionClick(reaction)}
                className={cn(
                  "text-xs px-2 py-1 rounded-full transition-colors",
                  data.userReacted
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                )}
                title={`${data.count} reaction${data.count !== 1 ? 's' : ''}`}
              >
                {reaction} {data.count}
              </button>
            ))}
          </div>
        )}

        {/* Quick reaction buttons and actions - shown on hover */}
        {showActions && (
          <div className={cn(
            "flex gap-1 mt-1",
            isCurrentUser ? "justify-end" : "justify-start"
          )}>
            {/* Quick reactions */}
            <div className="flex gap-1">
              {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className="text-sm hover:bg-gray-600 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                  title={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            
            {/* Message actions for own messages */}
            {isCurrentUser && (
              <div className="flex gap-1 ml-2">
                {onMessageEdit && (
                  <button
                    onClick={() => {
                      const newContent = prompt('Edit message:', message.content);
                      if (newContent && newContent !== message.content) {
                        onMessageEdit(message.id, newContent);
                      }
                    }}
                    className="text-xs text-gray-400 hover:text-gray-200 px-2"
                  >
                    Edit
                  </button>
                )}
                {onMessageDelete && (
                  <button
                    onClick={() => {
                      if (confirm('Delete this message?')) {
                        onMessageDelete(message.id);
                      }
                    }}
                    className="text-xs text-red-400 hover:text-red-300 px-2"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Export types for use in other components
export type { MessageItemProps };