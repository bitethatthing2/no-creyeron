import { useCallback, useEffect, useState } from "react";
import {
  createComment,
  deleteComment,
  getCommentCount,
  getRepliesForComment,
  getwolfpack_commentsForPost,
  updateComment,
} from "@/lib/database/wolfpack_comments";
import { Database } from "@/types/database.types";

type Comment =
  & Database["public"]["Tables"]["wolfpack_comments"]["Row"]
  & {
    user?: Pick<
      Database["public"]["Tables"]["users"]["Row"],
      "id" | "first_name" | "last_name" | "avatar_url" | "display_name"
    >;
    replies?: Comment[];
  };

interface Usewolfpack_commentsReturn {
  wolfpack_comments: Comment[];
  loading: boolean;
  error: Error | null;
  addComment: (content: string, parentId?: string) => Promise<void>;
  editComment: (commentId: string, content: string) => Promise<void>;
  removeComment: (commentId: string) => Promise<void>;
  loadReplies: (commentId: string) => Promise<Comment[]>;
  refetch: () => Promise<void>;
  commentCount: number;
}

export function usewolfpack_comments(
  postId: string,
): Usewolfpack_commentsReturn {
  const [wolfpack_comments, setwolfpack_comments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [commentCount, setCommentCount] = useState(0);

  const loadwolfpack_comments = useCallback(async () => {
    if (!postId) return;

    try {
      setLoading(true);
      setError(null);

      const [wolfpack_commentsData, count] = await Promise.all([
        getwolfpack_commentsForPost(postId),
        getCommentCount(postId),
      ]);

      setwolfpack_comments(wolfpack_commentsData);
      setCommentCount(count);
    } catch (err) {
      console.error("Error loading wolfpack_comments:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadwolfpack_comments();
  }, [loadwolfpack_comments]);

  const addComment = useCallback(async (content: string, parentId?: string) => {
    if (!content.trim()) {
      throw new Error("Comment content cannot be empty");
    }

    try {
      const newComment = await createComment(postId, content, parentId);

      if (parentId) {
        // If it's a reply, we'll need to reload to get it in the right place
        await loadwolfpack_comments();
      } else {
        // If it's a top-level comment, add it to the beginning
        setwolfpack_comments((prev) => [newComment, ...prev]);
        setCommentCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      throw err;
    }
  }, [postId, loadwolfpack_comments]);

  const editComment = useCallback(
    async (commentId: string, content: string) => {
      if (!content.trim()) {
        throw new Error("Comment content cannot be empty");
      }

      try {
        const updatedComment = await updateComment(commentId, content);

        setwolfpack_comments((prev) =>
          prev.map((comment) =>
            comment.id === commentId ? updatedComment : comment
          )
        );
      } catch (err) {
        console.error("Error editing comment:", err);
        throw err;
      }
    },
    [],
  );

  const removeComment = useCallback(async (commentId: string) => {
    try {
      await deleteComment(commentId);

      setwolfpack_comments((prev) =>
        prev.filter((comment) => comment.id !== commentId)
      );
      setCommentCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error removing comment:", err);
      throw err;
    }
  }, []);

  const loadReplies = useCallback(
    async (commentId: string): Promise<Comment[]> => {
      try {
        const replies = await getRepliesForComment(commentId);

        // Update the comment with its replies
        setwolfpack_comments((prev) =>
          prev.map((comment) =>
            comment.id === commentId ? { ...comment, replies } : comment
          )
        );

        return replies;
      } catch (err) {
        console.error("Error loading replies:", err);
        throw err;
      }
    },
    [],
  );

  const refetch = useCallback(async () => {
    await loadwolfpack_comments();
  }, [loadwolfpack_comments]);

  return {
    wolfpack_comments,
    loading,
    error,
    addComment,
    editComment,
    removeComment,
    loadReplies,
    refetch,
    commentCount,
  };
}
