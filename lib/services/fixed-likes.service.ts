// Fixed Likes Service - Works with wolfpack_post_likes table
import { createClient } from "@supabase/supabase-js";

export class FixedLikesService {
  private supabase: any = null;

  constructor() {
    this.initSupabase();
  }

  private async initSupabase() {
    if (this.supabase) return this.supabase;

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    return this.supabase;
  }

  private async getCurrentUserId() {
    if (!this.supabase) await this.initSupabase();

    const { data: { user }, error: authError } = await this.supabase.auth
      .getUser();
    if (authError) {
      throw new Error(`Authentication error: ${authError.message}`);
    }
    if (!user) throw new Error("Not authenticated");

    const { data: userData, error: userError } = await this.supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (userError) throw new Error(`User lookup error: ${userError.message}`);
    if (!userData) throw new Error("User profile not found");

    return userData.id;
  }

  // Video Likes using the correct wolfpack_post_likes table
  async toggleVideoLike(videoId: string) {
    try {
      if (!videoId || typeof videoId !== "string") {
        throw new Error("Invalid video ID provided");
      }

      if (!this.supabase) await this.initSupabase();

      const userId = await this.getCurrentUserId();

      // Check if like exists using maybeSingle to avoid errors
      const { data: existingLike, error: checkError } = await this.supabase
        .from("wolfpack_post_likes")
        .select("id")
        .eq("video_id", videoId)
        .eq("user_id", userId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking like status:", checkError);
        throw new Error(`Failed to check like status: ${checkError.message}`);
      }

      if (existingLike) {
        // Remove like
        const { error: deleteError } = await this.supabase
          .from("wolfpack_post_likes")
          .delete()
          .eq("video_id", videoId)
          .eq("user_id", userId);

        if (deleteError) {
          console.error("Error removing like:", deleteError);
          throw new Error(`Failed to remove like: ${deleteError.message}`);
        }

        // Update video like count (decrement)
        try {
          await this.supabase.rpc("decrement_video_likes", {
            video_id: videoId,
          });
        } catch (rpcError) {
          console.warn(
            "RPC function not available, updating manually:",
            rpcError,
          );
          // Fallback: update like_count directly
          const { error: updateError } = await this.supabase
            .from("wolfpack_videos")
            .update({
              like_count: this.supabase.sql`GREATEST(0, like_count - 1)`,
            })
            .eq("id", videoId);

          if (updateError) {
            console.error("Error updating like count:", updateError);
          }
        }

        console.log("Successfully removed like for video:", videoId);
        return { liked: false, action: "removed" };
      } else {
        // Add like
        const { error: insertError } = await this.supabase
          .from("wolfpack_post_likes")
          .insert({ video_id: videoId, user_id: userId });

        if (insertError) {
          console.error("Error adding like:", insertError);

          // Handle specific errors
          if (insertError.code === "23505") {
            // Duplicate key - already liked
            console.log("Video already liked by user");
            return { liked: true, action: "already_liked" };
          }

          throw new Error(`Failed to add like: ${insertError.message}`);
        }

        // Update video like count (increment)
        try {
          await this.supabase.rpc("increment_video_likes", {
            video_id: videoId,
          });
        } catch (rpcError) {
          console.warn(
            "RPC function not available, updating manually:",
            rpcError,
          );
          // Fallback: update like_count directly
          const { error: updateError } = await this.supabase
            .from("wolfpack_videos")
            .update({ like_count: this.supabase.sql`like_count + 1` })
            .eq("id", videoId);

          if (updateError) {
            console.error("Error updating like count:", updateError);
          }
        }

        console.log("Successfully added like for video:", videoId);
        return { liked: true, action: "added" };
      }
    } catch (error) {
      console.error("Error toggling video like:", error);
      throw error;
    }
  }

  // Comment Likes
  async toggleCommentLike(commentId: string) {
    try {
      if (!commentId || typeof commentId !== "string") {
        throw new Error("Invalid comment ID provided");
      }

      if (!this.supabase) await this.initSupabase();

      const userId = await this.getCurrentUserId();

      // Check if like exists
      const { data: existingLike, error: checkError } = await this.supabase
        .from("wolfpack_comment_reactions")
        .select("id")
        .eq("comment_id", commentId)
        .eq("user_id", userId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking comment like status:", checkError);
        throw new Error(
          `Failed to check comment like status: ${checkError.message}`,
        );
      }

      if (existingLike) {
        // Remove like
        const { error: deleteError } = await this.supabase
          .from("wolfpack_comment_reactions")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", userId);

        if (deleteError) {
          console.error("Error removing comment like:", deleteError);
          throw new Error(
            `Failed to remove comment like: ${deleteError.message}`,
          );
        }

        console.log("Successfully removed comment like:", commentId);
        return { liked: false, action: "removed" };
      } else {
        // Add like
        const { error: insertError } = await this.supabase
          .from("wolfpack_comment_reactions")
          .insert({
            comment_id: commentId,
            user_id: userId,
            reaction_type: "❤️",
          });

        if (insertError) {
          console.error("Error adding comment like:", insertError);

          if (insertError.code === "23505") {
            console.log("Comment already liked by user");
            return { liked: true, action: "already_liked" };
          }

          throw new Error(`Failed to add comment like: ${insertError.message}`);
        }

        console.log("Successfully added comment like:", commentId);
        return { liked: true, action: "added" };
      }
    } catch (error) {
      console.error("Error toggling comment like:", error);
      throw error;
    }
  }

  async getLikeCount(videoId: string): Promise<number> {
    try {
      if (!videoId || typeof videoId !== "string") {
        console.error("Invalid video ID for like count");
        return 0;
      }

      if (!this.supabase) await this.initSupabase();

      const { count, error } = await this.supabase
        .from("wolfpack_post_likes")
        .select("*", { count: "exact", head: true })
        .eq("video_id", videoId);

      if (error) {
        console.error("Error getting like count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Error getting like count:", error);
      return 0;
    }
  }

  async isLikedByUser(videoId: string, userId?: string): Promise<boolean> {
    try {
      if (!videoId || typeof videoId !== "string") {
        console.error("Invalid video ID for like check");
        return false;
      }

      if (!this.supabase) await this.initSupabase();

      if (!userId) {
        try {
          userId = await this.getCurrentUserId();
        } catch (error) {
          // Not authenticated
          return false;
        }
      }

      const { data, error } = await this.supabase
        .from("wolfpack_post_likes")
        .select("id")
        .eq("video_id", videoId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error checking like status:", error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error("Error checking like status:", error);
      return false;
    }
  }

  async getLikeStats(videoId: string) {
    try {
      if (!this.supabase) await this.initSupabase();

      const [count, isLiked] = await Promise.all([
        this.getLikeCount(videoId),
        this.isLikedByUser(videoId),
      ]);

      return {
        count,
        liked: isLiked,
      };
    } catch (error) {
      console.error("Error getting like stats:", error);
      return {
        count: 0,
        liked: false,
      };
    }
  }
}
