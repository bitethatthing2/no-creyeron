import * as React from "react";
import { supabase } from "@/lib/supabase";
import { getAppUserId } from "@/lib/utils/auth-helpers";

interface LikeVideoHookReturn {
  toggleLike: (
    videoId: string,
    isCurrentlyLiked: boolean,
  ) => Promise<{ success: boolean; error?: any }>;
  loading: boolean;
}

export function useLikeVideo(): LikeVideoHookReturn {
  const [loading, setLoading] = React.useState(false);

  const toggleLike = React.useCallback(
    async (videoId: string, isCurrentlyLiked: boolean) => {
      setLoading(true);

      try {
        // Get the app user ID (maps from auth.users to public.users)
        const appUserId = await getAppUserId(supabase);
        console.log("🔍 LIKE DEBUG:", { videoId, isCurrentlyLiked, appUserId });

        if (!appUserId) {
          console.error("❌ No app user ID found");
          throw new Error("Not authenticated or user not found");
        }

        if (isCurrentlyLiked) {
          // Remove like - use correct table name
          const { error } = await supabase
            .from("content_reactions")
            .delete()
            .eq("content_id", videoId)
            .eq("content_type", "video")
            .eq("reaction_type", "like")
            .eq("user_id", appUserId);

          if (error) {
            if (error.code === "42P01") {
              console.warn(
                "Like functionality disabled - database table missing",
              );
              return {
                success: false,
                error: "Like functionality temporarily disabled",
              };
            }
            throw error;
          }
        } else {
          // Add like
          const { error } = await supabase
            .from("content_reactions")
            .insert({
              content_id: videoId,
              content_type: "video",
              reaction_type: "like",
              user_id: appUserId, // Use app user ID, not auth ID
            });

          if (error) {
            if (error.code === "42P01") {
              console.warn(
                "Like functionality disabled - database table missing",
              );
              return {
                success: false,
                error: "Like functionality temporarily disabled",
              };
            }
            throw error;
          }
        }

        return { success: true };
      } catch (error) {
        console.error("Error toggling like:", error);
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { toggleLike, loading };
}
