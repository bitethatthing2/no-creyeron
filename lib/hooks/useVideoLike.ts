"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { debugLog, performanceLog } from "@/lib/debug";

interface VideoLikeState {
  liked: boolean;
  likeCount: number;
  loading: boolean;
  error: string | null;
}

interface UseVideoLikeReturn extends VideoLikeState {
  toggleLike: () => Promise<void>;
  refreshLikeStatus: () => Promise<void>;
}

/**
 * Hook for managing video/post likes using the user_post_interactions table
 * and the toggle_post_like database function
 */
export function useVideoLike(
  postId: string,
  initialLiked = false,
  initialCount = 0,
): UseVideoLikeReturn {
  const { currentUser } = useAuth();
  const [state, setState] = React.useState<VideoLikeState>({
    liked: initialLiked,
    likeCount: initialCount,
    loading: false,
    error: null,
  });

  // Track if we're currently toggling to prevent double-clicks
  const isTogglingRef = React.useRef(false);

  /**
   * Load the current like status from the database
   */
  const loadLikeStatus = React.useCallback(async () => {
    if (!postId || !currentUser?.id) {
      debugLog.custom(
        "ℹ️",
        "loadLikeStatus: Missing postId or currentUser",
        {},
      );
      return;
    }

    const startTime = performanceLog.start("loadLikeStatus");
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Check if current user has liked this post
      const { data: interaction, error: interactionError } = await supabase
        .from("user_post_interactions")
        .select("has_liked")
        .eq("post_id", postId)
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (interactionError) {
        throw interactionError;
      }

      // Get the current like count from the post
      const { data: post, error: postError } = await supabase
        .from("content_posts")
        .select("likes_count")
        .eq("id", postId)
        .single();

      if (postError) {
        throw postError;
      }

      setState({
        liked: interaction?.has_liked || false,
        likeCount: post?.likes_count || 0,
        loading: false,
        error: null,
      });

      debugLog.success("loadLikeStatus", {
        postId,
        liked: interaction?.has_liked || false,
        count: post?.likes_count || 0,
      });
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to load like status";
      debugLog.error("loadLikeStatus", error, {
        userId: currentUser.id,
      });

      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    } finally {
      performanceLog.end("loadLikeStatus", startTime);
    }
  }, [postId, currentUser?.id]);

  // Load initial like status when component mounts or postId changes
  React.useEffect(() => {
    if (postId && currentUser?.id) {
      loadLikeStatus();
    } else if (!currentUser?.id) {
      // Reset to initial state if user is not logged in
      setState({
        liked: false,
        likeCount: initialCount,
        loading: false,
        error: null,
      });
    }
  }, [postId, currentUser?.id, initialCount, loadLikeStatus]);

  /**
   * Toggle the like status for the current post
   */
  const toggleLike = React.useCallback(async () => {
    // Prevent double-clicks and require authentication
    if (isTogglingRef.current || !currentUser?.id) {
      if (!currentUser?.id) {
        setState((prev) => ({
          ...prev,
          error: "Please log in to like posts",
        }));

        // Optionally redirect to login
        const currentPath = window.location.pathname + window.location.search;
        localStorage.setItem("redirectAfterLogin", currentPath);

        // You could trigger a login modal here instead of redirecting
        // For now, just show the error
      }
      return;
    }

    if (!postId) {
      setState((prev) => ({
        ...prev,
        error: "Invalid post ID",
      }));
      return;
    }

    isTogglingRef.current = true;
    const startTime = performanceLog.start("toggleLike");

    // Optimistic update
    const previousState = { ...state };
    setState((prev) => ({
      ...prev,
      liked: !prev.liked,
      likeCount: prev.liked
        ? Math.max(0, prev.likeCount - 1)
        : prev.likeCount + 1,
      error: null,
    }));

    try {
      // Call the database function to toggle the like
      const { data, error } = await supabase
        .rpc("toggle_post_like", {
          post_id: postId,
        });

      if (error) {
        throw error;
      }

      // The RPC function returns the new state
      if (data) {
        setState((prev) => ({
          ...prev,
          liked: data.has_liked,
          likeCount: data.likes_count,
          loading: false,
          error: null,
        }));

        debugLog.success("toggleLike", {
          postId,
          action: data.has_liked ? "liked" : "unliked",
          newCount: data.likes_count,
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setState({
        ...previousState,
        error: error instanceof Error ? error.message : "Failed to update like",
      });

      debugLog.error("toggleLike", error, {
        userId: currentUser.id,
      });

      // Show user-friendly error messages
      let errorMessage = "Failed to update like. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          errorMessage = "This post is no longer available.";
        } else if (
          error.message.includes("network") || error.message.includes("fetch")
        ) {
          errorMessage = "Network error. Please check your connection.";
        } else if (
          error.message.includes("permission") ||
          error.message.includes("denied")
        ) {
          errorMessage = "You don't have permission to like this post.";
        }
      }

      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
    } finally {
      isTogglingRef.current = false;
      performanceLog.end("toggleLike", startTime);
    }
  }, [postId, currentUser?.id, state]);

  /**
   * Manually refresh the like status from the database
   */
  const refreshLikeStatus = React.useCallback(async () => {
    await loadLikeStatus();
  }, [loadLikeStatus]);

  // Subscribe to real-time updates for this post's interactions
  React.useEffect(() => {
    if (!postId) return;

    const channel = supabase
      .channel(`post-likes:${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_post_interactions",
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          debugLog.success("Real-time like update", {
            event: payload.eventType,
            postId,
          });

          // If it's not the current user's action, update the count
          if (
            payload.new &&
            typeof payload.new === "object" &&
            "user_id" in payload.new &&
            payload.new.user_id !== currentUser?.id
          ) {
            // Refresh the like count when other users like/unlike
            const { data: post } = await supabase
              .from("content_posts")
              .select("likes_count")
              .eq("id", postId)
              .single();

            if (post) {
              setState((prev) => ({
                ...prev,
                likeCount: post.likes_count || 0,
              }));
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, currentUser?.id]);

  // Also subscribe to changes in the content_posts table for like count updates
  React.useEffect(() => {
    if (!postId) return;

    const channel = supabase
      .channel(`post-counts:${postId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "content_posts",
          filter: `id=eq.${postId}`,
        },
        (payload) => {
          if (
            payload.new &&
            typeof payload.new === "object" &&
            "likes_count" in payload.new
          ) {
            setState((prev) => ({
              ...prev,
              likeCount: payload.new.likes_count as number || 0,
            }));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  return {
    liked: state.liked,
    likeCount: state.likeCount,
    loading: state.loading,
    error: state.error,
    toggleLike,
    refreshLikeStatus,
  };
}
