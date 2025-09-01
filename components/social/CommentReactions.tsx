// React Component for Comment Reactions
'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface CommentReactionsProps {
  commentId: string;
  className?: string;
}

interface ReactionData {
  user_id: string;
  reaction_type: string;
  created_at: string;
}

export const CommentReactions = ({ commentId, className = '' }: CommentReactionsProps) => {
  const { currentUser } = useAuth();
  const [reactions, setReactions] = React.useState<Record<string, ReactionData[]>>({});
  const [userReactions, setUserReactions] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState<Record<string, boolean>>({});

  const reactionTypes = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  // Load all reactions for this comment
  const loadReactions = React.useCallback(async () => {
    try {
      // Note: Your database doesn't have a comment_reactions table
      // You'll need to use content_interactions or create a new table
      const { data, error } = await supabase
        .from('content_interactions')
        .select('user_id, interaction_type, created_at')
        .eq('content_id', commentId)
        .in('interaction_type', ['like', 'love', 'laugh', 'wow', 'sad', 'angry']);

      if (error) throw error;

      // Group reactions by type
      const groupedReactions: Record<string, ReactionData[]> = {};
      
      // Map interaction types to emojis
      const typeMap: Record<string, string> = {
        'like': '👍',
        'love': '❤️',
        'laugh': '😂',
        'wow': '😮',
        'sad': '😢',
        'angry': '😡'
      };

      (data || []).forEach(reaction => {
        const emoji = typeMap[reaction.interaction_type];
        if (emoji) {
          if (!groupedReactions[emoji]) {
            groupedReactions[emoji] = [];
          }
          groupedReactions[emoji].push({
            user_id: reaction.user_id,
            reaction_type: reaction.interaction_type,
            created_at: reaction.created_at
          });
        }
      });

      setReactions(groupedReactions);
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  }, [commentId]);

  // Check which reactions the current user has made
  const checkUserReactions = React.useCallback(async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('content_interactions')
        .select('interaction_type')
        .eq('content_id', commentId)
        .eq('user_id', currentUser.id)
        .in('interaction_type', ['like', 'love', 'laugh', 'wow', 'sad', 'angry']);

      if (error) throw error;

      const typeMap: Record<string, string> = {
        'like': '👍',
        'love': '❤️',
        'laugh': '😂',
        'wow': '😮',
        'sad': '😢',
        'angry': '😡'
      };

      const userReactionMap: Record<string, boolean> = {};
      (data || []).forEach(reaction => {
        const emoji = typeMap[reaction.interaction_type];
        if (emoji) {
          userReactionMap[emoji] = true;
        }
      });

      setUserReactions(userReactionMap);
    } catch (error) {
      console.error('Error checking user reactions:', error);
    }
  }, [commentId, currentUser]);

  React.useEffect(() => {
    if (commentId) {
      loadReactions();
      checkUserReactions();
    }
  }, [commentId, loadReactions, checkUserReactions]);

  const handleReaction = async (reactionEmoji: string) => {
    if (!currentUser) {
      alert('Please log in to react to comments');
      return;
    }

    if (loading[reactionEmoji]) return;

    setLoading(prev => ({ ...prev, [reactionEmoji]: true }));
    
    try {
      // Map emoji to interaction type
      const emojiMap: Record<string, string> = {
        '👍': 'like',
        '❤️': 'love',
        '😂': 'laugh',
        '😮': 'wow',
        '😢': 'sad',
        '😡': 'angry'
      };

      const interactionType = emojiMap[reactionEmoji];
      if (!interactionType) return;

      const isCurrentlyReacted = userReactions[reactionEmoji];

      if (isCurrentlyReacted) {
        // Remove reaction
        const { error } = await supabase
          .from('content_interactions')
          .delete()
          .eq('content_id', commentId)
          .eq('user_id', currentUser.id)
          .eq('interaction_type', interactionType);

        if (error) throw error;

        // Update local state
        setUserReactions(prev => ({ ...prev, [reactionEmoji]: false }));
        setReactions(prev => ({
          ...prev,
          [reactionEmoji]: (prev[reactionEmoji] || []).filter(r => r.user_id !== currentUser.id)
        }));

        // Update comment likes count if it's a like
        if (interactionType === 'like') {
          const { error: updateError } = await supabase
            .from('content_comments')
            .update({ 
              likes_count: reactions[reactionEmoji]?.length ? reactions[reactionEmoji].length - 1 : 0 
            })
            .eq('id', commentId);

          if (updateError) console.error('Failed to update likes count:', updateError);
        }
      } else {
        // Add reaction
        const { error } = await supabase
          .from('content_interactions')
          .insert({
            content_id: commentId,
            user_id: currentUser.id,
            interaction_type: interactionType
          });

        if (error) {
          // Handle duplicate key error
          if (error.code === '23505') {
            console.log('Reaction already exists');
            return;
          }
          throw error;
        }

        // Update local state
        setUserReactions(prev => ({ ...prev, [reactionEmoji]: true }));
        setReactions(prev => ({
          ...prev,
          [reactionEmoji]: [...(prev[reactionEmoji] || []), {
            user_id: currentUser.id,
            reaction_type: interactionType,
            created_at: new Date().toISOString()
          }]
        }));

        // Update comment likes count if it's a like
        if (interactionType === 'like') {
          const { error: updateError } = await supabase
            .from('content_comments')
            .update({ 
              likes_count: (reactions[reactionEmoji]?.length || 0) + 1 
            })
            .eq('id', commentId);

          if (updateError) console.error('Failed to update likes count:', updateError);
        }
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
      alert('Failed to update reaction. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, [reactionEmoji]: false }));
    }
  };

  return (
    <div className={`comment-reactions flex gap-2 ${className}`}>
      {reactionTypes.map(emoji => {
        const count = reactions[emoji]?.length || 0;
        const isActive = userReactions[emoji] || false;
        const isLoading = loading[emoji] || false;
        
        return (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            disabled={isLoading || !currentUser}
            className={`
              reaction-button flex items-center gap-1 px-2 py-1 rounded-full text-sm
              transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800
              ${isActive ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${!currentUser ? 'cursor-not-allowed opacity-60' : ''}
            `}
            title={!currentUser ? 'Please log in to react' : `React with ${emoji}`}
          >
            <span className="text-base">{emoji}</span>
            {count > 0 && (
              <span className="text-xs font-medium min-w-[1rem] text-center">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};