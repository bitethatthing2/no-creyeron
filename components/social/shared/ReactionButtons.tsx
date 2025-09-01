'use client';

import React from 'react';

interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
}

interface ReactionData {
  count: number;
  userReacted: boolean;
  reactionId?: string;
}

interface ReactionButtonsProps {
  messageId: string;
  reactions?: Reaction[];
  currentUserId?: string;
  onReactionAdd: (messageId: string, emoji: string) => void;
  onReactionRemove: (reactionId: string) => void;
  variant?: 'default' | 'mobile';
  showQuickReactions?: boolean;
  quickReactionEmojis?: string[];
  className?: string;
}

const defaultQuickReactions = ['👍', '❤️', '🔥', '🐺'];

export function ReactionButtons({
  messageId,
  reactions = [],
  currentUserId,
  onReactionAdd,
  onReactionRemove,
  variant = 'default',
  showQuickReactions = false,
  quickReactionEmojis = defaultQuickReactions,
  className = ''
}: ReactionButtonsProps) {
  // Group reactions by emoji and calculate user interaction data
  const groupedReactions: Record<string, ReactionData> = reactions.reduce((acc, reaction) => {
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
  }, {} as Record<string, ReactionData>);

  const handleReactionClick = (emoji: string, data?: ReactionData) => {
    if (data?.userReacted && data.reactionId) {
      onReactionRemove(data.reactionId);
    } else {
      onReactionAdd(messageId, emoji);
    }
  };

  // Mobile variant styling
  if (variant === 'mobile') {
    return (
      <div className={className}>
        {/* Existing Reactions */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {Object.entries(groupedReactions).map(([emoji, data]) => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji, data)}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors min-h-[32px] min-w-[32px] ${
                  data.userReacted 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                }`}
              >
                {emoji} {data.count}
              </button>
            ))}
          </div>
        )}

        {/* Quick Reactions - Always visible on mobile */}
        {showQuickReactions && (
          <div className="mt-2 flex gap-1">
            {quickReactionEmojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji, groupedReactions[emoji])}
                className="text-xs bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full px-2 py-1 transition-colors min-h-[32px] min-w-[32px]"
                title={`Add ${emoji} reaction`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default variant styling
  return (
    <div className={className}>
      {/* Existing Reactions */}
      {Object.keys(groupedReactions).length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {Object.entries(groupedReactions).map(([emoji, data]) => (
            <button
              key={emoji}
              onClick={() => handleReactionClick(emoji, data)}
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

      {/* Quick Reactions for default variant */}
      {showQuickReactions && (
        <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {quickReactionEmojis.map(emoji => {
            const existingReaction = groupedReactions[emoji];
            if (existingReaction) return null; // Don't show quick reaction if it already exists
            
            return (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className="text-xs px-2 py-1 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                title={`Add ${emoji} reaction`}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}