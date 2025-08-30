import { supabase } from "@/lib/supabase";

export async function togglePostLike(
  postId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  console.log("Auth check:", {
    user: !!user,
    userId: user?.id,
    authError,
  });

  if (!user) {
    throw new Error("User not authenticated");
  }

  console.log("Toggling like for post:", postId, "by user:", user.id);

  // Check if interaction record exists
  console.log("Checking for existing interaction...");
  const { data: existingInteraction, error: fetchError } = await supabase
    .from("user_post_interactions")
    .select("id, has_liked, liked_at")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  console.log("Existing interaction check result:", {
    existingInteraction,
    fetchError,
  });

  if (fetchError) {
    console.error("Error checking existing interaction:", fetchError);
    throw new Error(`Failed to check like status: ${fetchError.message}`);
  }

  let liked = false;
  let newLikeCount = 0;

  try {
    if (existingInteraction) {
      // Record exists - toggle the like status
      const newLikedStatus = !existingInteraction.has_liked;

      const { error: updateError } = await supabase
        .from("user_post_interactions")
        .update({
          has_liked: newLikedStatus,
          liked_at: newLikedStatus ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingInteraction.id);

      if (updateError) {
        console.error("Error updating like status:", updateError);
        throw new Error(`Failed to update like status: ${updateError.message}`);
      }

      liked = newLikedStatus;

      // Update the likes_count on the post
      const { data: currentPost, error: postFetchError } = await supabase
        .from("content_posts")
        .select("likes_count")
        .eq("id", postId)
        .single();

      if (!postFetchError && currentPost) {
        const currentCount = currentPost.likes_count || 0;
        newLikeCount = liked ? currentCount + 1 : Math.max(0, currentCount - 1);

        const { error: countUpdateError } = await supabase
          .from("content_posts")
          .update({ likes_count: newLikeCount })
          .eq("id", postId);

        if (countUpdateError) {
          console.error("Error updating likes count:", countUpdateError);
        }
      }
    } else {
      // No record exists - create a new one with like
      const interactionData = {
        user_id: user.id,
        post_id: postId,
        has_liked: true,
        liked_at: new Date().toISOString(),
        has_viewed: false,
        view_count: 0,
      };

      console.log("Creating new interaction:", interactionData);
      const { data: insertData, error: insertError } = await supabase
        .from("user_post_interactions")
        .insert(interactionData)
        .select();

      console.log("Insert result:", { insertData, insertError });

      if (insertError) {
        // Handle duplicate key error (race condition)
        const errorCode = insertError.code || "";
        const errorMessage = insertError.message?.toLowerCase() || "";

        if (
          errorCode === "23505" || errorMessage.includes("duplicate") ||
          errorMessage.includes("unique")
        ) {
          // Race condition - record was created by another request
          // Try to fetch and update instead
          const { data: retryInteraction, error: retryFetchError } =
            await supabase
              .from("user_post_interactions")
              .select("id, has_liked")
              .eq("user_id", user.id)
              .eq("post_id", postId)
              .single();

          if (!retryFetchError && retryInteraction) {
            const { error: retryUpdateError } = await supabase
              .from("user_post_interactions")
              .update({
                has_liked: true,
                liked_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", retryInteraction.id);

            if (!retryUpdateError) {
              liked = true;
            }
          }
        } else {
          console.error("Error creating interaction:", insertError);
          throw new Error(`Failed to add like: ${insertError.message}`);
        }
      } else {
        liked = true;
      }

      // Update the likes_count on the post
      const { data: currentPost, error: postFetchError } = await supabase
        .from("content_posts")
        .select("likes_count")
        .eq("id", postId)
        .single();

      if (!postFetchError && currentPost) {
        newLikeCount = (currentPost.likes_count || 0) + 1;

        const { error: countUpdateError } = await supabase
          .from("content_posts")
          .update({ likes_count: newLikeCount })
          .eq("id", postId);

        if (countUpdateError) {
          console.error("Error updating likes count:", countUpdateError);
        }
      }
    }
  } catch (error) {
    console.error("Error in togglePostLike:", error);
    throw error;
  }

  // Get the final like count
  const likeCount = await getLikeCount(postId);

  return { liked, likeCount };
}

export async function checkIfUserLikedPost(postId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("user_post_interactions")
    .select("has_liked")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (error) {
    console.error("Error checking if user liked post:", error);
    return false;
  }

  return data?.has_liked || false;
}

export async function getLikeCount(postId: string): Promise<number> {
  // Get the like count from the content_posts table (denormalized for performance)
  const { data, error } = await supabase
    .from("content_posts")
    .select("likes_count")
    .eq("id", postId)
    .single();

  if (error) {
    console.error("Error getting like count:", error);
    // Fallback: count from user_post_interactions
    const { count, error: countError } = await supabase
      .from("user_post_interactions")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId)
      .eq("has_liked", true);

    if (countError) {
      console.error("Error counting likes from interactions:", countError);
      return 0;
    }

    return count || 0;
  }

  return data?.likes_count || 0;
}

export async function getUsersWhoLiked(
  postId: string,
  limit = 10,
): Promise<
  Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    display_name: string | null;
  }>
> {
  const { data, error } = await supabase
    .from("user_post_interactions")
    .select(`
      user:users!user_post_interactions_user_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name
      )
    `)
    .eq("post_id", postId)
    .eq("has_liked", true)
    .order("liked_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching users who liked:", error);
    return [];
  }

  return (data?.flatMap((item) =>
    Array.isArray(item.user) ? item.user : [item.user]
  ).filter(
    (user): user is {
      id: string;
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
      display_name: string | null;
    } => user !== null,
  )) || [];
}

