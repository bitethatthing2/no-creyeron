'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { X, Send, Heart, Pin, Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// Interface matching your actual database schema
interface ContentComment {
  id: string;
  user_id: string;
  video_id: string;
  parent_comment_id: string | null;
  content: string;
  is_pinned: boolean | null;
  is_edited: boolean | null;
  is_deleted: boolean | null;
  likes_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined user data
  user?: {
    id: string;
    username?: string;
    display_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    profile_image_url?: string;
    email?: string;
  };
  // Child comments
  replies?: ContentComment[];
}

interface VideoCommentsProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  initialCommentCount?: number;
  onCommentCountChange?: (count: number) => void;
}

export default function VideoCommentsOptimized({
  postId,
  isOpen,
  onClose,
  initialCommentCount = 0,
  onCommentCountChange
}: VideoCommentsProps) {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<ContentComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(initialCommentCount);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;
  
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showOptions, setShowOptions] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  const updateCommentInTree = (comments: ContentComment[], updated: ContentComment): ContentComment[] => {
    return comments.map(comment => {
      if (comment.id === updated.id) {
        return { ...comment, ...updated, user: comment.user }; // Preserve user data
      }
      if (comment.replies) {
        return { ...comment, replies: updateCommentInTree(comment.replies, updated) };
      }
      return comment;
    });
  };

  // Subscribe to real-time comment updates
  const subscribeToComments = useCallback(() => {
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'content_comments',
          filter: `video_id=eq.${postId}`
        },
        async (payload) => {
          if (payload.new) {
            const newComment = payload.new as ContentComment;
            
            // Fetch user data for the new comment
            const { data: userData } = await supabase
              .from('users')
              .select('id, username, display_name, first_name, last_name, avatar_url, profile_image_url, email')
              .eq('id', newComment.user_id)
              .single();

            const commentWithUser: ContentComment = { ...newComment, user: userData || undefined };

            if (newComment.parent_comment_id) {
              // Add as reply
              setComments(prev => prev.map(comment => 
                comment.id === newComment.parent_comment_id
                  ? { ...comment, replies: [...(comment.replies || []), commentWithUser] }
                  : comment
              ));
            } else {
              // Add as top-level comment
              setComments(prev => [commentWithUser, ...prev]);
            }
            
            setTotalCount(prev => prev + 1);
            if (onCommentCountChange) {
              onCommentCountChange(totalCount + 1);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'content_comments',
          filter: `video_id=eq.${postId}`
        },
        (payload) => {
          if (payload.new) {
            const updated = payload.new as ContentComment;
            setComments(prev => updateCommentInTree(prev, updated));
          }
        }
      )
      .subscribe();

    return channel;
  }, [postId, onCommentCountChange, totalCount]);

  const loadComments = useCallback(async (loadMore = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentOffset = loadMore ? offset : 0;

      // Load top-level comments with user data
      const { data: commentsData, error: commentsError, count } = await supabase
        .from('content_comments')
        .select(`
          *,
          user:users!user_id(
            id,
            username,
            display_name,
            first_name,
            last_name,
            avatar_url,
            profile_image_url,
            email
          )
        `, { count: 'exact' })
        .eq('video_id', postId)
        .is('parent_comment_id', null)
        .eq('is_deleted', false)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + limit - 1);

      if (commentsError) throw commentsError;

      // Load replies for each comment
      if (commentsData && commentsData.length > 0) {
        const commentIds = commentsData.map(c => c.id);
        
        const { data: repliesData, error: repliesError } = await supabase
          .from('content_comments')
          .select(`
            *,
            user:users!user_id(
              id,
              username,
              display_name,
              first_name,
              last_name,
              avatar_url,
              profile_image_url,
              email
            )
          `)
          .in('parent_comment_id', commentIds)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        if (repliesError) throw repliesError;

        // Organize replies under their parent comments
        const commentsWithReplies = commentsData.map(comment => ({
          ...comment,
          replies: repliesData?.filter(reply => reply.parent_comment_id === comment.id) || []
        }));

        if (loadMore) {
          setComments(prev => [...prev, ...commentsWithReplies]);
        } else {
          setComments(commentsWithReplies);
        }
      } else if (!loadMore) {
        setComments([]);
      }

      // Update pagination state
      setTotalCount(count || 0);
      setHasMore((count || 0) > currentOffset + limit);
      setOffset(currentOffset + limit);
      
      if (onCommentCountChange && count !== undefined) {
        onCommentCountChange(count ?? 0);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [postId, offset, limit, onCommentCountChange]);

  // Load comments when modal opens
  useEffect(() => {
    if (isOpen && postId) {
      loadComments();
      const subscription = subscribeToComments();
      subscriptionRef.current = subscription;
    }

    return () => {
      // Cleanup subscription when modal closes
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [isOpen, postId, loadComments, subscribeToComments]);

  const loadMoreComments = () => {
    loadComments(true);
  };

  const addComment = async (content: string, parentCommentId: string | null = null) => {
    if (!content.trim() || !currentUser?.id) return false;

    try {
      setSubmitting(true);
      
      // Use the RPC function for adding comments
      const { error } = await supabase.rpc('add_comment', {
        p_video_id: postId,
        p_content: content.trim(),
        p_parent_comment_id: parentCommentId
      });

      if (error) {
        // Fallback to direct insert if RPC fails
        const { error: insertError } = await supabase
          .from('content_comments')
          .insert({
            video_id: postId,
            user_id: currentUser.id,
            content: content.trim(),
            parent_comment_id: parentCommentId
          });

        if (insertError) throw insertError;
      }

      // Comment will be added via real-time subscription
      return true;
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const editComment = async (commentId: string, newContent: string) => {
    if (!newContent.trim() || !currentUser?.id) return false;

    try {
      setSubmitting(true);
      
      const { error } = await supabase
        .from('content_comments')
        .update({
          content: newContent.trim(),
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', currentUser.id); // Ensure user owns the comment

      if (error) throw error;

      // Update will be reflected via real-time subscription
      return true;
    } catch (err) {
      console.error('Error editing comment:', err);
      setError('Failed to edit comment');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!currentUser?.id) return false;

    try {
      setSubmitting(true);
      
      // Soft delete
      const { error } = await supabase
        .from('content_comments')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', currentUser.id); // Ensure user owns the comment

      if (error) throw error;

      // Remove from UI immediately
      setComments(prev => prev.filter(c => c.id !== commentId).map(c => ({
        ...c,
        replies: c.replies?.filter(r => r.id !== commentId)
      })));
      
      setTotalCount(prev => Math.max(0, prev - 1));
      if (onCommentCountChange) {
        onCommentCountChange(Math.max(0, totalCount - 1));
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const likeComment = async (commentId: string) => {
    // TODO: Implement like functionality if you have a likes table
    console.log('Like comment:', commentId);
  };

  // Focus input when replying
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  // Handle backdrop click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submitting) return;

    const success = await addComment(newComment, replyingTo);
    if (success) {
      setNewComment('');
      setReplyingTo(null);
    }
  };

  const handleEditSubmit = async (commentId: string) => {
    if (!editContent.trim() || submitting) return;

    const success = await editComment(commentId, editContent);
    if (success) {
      setEditingComment(null);
      setEditContent('');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await deleteComment(commentId);
    }
    setShowOptions(null);
  };

  const startEdit = (comment: ContentComment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
    setShowOptions(null);
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    setShowOptions(null);
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'now';
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return `${Math.floor(seconds / 604800)}w`;
  };

  const getUserDisplayName = (user?: ContentComment['user']) => {
    if (!user) return 'Anonymous';
    
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return user.display_name || fullName || user.username || 'Anonymous';
  };

  const getUserAvatar = (user?: ContentComment['user']) => {
    return user?.avatar_url || user?.profile_image_url || 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png';
  };

  const getUserInitial = (user?: ContentComment['user']) => {
    if (!user) return 'U';
    
    const name = getUserDisplayName(user);
    return name[0].toUpperCase();
  };

  const renderComment = (comment: ContentComment, isReply = false) => {
    const isOwner = currentUser?.id === comment.user_id;
    const isEditing = editingComment === comment.id;
    const showingOptions = showOptions === comment.id;

    return (
      <div key={comment.id} className={cn('mb-4', isReply && 'ml-8 border-l border-gray-700 pl-4')}>
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0 overflow-hidden">
            {getUserAvatar(comment.user) !== 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png' ? (
              <Image
                src={getUserAvatar(comment.user)}
                alt={getUserDisplayName(comment.user)}
                className="w-full h-full object-cover"
                width={32}
                height={32}
                unoptimized
              />
            ) : (
              getUserInitial(comment.user)
            )}
          </div>
          {/* Comment content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-medium text-sm">
                {getUserDisplayName(comment.user)}
              </span>
              <span className="text-gray-400 text-xs">
                {formatTimeAgo(comment.created_at)}
              </span>
              {comment.is_pinned && (
                <Pin className="w-3 h-3 text-yellow-500" />
              )}
              {comment.is_edited && (
                <span className="text-gray-500 text-xs">(edited)</span>
              )}
            </div>
            
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  autoComplete="off"
                  placeholder="Edit your comment"
                  title="Edit your comment"
                  className="flex-1 bg-gray-800 text-white text-sm px-3 py-1 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleEditSubmit(comment.id);
                    } else if (e.key === 'Escape') {
                      setEditingComment(null);
                      setEditContent('');
                    }
                  }}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => handleEditSubmit(comment.id)}
                  disabled={submitting}
                  aria-label="Save edited comment"
                  className="text-red-500 hover:text-red-400 p-1 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="text-gray-200 text-sm mb-2 break-words">
                {comment.content}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <button
                type="button"
                onClick={() => likeComment(comment.id)}
                aria-label="Like comment"
                className="flex items-center gap-1 hover:text-red-500 transition-colors"
              >
                <Heart className="w-3 h-3" />
                {comment.likes_count || 0}
              </button>
              
              {!isReply && (
                <button
                  type="button"
                  onClick={() => handleReply(comment.id)}
                  className="hover:text-white transition-colors"
                >
                  Reply
                </button>
              )}
              
              {isOwner && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowOptions(showingOptions ? null : comment.id)}
                    aria-label="Comment options"
                    className="hover:text-white transition-colors p-1"
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </button>
                  
                  {showingOptions && (
                    <div className="absolute bottom-full right-0 mb-1 bg-gray-800 border border-gray-600 rounded-lg py-1 shadow-lg z-10 min-w-[100px]">
                      <button
                        type="button"
                        onClick={() => startEdit(comment)}
                        className="w-full text-left px-3 py-1 text-xs hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="w-full text-left px-3 py-1 text-xs hover:bg-gray-700 text-red-400 flex items-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Render replies */}
        {(comment.replies ?? []).length > 0 && (
          <div className="mt-3">
            {(comment.replies ?? []).map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div 
        ref={modalRef}
        className="bg-gray-900 w-full max-w-lg h-[70vh] sm:h-[80vh] flex flex-col rounded-t-lg sm:rounded-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-white font-semibold">
            Comments ({totalCount})
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comments"
            className="text-gray-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && comments.length === 0 ? (
            <div className="text-gray-400 text-center py-8">Loading comments...</div>
          ) : error ? (
            <div className="text-red-400 text-center py-8">{error}</div>
          ) : comments.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <>
              {comments.map(comment => renderComment(comment))}
              
              {hasMore && (
                <button
                  type="button"
                  onClick={loadMoreComments}
                  disabled={loading}
                  className="w-full text-center text-gray-400 hover:text-white py-2 text-sm disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load more comments...'}
                </button>
              )}
            </>
          )}
        </div>
        
        {/* Input */}
        <div className="p-4 border-t border-gray-700">
          {replyingTo && (
            <div className="flex items-center justify-between mb-2 text-xs text-gray-400">
              <span>Replying to comment</span>
              <button type="button" onClick={() => setReplyingTo(null)} className="text-red-500">
                Cancel
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0 overflow-hidden">
              {currentUser?.avatarUrl && currentUser.avatarUrl !== 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png' ? (
                <Image
                  src={currentUser.avatarUrl}
                  alt={currentUser.username || ''}
                  className="w-full h-full object-cover"
                  width={32}
                  height={32}
                  unoptimized
                />
              ) : (
                getUserInitial({
                  username: currentUser?.username,
                  email: currentUser?.email
                } as ContentComment['user'])
              )}
            </div>
            
            <input
              ref={inputRef}
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
              disabled={submitting}
              className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-full border border-gray-600 focus:border-red-500 focus:outline-none text-sm disabled:opacity-50"
            />
            
            <button
              type="button"
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
              aria-label="Submit comment"
              className={cn(
                'p-2 rounded-full transition-colors',
                newComment.trim() && !submitting
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              )}
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}