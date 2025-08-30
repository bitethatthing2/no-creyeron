import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";

type Comment =
  & Database["public"]["Tables"]["content_comments"]["Row"]
  & {
    user?: Pick<
      Database["public"]["Tables"]["users"]["Row"],
      | "id"
      | "first_name"
      | "last_name"
      | "avatar_url"
      | "display_name"
      | "username"
    >;
    replies?: Comment[];
    reply_count?: number;
  };

type CommentInsert = Database["public"]["Tables"]["content_comments"]["Insert"];

export async function getCommentsForPost(
  postId: string,
  includeDeleted = false,
): Promise<Comment[]> {
  console.log("🔍 COMMENTS DEBUG: Loading comments for post:", postId);

  // Build query
  let query = supabase
    .from("content_comments")
    .select(`
      *,
      user:users!content_comments_user_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name,
        username
      )
    `)
    .eq("video_id", postId);

  // Filter out deleted comments unless specifically requested
  if (!includeDeleted) {
    query = query.eq("is_deleted", false);
  }

  // Order by created_at, with pinned comments first
  const { data, error } = await query
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching comments:", error);
    throw new Error(`Failed to fetch comments: ${error.message}`);
  }

  console.log("✅ COMMENTS DEBUG: Found", data?.length || 0, "comments");

  // Organize comments into a tree structure if needed
  if (data && data.length > 0) {
    return organizeCommentsTree(data);
  }

  return data || [];
}

export async function getRepliesForComment(
  commentId: string,
  includeDeleted = false,
): Promise<Comment[]> {
  let query = supabase
    .from("content_comments")
    .select(`
      *,
      user:users!content_comments_user_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name,
        username
      )
    `)
    .eq("parent_comment_id", commentId);

  if (!includeDeleted) {
    query = query.eq("is_deleted", false);
  }

  const { data, error } = await query
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching replies:", error);
    throw new Error(`Failed to fetch replies: ${error.message}`);
  }

  return data || [];
}

export async function createComment(
  postId: string,
  content: string,
  parentId?: string,
): Promise<Comment> {
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error("User not authenticated");
  }

  // Get the public user profile using the auth ID
  const { data: publicUser, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .single();

  if (userError || !publicUser) {
    throw new Error("User profile not found");
  }

  const commentData: CommentInsert = {
    video_id: postId,
    content: content.trim(),
    parent_comment_id: parentId || null,
    user_id: publicUser.id,
    is_deleted: false,
    is_edited: false,
    is_pinned: false,
    likes_count: 0,
  };

  const { data, error } = await supabase
    .from("content_comments")
    .insert(commentData)
    .select(`
      *,
      user:users!content_comments_user_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name,
        username
      )
    `)
    .single();

  if (error) {
    console.error("Error creating comment:", error);
    throw new Error(`Failed to create comment: ${error.message}`);
  }

  // Update the comment count on the post
  await updatePostCommentCount(postId);

  return data;
}

export async function updateComment(
  commentId: string,
  content: string,
): Promise<Comment> {
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error("User not authenticated");
  }

  // Get the public user profile
  const { data: publicUser, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .single();

  if (userError || !publicUser) {
    throw new Error("User profile not found");
  }

  const { data, error } = await supabase
    .from("content_comments")
    .update({
      content: content.trim(),
      is_edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", commentId)
    .eq("user_id", publicUser.id) // Ensure user owns the comment
    .select(`
      *,
      user:users!content_comments_user_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name,
        username
      )
    `)
    .single();

  if (error) {
    console.error("Error updating comment:", error);
    throw new Error(`Failed to update comment: ${error.message}`);
  }

  return data;
}

export async function deleteComment(
  commentId: string,
  hardDelete = false,
): Promise<void> {
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error("User not authenticated");
  }

  // Get the public user profile
  const { data: publicUser, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .single();

  if (userError || !publicUser) {
    throw new Error("User profile not found");
  }

  // First check if user owns the comment and get the video_id
  const { data: comment, error: fetchError } = await supabase
    .from("content_comments")
    .select("user_id, video_id")
    .eq("id", commentId)
    .single();

  if (fetchError) {
    throw new Error(`Comment not found: ${fetchError.message}`);
  }

  if (comment.user_id !== publicUser.id) {
    throw new Error("You can only delete your own comments");
  }

  if (hardDelete) {
    // Permanently delete the comment
    const { error } = await supabase
      .from("content_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Error deleting comment:", error);
      throw new Error(`Failed to delete comment: ${error.message}`);
    }
  } else {
    // Soft delete - just mark as deleted
    const { error } = await supabase
      .from("content_comments")
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId);

    if (error) {
      console.error("Error soft deleting comment:", error);
      throw new Error(`Failed to delete comment: ${error.message}`);
    }
  }

  // Update the comment count on the post
  if (comment.video_id) {
    await updatePostCommentCount(comment.video_id);
  }
}

