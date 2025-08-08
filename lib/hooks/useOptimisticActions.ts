/**
 * Optimistic Actions Hook
 * Handles optimistic updates for likes, wolfpack_comments, follows without waiting for server response
 */

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import WolfpackOfflineManager from "@/lib/utils/wolfpack-offline-manager";

interface OptimisticState {
  likes: Record<string, boolean>; // videoId -> isLiked
  follows: Record<string, boolean>; // userId -> isFollowed
  localLikeCounts: Record<string, number>; // videoId -> count adjustment
  localCommentCounts: Record<string, number>; // videoId -> count adjustment
  pendingActions: Record<string, boolean>; // actionId -> isPending
  offlineActions: Record<string, { type: string; timestamp: number }>; // actionId -> action info
}

interface UseOptimisticActionsProps {
  userId?: string; // This should be the public user ID (database ID), not auth ID
  onUpdatewolfpack_videostats?: (
    videoId: string,
    updates: { likes_count?: number; wolfpack_comments_count?: number },
  ) => void;
}

export function useOptimisticActions({
  userId,
  onUpdatewolfpack_videostats,
}: UseOptimisticActionsProps = {}) {
  const [optimisticState, setOptimisticState] = useState<OptimisticState>({
    likes: {},
    follows: {},
    localLikeCounts: {},
    localCommentCounts: {},
    pendingActions: {},
    offlineActions: {},
  });

  // Listen for offline sync events
  useEffect(() => {
    const handleSyncCompleted = (event: CustomEvent) => {
      // Remove completed actions from pending state
      setOptimisticState((prev) => {
        const newPendingActions = { ...prev.pendingActions };
        const newOfflineActions = { ...prev.offlineActions };

        if (event.detail?.syncedActions) {
          event.detail.syncedActions.forEach((actionId: string) => {
            delete newPendingActions[actionId];
            delete newOfflineActions[actionId];
          });
        }

        return {
          ...prev,
          pendingActions: newPendingActions,
          offlineActions: newOfflineActions,
        };
      });
    };

    const handleSyncFailed = (event: CustomEvent) => {
      // Show error for failed actions
      if (event.detail?.failedActions?.length > 0) {
        toast({
          title: "Some actions failed to sync",
          description:
            `${event.detail.failedActions.length} actions couldn't be synced. They'll be retried later.`,
          variant: "destructive",
        });
      }
    };

    window.addEventListener(
      "wolfpack-sync-completed" as any,
      handleSyncCompleted,
    );
    window.addEventListener("wolfpack-sync-failed" as any, handleSyncFailed);

    return () => {
      window.removeEventListener(
        "wolfpack-sync-completed" as any,
        handleSyncCompleted,
      );
      window.removeEventListener(
        "wolfpack-sync-failed" as any,
        handleSyncFailed,
      );
    };
  }, []);

  // Optimistic like/unlike
  const handleLike = useCallback(
    async (
      videoId: string,
      currentLikeCount: number,
      isCurrentlyLiked: boolean,
    ) => {
      if (!userId) {
        toast({
          title: "Account linking required",
          description:
            "Please link your account to like posts. Check the signup form below.",
          variant: "destructive",
        });
        return;
      }

      const newIsLiked = !isCurrentlyLiked;
      const countChange = newIsLiked ? 1 : -1;
      const newCount = Math.max(0, currentLikeCount + countChange);

      // Optimistic update
      setOptimisticState((prev) => ({
        ...prev,
        likes: { ...prev.likes, [videoId]: newIsLiked },
        localLikeCounts: { ...prev.localLikeCounts, [videoId]: countChange },
      }));

      // Update parent component immediately
      onUpdatewolfpack_videostats?.(videoId, { likes_count: newCount });

      try {
        // userId should already be the database user ID (public user ID)
        const userDbId = userId;

        // Use offline manager to handle the action
        const result = await WolfpackOfflineManager.executeAction({
          type: newIsLiked ? "wolfpack_like" : "wolfpack_unlike",
          videoId,
          userId: userDbId,
        });

        if (!result.success) {
          throw new Error(result.data?.error || "Failed to update like");
        }

        // Track offline actions for UI indicators
        if (result.queued) {
          const actionId = result.data?.actionId;
          if (actionId) {
            setOptimisticState((prev) => ({
              ...prev,
              pendingActions: { ...prev.pendingActions, [actionId]: true },
              offlineActions: {
                ...prev.offlineActions,
                [actionId]: {
                  type: newIsLiked ? "like" : "unlike",
                  timestamp: Date.now(),
                },
              },
            }));
          }

          toast({
            title: "Action queued",
            description: `Your ${
              newIsLiked ? "like" : "unlike"
            } will sync when you're back online.`,
            variant: "default",
          });
        }

        console.log(
          `${newIsLiked ? "Liked" : "Unliked"} video ${videoId}${
            result.queued ? " (queued for sync)" : ""
          }`,
        );
      } catch (error) {
        console.error("Error handling like:", error);

        // Revert optimistic update
        setOptimisticState((prev) => ({
          ...prev,
          likes: { ...prev.likes, [videoId]: isCurrentlyLiked },
          localLikeCounts: { ...prev.localLikeCounts, [videoId]: 0 },
        }));

        // Revert parent component
        onUpdatewolfpack_videostats?.(videoId, {
          likes_count: currentLikeCount,
        });

        toast({
          title: "Action failed",
          description: "Failed to update like. Please try again.",
          variant: "destructive",
        });
      }
    },
    [userId, onUpdatewolfpack_videostats],
  );

  // Optimistic follow/unfollow
  const handleFollow = useCallback(
    async (targetUserId: string, isCurrentlyFollowed: boolean) => {
      if (!userId) {
        toast({
          title: "Account linking required",
          description:
            "Please link your account to follow users. Check the signup form below.",
          variant: "destructive",
        });
        return;
      }

      const newIsFollowed = !isCurrentlyFollowed;

      // Optimistic update
      setOptimisticState((prev) => ({
        ...prev,
        follows: { ...prev.follows, [targetUserId]: newIsFollowed },
      }));

      try {
        // userId should already be the database user ID (public user ID)
        const userDbId = userId;

        // Use offline manager to handle the action
        const result = await WolfpackOfflineManager.executeAction({
          type: newIsFollowed ? "wolfpack_follow" : "wolfpack_unfollow",
          userId: userDbId,
          targetUserId,
        });

        if (!result.success) {
          throw new Error(
            result.data?.error || "Failed to update follow status",
          );
        }

        // Track offline actions for UI indicators
        if (result.queued) {
          const actionId = result.data?.actionId;
          if (actionId) {
            setOptimisticState((prev) => ({
              ...prev,
              pendingActions: { ...prev.pendingActions, [actionId]: true },
              offlineActions: {
                ...prev.offlineActions,
                [actionId]: {
                  type: newIsFollowed ? "follow" : "unfollow",
                  timestamp: Date.now(),
                },
              },
            }));
          }

          toast({
            title: "Action queued",
            description: `Your ${
              newIsFollowed ? "follow" : "unfollow"
            } will sync when you're back online.`,
            variant: "default",
          });
        } else {
          toast({
            title: newIsFollowed ? "Following" : "Unfollowed",
            description: newIsFollowed
              ? "You are now following this user"
              : "You unfollowed this user",
          });
        }
      } catch (error) {
        console.error("Error handling follow:", error);

        // Revert optimistic update
        setOptimisticState((prev) => ({
          ...prev,
          follows: { ...prev.follows, [targetUserId]: isCurrentlyFollowed },
        }));

        toast({
          title: "Action failed",
          description: "Failed to update follow status. Please try again.",
          variant: "destructive",
        });
      }
    },
    [userId],
  );

  // Handle comment creation with optimistic count update
  const handlewolfpack_commentsubmit = useCallback(async (
    videoId: string,
    content: string,
    currentCommentCount: number,
    parentId?: string,
  ) => {
    if (!userId) {
      toast({
        title: "Account linking required",
        description:
          "Please link your account to comment. Check the signup form below.",
        variant: "destructive",
      });
      return null;
    }

    // Optimistic update - increment comment count
    const newCount = currentCommentCount + 1;
    setOptimisticState((prev) => ({
      ...prev,
      localCommentCounts: {
        ...prev.localCommentCounts,
        [videoId]: (prev.localCommentCounts[videoId] || 0) + 1,
      },
    }));

    // Update parent component immediately
    onUpdatewolfpack_videostats?.(videoId, {
      wolfpack_comments_count: newCount,
    });

    try {
      // userId should already be the database user ID (public user ID)
      const userDbId = userId;

      // Use offline manager to handle the action
      const result = await WolfpackOfflineManager.executeAction({
        type: "wolfpack_comment",
        videoId,
        userId: userDbId,
        content: content.trim(),
        parentId: parentId || undefined,
      });

      if (!result.success) {
        throw new Error(result.data?.error || "Failed to add comment");
      }

      // Track offline actions for UI indicators
      if (result.queued) {
        const actionId = result.data?.actionId;
        if (actionId) {
          setOptimisticState((prev) => ({
            ...prev,
            pendingActions: { ...prev.pendingActions, [actionId]: true },
            offlineActions: {
              ...prev.offlineActions,
              [actionId]: {
                type: "comment",
                timestamp: Date.now(),
              },
            },
          }));
        }

        toast({
          title: "Comment queued",
          description: "Your comment will be posted when you're back online.",
          variant: "default",
        });

        // Return a temporary comment object for offline display
        return {
          id: `temp_${Date.now()}`,
          content: content.trim(),
          created_at: new Date().toISOString(),
          user: {
            first_name: "You",
            last_name: "",
            display_name: "You (offline)",
            avatar_url: null,
          },
          pending: true,
        };
      }

      return result.data?.data || result.data;
    } catch (error) {
      console.error("Error creating comment:", error);

      // Revert optimistic update
      setOptimisticState((prev) => ({
        ...prev,
        localCommentCounts: {
          ...prev.localCommentCounts,
          [videoId]: (prev.localCommentCounts[videoId] || 1) - 1,
        },
      }));

      // Revert parent component
      onUpdatewolfpack_videostats?.(videoId, {
        wolfpack_comments_count: currentCommentCount,
      });

      toast({
        title: "Comment failed",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });

      return null;
    }
  }, [userId, onUpdatewolfpack_videostats]);

  // Get optimistic state for a video
  const getOptimisticwolfpack_videostate = useCallback(
    (
      videoId: string,
      originalLikeCount: number,
      originalCommentCount: number,
    ) => {
      const likeAdjustment = optimisticState.localLikeCounts[videoId] || 0;
      const commentAdjustment = optimisticState.localCommentCounts[videoId] ||
        0;

      return {
        isLiked: optimisticState.likes[videoId],
        likes_count: Math.max(0, originalLikeCount + likeAdjustment),
        wolfpack_comments_count: Math.max(
          0,
          originalCommentCount + commentAdjustment,
        ),
      };
    },
    [optimisticState],
  );

  // Get optimistic follow state
  const getOptimisticFollowState = useCallback((userId: string) => {
    return optimisticState.follows[userId];
  }, [optimisticState]);

  // Clear optimistic state (useful after real-time updates)
  const clearOptimisticState = useCallback(() => {
    setOptimisticState({
      likes: {},
      follows: {},
      localLikeCounts: {},
      localCommentCounts: {},
      pendingActions: {},
      offlineActions: {},
    });
  }, []);

  // Get offline action status
  const getOfflineStatus = useCallback(() => {
    const pendingCount = Object.keys(optimisticState.pendingActions).length;
    const actions = Object.entries(optimisticState.offlineActions).map((
      [id, action],
    ) => ({
      id,
      ...action,
    }));

    return {
      hasPendingActions: pendingCount > 0,
      pendingCount,
      actions,
      isOnline: navigator.onLine,
    };
  }, [optimisticState.pendingActions, optimisticState.offlineActions]);

  // Force sync pending actions
  const forceSyncActions = useCallback(async () => {
    try {
      const result = await WolfpackOfflineManager.forceSyncNow();

      if (result.success) {
        toast({
          title: "Sync completed",
          description: `Synced ${result.synced} actions successfully.`,
          variant: "default",
        });
      } else if (result.failed > 0) {
        toast({
          title: "Sync partially failed",
          description:
            `Synced ${result.synced} actions, ${result.failed} failed.`,
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      console.error("Error forcing sync:", error);
      toast({
        title: "Sync failed",
        description:
          "Failed to sync pending actions. Will retry automatically.",
        variant: "destructive",
      });

      return { success: false, synced: 0, failed: 0 };
    }
  }, []);

  return {
    handleLike,
    handleFollow,
    handlewolfpack_commentsubmit,
    getOptimisticwolfpack_videostate,
    getOptimisticFollowState,
    clearOptimisticState,
    getOfflineStatus,
    forceSyncActions,
  };
}
