import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";

type ContentPost =
  & Database["public"]["Tables"]["content_posts"]["Row"]
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
    user_liked?: boolean;
  };

type ContentPostInsert =
  Database["public"]["Tables"]["content_posts"]["Insert"];
type ContentPostUpdate =
  Database["public"]["Tables"]["content_posts"]["Update"];

export async function getFeedPosts(
  limit = 20,
  offset = 0,
): Promise<ContentPost[]> {
  // Verify authentication first
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("[AUTH] User not authenticated for feed fetch");
    throw new Error("Authentication required");
  }

  // Get the public user profile using the auth ID
  const { data: publicUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  // Fetch posts with user information and check if current user liked
  const { data, error } = await supabase
    .from("content_posts")
    .select(`
      *,
      user:users!content_posts_user_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name,
        username
      )
    `)
    .eq("is_active", true)
    .eq("visibility", "public") // Only fetch public posts for feed
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching feed posts:", error);
    throw new Error(`Failed to fetch feed posts: ${error.message}`);
  }

  // If user is logged in, check which posts they liked
  if (publicUser && data) {
    const postIds = data.map((post) => post.id);

    const { data: userInteractions } = await supabase
      .from("user_post_interactions")
      .select("post_id, has_liked")
      .eq("user_id", publicUser.id)
      .in("post_id", postIds);

    // Map the liked status to posts
    const likedMap = new Map(
      userInteractions?.map((i) => [i.post_id, i.has_liked]) || [],
    );

    return data.map((post) => ({
      ...post,
      user_liked: likedMap.get(post.id) || false,
    }));
  }

  return data || [];
}

export async function getPost(postId: string): Promise<ContentPost | null> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("content_posts")
    .select(`
      *,
      user:users!content_posts_user_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name,
        username
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

  // Check if current user liked this post
  if (user && data) {
    const { data: publicUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (publicUser) {
      const { data: interaction } = await supabase
        .from("user_post_interactions")
        .select("has_liked")
        .eq("user_id", publicUser.id)
        .eq("post_id", postId)
        .maybeSingle();

      return {
        ...data,
        user_liked: interaction?.has_liked || false,
      };
    }
  }

  return data;
}

export async function getUserPosts(
  userId: string,
  limit = 20,
  offset = 0,
): Promise<ContentPost[]> {
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("content_posts")
    .select(`
      *,
      user:users!content_posts_user_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name,
        username
      )
    `)
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching user posts:", error);
    throw new Error(`Failed to fetch user posts: ${error.message}`);
  }

  // Check which posts current user liked
  if (currentUser && data) {
    const { data: publicUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", currentUser.id)
      .single();

    if (publicUser) {
      const postIds = data.map((post) => post.id);

      const { data: userInteractions } = await supabase
        .from("user_post_interactions")
        .select("post_id, has_liked")
        .eq("user_id", publicUser.id)
        .in("post_id", postIds);

      const likedMap = new Map(
        userInteractions?.map((i) => [i.post_id, i.has_liked]) || [],
      );

      return data.map((post) => ({
        ...post,
        user_liked: likedMap.get(post.id) || false,
      }));
    }
  }

  return data || [];
}

export async function createPost(postData: {
  title?: string;
  caption?: string;
  description?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  post_type?: "video" | "image" | "text" | "carousel";
  images?: string[];
  tags?: string[];
  visibility?: "public" | "followers" | "private";
  allow_comments?: boolean;
  allow_duets?: boolean;
  allow_stitches?: boolean;
  location_tag?: string;
  location_lat?: number;
  location_lng?: number;
}): Promise<ContentPost> {
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

  const insertData: ContentPostInsert = {
    user_id: publicUser.id,
    title: postData.title || null,
    caption: postData.caption || null,
    description: postData.description || null,
    video_url: postData.video_url || null,
    thumbnail_url: postData.thumbnail_url || null,
    duration_seconds: postData.duration_seconds || null,
    post_type: postData.post_type || "video",
    images: postData.images || null,
    tags: postData.tags || [],
    visibility: postData.visibility || "public",
    allow_comments: postData.allow_comments !== false,
    allow_duets: postData.allow_duets !== false,
    allow_stitches: postData.allow_stitches !== false,
    location_tag: postData.location_tag || null,
    location_lat: postData.location_lat || null,
    location_lng: postData.location_lng || null,
    is_active: true,
    views_count: 0,
    likes_count: 0,
    comments_count: 0,
    shares_count: 0,
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
        display_name,
        username
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
  updates: Partial<
    Pick<
      ContentPostUpdate,
      | "title"
      | "caption"
      | "description"
      | "thumbnail_url"
      | "tags"
      | "visibility"
      | "allow_comments"
      | "allow_duets"
      | "allow_stitches"
      | "location_tag"
      | "location_lat"
      | "location_lng"
    >
  >,
): Promise<ContentPost> {
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
    .from("content_posts")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("user_id", publicUser.id) // Ensure user owns the post
    .select(`
      *,
      user:users!content_posts_user_id_fkey(
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
    .eq("user_id", publicUser.id);

  if (error) {
    console.error("Error deleting post:", error);
    throw new Error(`Failed to delete post: ${error.message}`);
  }

  return true;
}

