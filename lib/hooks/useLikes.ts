import * as React from "react";
import {
  checkIfUserLikedPost,
  getLikeCount,
  getLikeStats,
  togglePostLike,
} from "@/lib/database/likes";
import { Database } from "@/types/database.types";

interface UseLikesReturn {
  liked: boolean;
  likeCount: number;
  loading: boolean;
  error: Error | null;
  toggleLike: () => Promise<void>;
  refetch: () => Promise<void>;
  recentLikers: Array<
    Pick<
      Database["public"]["Tables"]["users"]["Row"],
      "id" | "first_name" | "last_name" | "avatar_url" | "display_name"
    >
  >;
}

export function useLikes(postId: string): UseLikesReturn {
  const [liked, setLiked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [recentLikers, setRecentLikers] = React.useState<
    Array<
      Pick<
        Database["public"]["Tables"]["users"]["Row"],
        "id" | "first_name" | "last_name" | "avatar_url" | "display_name"
      >
    >
  >([]);

  const loadLikeStatus = React.useCallback(async () => {
    if (!postId) return;

    try {
      setLoading(true);
      setError(null);

      const stats = await getLikeStats(postId);

      setLiked(stats.userLiked);
      setLikeCount(stats.count);
      setRecentLikers(stats.recentLikers);
    } catch (err) {
      console.error("Error loading like status:", err);
      setError(err as Error);

      // Fallback to individual calls if getLikeStats fails
      try {
        const [userLiked, count] = await Promise.all([
          checkIfUserLikedPost(postId),
          getLikeCount(postId),
        ]);

        setLiked(userLiked);
        setLikeCount(count);
      } catch (fallbackErr) {
        console.error("Fallback like status loading failed:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  }, [postId]);

  React.useEffect(() => {
    loadLikeStatus();
  }, [loadLikeStatus]);

  const toggleLike = React.useCallback(async () => {
    if (!postId) return;

    // Optimistic update
    const previousLiked = liked;
    const previousCount = likeCount;

    setLiked(!liked);
    setLikeCount((prev) => liked ? prev - 1 : prev + 1);

    try {
      const result = await togglePostLike(postId);

      // Update with actual values from server
      setLiked(result.liked);
      setLikeCount(result.likeCount);

      // Refresh recent likers
      loadLikeStatus();
    } catch (err) {
      console.error("Error toggling like:", err);

      // Revert optimistic update
      setLiked(previousLiked);
      setLikeCount(previousCount);

      setError(err as Error);
      throw err;
    }
  }, [postId, liked, likeCount, loadLikeStatus]);

  const refetch = React.useCallback(async () => {
    await loadLikeStatus();
  }, [loadLikeStatus]);

  return {
    liked,
    likeCount,
    loading,
    error,
    toggleLike,
    refetch,
    recentLikers,
  };
}
