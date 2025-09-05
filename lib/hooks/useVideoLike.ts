import { useMemo, useEffect, useCallback } from "react";
import { useDebounceValue, useToggle, useLocalStorage } from 'usehooks-ts';
import { usePrevious } from './enhanced/usePrevious';
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "./useNotifications";

interface VideoLikeState {
  liked: boolean;
  likeCount: number;
  loading: boolean;
  error: string | null;
}

// Optimistic updates with usehooks-ts
export function useVideoLike(postId: string, initialLiked = false, initialCount = 0) {
  const { currentUser } = useAuth();
  const { sendNotification } = useNotifications();
  const [optimisticState, setOptimisticState] = useLocalStorage<VideoLikeState>(
    `like-${postId}`, 
    { liked: initialLiked, likeCount: initialCount, loading: false, error: null }
  );
  const [isToggling, toggleIsToggling, setIsToggling] = useToggle(false);
  const [debouncedPostId] = useDebounceValue(postId, 100);
  const prevPostId = usePrevious(debouncedPostId);

  // Auto-sync like status when postId changes
  useEffect(() => {
    if (debouncedPostId && debouncedPostId !== prevPostId && currentUser?.id) {
      const loadLikeStatus = async () => {
        try {
          const [{ data: interaction }, { data: post }] = await Promise.all([
            supabase.from("user_post_interactions")
              .select("has_liked")
              .eq("post_id", debouncedPostId)
              .eq("user_id", currentUser.id)
              .maybeSingle(),
            supabase.from("content_posts")
              .select("likes_count")
              .eq("id", debouncedPostId)
              .single()
          ]);

          setOptimisticState({
            liked: interaction?.has_liked || false,
            likeCount: post?.likes_count || 0,
            loading: false,
            error: null
          });
        } catch (err) {
          setOptimisticState(prev => ({
            ...prev,
            error: err instanceof Error ? err.message : 'Failed to load like status',
            loading: false
          }));
        }
      };
      loadLikeStatus();
    }
  }, [debouncedPostId, prevPostId, currentUser?.id, setOptimisticState]);

  const toggleLike = useCallback(async () => {
    if (!currentUser?.id || isToggling) return;
    
    // Optimistic update
    const newLiked = !optimisticState.liked;
    const newCount = optimisticState.likeCount + (newLiked ? 1 : -1);
    
    setOptimisticState(prev => ({
      ...prev,
      liked: newLiked,
      likeCount: newCount,
      error: null
    }));
    
    setIsToggling(true);
    
    try {
      const { error } = await supabase.rpc('toggle_post_like', {
        p_post_id: postId,
        p_user_id: currentUser.id
      });
      
      if (error) throw error;

      // Send notification if user liked the post (not unliked)
      if (newLiked) {
        try {
          // Get post owner and details
          const { data: post } = await supabase
            .from('content_posts')
            .select('user_id, thumbnail_url')
            .eq('id', postId)
            .single();

          if (post?.user_id && post.user_id !== currentUser.id) {
            const likerName = currentUser.displayName || currentUser.firstName || 'Someone';
            await sendNotification(
              [post.user_id],
              `${likerName} liked your video`,
              'Someone enjoyed your content!',
              { postId, thumbnailUrl: post.thumbnail_url }
            );
          }
        } catch (notifError) {
          console.error('Failed to send like notification:', notifError);
          // Don't fail the like if notification fails
        }
      }
    } catch (err) {
      // Revert optimistic update on error
      setOptimisticState(prev => ({
        ...prev,
        liked: !newLiked,
        likeCount: prev.likeCount + (newLiked ? -1 : 1),
        error: err instanceof Error ? err.message : 'Failed to toggle like'
      }));
    } finally {
      setIsToggling(false);
    }
  }, [postId, currentUser?.id, optimisticState.liked, optimisticState.likeCount, isToggling, setOptimisticState, setIsToggling, sendNotification]);

  return {
    ...optimisticState,
    loading: isToggling,
    toggleLike,
    refreshLikeStatus: () => setOptimisticState(prev => ({ ...prev, loading: true }))
  };
}