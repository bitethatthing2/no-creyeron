import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";

type WolfpackVideo =
  & Database["public"]["Tables"]["content_posts"]["Row"]
  & {
    user?: Pick<
      Database["public"]["Tables"]["users"]["Row"],
      "id" | "first_name" | "last_name" | "avatar_url" | "display_name"
    >;
    like_count?: number;
    comment_count?: number;
    user_liked?: boolean;
  };

type WolfpackVideoInsert =
  Database["public"]["Tables"]["content_posts"]["Insert"];
type WolfpackVideoUpdate =
  Database["public"]["Tables"]["content_posts"]["Update"];

export async function getFeedcontent_posts(
  limit = 20,
  offset = 0,
): Promise<WolfpackVideo[]> {
  // Verify authentication first
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("[AUTH] User not authenticated for feed fetch");
    throw new Error("Authentication required");
  }

  // Now make the query - RLS policies will use auth.uid()
  const { data, error } = await supabase
    .from("content_posts")
    .select(`
      *,
      user:users!content_posts_user_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching feed content_posts:", error);
    throw new Error(`Failed to fetch feed content_posts: ${error.message}`);
  }

  return data || [];
}

export async function getPost(postId: string): Promise<WolfpackVideo | null> {
  const { data, error } = await supabase
    .from("content_posts")
    .select(`
      *,
      user:users!content_posts_user_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name
      )
    `)
    .eq("id", postId)
    .eq("is_active", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Post not found
    }
    console.error("Error fetching post:", error);
    throw new Error(`Failed to fetch post: ${error.message}`);
  }

  return data;
}

export async function getUsercontent_posts(
  conversationid: string,
  limit = 20,
  offset = 0,
): Promise<WolfpackVideo[]> {
  const { data, error } = await supabase
    .from("content_posts")
    .select(`
      *,
      user:users!content_posts_user_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name
      )
    `)
    .eq("user_id", conversationid)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching user content_posts:", error);
    throw new Error(`Failed to fetch user content_posts: ${error.message}`);
  }

  return data || [];
}

export async function createPost(postData: {
  title?: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
}): Promise<WolfpackVideo> {
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
    throw new Error(
      `Error fetching user profile: ${userError?.message || "User not found"}`,
    );
  }

  const insertData: WolfpackVideoInsert = {
    user_id: publicUser.id, // Use the public user ID, not auth user ID
    title: postData.title || null,
    description: postData.description || null,
    video_url: postData.video_url,
    thumbnail_url: postData.thumbnail_url || null,
    duration: postData.duration || null,
    is_active: true,
    view_count: 0,
    like_count: 0,
  };

  const { data, error } = await supabase
    .from("content_posts")
    .insert(insertData)
    .select(`
      *,
      user:users!content_posts_user_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name
      )
    `)
    .single();

  if (error) {
    console.error("Error creating post:", error);
    throw new Error(`Failed to create post: ${error.message}`);
  }

  return data;
}

export async function updatePost(
  postId: string,
  updates: Pick<WolfpackVideoUpdate, "title" | "description" | "thumbnail_url">,
): Promise<WolfpackVideo> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("content_posts")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("user_id", user.id) // Ensure user owns the post
    .select(`
      *,
      user:users!content_posts_user_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name
      )
    `)
    .single();

  if (error) {
    console.error("Error updating post:", error);
    throw new Error(`Failed to update post: ${error.message}`);
  }

  return data;
}

export async function deletePost(postId: string): Promise<boolean> {
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
    throw new Error(
      `Error fetching user profile: ${userError?.message || "User not found"}`,
    );
  }

  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from("content_posts")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("user_id", publicUser.id); // Use the correct public user ID

  if (error) {
    console.error("Error deleting post:", error);
    throw new Error(`Failed to delete post: ${error.message}`);
  }

  return true;
}

export async function incrementViewCount(postId: string): Promise<void> {
  const { error } = await supabase.rpc("increment_view_count", {
    video_id: postId,
  });

  if (error) {
    console.error("Error incrementing view count:", error);
    // Don't throw error for view count failures as it's not critical
  }
}

export async function getcontent_poststats(postId: string): Promise<{
  views: number;
  likes: number;
  content_comments: number;
}> {
  // Get post basic stats
  const { data: post, error: postError } = await supabase
    .from("content_posts")
    .select("view_count, like_count")
    .eq("id", postId)
    .single();

  if (postError) {
    console.error("Error fetching post stats:", postError);
    return { views: 0, likes: 0, content_comments: 0 };
  }

  // Get comment count
  const { count: commentCount, error: commentError } = await supabase
    .from("content_comments")
    .select("*", { count: "exact", head: true })
    .eq("video_id", postId);

  if (commentError) {
    console.error("Error fetching comment count:", commentError);
  }

  return {
    views: post.view_count || 0,
    likes: post.like_count || 0,
    content_comments: commentCount || 0,
  };
}
