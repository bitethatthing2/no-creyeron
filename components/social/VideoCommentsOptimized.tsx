'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Heart, Pin, Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import { useVideoComments, VideoComment } from '@/lib/hooks/useVideoComments';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface VideoCommentsProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  initialCommentCount?: number;
  onCommentCountChange?: (count: number) => void;
}

export default function VideoComments({
  postId,
  isOpen,
  onClose,
  initialCommentCount = 0,
  onCommentCountChange
}: VideoCommentsProps) {
  const { currentUser } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showOptions, setShowOptions] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const {
    comments,
    loading,
    error,
    hasMore,
    totalCount,
    addComment,
    editComment,
    deleteComment,
    pinComment,
    unpinComment,
    likeComment,
    loadMoreComments
  } = useVideoComments(postId);

  // Notify parent of comment count changes
  useEffect(() => {
    if (onCommentCountChange && totalCount !== initialCommentCount) {
      onCommentCountChange(totalCount);
    }
  }, [totalCount, onCommentCountChange, initialCommentCount]);

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

  const startEdit = (comment: VideoComment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
    setShowOptions(null);
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
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

  const renderComment = (comment: VideoComment, isReply = false) => {
    const isOwner = currentUser?.id === comment.user_id;
    const isEditing = editingComment === comment.id;
    const showingOptions = showOptions === comment.id;

    return (
      <div key={comment.id} className={cn('mb-4', isReply && 'ml-6 border-l border-gray-700 pl-4')}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            {comment.user?.avatar_url ? (
              <img 
                src={comment.user.avatar_url} 
                alt={comment.user.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              (comment.user?.username?.[0] || comment.user?.email?.[0] || 'U').toUpperCase()
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-medium text-sm">
                {comment.user?.display_name || comment.user?.username || 'Anonymous'}
              </span>
              <span className="text-gray-400 text-xs">
                {formatTimeAgo(comment.created_at || '')}
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
                  onClick={() => handleReply(comment.id)}
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
                        onClick={() => startEdit(comment)}
                        className="w-full text-left px-3 py-1 text-xs hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
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
        {comment.replies?.map(reply => renderComment(reply, true))}
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
            onClick={onClose}
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
                  onClick={loadMoreComments}
                  className="w-full text-center text-gray-400 hover:text-white py-2 text-sm"
                >
                  Load more comments...
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
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.username || ''}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (currentUser?.username?.[0] || currentUser?.email?.[0] || 'U').toUpperCase()
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
              className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-full border border-gray-600 focus:border-red-500 focus:outline-none text-sm"
            />
            
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              className={cn(
                'p-2 rounded-full transition-colors',
                newComment.trim()
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}