import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";

type PostLike = Database["public"]["Tables"]["wolfpack_post_likes"]["Row"];
type PostLikeInsert =
  Database["public"]["Tables"]["wolfpack_post_likes"]["Insert"];

export async function togglePostLike(
  postId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  console.log("Auth check:", { user: !!user, userId: user?.id, authError });

  if (!user) {
    throw new Error("User not authenticated");
  }

  console.log("Toggling like for post:", postId, "by user:", user.id);

  // Check if already liked
  console.log("Checking for existing like...");
  const { data: existingLike, error: fetchError } = await supabase
    .from("wolfpack_post_likes")
    .select("id")
    .eq("video_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  console.log("Existing like check result:", { existingLike, fetchError });

  if (fetchError) {
    console.error("Error checking existing like:", fetchError);
    throw new Error(`Failed to check like status: ${fetchError.message}`);
  }

  let liked = false;

  if (existingLike) {
    // Unlike - remove the like
    const { error: deleteError } = await supabase
      .from("wolfpack_post_likes")
      .delete()
      .eq("video_id", postId)
      .eq("user_id", user.id); // Use composite key for safety

    if (deleteError) {
      console.error("Error removing like:", deleteError);
      throw new Error(`Failed to remove like: ${deleteError.message}`);
    }

    liked = false;
  } else {
    // Like - add new like with proper error handling for 409 Conflict
    const likeData: PostLikeInsert = {
      video_id: postId,
      user_id: user.id,
    };

    console.log("Inserting new like:", likeData);
    const { data: insertData, error: insertError } = await supabase
      .from("wolfpack_post_likes")
      .insert(likeData)
      .select();

    console.log("Insert result:", { insertData, insertError });

    if (insertError) {
      // Log the full error for debugging
      console.log("Full insert error:", JSON.stringify(insertError, null, 2));
      console.log("Error properties:", Object.keys(insertError));
      console.log("Error code:", insertError.code);
      console.log("Error message:", insertError.message);
      console.log("Error details:", insertError.details);

      // Handle various forms of unique constraint violations
      const errorMessage = insertError.message?.toLowerCase() || "";
      const errorCode = insertError.code || "";
      const errorDetails = insertError.details?.toLowerCase() || "";

      const isUniqueConstraintError = errorCode === "23505" || // PostgreSQL unique violation
        errorMessage.includes("409") || // HTTP 409 Conflict
        errorMessage.includes("duplicate") || // Duplicate key
        errorMessage.includes("unique") || // Unique constraint
        errorDetails.includes("duplicate") || // Details might have more info
        errorDetails.includes("unique") || // Details might have constraint info
        errorMessage.includes(
          "wolfpack_post_likes_video_id_user_id_key",
        ) || // Specific constraint name
        errorDetails.includes(
          "wolfpack_post_likes_video_id_user_id_key",
        ); // Or in details

      const isForeignKeyError = errorCode === "23503" && // Foreign key violation
        errorDetails.includes("key is not present in table"); // Post doesn't exist

      const isTableNotFoundError = errorCode === "42P01" && // Table not found
        errorMessage.includes("relation") &&
        errorMessage.includes("does not exist");

      if (isUniqueConstraintError) {
        console.log(
          "User already liked this post (409/duplicate conflict handled)",
        );
        liked = true;
      } else if (isForeignKeyError) {
        console.error(
          "Foreign key error - Post does not exist in referenced table:",
          insertError,
        );
        throw new Error(
          `Post not found - the video you're trying to like may have been deleted or the database structure needs to be updated`,
        );
      } else if (isTableNotFoundError) {
        console.error(
          "Table not found error - Database schema issue:",
          insertError,
        );
        throw new Error(
          `Database error: ${errorMessage}. The database schema may need to be updated.`,
        );
      } else {
        console.error("Error adding like:", insertError);
        // Provide more detailed error message
        const errorMsg = insertError.message || insertError.details ||
          "Unknown error occurred";
        throw new Error(`Failed to add like: ${errorMsg}`);
      }
    } else {
      liked = true;
    }
  }

  // Get updated like count
  const likeCount = await getLikeCount(postId);

  return { liked, likeCount };
}

export async function checkIfUserLikedPost(postId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("wolfpack_post_likes")
    .select("id")
    .eq("video_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error checking if user liked post:", error);
    return false;
  }

  return !!data;
}

export async function getLikeCount(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from("wolfpack_post_likes")
    .select("*", { count: "exact", head: true })
    .eq("video_id", postId);

  if (error) {
    console.error("Error getting like count:", error);
    return 0;
  }

  return count || 0;
}

export async function getUsersWhoLiked(
  postId: string,
  limit = 10,
): Promise<
  Array<
    Pick<
      Database["public"]["Tables"]["users"]["Row"],
      "id" | "first_name" | "last_name" | "avatar_url" | "display_name"
    >
  >
> {
  const { data, error } = await supabase
    .from("wolfpack_post_likes")
    .select(`
      user:users!user_id(
        id,
        first_name,
        last_name,
        avatar_url,
        display_name
      )
    `)
    .eq("video_id", postId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching users who liked:", error);
    return [];
  }

  return data?.map((item) => item.user).filter(Boolean) as any[] || [];
}

export async function getLikeStats(postId: string): Promise<{
  count: number;
  userLiked: boolean;
  recentLikers: Array<
    Pick<
      Database["public"]["Tables"]["users"]["Row"],
      "id" | "first_name" | "last_name" | "avatar_url" | "display_name"
    >
  >;
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
