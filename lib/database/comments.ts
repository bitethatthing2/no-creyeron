import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { UserService } from "@/lib/services/user.service";

type Comment =
  & Database["public"]["Tables"]["wolfpack_comments"]["Row"]
  & {
    user?: Pick<
      Database["public"]["Tables"]["users"]["Row"],
      "id" | "first_name" | "last_name" | "avatar_url" | "display_name"
    >;
    replies?: Comment[];
  };

type CommentInsert =
  Database["public"]["Tables"]["wolfpack_comments"]["Insert"];

export async function getwolfpack_commentsForPost(
  postId: string,
): Promise<Comment[]> {
  console.log('🔍 COMMENTS DEBUG: Loading comments for video:', postId);
  
  // Fetch ALL wolfpack_comments for this post (both root wolfpack_comments and replies)
  const { data, error } = await supabase
    .from("wolfpack_comments")
    .select(`
      *,
      user:users!user_id(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name
      )
    `)
    .eq("video_id", postId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching wolfpack_comments:", error);
    throw new Error(`Failed to fetch wolfpack_comments: ${error.message}`);
  }

  console.log('✅ COMMENTS DEBUG: Found', data?.length || 0, 'comments');
  return data || [];
}

export async function getRepliesForComment(
  commentId: string,
): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("wolfpack_comments")
    .select(`
      *,
      user:users!user_id(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name
      )
    `)
    .eq("parent_comment_id", commentId)
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
  // Use the centralized UserService to get public user ID
  const userService = new UserService(supabase);
  const publicUserId = await userService.getPublicUserId();

  if (!publicUserId) {
    throw new Error("User not authenticated or profile not found");
  }

  const commentData: CommentInsert = {
    video_id: postId,
    content: content.trim(),
    parent_comment_id: parentId || null,
    user_id: publicUserId, // Always use public user ID for foreign keys
  };

  const { data, error } = await supabase
    .from("wolfpack_comments")
    .insert(commentData)
    .select(`
      *,
      user:users!user_id(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name
      )
    `)
    .single();

  if (error) {
    console.error("Error creating comment:", error);
    throw new Error(`Failed to create comment: ${error.message}`);
  }

  return data;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // First check if user owns the comment
  const { data: comment, error: fetchError } = await supabase
    .from("wolfpack_comments")
    .select("user_id")
    .eq("id", commentId)
    .single();

  if (fetchError) {
    throw new Error(`Comment not found: ${fetchError.message}`);
  }

  if (comment.user_id !== user.id) {
    throw new Error("You can only delete your own wolfpack_comments");
  }

  const { error } = await supabase
    .from("wolfpack_comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    console.error("Error deleting comment:", error);
    throw new Error(`Failed to delete comment: ${error.message}`);
  }
}

export async function updateComment(
  commentId: string,
  content: string,
): Promise<Comment> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("wolfpack_comments")
    .update({
      content: content.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", commentId)
    .eq("user_id", user.id) // Ensure user owns the comment
    .select(`
      *,
      user:users!user_id(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name
      )
    `)
    .single();

  if (error) {
    console.error("Error updating comment:", error);
    throw new Error(`Failed to update comment: ${error.message}`);
  }

  return data;
}

export async function getCommentCount(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from("wolfpack_comments")
    .select("*", { count: "exact", head: true })
    .eq("video_id", postId);

  if (error) {
    console.error("Error getting comment count:", error);
    return 0;
  }

  return count || 0;
}
