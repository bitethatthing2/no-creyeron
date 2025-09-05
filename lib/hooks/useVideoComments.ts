import { useMemo, useEffect, useCallback } from "react";
import { useDebounceValue, useToggle, useLocalStorage, useInterval } from 'usehooks-ts';
import { usePrevious } from './enhanced/usePrevious';
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "./useNotifications";

export interface VideoComment {
  id: string;
  user_id: string;
  video_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string | null;
  updated_at: string | null;
  is_deleted: boolean | null;
  is_edited: boolean | null;
  is_pinned: boolean | null;
  likes_count: number | null;
  user?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  replies?: VideoComment[];
}

interface CommentState {
  comments: VideoComment[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

// Dramatically simplified comments hook with usehooks-ts
export function useVideoComments(videoId: string, autoRefresh = true) {
  const { currentUser } = useAuth();
  const { sendNotification } = useNotifications();
  const [state, setState] = useLocalStorage<CommentState>(
    `comments-${videoId}`, 
    { comments: [], loading: false, error: null, hasMore: true }
  );
  const [isSubmitting, toggleSubmitting, setIsSubmitting] = useToggle(false);
  const [debouncedVideoId] = useDebounceValue(videoId, 100);
  const prevVideoId = usePrevious(debouncedVideoId);

  const loadComments = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      const { data, error } = await supabase
        .from('content_comments')
        .select(`
          *,
          user:users!content_comments_user_id_fkey (
            id, email, first_name, last_name, display_name, avatar_url
          )
        `)
        .eq('video_id', debouncedVideoId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Organize comments with replies
      const topLevelComments = data?.filter(c => !c.parent_comment_id) || [];
      const replies = data?.filter(c => c.parent_comment_id) || [];
      
      const commentsWithReplies = topLevelComments.map(comment => ({
        ...comment,
        replies: replies.filter(r => r.parent_comment_id === comment.id)
      }));

      setState({
        comments: commentsWithReplies,
        loading: false,
        error: null,
        hasMore: data?.length === 50
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load comments'
      }));
    }
  }, [debouncedVideoId, setState]);

  // Auto-load comments when videoId changes
  useEffect(() => {
    if (debouncedVideoId && debouncedVideoId !== prevVideoId) {
      loadComments();
    }
  }, [debouncedVideoId, prevVideoId, loadComments]);

  // Auto-refresh every 30 seconds if enabled
  useInterval(() => {
    if (autoRefresh && !state.loading) {
      loadComments(false);
    }
  }, 30000);

  const addComment = useCallback(async (content: string, parentId?: string) => {
    if (!currentUser?.id || !content.trim()) return;

    setIsSubmitting(true);
    
    // Optimistic update
    const tempComment: VideoComment = {
      id: `temp-${Date.now()}`,
      user_id: currentUser.id,
      video_id: debouncedVideoId,
      parent_comment_id: parentId || null,
      content: content.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      is_edited: false,
      is_pinned: false,
      likes_count: 0,
      user: {
        id: currentUser.id,
        email: currentUser.email || '',
        first_name: currentUser.firstName || null,
        last_name: currentUser.lastName || null,
        display_name: currentUser.displayName || null,
        avatar_url: currentUser.avatarUrl || null,
      }
    };

    // Add optimistically
    if (parentId) {
      setState(prev => ({
        ...prev,
        comments: prev.comments.map(c => 
          c.id === parentId 
            ? { ...c, replies: [...(c.replies || []), tempComment] }
            : c
        )
      }));
    } else {
      setState(prev => ({
        ...prev,
        comments: [tempComment, ...prev.comments]
      }));
    }

    try {
      const { error } = await supabase
        .from('content_comments')
        .insert({
          user_id: currentUser.id,
          video_id: debouncedVideoId,
          parent_comment_id: parentId || null,
          content: content.trim(),
        });

      if (error) throw error;

      // Send notification to post owner (for top-level comments) or comment author (for replies)
      try {
        if (parentId) {
          // Reply notification - notify the original commenter
          const parentComment = state.comments.find(c => c.id === parentId);
          if (parentComment?.user_id && parentComment.user_id !== currentUser.id) {
            const commenterName = currentUser.displayName || currentUser.firstName || 'Someone';
            await sendNotification(
              [parentComment.user_id],
              `New reply from ${commenterName}`,
              content.trim(),
              { videoId: debouncedVideoId }
            );
          }
        } else {
          // Top-level comment notification - notify post owner
          const { data: post } = await supabase
            .from('content_posts')
            .select('user_id, thumbnail_url')
            .eq('id', debouncedVideoId)
            .single();

          if (post?.user_id && post.user_id !== currentUser.id) {
            const commenterName = currentUser.displayName || currentUser.firstName || 'Someone';
            await sendNotification(
              [post.user_id],
              `New comment from ${commenterName}`,
              content.trim(),
              { videoId: debouncedVideoId, thumbnailUrl: post.thumbnail_url }
            );
          }
        }
      } catch (notifError) {
        console.error('Failed to send comment notification:', notifError);
        // Don't fail the comment if notification fails
      }

      // Refresh to get real data
      await loadComments(false);
    } catch (err) {
      // Remove optimistic update on error
      if (parentId) {
        setState(prev => ({
          ...prev,
          comments: prev.comments.map(c => 
            c.id === parentId 
              ? { ...c, replies: c.replies?.filter(r => r.id !== tempComment.id) || [] }
              : c
          ),
          error: err instanceof Error ? err.message : 'Failed to add comment'
        }));
      } else {
        setState(prev => ({
          ...prev,
          comments: prev.comments.filter(c => c.id !== tempComment.id),
          error: err instanceof Error ? err.message : 'Failed to add comment'
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [currentUser, debouncedVideoId, setState, setIsSubmitting, loadComments, sendNotification, state.comments]);

  return {
    ...state,
    isSubmitting,
    loadComments,
    addComment,
    refreshComments: () => loadComments(false)
  };
}