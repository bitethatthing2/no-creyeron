import { useCallback, useEffect, useState } from "react";
import {
  createPost,
  deletePost,
  getFeedPosts as getFeedwolfpack_posts,
  getPost,
  getPostStats as getwolfpack_poststats,
  getUserPosts as getUserwolfpack_posts,
  incrementViewCount,
  updatePost,
} from "@/lib/database/posts";
import { Database } from "@/types/database.types";

type WolfpackVideo =
  & Database["public"]["Tables"]["wolfpack_videos"]["Row"]
  & {
    user?: Pick<
      Database["public"]["Tables"]["users"]["Row"],
      "id" | "first_name" | "last_name" | "avatar_url" | "display_name"
    >;
    like_count?: number;
    comment_count?: number;
    user_liked?: boolean;
  };

interface Usewolfpack_postsReturn {
  wolfpack_posts: WolfpackVideo[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  createNewPost: (postData: {
    title?: string;
    description?: string;
    video_url: string;
    thumbnail_url?: string;
    duration?: number;
  }) => Promise<WolfpackVideo>;
}

export function useFeedwolfpack_posts(limit = 20): Usewolfpack_postsReturn {
  const [wolfpack_posts, setwolfpack_posts] = useState<WolfpackVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadwolfpack_posts = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;
      const newwolfpack_posts = await getFeedwolfpack_posts(
        limit,
        currentOffset,
      );

      if (reset) {
        setwolfpack_posts(newwolfpack_posts);
        setOffset(newwolfpack_posts.length);
      } else {
        setwolfpack_posts((prev) => [...prev, ...newwolfpack_posts]);
        setOffset((prev) => prev + newwolfpack_posts.length);
      }

      setHasMore(newwolfpack_posts.length === limit);
    } catch (err) {
      console.error("Error loading wolfpack_posts:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    loadwolfpack_posts(true);
  }, []); // Only run on mount, loadwolfpack_posts handles its own dependencies

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadwolfpack_posts(false);
  }, [hasMore, loading, loadwolfpack_posts]);

  const refetch = useCallback(async () => {
    setOffset(0);
    await loadwolfpack_posts(true);
  }, [loadwolfpack_posts]);

  const createNewPost = useCallback(async (postData: {
    title?: string;
    description?: string;
    video_url: string;
    thumbnail_url?: string;
    duration?: number;
  }) => {
    try {
      const newPost = await createPost(postData);

      // Add to beginning of wolfpack_posts
      setwolfpack_posts((prev) => [newPost, ...prev]);

      return newPost;
    } catch (err) {
      console.error("Error creating post:", err);
      throw err;
    }
  }, []);

  return {
    wolfpack_posts,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
    createNewPost,
  };
}

interface UseSinglePostReturn {
  post: WolfpackVideo | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updatePostData: (updates: {
    title?: string;
    description?: string;
    thumbnail_url?: string;
  }) => Promise<void>;
  deletePostData: () => Promise<void>;
  recordView: () => Promise<void>;
  stats: {
    views: number;
    likes: number;
    wolfpack_comments: number;
  };
}

export function usePost(postId: string): UseSinglePostReturn {
  const [post, setPost] = useState<WolfpackVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState({
    views: 0,
    likes: 0,
    wolfpack_comments: 0,
  });

  const loadPost = useCallback(async () => {
    if (!postId) return;

    try {
      setLoading(true);
      setError(null);

      const [postData, wolfpack_poststats] = await Promise.all([
        getPost(postId),
        getwolfpack_poststats(postId),
      ]);

      setPost(postData);
      setStats(wolfpack_poststats);
    } catch (err) {
      console.error("Error loading post:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const refetch = useCallback(async () => {
    await loadPost();
  }, [loadPost]);

  const updatePostData = useCallback(async (updates: {
    title?: string;
    description?: string;
    thumbnail_url?: string;
  }) => {
    if (!postId) throw new Error("No post ID");

    try {
      const updatedPost = await updatePost(postId, updates);
      setPost(updatedPost);
    } catch (err) {
      console.error("Error updating post:", err);
      throw err;
    }
  }, [postId]);

  const deletePostData = useCallback(async () => {
    if (!postId) throw new Error("No post ID");

    try {
      await deletePost(postId);
      setPost(null);
    } catch (err) {
      console.error("Error deleting post:", err);
      throw err;
    }
  }, [postId]);

  const recordView = useCallback(async () => {
    if (!postId) return;

    try {
      await incrementViewCount(postId);
      setStats((prev) => ({ ...prev, views: prev.views + 1 }));
    } catch (err) {
      console.error("Error recording view:", err);
      // Don't throw as this is not critical
    }
  }, [postId]);

  return {
    post,
    loading,
    error,
    refetch,
    updatePostData,
    deletePostData,
    recordView,
    stats,
  };
}

export function useAuthwolfpack_posts(userId: string, limit = 20) {
  const [wolfpack_posts, setwolfpack_posts] = useState<WolfpackVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadwolfpack_posts = useCallback(async (reset = false) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;
      const newwolfpack_posts = await getUserwolfpack_posts(
        conversationid,
        limit,
        currentOffset,
      );

      if (reset) {
        setwolfpack_posts(newwolfpack_posts);
        setOffset(newwolfpack_posts.length);
      } else {
        setwolfpack_posts((prev) => [...prev, ...newwolfpack_posts]);
        setOffset((prev) => prev + newwolfpack_posts.length);
      }

      setHasMore(newwolfpack_posts.length === limit);
    } catch (err) {
      console.error("Error loading user wolfpack_posts:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId, limit, offset]);

  useEffect(() => {
    loadwolfpack_posts(true);
  }, [userId]); // Reset whenconversationid changes

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadwolfpack_posts(false);
  }, [hasMore, loading, loadwolfpack_posts]);

  const refetch = useCallback(async () => {
    setOffset(0);
    await loadwolfpack_posts(true);
  }, [loadwolfpack_posts]);

  return {
    wolfpack_posts,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
  };
}
