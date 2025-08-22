import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";

type PostLike = Database["public"]["Tables"]["content_reactions"]["Row"];
type PostLikeInsert =
  Database["public"]["Tables"]["content_reactions"]["Insert"];

/**
 * Alternative implementation using upsert to handle 409 conflicts gracefully
 * This approach is more robust for handling the unique constraint
 */
export async function togglePostLikeUpsert(
  postId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // First, check current state
  const { data: existingLike } = await supabase
    .from("content_reactions")
    .select("id")
    .eq("content_id", postId)
    .eq("content_type", "video")
    .eq("reaction_type", "like")
    .eq("user_id", user.id)
    .maybeSingle();

  let liked = false;

  if (existingLike) {
    // Unlike - remove the like
    const { error } = await supabase
      .from("content_reactions")
      .delete()
      .eq("content_id", postId)
      .eq("content_type", "video")
      .eq("reaction_type", "like")
      .eq("user_id", user.id);

    if (error) {
      throw new Error(`Failed to remove like: ${error.message}`);
    }
    liked = false;
  } else {
    // Like - use upsert to handle conflicts
    const { error } = await supabase
      .from("content_reactions")
      .upsert(
        {
          content_id: postId,
          content_type: "video",
          reaction_type: "like",
          user_id: user.id,
        },
        {
          onConflict: "content_id,content_type,reaction_type,user_id",
          ignoreDuplicates: false,
        },
      );

    if (error) {
      throw new Error(`Failed to add like: ${error.message}`);
    }
    liked = true;
  }

  // Get updated like count
  const { count } = await supabase
    .from("content_reactions")
    .select("*", { count: "exact", head: true })
    .eq("content_id", postId)
    .eq("content_type", "video")
    .eq("reaction_type", "like");

  return { liked, likeCount: count || 0 };
}

/**
 * Even simpler approach - let Supabase handle the logic with a stored procedure
 */
export async function togglePostLikeRPC(
  postId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    // Call a custom RPC function that handles the toggle logic
    const { data, error } = await supabase
      .rpc("toggle_post_like", {
        p_video_id: postId,
        p_user_id: user.id,
      });

    if (error) {
      throw new Error(`Failed to toggle like: ${error.message}`);
    }

    return {
      liked: data.liked,
      likeCount: data.like_count,
    };
  } catch (error) {
    // Fallback to manual approach if RPC doesn't exist
    console.warn(
      "RPC toggle_post_like not available, falling back to manual approach",
    );
    return togglePostLikeUpsert(postId);
  }
}

/**
 * Batch operation to handle multiple likes efficiently
 */
export async function batchToggleLikes(
  postIds: string[],
): Promise<Array<{ postId: string; liked: boolean; likeCount: number }>> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const results = [];

  for (const postId of postIds) {
    try {
      const result = await togglePostLikeUpsert(postId);
      results.push({ postId, ...result });
    } catch (error) {
      console.error(`Error toggling like for post ${postId}:`, error);
      results.push({ postId, liked: false, likeCount: 0 });
    }
  }

  return results;
}

/*
SQL for the RPC function (to be created in Supabase):

CREATE OR REPLACE FUNCTION toggle_post_like(p_video_id uuid, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  like_exists boolean;
  like_count_result integer;
  result json;
BEGIN
  -- Check if like exists
  SELECT EXISTS(
    SELECT 1 FROM wolfpack_post_likes
    WHERE video_id = p_video_id AND user_id = p_user_id
  ) INTO like_exists;

  IF like_exists THEN
    -- Remove like
    DELETE FROM wolfpack_post_likes
    WHERE video_id = p_video_id AND user_id = p_user_id;

    -- Get updated count
    SELECT COUNT(*) INTO like_count_result
    FROM wolfpack_post_likes
    WHERE video_id = p_video_id;

    result := json_build_object('liked', false, 'like_count', like_count_result);
  ELSE
    -- Add like
    INSERT INTO wolfpack_post_likes (video_id, user_id)
    VALUES (p_video_id, p_user_id)
    ON CONFLICT (video_id, user_id) DO NOTHING;

    -- Get updated count
    SELECT COUNT(*) INTO like_count_result
    FROM wolfpack_post_likes
    WHERE video_id = p_video_id;

    result := json_build_object('liked', true, 'like_count', like_count_result);
  END IF;

  RETURN result;
END;
$$;
*/
