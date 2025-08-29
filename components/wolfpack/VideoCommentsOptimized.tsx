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
import { toast } from '@/components/ui/use-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ContentComment, User } from '@/types/supabase';

// Types
interface CommentWithUser extends ContentComment {
  user?: User;
  replies?: CommentWithUser[];
  likes_count?: number;
  user_has_liked?: boolean;
}

interface VideoCommentsProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  initialCommentCount: number;
  onCommentCountChange?: (count: number) => void;
}

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
  const { currentUser } = useAuth();
  const [comments, setComments] = React.useState<CommentWithUser[]>([]);
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

  // Helper function to calculate total comments including replies
  const calculateTotalComments = (commentsList: CommentWithUser[]): number => {
    const countComments = (list: CommentWithUser[]): number => {
      return list.reduce((count, comment) => {
        return count + 1 + countComments(comment.replies || []);
      }, 0);
    };
    return countComments(commentsList);
  };

  // Load comments
  const loadComments = React.useCallback(async () => {
    if (!postId) return;

    try {
      setLoading(true);
      
      // Get comments with user data
      const { data: commentsData, error } = await supabase
        .from('content_comments')
        .select(`
          *,
          user:users(
            id,
            username,
            display_name,
            first_name,
            last_name,
            avatar_url,
            profile_image_url
          )
        `)
        .eq('video_id', postId)
        .is('parent_comment_id', null)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load replies for each comment
      const commentsWithReplies = await Promise.all((commentsData || []).map(async (comment) => {
        const { data: replies } = await supabase
          .from('content_comments')
          .select(`
            *,
            user:users(
              id,
              username,
              display_name,
              first_name,
              last_name,
              avatar_url,
              profile_image_url
            )
          `)
          .eq('parent_comment_id', comment.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        // Check if current user has liked this comment
        let userHasLiked = false;
        if (currentUser) {
          const { data: likeData } = await supabase
            .from('content_interactions')
            .select('id')
            .eq('content_id', comment.id)
            .eq('user_id', currentUser.id)
            .eq('interaction_type', 'like')
            .maybeSingle();
          
          userHasLiked = !!likeData;
        }

        return {
          ...comment,
          replies: replies || [],
          user_has_liked: userHasLiked
        };
      }));

      setComments(commentsWithReplies);
      const totalCount = calculateTotalComments(commentsWithReplies);
      setCommentCount(totalCount);
      
      if (onCommentCountChange) {
        onCommentCountChange(totalCount);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [postId, currentUser, onCommentCountChange]);

  // Setup real-time subscription
  React.useEffect(() => {
    if (!isOpen || !postId) return;

    loadComments();

    // Setup real-time subscription
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
          // Reload comments on any change
          if (mountedRef.current) {
            loadComments();
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [isOpen, postId, loadComments]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Submit new comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting || !currentUser) return;

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('content_comments')
        .insert({
          video_id: postId,
          user_id: currentUser.id,
          content: newComment.trim(),
          is_deleted: false,
          is_edited: false,
          is_pinned: false,
          likes_count: 0
        });

      if (error) throw error;

      // Update comment count on the post
      const { error: updateError } = await supabase
        .from('content_posts')
        .update({ 
          comments_count: commentCount + 1 
        })
        .eq('id', postId);

      if (updateError) console.error('Error updating comment count:', updateError);

      setNewComment('');
      toast({
        title: 'Success',
        description: 'Comment posted!',
      });

      // Reload comments
      loadComments();

    } catch (error: any) {
      console.error('Error submitting comment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to post comment',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit reply
  const handleSubmitReply = async (e: React.FormEvent, parentCommentId: string) => {
    e.preventDefault();
    if (!replyContent.trim() || submittingReply || !currentUser) return;

    try {
      setSubmittingReply(true);

      const { error } = await supabase
        .from('content_comments')
        .insert({
          video_id: postId,
          user_id: currentUser.id,
          content: replyContent.trim(),
          parent_comment_id: parentCommentId,
          is_deleted: false,
          is_edited: false,
          is_pinned: false,
          likes_count: 0
        });

      if (error) throw error;

      setReplyContent('');
      setReplyingTo(null);
      
      toast({
        title: 'Success',
        description: 'Reply posted!',
      });

      // Reload comments
      loadComments();

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
  };

  // Handle like/unlike comment
  const handleLikeComment = async (commentId: string, currentLikeStatus: boolean) => {
    if (!currentUser) {
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

      if (currentLikeStatus) {
        // Unlike - remove interaction
        const { error } = await supabase
          .from('content_interactions')
          .delete()
          .eq('content_id', commentId)
          .eq('user_id', currentUser.id)
          .eq('interaction_type', 'like');

        if (error) throw error;

        // Update likes count
        const { data: commentData } = await supabase
          .from('content_comments')
          .select('likes_count')
          .eq('id', commentId)
          .single();

        if (commentData) {
          await supabase
            .from('content_comments')
            .update({ 
              likes_count: Math.max(0, (commentData.likes_count || 1) - 1)
            })
            .eq('id', commentId);
        }
      } else {
        // Like - add interaction
        const { error } = await supabase
          .from('content_interactions')
          .insert({
            content_id: commentId,
            user_id: currentUser.id,
            interaction_type: 'like'
          });

        if (error && error.code !== '23505') throw error; // Ignore duplicate key errors

        // Update likes count
        const { data: commentData } = await supabase
          .from('content_comments')
          .select('likes_count')
          .eq('id', commentId)
          .single();

        if (commentData) {
          await supabase
            .from('content_comments')
            .update({ 
              likes_count: (commentData.likes_count || 0) + 1
            })
            .eq('id', commentId);
        }
      }

      // Reload comments to reflect changes
      loadComments();

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
  };

  const getDisplayName = (user?: User) => {
    if (!user) return 'Anonymous';
    
    if (user.display_name) return user.display_name;
    if (user.username) return `@${user.username}`;
    
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || 'Anonymous';
  };

  const getAvatarUrl = (user?: User) => {
    if (!user) return '/icons/wolf-icon.png';
    return user.avatar_url || user.profile_image_url || '/icons/wolf-icon.png';
  };

  // Add emoji handlers
  const addEmojiToComment = (emoji: string) => {
    setNewComment(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const addEmojiToReply = (emoji: string) => {
    setReplyContent(prev => prev + emoji);
    setShowReplyEmojiPicker(false);
    replyInputRef.current?.focus();
  };

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
                onLike={() => handleLikeComment(comment.id, comment.user_has_liked || false)}
                onReply={() => setReplyingTo(comment.id)}
                replyingTo={replyingTo}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                onSubmitReply={handleSubmitReply}
                submittingReply={submittingReply}
                replyInputRef={replyInputRef}
                isLiking={likingCommentId === comment.id}
                getDisplayName={getDisplayName}
                getAvatarUrl={getAvatarUrl}
                handleLikeComment={handleLikeComment}
                setReplyingTo={setReplyingTo}
                showReplyEmojiPicker={showReplyEmojiPicker}
                setShowReplyEmojiPicker={setShowReplyEmojiPicker}
                addEmojiToReply={addEmojiToReply}
              />
            ))
          )}
        </div>

        {/* Comment Input */}
        <div className="border-t border-gray-800 bg-gray-900/95 backdrop-blur-sm p-3 pb-safe">
          {!currentUser ? (
            <div className="text-center py-4">
              <p className="text-gray-400 mb-2">Sign in to comment</p>
              <button
                onClick={() => window.location.href = '/login'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitComment} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Simplified CommentItem component
interface CommentItemProps {
  comment: CommentWithUser;
  onLike: () => void;
  onReply: () => void;
  replyingTo: string | null;
  replyContent: string;
  setReplyContent: (content: string) => void;
  onSubmitReply: (e: React.FormEvent, parentCommentId: string) => void;
  submittingReply: boolean;
  replyInputRef: React.RefObject<HTMLInputElement>;
  isLiking: boolean;
  getDisplayName: (user?: User) => string;
  getAvatarUrl: (user?: User) => string;
  handleLikeComment: (id: string, currentStatus: boolean) => void;
  setReplyingTo: (id: string | null) => void;
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
  isLiking,
  getDisplayName,
  getAvatarUrl,
  setReplyingTo
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
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
          <Image
            src={getAvatarUrl(comment.user)}
            alt={getDisplayName(comment.user)}
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white text-sm">
              {getDisplayName(comment.user)}
            </span>
            <span className="text-gray-400 text-xs">
              {formatTimeAgo(comment.created_at)}
            </span>
          </div>
          
          <p className="text-gray-100 text-sm">{comment.content}</p>
          
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={onLike}
              disabled={isLiking}
              className={`flex items-center gap-1 text-xs ${
                comment.user_has_liked ? 'text-red-500' : 'text-gray-400'
              } hover:text-red-400`}
            >
              <Heart className={`h-4 w-4 ${comment.user_has_liked ? 'fill-current' : ''}`} />
              {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
            </button>
            
            <button
              onClick={onReply}
              className="text-xs text-gray-400 hover:text-blue-400"
            >
              <ReplyIcon className="h-4 w-4 inline mr-1" />
              Reply
            </button>
          </div>
          
          {/* Reply Input */}
          {replyingTo === comment.id && (
            <form onSubmit={(e) => onSubmitReply(e, comment.id)} className="mt-3 flex gap-2">
              <input
                ref={replyInputRef}
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Reply to ${getDisplayName(comment.user)}...`}
                className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 text-sm"
                disabled={submittingReply}
                autoFocus
              />
              <button
                type="submit"
                disabled={!replyContent.trim() || submittingReply}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm"
              >
                Reply
              </button>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-gray-400 hover:text-white px-2"
              >
                Cancel
              </button>
            </form>
          )}
          
          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-2 pl-4 border-l border-gray-700">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onLike={() => handleLikeComment(reply.id, reply.user_has_liked || false)}
                  onReply={() => setReplyingTo(reply.id)}
                  replyingTo={replyingTo}
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                  onSubmitReply={onSubmitReply}
                  submittingReply={submittingReply}
                  replyInputRef={replyInputRef}
                  isLiking={false}
                  getDisplayName={getDisplayName}
                  getAvatarUrl={getAvatarUrl}
                  handleLikeComment={handleLikeComment}
                  setReplyingTo={setReplyingTo}
                  showReplyEmojiPicker={false}
                  setShowReplyEmojiPicker={() => {}}
                  addEmojiToReply={() => {}}
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