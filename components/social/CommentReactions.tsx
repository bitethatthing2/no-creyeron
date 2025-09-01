'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Send, Heart, Pin, Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// CORRECT TYPE based on actual backend
interface VideoComment {
  id: string;
  video_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  is_pinned: boolean;
  is_edited: boolean;
  is_deleted: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
  // User data from join
  user?: {
    id: string;
    username: string | null;
    display_name: string | null;
    first_name?: string | null;
    last_name?: string | null;
    avatar_url: string | null;
    profile_image_url?: string | null;
  };
  // Replies are child comments
  replies?: VideoComment[];
}

interface VideoCommentsProps {
  postId: string;  // This is actually video_id in the backend
  isOpen: boolean;
  onCloseAction: () => void;
  onCommentCountChange?: (count: number) => void;
}

export default function VideoComments({
  postId,
  isOpen,
  onCloseAction,
  onCommentCountChange,
}: VideoCommentsProps) {
  const { currentUser } = useAuth();
  const supabase = createClient();
  
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showOptions, setShowOptions] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;
  
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load comments
  const loadComments = React.useCallback(
    async (reset = false) => {
      if (loading) return;
      setLoading(true);
      setError(null);

      try {
        const currentOffset = reset ? 0 : offset;
        
        // Fetch comments with user data
        const { data: commentsData, error: fetchError } = await supabase
          .from('content_comments')
          .select(`
            *,
            user:users!user_id (
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
          .eq('is_deleted', false)
          .is('parent_comment_id', null)  // Only get top-level comments
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .range(currentOffset, currentOffset + limit - 1);

        if (fetchError) throw fetchError;

        // Fetch replies for each comment
        const commentsWithReplies = await Promise.all(
          (commentsData || []).map(async (comment) => {
            const { data: replies } = await supabase
              .from('content_comments')
              .select(`
                *,
                user:users!user_id (
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

            return {
              ...comment,
              replies: replies || []
            };
          })
        );

        if (reset) {
          setComments(commentsWithReplies);
          setOffset(limit);
        } else {
          setComments(prev => [...prev, ...commentsWithReplies]);
          setOffset(prev => prev + limit);
        }

        setHasMore(commentsData?.length === limit);
        
        // Update count
        if (onCommentCountChange) {
          const { count } = await supabase
            .from('content_comments')
            .select('*', { count: 'exact', head: true })
            .eq('video_id', postId)
            .eq('is_deleted', false);
          
          if (count !== null) onCommentCountChange(count);
        }
      } catch (err) {
        console.error('Error loading comments:', err);
        setError('Failed to load comments');
      } finally {
        setLoading(false);
      }
    },
    [loading, offset, supabase, postId, limit, onCommentCountChange]
  );

  // Load comments when modal opens
  useEffect(() => {
    if (isOpen && comments.length === 0) {
      loadComments(true);
    }
  }, [isOpen, comments.length, loadComments]);

  // Handle backdrop click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onCloseAction();
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
  }, [isOpen, onCloseAction]);

  // Add comment using the backend function
  const addComment = async (content: string, parentId: string | null = null) => {
    if (!currentUser) {
      setError('Please sign in to comment');
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('add_comment', {
        p_video_id: postId,
        p_content: content,
        p_parent_comment_id: parentId
      });

      if (error) throw error;

      if (data?.success && data.comment) {
        // Refresh comments to show the new one
        await loadComments(true);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
      return false;
    }
  };

  // Edit comment
  const editComment = async (commentId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('content_comments')
        .update({ 
          content,
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) throw error;

      // Update local state
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, content, is_edited: true };
        }
        // Check replies
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply =>
              reply.id === commentId
                ? { ...reply, content, is_edited: true }
                : reply
            )
          };
        }
        return comment;
      }));

      return true;
    } catch (err) {
      console.error('Error editing comment:', err);
      setError('Failed to edit comment');
      return false;
    }
  };

  // Delete comment (soft delete)
  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('content_comments')
        .update({ is_deleted: true })
        .eq('id', commentId);

      if (error) throw error;

      // Remove from local state
      setComments(prev => prev.filter(c => c.id !== commentId).map(comment => ({
        ...comment,
        replies: comment.replies?.filter(r => r.id !== commentId)
      })));

      // Update post comment count
      await supabase.rpc('increment', {
        table_name: 'content_posts',
        row_id: postId,
        column_name: 'comments_count',
        increment_value: -1
      });

      return true;
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
      return false;
    }
  };

  // Toggle pin status
  const togglePin = async (commentId: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('content_comments')
        .update({ is_pinned: !currentPinned })
        .eq('id', commentId);

      if (error) throw error;

      // Refresh to reorder with pinned at top
      await loadComments(true);
      return true;
    } catch (err) {
      console.error('Error toggling pin:', err);
      return false;
    }
  };

  // Like comment (just increment the count)
  const likeComment = async (commentId: string) => {
    try {
      // Since there's no likes table, we just increment the count
      // In a real app, you'd want a separate likes table to track who liked what
      const { error } = await supabase.rpc('increment', {
        table_name: 'content_comments',
        row_id: commentId,
        column_name: 'likes_count',
        increment_value: 1
      });

      if (!error) {
        // Update local state
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, likes_count: (comment.likes_count || 0) + 1 };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.id === commentId
                  ? { ...reply, likes_count: (reply.likes_count || 0) + 1 }
                  : reply
              )
            };
          }
          return comment;
        }));
      }
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    const success = await addComment(newComment, replyingTo);
    if (success) {
      setNewComment('');
      setReplyingTo(null);
    }
  };

  const handleEditSubmit = async (commentId: string) => {
    if (!editContent.trim()) return;

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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const getUserDisplayName = (user: VideoComment['user']): string => {
    if (!user) return 'Anonymous';
    if (user.display_name) return user.display_name;
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    if (fullName) return fullName;
    if (user.username) return user.username;
    return 'Wolf Pack Member';
  };

  const getUserAvatar = (user: VideoComment['user']): string | null => {
    if (!user) return null;
    return user.avatar_url || user.profile_image_url || null;
  };

  const renderComment = (comment: VideoComment, isReply = false) => {
    // Check if current user owns the comment
    // currentUser might have databaseId or id field
    const isOwner = currentUser && (
      comment.user_id === currentUser.id
    );
    
    const isEditing = editingComment === comment.id;
    const showingOptions = showOptions === comment.id;
    const displayName = getUserDisplayName(comment.user);
    const avatar = getUserAvatar(comment.user);

    return (
      <div key={comment.id} className={cn('mb-4', isReply && 'ml-6 border-l border-gray-700 pl-4')}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            {avatar ? (
              <Image
                src={avatar}
                alt={displayName}
                width={32}
                height={32}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              displayName[0].toUpperCase()
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-medium text-sm">
                {displayName}
              </span>
              <span className="text-gray-400 text-xs">
                {formatTimeAgo(comment.created_at)}
              </span>
              {comment.is_pinned && (
                <Pin className="w-3 h-3 text-yellow-500 fill-yellow-500" />
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
                />
                <button
                  onClick={() => handleEditSubmit(comment.id)}
                  className="text-red-500 hover:text-red-400 p-1"
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
                onClick={() => likeComment(comment.id)}
                className="flex items-center gap-1 hover:text-red-500 transition-colors"
              >
                <Heart className="w-3 h-3" />
                {comment.likes_count || 0}
              </button>
              
              {!isReply && (
                <button
                  onClick={() => {
                    setReplyingTo(comment.id);
                    setShowOptions(null);
                  }}
                  className="hover:text-white transition-colors"
                >
                  Reply
                </button>
              )}
              
              {isOwner && (
                <div className="relative">
                  <button
                    onClick={() => setShowOptions(showingOptions ? null : comment.id)}
                    className="hover:text-white transition-colors p-1"
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </button>
                  
                  {showingOptions && (
                    <div className="absolute bottom-full right-0 mb-1 bg-gray-800 border border-gray-600 rounded-lg py-1 shadow-lg z-10 min-w-[100px]">
                      <button
                        onClick={() => {
                          setEditingComment(comment.id);
                          setEditContent(comment.content);
                          setShowOptions(null);
                        }}
                        className="w-full text-left px-3 py-1 text-xs hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                      {!isReply && (
                        <button
                          onClick={() => {
                            togglePin(comment.id, comment.is_pinned);
                            setShowOptions(null);
                          }}
                          className="w-full text-left px-3 py-1 text-xs hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Pin className="w-3 h-3" />
                          {comment.is_pinned ? 'Unpin' : 'Pin'}
                        </button>
                      )}
                      <button
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
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  const totalCount = comments.reduce(
    (total, comment) => total + 1 + (comment.replies?.length || 0),
    0
  );

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
            onClick={onCloseAction}
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
                  onClick={() => loadComments()}
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
              <button onClick={() => setReplyingTo(null)} className="text-red-500">
                Cancel
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
              {currentUser?.avatarUrl ? (
                <Image
                  src={currentUser.avatarUrl}
                  alt="You"
                  width={32}
                  height={32}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (currentUser?.displayName?.[0] || currentUser?.username?.[0] || 'U').toUpperCase()
              )}
            </div>
            
            <input
              ref={inputRef}
              type="text"
              placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
              className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-full border border-gray-600 focus:border-red-500 focus:outline-none text-sm"
              disabled={!currentUser}
            />
            
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || !currentUser}
              className={cn(
                'p-2 rounded-full transition-colors',
                newComment.trim() && currentUser
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          
          {!currentUser && (
            <p className="text-gray-400 text-xs mt-2 text-center">
              Please sign in to comment
            </p>
          )}
        </div>
      </div>
    </div>
  );
}