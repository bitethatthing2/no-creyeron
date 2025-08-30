"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { debugLog, performanceLog } from "@/lib/debug";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

// Precise comment type matching content_comments table schema
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
  // Joined user data
  user?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    username: string;
    avatar_url: string | null;
    profile_image_url: string | null;
  };
  // Nested replies (populated separately)
  replies?: VideoComment[];
  // UI state helpers
  isOptimistic?: boolean;
  isDeleting?: boolean;
  isEditing?: boolean;
}

interface CommentState {
  comments: VideoComment[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
}

interface UseVideoCommentsReturn extends CommentState {
  addComment: (
    content: string,
    parentCommentId?: string | null,
  ) => Promise<boolean>;
  editComment: (commentId: string, newContent: string) => Promise<boolean>;
  deleteComment: (commentId: string) => Promise<boolean>;
  pinComment: (commentId: string) => Promise<boolean>;
  unpinComment: (commentId: string) => Promise<boolean>;
  likeComment: (commentId: string) => Promise<boolean>;
  refreshComments: () => Promise<void>;
  loadMoreComments: () => Promise<void>;
  subscribeToComments: () => () => void;
}

const COMMENTS_PER_PAGE = 20;

export function useVideoComments(videoId: string): UseVideoCommentsReturn {
  const { currentUser } = useAuth();
  const [state, setState] = React.useState<CommentState>({
    comments: [],
    loading: true,
    error: null,
    hasMore: true,
    totalCount: 0,
  });

  const subscriptionRef = React.useRef<RealtimeChannel | null>(null);
  const offsetRef = React.useRef(0);
  const loadingMoreRef = React.useRef(false);

  // Load comments with pagination
  const loadComments = React.useCallback(async (reset = false) => {
    if (!videoId) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Invalid video ID",
      }));
      return;
    }

    const startTime = performanceLog.start("loadComments");

    if (reset) {
      offsetRef.current = 0;
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        comments: [],
      }));
    } else if (loadingMoreRef.current) {
      return; // Prevent duplicate loads
    }

    loadingMoreRef.current = true;

    try {
      // Get total count
      const { count } = await supabase
        .from("content_comments")
        .select("*", { count: "exact", head: true })
        .eq("video_id", videoId)
        .eq("is_deleted", false)
        .is("parent_comment_id", null); // Only count top-level comments

      // Fetch comments with user data
      const { data, error: fetchError } = await supabase
        .from("content_comments")
        .select(`
         *,
         user:users!content_comments_user_id_fkey (
           id,
           email,
           first_name,
           last_name,
           display_name,
           username,
           avatar_url,
           profile_image_url
         )
       `)
        .eq("video_id", videoId)
        .eq("is_deleted", false)
        .is("parent_comment_id", null) // Top-level comments only
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .range(offsetRef.current, offsetRef.current + COMMENTS_PER_PAGE - 1);

      if (fetchError) throw fetchError;

      const comments = data || [];

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
          const { data: replies } = await supabase
            .from("content_comments")
            .select(`
             *,
             user:users!content_comments_user_id_fkey (
               id,
               email,
               first_name,
               last_name,
               display_name,
               username,
               avatar_url,
               profile_image_url
             )
           `)
            .eq("parent_comment_id", comment.id)
            .eq("is_deleted", false)
            .order("created_at", { ascending: true });

          return {
            ...comment,
            replies: replies || [],
          };
        }),
      );

      offsetRef.current += comments.length;

      setState((prev) => ({
        ...prev,
        comments: reset
          ? commentsWithReplies
          : [...prev.comments, ...commentsWithReplies],
        loading: false,
        error: null,
        hasMore: offsetRef.current < (count || 0),
        totalCount: count || 0,
      }));

      debugLog.success("loadComments", {
        videoId,
        loaded: comments.length,
        total: count,
        offset: offsetRef.current,
      });
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to load comments";
      debugLog.error("loadComments", error, {});
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    } finally {
      performanceLog.end("loadComments", startTime);
      loadingMoreRef.current = false;
    }
  }, [videoId]);

  // Add a new comment
  const addComment = React.useCallback(async (
    content: string,
    parentCommentId: string | null = null,
  ): Promise<boolean> => {
    if (!currentUser?.id) {
      setState((prev) => ({ ...prev, error: "Please log in to comment" }));
      return false;
    }

    if (!content.trim()) {
      setState((prev) => ({ ...prev, error: "Comment cannot be empty" }));
      return false;
    }

    const startTime = performanceLog.start("addComment");

    // Create optimistic comment
    const optimisticComment: VideoComment = {
      id: `optimistic-${Date.now()}`,
      user_id: currentUser.id,
      video_id: videoId,
      parent_comment_id: parentCommentId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      is_edited: false,
      is_pinned: false,
      likes_count: 0,
      user: {
        id: currentUser.id,
        email: currentUser.email || "",
        first_name: currentUser.firstName ?? null,
        last_name: currentUser.lastName ?? null,
        display_name: currentUser.displayName ?? null,
        username: currentUser.username || "",
        avatar_url: currentUser.avatarUrl ?? null,
        profile_image_url: currentUser.profileImageUrl ?? null,
      },
      isOptimistic: true,
    };

    // Add optimistic update
    if (parentCommentId) {
      // Add as reply
      setState((prev) => ({
        ...prev,
        comments: prev.comments.map((comment) => {
          if (comment.id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), optimisticComment],
            };
          }
          return comment;
        }),
      }));
    } else {
      // Add as top-level comment
      setState((prev) => ({
        ...prev,
        comments: [optimisticComment, ...prev.comments],
        totalCount: prev.totalCount + 1,
      }));
    }

    try {
      // Use RPC function to add comment
      const { data, error } = await supabase
        .rpc("add_comment", {
          p_video_id: videoId,
          p_content: content.trim(),
          p_parent_comment_id: parentCommentId,
        });

      if (error) throw error;

      // Replace optimistic comment with real one
      const { data: newComment } = await supabase
        .from("content_comments")
        .select(`
         *,
         user:users!content_comments_user_id_fkey (
           id,
           email,
           first_name,
           last_name,
           display_name,
           username,
           avatar_url,
           profile_image_url
         )
       `)
        .eq("id", data.comment_id)
        .single();

      if (newComment) {
        if (parentCommentId) {
          setState((prev) => ({
            ...prev,
            comments: prev.comments.map((comment) => {
              if (comment.id === parentCommentId) {
                return {
                  ...comment,
                  replies: (comment.replies || []).map((reply) =>
                    reply.id === optimisticComment.id ? newComment : reply
                  ),
                };
              }
              return comment;
            }),
          }));
        } else {
          setState((prev) => ({
            ...prev,
            comments: prev.comments.map((comment) =>
              comment.id === optimisticComment.id ? newComment : comment
            ),
          }));
        }
      }

      debugLog.success("addComment", { commentId: data.comment_id, videoId });
      performanceLog.end("addComment", startTime);
      return true;
    } catch (error) {
      // Remove optimistic comment on error
      if (parentCommentId) {
        setState((prev) => ({
          ...prev,
          comments: prev.comments.map((comment) => {
            if (comment.id === parentCommentId) {
              return {
                ...comment,
                replies: (comment.replies || []).filter(
                  (reply) => reply.id !== optimisticComment.id,
                ),
              };
            }
            return comment;
          }),
        }));
      } else {
        setState((prev) => ({
          ...prev,
          comments: prev.comments.filter((c) => c.id !== optimisticComment.id),
          totalCount: prev.totalCount - 1,
        }));
      }

      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to add comment";
      debugLog.error("addComment", error, {});
      setState((prev) => ({ ...prev, error: errorMessage }));
      performanceLog.end("addComment", startTime);
      return false;
    }
  }, [currentUser, videoId]);

  // Edit a comment
  const editComment = React.useCallback(async (
    commentId: string,
    newContent: string,
  ): Promise<boolean> => {
    if (!currentUser?.id || !newContent.trim()) return false;

    try {
      const { error } = await supabase
        .from("content_comments")
        .update({
          content: newContent.trim(),
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", commentId)
        .eq("user_id", currentUser.id);

      if (error) throw error;

      // Update local state
      setState((prev) => ({
        ...prev,
        comments: prev.comments.map((comment) => {
          if (comment.id === commentId) {
            return { ...comment, content: newContent, is_edited: true };
          }
          // Check replies
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.id === commentId
                  ? { ...reply, content: newContent, is_edited: true }
                  : reply
              ),
            };
          }
          return comment;
        }),
      }));

      return true;
    } catch (error) {
      debugLog.error("editComment", error, {});
      setState((prev) => ({ ...prev, error: "Failed to edit comment" }));
      return false;
    }
  }, [currentUser?.id]);

  // Delete a comment
  const deleteComment = React.useCallback(
    async (commentId: string): Promise<boolean> => {
      if (!currentUser?.id) return false;

      // Mark as deleting in UI
      setState((prev) => ({
        ...prev,
        comments: prev.comments.map((comment) => {
          if (comment.id === commentId) {
            return { ...comment, isDeleting: true };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.id === commentId ? { ...reply, isDeleting: true } : reply
              ),
            };
          }
          return comment;
        }),
      }));

      try {
        const { error } = await supabase
          .from("content_comments")
          .update({ is_deleted: true })
          .eq("id", commentId)
          .eq("user_id", currentUser.id);

        if (error) throw error;

        // Remove from local state
        setState((prev) => ({
          ...prev,
          comments: prev.comments
            .filter((c) => c.id !== commentId)
            .map((comment) => ({
              ...comment,
              replies: comment.replies?.filter((r) => r.id !== commentId),
            })),
          totalCount: prev.comments.find((c) => c.id === commentId)
            ? prev.totalCount - 1
            : prev.totalCount,
        }));

        return true;
      } catch (error) {
        // Revert deleting state
        setState((prev) => ({
          ...prev,
          comments: prev.comments.map((comment) => {
            if (comment.id === commentId) {
              return { ...comment, isDeleting: false };
            }
            if (comment.replies) {
              return {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply.id === commentId
                    ? { ...reply, isDeleting: false }
                    : reply
                ),
              };
            }
            return comment;
          }),
          error: "Failed to delete comment",
        }));
        return false;
      }
    },
    [currentUser?.id],
  );

  // Pin/unpin comment (admin only)
  const pinComment = React.useCallback(
    async (commentId: string): Promise<boolean> => {
      if (!currentUser?.id) return false;

      try {
        const { error } = await supabase
          .from("content_comments")
          .update({ is_pinned: true })
          .eq("id", commentId);

        if (error) throw error;

        setState((prev) => ({
          ...prev,
          comments: prev.comments.map((c) =>
            c.id === commentId ? { ...c, is_pinned: true } : c
          ),
        }));

        return true;
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to pin comment" }));
        return false;
      }
    },
    [currentUser?.id],
  );

  const unpinComment = React.useCallback(
    async (commentId: string): Promise<boolean> => {
      if (!currentUser?.id) return false;

      try {
        const { error } = await supabase
          .from("content_comments")
          .update({ is_pinned: false })
          .eq("id", commentId);

        if (error) throw error;

        setState((prev) => ({
          ...prev,
          comments: prev.comments.map((c) =>
            c.id === commentId ? { ...c, is_pinned: false } : c
          ),
        }));

        return true;
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to unpin comment" }));
        return false;
      }
    },
    [currentUser?.id],
  );

  // Like a comment (would need a separate table for this)
  const likeComment = React.useCallback(
    async (commentId: string): Promise<boolean> => {
      // This would require a comment_likes table
      // For now, just increment the count locally
      setState((prev) => ({
        ...prev,
        comments: prev.comments.map((c) =>
          c.id === commentId
            ? { ...c, likes_count: (c.likes_count || 0) + 1 }
            : c
        ),
      }));
      return true;
    },
    [],
  );

  // Subscribe to real-time updates
  const subscribeToComments = React.useCallback(() => {
    if (!videoId) return () => {};

    // Clean up existing subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    const channel = supabase
      .channel(`comments:${videoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "content_comments",
          filter: `video_id=eq.${videoId}`,
        },
        async (
          payload: RealtimePostgresChangesPayload<VideoComment>,
        ) => {
          // Don't add if it's from current user (already optimistically added)
          if (
            "user_id" in payload.new && payload.new.user_id === currentUser?.id
          ) return;

          // Fetch full comment with user data
          const { data } = await supabase
            .from("content_comments")
            .select(`
             *,
             user:users!content_comments_user_id_fkey (
               id,
               email,
               first_name,
               last_name,
               display_name,
               username,
               avatar_url,
               profile_image_url
             )
           `)
            .eq("id", "id" in payload.new ? payload.new.id : "")
            .single();

          if (data) {
            if (data.parent_comment_id) {
              // Add as reply
              setState((prev) => ({
                ...prev,
                comments: prev.comments.map((comment) => {
                  if (comment.id === data.parent_comment_id) {
                    return {
                      ...comment,
                      replies: [...(comment.replies || []), data],
                    };
                  }
                  return comment;
                }),
              }));
            } else {
              // Add as top-level comment
              setState((prev) => ({
                ...prev,
                comments: [data, ...prev.comments],
                totalCount: prev.totalCount + 1,
              }));
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "content_comments",
          filter: `video_id=eq.${videoId}`,
        },
        (payload: RealtimePostgresChangesPayload<VideoComment>) => {
          setState((prev) => ({
            ...prev,
            comments: prev.comments.map((comment) => {
              if (
                comment &&
                typeof comment === "object" &&
                "id" in comment &&
                typeof (comment as VideoComment).id === "string" &&
                (comment as VideoComment).id === payload.new.id
              ) {
                return { ...(comment as VideoComment), ...payload.new };
              }
              if (
                comment && typeof comment === "object" &&
                "replies" in comment &&
                Array.isArray((comment as VideoComment).replies)
              ) {
                return {
                  ...(comment as VideoComment),
                  replies: (comment as VideoComment).replies!.map((reply) =>
                    reply && typeof reply === "object" && "id" in reply &&
                      typeof reply.id === "string" &&
                      reply.id === payload.new.id
                      ? { ...(reply as VideoComment), ...payload.new }
                      : reply
                  ),
                };
              }
              return comment;
            }),
          }));
        },
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [videoId, currentUser?.id]);

  // Refresh comments
  const refreshComments = React.useCallback(async () => {
    await loadComments(true);
  }, [loadComments]);

  // Load more comments
  const loadMoreComments = React.useCallback(async () => {
    if (state.hasMore && !loadingMoreRef.current) {
      await loadComments(false);
    }
  }, [state.hasMore, loadComments]);

  // Initial load
  React.useEffect(() => {
    loadComments(true);
  }, [videoId]); // Only depend on videoId, not loadComments

  // Set up subscription
  React.useEffect(() => {
    const unsubscribe = subscribeToComments();
    return unsubscribe;
  }, [subscribeToComments]);

  return {
    ...state,
    addComment,
    editComment,
    deleteComment,
    pinComment,
    unpinComment,
    likeComment,
    refreshComments,
    loadMoreComments,
    subscribeToComments,
  };
}
