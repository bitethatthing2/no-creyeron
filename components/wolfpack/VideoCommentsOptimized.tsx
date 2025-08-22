'use client';

import * as React from 'react';
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
// Removed unused import: getZIndexClass
import { toast } from '@/components/ui/use-toast';
import { WolfpackService } from '@/lib/services/wolfpack';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

// Types
interface CommentUser {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  display_name?: string | null;
  username?: string | null;
  profile_image_url?: string | null;
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

interface Comment extends Omit<SupabaseComment, 'users' | 'replies'> {
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

interface UnifiedComment {
  id: string;
  user_id: string;
  video_id: string;
  content: string;
  created_at: string;
  parent_comment_id?: string | null;
  users?: CommentUser | null;
  user?: CommentUser | null;
  replies?: UnifiedComment[];
  like_count?: number;
  likes_count?: number;
  user_liked?: boolean;
}

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ToggleLikeResponse {
  success: boolean;
  action: "added" | "removed";
  user_has_liked: boolean;
  new_like_count: number;
}

// Convert unified service response to component format
const convertUnifiedComments = (unifiedComments: UnifiedComment[]): Comment[] => {
  return unifiedComments.map(comment => {
    // Get user data from either users or user field
    let userData: CommentUser;
    if (comment.users && typeof comment.users === 'object' && !Array.isArray(comment.users)) {
      userData = comment.users;
    } else if (comment.user && typeof comment.user === 'object') {
      userData = comment.user;
    } else {
      userData = {
        id: comment.user_id,
        first_name: 'Unknown',
        last_name: 'User'
      };
    }

    return {
      id: comment.id,
      user_id: comment.user_id,
      video_id: comment.video_id,
      content: comment.content,
      created_at: comment.created_at,
      parent_comment_id: comment.parent_comment_id,
      user: userData,
      replies: comment.replies ? convertUnifiedComments(comment.replies) : [],
      like_count: comment.like_count || comment.likes_count || 0,
      user_liked: comment.user_liked || false
    };
  });
};

// Common emojis for quick access
const commonEmojis = ['😀', '😂', '😍', '😢', '😮', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉', '😎', '🤔', '😊', '💀', '🙄', '😱', '🤣', '🥺'];

// Main component
function VideoComments({ 
  postId, 
  isOpen, 
  onClose, 
  initialCommentCount, 
  onCommentCountChange 
}: VideoCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [newComment, setNewComment] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
  const [replyContent, setReplyContent] = React.useState('');
  const [submittingReply, setSubmittingReply] = React.useState(false);
  const [commentCount, setCommentCount] = React.useState(initialCommentCount);
  const [likingCommentId, setLikingCommentId] = React.useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = React.useState(false);
  
  const channelRef = React.useRef<RealtimeChannel | null>(null);
  const mountedRef = React.useRef(true);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const replyInputRef = React.useRef<HTMLInputElement>(null);
  const loadedPostIdRef = React.useRef<string | null>(null);

  // Helper function to calculate total comments including replies
  const calculateTotalComments = (commentsList: Comment[]): number => {
    const countComments = (commentList: Comment[]): number => {
      return commentList.reduce((count, comment) => {
        return count + 1 + countComments(comment.replies || []);
      }, 0);
    };
    return countComments(commentsList);
  };

  // Helper function to update comment in tree structure
  const updateCommentInTree = React.useCallback((commentsList: Comment[], commentId: string, updates: Partial<Comment>): Comment[] => {
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

  // Reset mounted ref when component opens
  React.useEffect(() => {
    if (isOpen) {
      mountedRef.current = true;
    }
  }, [isOpen]);

  // Initial load and subscription setup
  React.useEffect(() => {
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
        const response = await WolfpackService.social.getCommentsWithLikes(postId);
        
        if (response.success && mountedRef.current) {
          const commentsData = convertUnifiedComments(response.data || []);
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
            table: 'content_comments',
            filter: `video_id=eq.${postId}`
          },
          () => {
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
          () => {
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
  }, [isOpen, postId, onCommentCountChange]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Close emoji pickers when clicking outside
  React.useEffect(() => {
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
  const handleSubmitComment = React.useCallback(async (e: React.FormEvent) => {
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

      const response = await WolfpackService.social.addComment(postId, newComment.trim());

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
  const handleSubmitReply = React.useCallback(async (e: React.FormEvent, parentCommentId: string) => {
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

      const response = await WolfpackService.social.addComment(postId, replyContent.trim(), parentCommentId);

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

  // Handle like/unlike comment
  const handleLikeComment = React.useCallback(async (commentId: string) => {
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
      const response = await WolfpackService.social.toggleCommentLike(commentId) as ServiceResponse<ToggleLikeResponse>;

      if (response.success && response.data) {
        // Update with actual server response
        const { user_has_liked, new_like_count } = response.data;
        setComments(prevComments => 
          updateCommentInTree(prevComments, commentId, {
            user_liked: user_has_liked,
            like_count: new_like_count
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

    } catch (error) {
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

  const getDisplayName = React.useCallback((userInfo: Comment['user']) => {
    if (!userInfo) return 'Anonymous';
    
    if (userInfo.display_name) return userInfo.display_name;
    if (userInfo.username) return `@${userInfo.username}`;
    
    const fullName = `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim();
    return fullName || 'Anonymous';
  }, []);

  const getAvatarUrl = React.useCallback((userInfo: Comment['user']) => {
    if (!userInfo) return '/icons/wolf-icon.png';
    return userInfo.avatar_url || '/icons/wolf-icon.png';
  }, []);

  // Add emoji to comment
  const addEmojiToComment = React.useCallback((emoji: string) => {
    setNewComment(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  }, []);

  // Add emoji to reply
  const addEmojiToReply = React.useCallback((emoji: string) => {
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
                showReplyEmojiPicker={showReplyEmojiPicker}
                setShowReplyEmojiPicker={setShowReplyEmojiPicker}
                addEmojiToReply={addEmojiToReply}
              />
            ))
          )}
        </div>

        <div className="border-t border-gray-800 bg-gray-900/95 backdrop-blur-sm p-3 pb-safe">
          {!user ? (
            <div className="text-center py-4">
              <p className="text-gray-400 mb-2">Sign in to comment</p>
              <button
                type="button"
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
                        aria-label={`Add ${emoji} emoji`}
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
                    aria-label="Add emoji"
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
  currentUser: User | null;
  isLiking: boolean;
  getDisplayName: (user: Comment['user']) => string;
  getAvatarUrl: (user: Comment['user']) => string;
  handleLikeComment: (commentId: string) => void;
  setReplyingTo: (id: string | null) => void;
  likingCommentId: string | null;
  showReplyEmojiPicker: boolean;
  setShowReplyEmojiPicker: (show: boolean) => void;
  addEmojiToReply: (emoji: string) => void;
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
  likingCommentId,
  showReplyEmojiPicker,
  setShowReplyEmojiPicker,
  addEmojiToReply
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
              type="button"
              onClick={onLike}
              disabled={isLiking}
              className={`flex items-center gap-1 text-xs transition-colors ${
                comment.user_liked 
                  ? 'text-red-500 hover:text-red-400' 
                  : 'text-gray-400 hover:text-red-400'
              } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={comment.user_liked ? 'Unlike comment' : 'Like comment'}
            >
              <Heart className={`h-4 w-4 ${comment.user_liked ? 'fill-current' : ''}`} />
              {comment.like_count > 0 && (
                <span>{comment.like_count}</span>
              )}
            </button>
            
            <button
              type="button"
              onClick={onReply}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400 transition-colors"
              aria-label="Reply to comment"
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
                        aria-label={`Add ${emoji} emoji to reply`}
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
                    aria-label="Add emoji to reply"
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
                  aria-label="Cancel reply"
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
                  showReplyEmojiPicker={showReplyEmojiPicker}
                  setShowReplyEmojiPicker={setShowReplyEmojiPicker}
                  addEmojiToReply={addEmojiToReply}
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