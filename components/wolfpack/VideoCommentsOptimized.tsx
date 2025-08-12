'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageCircle, 
  Heart, 
  Send, 
  X as XIcon,
  Reply as ReplyIcon,
  Smile
} from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getZIndexClass } from '@/lib/constants/z-index';
import { toast } from '@/components/ui/use-toast';
import { wolfpackService } from '@/lib/services/unified-wolfpack.service';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Types
interface CommentUser {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  display_name?: string;
  username?: string;
  profile_image_url?: string;
}

interface SupabaseComment {
  id: string;
  user_id: string;
  video_id: string;
  content: string;
  created_at: string;
  parent_comment_id?: string | null;
  users?: CommentUser | CommentUser[];
  replies?: SupabaseComment[];
  like_count?: number;
  user_liked?: boolean;
}

interface Comment extends SupabaseComment {
  user: CommentUser;
  replies: Comment[];
  like_count: number;
  user_liked: boolean;
}

interface VideoCommentsProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  initialCommentCount: number;
  onCommentCountChange?: (count: number) => void;
}

// Convert unified service response to component format
const convertUnifiedComments = (unifiedComments: any[]): Comment[] => {
  return unifiedComments.map(comment => ({
    ...comment,
    user: comment.users || comment.user || {
      id: comment.user_id,
      first_name: 'Unknown',
      last_name: 'User'
    },
    replies: comment.replies || [],
    like_count: comment.like_count || comment.likes_count || 0,
    user_liked: comment.user_liked || false // Now properly passed from service
  }));
};

