// React Component for Comment Reactions
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CommentReactionService } from '@/lib/services/comment-reaction.service';

interface CommentReactionsProps {
  commentId: string;
  className?: string;
}

export const CommentReactions = ({ commentId, className = '' }: CommentReactionsProps) => {
  const [reactions, setReactions] = useState<Record<string, any[]>>({});
  const [userReactions, setUserReactions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  // Using singleton instance
// const supabase is already imported;
  const reactionService = new CommentReactionService(supabase);

  const reactionTypes = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  useEffect(() => {
    if (commentId) {
      loadReactions();
      checkUserReactions();
    }
  }, [commentId]);

  const loadReactions = async () => {
    try {
      const data = await reactionService.getCommentReactions(commentId);
      setReactions(data);
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  const checkUserReactions = async () => {
    try {
      const checks = await Promise.all(
        reactionTypes.map(async (type) => ({
          type,
          reacted: await reactionService.hasUserReacted(commentId, type)
        }))
      );

      const userReactionMap = checks.reduce((acc, { type, reacted }) => {
        acc[type] = reacted;
        return acc;
      }, {} as Record<string, boolean>);

      setUserReactions(userReactionMap);
    } catch (error) {
      console.error('Error checking user reactions:', error);
    }
  };

  const handleReaction = async (reactionType: string) => {
    if (loading[reactionType]) return;

    setLoading(prev => ({ ...prev, [reactionType]: true }));
    
    try {
      const result = await reactionService.toggleReaction(commentId, reactionType);
      
      if (result?.success) {
        // Update local state
        setUserReactions(prev => ({
          ...prev,
          [reactionType]: result.action === 'added'
        }));
        
        // Reload reactions to get updated counts
        await loadReactions();
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
      alert('Failed to update reaction. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, [reactionType]: false }));
    }
  };

  return (
    <div className={`comment-reactions flex gap-2 ${className}`}>
      {reactionTypes.map(type => {
        const count = reactions[type]?.length || 0;
        const isActive = userReactions[type];
        const isLoading = loading[type];
        
        return (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            disabled={isLoading}
            className={`
              reaction-button flex items-center gap-1 px-2 py-1 rounded-full text-sm
              transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800
              ${isActive ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className="text-base">{type}</span>
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