export async function incrementViewCount(postId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  try {
    if (user) {
      // Get public user ID
      const { data: publicUser } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (publicUser) {
        // Use the RPC function that accepts an array of post IDs
        const { error } = await supabase.rpc("increment_view_counts", {
          post_ids: [postId],
          user_id_param: publicUser.id,
        });

        if (error) {
          console.error("Error calling increment_view_counts RPC:", error);
          // Fallback to direct update
          await fallbackIncrementView(postId);
        }
      } else {
        // User not found, just increment the view count
        await fallbackIncrementView(postId);
      }
    } else {
      // Anonymous user, just increment the view count
      await fallbackIncrementView(postId);
    }
  } catch (error) {
    console.error("Error incrementing view count:", error);
    // Don't throw error for view count failures as it's not critical
  }
}

async function fallbackIncrementView(postId: string): Promise<void> {
  // Direct update fallback
  // Fetch current views_count, increment, and update
  const { data: post, error: fetchError } = await supabase
    .from("content_posts")
    .select("views_count")
    .eq("id", postId)
    .single();

  if (fetchError) {
    console.error("Error fetching current views_count:", fetchError);
    return;
  }

  const newViewsCount = (post?.views_count || 0) + 1;

  const { error } = await supabase
    .from("content_posts")
    .update({
      views_count: newViewsCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) {
    console.error("Fallback view increment failed:", error);
  }
}

export async function getPostStats(postId: string): Promise<{
  views: number;
  likes: number;
  comments: number;
  shares: number;
}> {
  // Get post stats from the denormalized counts
  const { data: post, error: postError } = await supabase
    .from("content_posts")
    .select("views_count, likes_count, comments_count, shares_count")
    .eq("id", postId)
    .single();

  if (postError) {
    console.error("Error fetching post stats:", postError);
    return { views: 0, likes: 0, comments: 0, shares: 0 };
  }

  return {
    views: post.views_count || 0,
    likes: post.likes_count || 0,
    comments: post.comments_count || 0,
    shares: post.shares_count || 0,
  };
}

export async function getTrendingPosts(
  limit = 20,
  offset = 0,
): Promise<ContentPost[]> {
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch trending posts based on trending_score and algorithm_boost
  const { data, error } = await supabase
    .from("content_posts")
    .select(`
      *,
      user:users!content_posts_user_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name,
        username
      )
    `)
    .eq("is_active", true)
    .eq("visibility", "public")
    .order("trending_score", { ascending: false })
    .order("algorithm_boost", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching trending posts:", error);
    throw new Error(`Failed to fetch trending posts: ${error.message}`);
  }

  // Check which posts current user liked
  if (user && data) {
    const { data: publicUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (publicUser) {
      const postIds = data.map((post) => post.id);

      const { data: userInteractions } = await supabase
        .from("user_post_interactions")
        .select("post_id, has_liked")
        .eq("user_id", publicUser.id)
        .in("post_id", postIds);

      const likedMap = new Map(
        userInteractions?.map((i) => [i.post_id, i.has_liked]) || [],
      );

      return data.map((post) => ({
        ...post,
        user_liked: likedMap.get(post.id) || false,
      }));
    }
  }

  return data || [];
}

export async function getFeaturedPosts(
  limit = 10,
): Promise<ContentPost[]> {
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch featured posts
  const { data, error } = await supabase
    .from("content_posts")
    .select(`
      *,
      user:users!content_posts_user_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name,
        username
      )
    `)
    .eq("is_active", true)
    .eq("is_featured", true)
    .eq("visibility", "public")
    .order("featured_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching featured posts:", error);
    throw new Error(`Failed to fetch featured posts: ${error.message}`);
  }

  // Check which posts current user liked
  if (user && data) {
    const { data: publicUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (publicUser) {
      const postIds = data.map((post) => post.id);

      const { data: userInteractions } = await supabase
        .from("user_post_interactions")
        .select("post_id, has_liked")
        .eq("user_id", publicUser.id)
        .in("post_id", postIds);

      const likedMap = new Map(
        userInteractions?.map((i) => [i.post_id, i.has_liked]) || [],
      );

      return data.map((post) => ({
        ...post,
        user_liked: likedMap.get(post.id) || false,
      }));
    }
  }

  return data || [];
}

export async function sharePost(postId: string): Promise<void> {
  // Increment share count
  // Fetch current shares_count
  const { data: post, error: fetchError } = await supabase
    .from("content_posts")
    .select("shares_count")
    .eq("id", postId)
    .single();

  if (fetchError) {
    console.error("Error fetching current share count:", fetchError);
    throw new Error(`Failed to share post: ${fetchError.message}`);
  }

  const newSharesCount = (post?.shares_count || 0) + 1;

  const { error } = await supabase
    .from("content_posts")
    .update({
      shares_count: newSharesCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) {
    console.error("Error incrementing share count:", error);
    throw new Error(`Failed to share post: ${error.message}`);
  }
}