// Main component
function VideoComments({ 
  postId, 
  isOpen, 
  onClose, 
  initialCommentCount, 
  onCommentCountChange 
}: VideoCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [likingCommentId, setLikingCommentId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  // Common emojis for quick access
  const commonEmojis = ['😀', '😂', '😍', '😢', '😮', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉', '😎', '🤔', '😊', '💀', '🙄', '😱', '🤣', '🥺'];

  // Helper function to calculate total comments including replies
  const calculateTotalComments = (commentsList: Comment[]): number => {
    const countComments = (commentList: Comment[]) => {
      return commentList.reduce((count, comment) => {
        return count + 1 + countComments(comment.replies || []);
      }, 0);
    };
    return countComments(commentsList);
  };

  // Helper function to remove comment from tree structure
  const removeCommentFromTree = (commentsList: Comment[], commentId: string): Comment[] => {
    return commentsList.reduce((acc: Comment[], comment) => {
      if (comment.id === commentId) {
        // Skip this comment (remove it)
        return acc;
      }
      
      // Process replies recursively
      const updatedComment = {
        ...comment,
        replies: removeCommentFromTree(comment.replies || [], commentId)
      };
      
      return [...acc, updatedComment];
    }, []);
  };


  // Handle real-time comment deletion
  const handleCommentDelete = useCallback((deletedData: any) => {
    if (deletedData.old?.id) {
      setComments(prevComments => {
        const updatedComments = removeCommentFromTree(prevComments, deletedData.old.id);
        const newTotal = calculateTotalComments(updatedComments);
        setCommentCount(newTotal);
        onCommentCountChange?.(newTotal);
        return updatedComments;
      });
    }
  }, [onCommentCountChange]);


  // Reset mounted ref when component opens
  useEffect(() => {
    if (isOpen) {
      mountedRef.current = true;
    }
  }, [isOpen]);

  // Track if we've already loaded for this postId
  const loadedPostIdRef = useRef<string | null>(null);

  // Initial load and subscription setup
  useEffect(() => {
    if (!isOpen || !postId) return;

    // Prevent duplicate loads for same postId
    if (loadedPostIdRef.current === postId) {
      return;
    }

    loadedPostIdRef.current = postId;

    // Load comments directly in effect to avoid dependencies
    const loadCommentsInEffect = async () => {
      try {
        setLoading(true);
        
        // Use the new method that includes like status
        const response = await wolfpackService.getCommentsWithLikes(postId);
        
        console.log('🔍 Comments response:', {
          success: response.success,
          dataLength: response.data?.length || 0,
          data: response.data,
          error: response.error
        });
        
        if (response.success && mountedRef.current) {
          const commentsData = convertUnifiedComments(response.data || []);
          console.log('🔍 Converted comments:', commentsData);
          setComments(commentsData);
          const totalCount = calculateTotalComments(commentsData);
          setCommentCount(totalCount);
          if (onCommentCountChange) {
            onCommentCountChange(totalCount);
          }
        }
      } catch (error) {
        console.error('❌ Error loading comments:', error);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    // Setup real-time subscription directly in effect
    const setupSubscription = () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }

      channelRef.current = supabase
        .channel(`comments-${postId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wolfpack_comments',
            filter: `video_id=eq.${postId}`
          },
          (payload) => {
            // Simply reload comments on any change
            if (mountedRef.current) {
              setTimeout(() => loadCommentsInEffect(), 500);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wolfpack_comment_reactions'
          },
          (payload) => {
            // Reload comments when reactions change
            if (mountedRef.current) {
              setTimeout(() => loadCommentsInEffect(), 500);
            }
          }
        )
        .subscribe();
    };

    loadCommentsInEffect();
    setupSubscription();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      // Reset loaded postId when closing
      if (!isOpen) {
        loadedPostIdRef.current = null;
      }
    };
  }, [isOpen, postId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Close emoji pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker || showReplyEmojiPicker) {
        const target = event.target as Element;
        if (!target.closest('.emoji-picker') && !target.closest('button[data-emoji-trigger]')) {
          setShowEmojiPicker(false);
          setShowReplyEmojiPicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker, showReplyEmojiPicker]);

  // Submit new comment
  const handleSubmitComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    if (!user?.id) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to comment',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);

      const response = await wolfpackService.addComment(postId, newComment.trim());

      if (response.success) {
        setNewComment('');
        toast({
          title: 'Success',
          description: 'Comment posted!',
        });

        // Comments will be updated via real-time subscription
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to post comment',
          variant: 'destructive'
        });
      }

    } catch (error: any) {
      console.error('❌ Error submitting comment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to post comment',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  }, [newComment, submitting, user, postId]);

  // Submit reply
  const handleSubmitReply = useCallback(async (e: React.FormEvent, parentCommentId: string) => {
    e.preventDefault();
    if (!replyContent.trim() || submittingReply) return;

    if (!user?.id) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to reply',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmittingReply(true);

      const response = await wolfpackService.addComment(postId, replyContent.trim(), parentCommentId);

      if (response.success) {
        setReplyContent('');
        setReplyingTo(null);
        
        toast({
          title: 'Success',
          description: 'Reply posted!',
        });

        // Comments will be updated via real-time subscription
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to post reply',
          variant: 'destructive'
        });
      }

    } catch (error: any) {
      console.error('Error submitting reply:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to post reply',
        variant: 'destructive'
      });
    } finally {
      setSubmittingReply(false);
    }
  }, [replyContent, submittingReply, user, postId]);

  // Helper function to update comment in tree structure
  const updateCommentInTree = useCallback((commentsList: Comment[], commentId: string, updates: Partial<Comment>): Comment[] => {
    return commentsList.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, ...updates };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentInTree(comment.replies, commentId, updates)
        };
      }
      return comment;
    });
  }, []);

  // Handle like/unlike comment
  const handleLikeComment = useCallback(async (commentId: string) => {
    if (!user?.id) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to like comments',
        variant: 'destructive'
      });
      return;
    }

    if (likingCommentId) return;

    try {
      setLikingCommentId(commentId);

      // Find current comment to get its state
      const findComment = (comments: Comment[], id: string): Comment | null => {
        for (const comment of comments) {
          if (comment.id === id) return comment;
          if (comment.replies) {
            const found = findComment(comment.replies, id);
            if (found) return found;
          }
        }
        return null;
      };

      const currentComment = findComment(comments, commentId);
      if (!currentComment) return;

      // Optimistic update
      const newLikedState = !currentComment.user_liked;
      const newLikeCount = newLikedState 
        ? (currentComment.like_count || 0) + 1 
        : Math.max(0, (currentComment.like_count || 0) - 1);

      setComments(prevComments => 
        updateCommentInTree(prevComments, commentId, {
          user_liked: newLikedState,
          like_count: newLikeCount
        })
      );

      // Call service to toggle like
      const response = await wolfpackService.toggleCommentLike(commentId);

      if (response.success && response.data) {
        // Update with actual server response
        setComments(prevComments => 
          updateCommentInTree(prevComments, commentId, {
            user_liked: response.data.user_has_liked,
            like_count: response.data.new_like_count
          })
        );
      } else {
        // Revert optimistic update on error
        setComments(prevComments => 
          updateCommentInTree(prevComments, commentId, {
            user_liked: currentComment.user_liked,
            like_count: currentComment.like_count
          })
        );
        
        throw new Error(response.error || 'Failed to toggle like');
      }

    } catch (error: any) {
      console.error('Error liking comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive'
      });
    } finally {
      setLikingCommentId(null);
    }
  }, [user, likingCommentId, comments, updateCommentInTree]);

  const getDisplayName = useCallback((userInfo: Comment['user']) => {
    if (!userInfo) return 'Anonymous';
    
    if (userInfo.display_name) return userInfo.display_name;
    if (userInfo.username) return `@${userInfo.username}`;
    
    const fullName = `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim();
    return fullName || 'Anonymous';
  }, []);

  const getAvatarUrl = useCallback((userInfo: Comment['user']) => {
    if (!userInfo) return '/icons/wolf-icon.png';
    return userInfo.avatar_url || '/icons/wolf-icon.png';
  }, []);

  // Add emoji to comment
  const addEmojiToComment = useCallback((emoji: string) => {
    setNewComment(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  }, []);

  // Add emoji to reply
  const addEmojiToReply = useCallback((emoji: string) => {
    setReplyContent(prev => prev + emoji);
    setShowReplyEmojiPicker(false);
    replyInputRef.current?.focus();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="flex-1" onClick={onClose}></div>
      
      <div className="bg-black text-white flex flex-col rounded-t-2xl max-h-[70vh] animate-slide-up">
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
        </div>
        
        <div className="flex items-center justify-between px-4 pb-4">
          <h3 className="text-lg font-semibold text-white">
            {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Close comments"
          >
            <XIcon className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3 max-h-[40vh]">
          {console.log('🔍 Rendering comments:', { loading, commentsLength: comments.length, comments: comments.slice(0, 2) })}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-600" />
              <p className="text-white">No comments yet</p>
              <p className="text-sm text-gray-400">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onLike={() => handleLikeComment(comment.id)}
                onReply={() => {
                  setReplyingTo(comment.id);
                  setTimeout(() => replyInputRef.current?.focus(), 100);
                }}
                replyingTo={replyingTo}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                onSubmitReply={handleSubmitReply}
                submittingReply={submittingReply}
                replyInputRef={replyInputRef}
                currentUser={user}
                isLiking={likingCommentId === comment.id}
                getDisplayName={getDisplayName}
                getAvatarUrl={getAvatarUrl}
                handleLikeComment={handleLikeComment}
                setReplyingTo={setReplyingTo}
                likingCommentId={likingCommentId}
              />
            ))
          )}
        </div>

        <div className="border-t border-gray-800 bg-gray-900/95 backdrop-blur-sm p-3 pb-safe">
          {!user ? (
            <div className="text-center py-4">
              <p className="text-gray-400 mb-2">Sign in to comment</p>
              <button
                onClick={() => window.location.href = '/login'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Sign In
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="emoji-picker bg-gray-800 border border-gray-600 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-10 gap-1">
                    {commonEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => addEmojiToComment(emoji)}
                        className="text-lg hover:bg-gray-700 rounded p-1 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full bg-gray-800 text-white px-3 py-2 pr-10 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    data-emoji-trigger
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-400 transition-colors"
                  >
                    <Smile className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  onLike: () => void;
  onReply: () => void;
  replyingTo: string | null;
  replyContent: string;
  setReplyContent: (content: string) => void;
  onSubmitReply: (e: React.FormEvent, parentCommentId: string) => void;
  submittingReply: boolean;
  replyInputRef: React.RefObject<HTMLInputElement>;
  currentUser: any;
  isLiking: boolean;
  getDisplayName: (user: Comment['user']) => string;
  getAvatarUrl: (user: Comment['user']) => string;
  handleLikeComment: (commentId: string) => void;
  setReplyingTo: (id: string | null) => void;
  likingCommentId: string | null;
}

function CommentItem({ 
  comment, 
  onLike, 
  onReply, 
  replyingTo,
  replyContent,
  setReplyContent,
  onSubmitReply,
  submittingReply,
  replyInputRef,
  currentUser,
  isLiking,
  getDisplayName,
  getAvatarUrl,
  handleLikeComment,
  setReplyingTo,
  likingCommentId
}: CommentItemProps) {
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - commentTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return commentTime.toLocaleDateString();
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
            <Image
              src={getAvatarUrl(comment.user)}
              alt={getDisplayName(comment.user)}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white text-sm">
              {getDisplayName(comment.user)}
            </span>
            <span className="text-gray-400 text-xs">
              {formatTimeAgo(comment.created_at)}
            </span>
          </div>
          
          <p className="text-gray-100 text-sm leading-relaxed break-words">
            {comment.content}
          </p>
          
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={onLike}
              disabled={isLiking}
              className={`flex items-center gap-1 text-xs transition-colors ${
                comment.user_liked 
                  ? 'text-red-500 hover:text-red-400' 
                  : 'text-gray-400 hover:text-red-400'
              } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart className={`h-4 w-4 ${comment.user_liked ? 'fill-current' : ''}`} />
              {comment.like_count > 0 && (
                <span>{comment.like_count}</span>
              )}
            </button>
            
            <button
              onClick={onReply}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400 transition-colors"
            >
              <ReplyIcon className="h-4 w-4" />
              Reply
            </button>
          </div>
          
          {/* Reply Input */}
          {replyingTo === comment.id && (
            <div className="mt-3 space-y-2">
              {/* Reply Emoji Picker */}
              {showReplyEmojiPicker && (
                <div className="emoji-picker bg-gray-800 border border-gray-600 rounded-lg p-2 max-h-24 overflow-y-auto">
                  <div className="grid grid-cols-10 gap-1">
                    {commonEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => addEmojiToReply(emoji)}
                        className="text-sm hover:bg-gray-700 rounded p-1 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <form 
                onSubmit={(e) => onSubmitReply(e, comment.id)}
                className="flex gap-2"
              >
                <div className="flex-1 relative">
                  <input
                    ref={replyInputRef}
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${getDisplayName(comment.user)}...`}
                    className="w-full bg-gray-800 text-white px-3 py-2 pr-8 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
                    disabled={submittingReply}
                  />
                  <button
                    type="button"
                    data-emoji-trigger
                    onClick={() => setShowReplyEmojiPicker(!showReplyEmojiPicker)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-400 transition-colors"
                  >
                    <Smile className="h-3 w-3" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!replyContent.trim() || submittingReply}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors text-sm"
                >
                  {submittingReply ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    'Reply'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null);
                    setShowReplyEmojiPicker(false);
                  }}
                  className="text-gray-400 hover:text-white px-2 py-2 transition-colors text-sm"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}
          
          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-2 border-l border-gray-700 pl-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onLike={() => handleLikeComment(reply.id)}
                  onReply={() => {
                    setReplyingTo(reply.id);
                    setTimeout(() => replyInputRef.current?.focus(), 100);
                  }}
                  replyingTo={replyingTo}
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                  onSubmitReply={onSubmitReply}
                  submittingReply={submittingReply}
                  replyInputRef={replyInputRef}
                  currentUser={currentUser}
                  isLiking={likingCommentId === reply.id}
                  getDisplayName={getDisplayName}
                  getAvatarUrl={getAvatarUrl}
                  handleLikeComment={handleLikeComment}
                  setReplyingTo={setReplyingTo}
                  likingCommentId={likingCommentId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoComments;