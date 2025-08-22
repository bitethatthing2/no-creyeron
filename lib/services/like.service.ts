// Fixed Like Service
export class LikeService {
  constructor(private supabase: any) {}

  /**
   * Toggle like on a video - handles user ID conversion properly with enhanced error handling
   */
  async toggleLike(videoId: string) {
    try {
      // Validate input
      if (!videoId || typeof videoId !== "string") {
        throw new Error("Invalid video ID provided");
      }

      // Get current user's public ID with error handling
      const { data: { user: authUser }, error: authError } = await this.supabase
        .auth.getUser();
      if (authError) {
        console.error("Authentication error:", authError);
        throw new Error("Authentication failed");
      }

      if (!authUser) {
        throw new Error("User not authenticated");
      }

      const { data: publicUser, error: userError } = await this.supabase
        .from("users")
        .select("id")
        .eq("auth_id", authUser.id)
        .maybeSingle();

      if (userError) {
        console.error("User lookup error:", userError);
        throw new Error("Failed to find user profile");
      }

      if (!publicUser) {
        throw new Error("User profile not found");
      }

      // Check if already liked with error handling
      const { data: existingLike, error: likeCheckError } = await this.supabase
        .from("content_reactions")
        .select("id")
        .eq("content_id", videoId)
        .eq("content_type", "video")
        .eq("reaction_type", "like")
        .eq("user_id", publicUser.id)
        .maybeSingle(); // Use maybeSingle to avoid errors when no record exists

      if (likeCheckError) {
        console.error("Like check error:", likeCheckError);

        // Handle specific database errors
        if (likeCheckError.code === "42P01") {
          throw new Error("Like functionality is temporarily unavailable");
        } else if (likeCheckError.code === "23503") {
          throw new Error("Video not found");
        }

        throw new Error("Failed to check like status");
      }

      if (existingLike) {
        // Unlike with better error handling
        const { error: deleteError } = await this.supabase
          .from("content_reactions")
          .delete()
          .eq("id", existingLike.id);

        if (deleteError) {
          console.error("Unlike error:", deleteError);

          // Handle specific delete errors
          if (deleteError.code === "23503") {
            throw new Error("Cannot unlike - video may have been deleted");
          }

          throw new Error("Failed to remove like");
        }

        console.log("Successfully unliked video:", videoId);
        return { liked: false, action: "unliked" };
      } else {
        // Like with better error handling
        const { error: insertError } = await this.supabase
          .from("content_reactions")
          .insert({
            content_id: videoId,
            content_type: "video",
            reaction_type: "like",
            user_id: publicUser.id,
          });

        if (insertError) {
          console.error("Like error:", insertError);

          // Handle specific insert errors
          if (insertError.code === "23505") {
            // Duplicate key - already liked
            console.log("Video already liked by user");
            return { liked: true, action: "already_liked" };
          } else if (insertError.code === "23503") {
            throw new Error("Video not found or user invalid");
          } else if (insertError.code === "42P01") {
            throw new Error("Like functionality is temporarily unavailable");
          }

          throw new Error("Failed to add like");
        }

        console.log("Successfully liked video:", videoId);
        return { liked: true, action: "liked" };
      }
    } catch (error) {
      console.error("Error toggling like:", error);

      // Re-throw with user-friendly messages
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(
          "An unexpected error occurred while processing your like",
        );
      }
    }
  }

  /**
   * Get like status for a video with enhanced error handling
   */
  async getLikeStatus(videoId: string) {
    try {
      // Validate input
      if (!videoId || typeof videoId !== "string") {
        console.error("Invalid video ID provided for like status");
        return { liked: false, count: 0, error: "Invalid video ID" };
      }

      const { data: { user: authUser }, error: authError } = await this.supabase
        .auth.getUser();
      if (authError) {
        console.error("Authentication error in getLikeStatus:", authError);
        return { liked: false, count: 0, error: "Authentication failed" };
      }

      if (!authUser) {
        console.log("No authenticated user for like status");
        // Still get the count for anonymous users
        try {
          const { count, error: countError } = await this.supabase
            .from("content_reactions")
            .select("*", { count: "exact" })
            .eq("content_id", videoId)
            .eq("content_type", "video")
            .eq("reaction_type", "like");

          if (countError) {
            console.error("Error getting anonymous like count:", countError);
            return {
              liked: false,
              count: 0,
              error: "Failed to load like count",
            };
          }

          return { liked: false, count: count || 0 };
        } catch (error) {
          console.error("Error getting like count for anonymous user:", error);
          return { liked: false, count: 0, error: "Failed to load like count" };
        }
      }

      const { data: publicUser, error: userError } = await this.supabase
        .from("users")
        .select("id")
        .eq("auth_id", authUser.id)
        .maybeSingle();

      if (userError) {
        console.error("User lookup error in getLikeStatus:", userError);
        return { liked: false, count: 0, error: "User profile not found" };
      }

      if (!publicUser) {
        console.error("No public user found for authenticated user");
        return { liked: false, count: 0, error: "User profile not found" };
      }

      // Parallel requests for better performance
      const [likeResult, countResult] = await Promise.allSettled([
        this.supabase
          .from("content_reactions")
          .select("id")
          .eq("content_id", videoId)
          .eq("content_type", "video")
          .eq("reaction_type", "like")
          .eq("user_id", publicUser.id)
          .maybeSingle(),
        this.supabase
          .from("content_reactions")
          .select("*", { count: "exact" })
          .eq("content_id", videoId)
          .eq("content_type", "video")
          .eq("reaction_type", "like"),
      ]);

      // Handle user like status
      let liked = false;
      if (likeResult.status === "fulfilled") {
        const { data: userLike, error: likeError } = likeResult.value;
        if (likeError) {
          console.error("Error checking user like status:", likeError);
          // Don't return error for like status - just assume false
        } else {
          liked = !!userLike;
        }
      } else {
        console.error("Failed to check user like status:", likeResult.reason);
      }

      // Handle like count
      let count = 0;
      if (countResult.status === "fulfilled") {
        const { count: likeCount, error: countError } = countResult.value;
        if (countError) {
          console.error("Error getting like count:", countError);
          // Don't fail completely - return what we have
        } else {
          count = likeCount || 0;
        }
      } else {
        console.error("Failed to get like count:", countResult.reason);
      }

      return {
        liked,
        count,
        videoId, // Include for debugging
      };
    } catch (error) {
      console.error("Error getting like status:", error);
      return {
        liked: false,
        count: 0,
        error: "An unexpected error occurred while loading like status",
      };
    }
  }
}