export async function getLikeStats(postId: string): Promise<{
  count: number;
  userLiked: boolean;
  recentLikers: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    display_name: string | null;
  }>;
}> {
  const [count, userLiked, recentLikers] = await Promise.all([
    getLikeCount(postId),
    checkIfUserLikedPost(postId),
    getUsersWhoLiked(postId, 5),
  ]);

  return {
    count,
    userLiked,
    recentLikers,
  };
}

// Additional utility function to track views
export async function trackPostView(postId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Anonymous view tracking could be implemented separately if needed
    return;
  }

  // Check if interaction exists
  const { data: existing, error: fetchError } = await supabase
    .from("user_post_interactions")
    .select("id, view_count")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (fetchError) {
    console.error("Error checking existing view:", fetchError);
    return;
  }

  if (existing) {
    // Update view count and timestamp
    const { error: updateError } = await supabase
      .from("user_post_interactions")
      .update({
        has_viewed: true,
        view_count: (existing.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error("Error updating view:", updateError);
    }
  } else {
    // Create new interaction record with view
    const { error: insertError } = await supabase
      .from("user_post_interactions")
      .insert({
        user_id: user.id,
        post_id: postId,
        has_viewed: true,
        view_count: 1,
        last_viewed_at: new Date().toISOString(),
        has_liked: false,
      });

    if (insertError && insertError.code !== "23505") {
      // Ignore duplicate key errors
      console.error("Error creating view record:", insertError);
    }
  }

  // Update view count on the post
  let postUpdateError = null;
  try {
    const { error } = await supabase.rpc(
      "increment_post_views",
      { post_id: postId },
    );
    postUpdateError = error;
    if (postUpdateError) {
      throw postUpdateError;
    }
  } catch (e) {
    // If RPC doesn't exist or fails, use regular update
    // Manually increment views_count since supabase.raw is not available
    const { data: postData, error: fetchPostError } = await supabase
      .from("content_posts")
      .select("views_count")
      .eq("id", postId)
      .single();

    if (!fetchPostError && postData) {
      const newViewsCount = (postData.views_count || 0) + 1;
      const { error } = await supabase
        .from("content_posts")
        .update({
          views_count: newViewsCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId);
      postUpdateError = error;
    } else {
      postUpdateError = fetchPostError;
    }
  }

  if (postUpdateError) {
    console.error("Error updating post view count:", postUpdateError);
  }
}