export async function togglePinComment(
  commentId: string,
  postId: string,
): Promise<Comment> {
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error("User not authenticated");
  }

  // Get the public user profile
  const { data: publicUser, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .single();

  if (userError || !publicUser) {
    throw new Error("User profile not found");
  }

  // Check if user owns the post
  const { data: post, error: postError } = await supabase
    .from("content_posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  if (postError || !post) {
    throw new Error("Post not found");
  }

  if (post.user_id !== publicUser.id) {
    throw new Error("Only the post owner can pin comments");
  }

  // Get current pin status
  const { data: comment, error: commentError } = await supabase
    .from("content_comments")
    .select("is_pinned")
    .eq("id", commentId)
    .single();

  if (commentError || !comment) {
    throw new Error("Comment not found");
  }

  // Toggle pin status
  const { data, error } = await supabase
    .from("content_comments")
    .update({
      is_pinned: !comment.is_pinned,
      updated_at: new Date().toISOString(),
    })
    .eq("id", commentId)
    .select(`
      *,
      user:users!content_comments_user_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name,
        username
      )
    `)
    .single();

  if (error) {
    console.error("Error toggling pin status:", error);
    throw new Error(`Failed to pin/unpin comment: ${error.message}`);
  }

  return data;
}

export async function getCommentCount(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from("content_comments")
    .select("*", { count: "exact", head: true })
    .eq("video_id", postId)
    .eq("is_deleted", false); // Don't count deleted comments

  if (error) {
    console.error("Error getting comment count:", error);
    return 0;
  }

  return count || 0;
}

export async function likeComment(
  commentId: string,
): Promise<{ likes_count: number }> {
  const { data: comment, error: fetchError } = await supabase
    .from("content_comments")
    .select("likes_count")
    .eq("id", commentId)
    .single();

  if (fetchError) {
    throw new Error("Comment not found");
  }

  const newCount = (comment.likes_count || 0) + 1;

  const { error: updateError } = await supabase
    .from("content_comments")
    .update({
      likes_count: newCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", commentId);

  if (updateError) {
    throw new Error("Failed to like comment");
  }

  return { likes_count: newCount };
}

// Helper function to organize comments into a tree structure
function organizeCommentsTree(comments: Comment[]): Comment[] {
  const commentMap = new Map<string, Comment>();
  const rootComments: Comment[] = [];

  // First pass: create a map of all comments
  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Second pass: organize into tree
  comments.forEach((comment) => {
    const mappedComment = commentMap.get(comment.id)!;

    if (comment.parent_comment_id) {
      // This is a reply
      const parent = commentMap.get(comment.parent_comment_id);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(mappedComment);
      } else {
        // Parent not found, treat as root
        rootComments.push(mappedComment);
      }
    } else {
      // This is a root comment
      rootComments.push(mappedComment);
    }
  });

  // Add reply counts
  rootComments.forEach((comment) => {
    comment.reply_count = comment.replies?.length || 0;
  });

  return rootComments;
}

// Helper function to update the denormalized comment count on posts
async function updatePostCommentCount(postId: string): Promise<void> {
  const count = await getCommentCount(postId);

  const { error } = await supabase
    .from("content_posts")
    .update({
      comments_count: count,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) {
    console.error("Error updating post comment count:", error);
  }
}
