import * as React from "react";
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeSyncEvent {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: unknown;
  old: unknown;
}

interface UseRealtimeSyncOptions {
  table: string;
  filter?: string;
  onInsert?: (record: unknown) => void;
  onUpdate?: (record: unknown, oldRecord: unknown) => void;
  onDelete?: (oldRecord: unknown) => void;
  enabled?: boolean;
}

export function useRealtimeSync({
  table,
  filter,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}: UseRealtimeSyncOptions) {
  const channelRef = React.useRef<RealtimeChannel | null>(null);

  const cleanup = React.useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (!enabled || !table) {
      cleanup();
      return;
    }

    const channelName = filter ? `${table}:${filter}` : table;

    channelRef.current = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: table,
          filter: filter,
        },
        (payload) => {
          if (onInsert) {
            onInsert(payload.new);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: table,
          filter: filter,
        },
        (payload) => {
          if (onUpdate) {
            onUpdate(payload.new, payload.old);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: table,
          filter: filter,
        },
        (payload) => {
          if (onDelete) {
            onDelete(payload.old);
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`✅ Subscribed to realtime updates for ${table}`);
        } else if (status === "CHANNEL_ERROR") {
          console.error(`❌ Error subscribing to ${table}:`, status);
        }
      });

    return cleanup;
  }, [table, filter, onInsert, onUpdate, onDelete, enabled, cleanup]);

  React.useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    cleanup,
  };
}

// Specialized hook for content_comments realtime sync
export function useRealtimecontent_comments(
  postId: string,
  onNewComment: (comment: unknown) => void,
  onCommentUpdate?: (comment: unknown) => void,
  onCommentDelete?: (commentId: string) => void,
) {
  return useRealtimeSync({
    table: "content_comments",
    filter: `video_id=eq.${postId}`,
    onInsert: async (newComment) => {
      // Fetch the full comment with user data
      const { data } = await supabase
        .from("content_comments")
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
        .eq("id", newComment.id)
        .single();

      if (data) {
        onNewComment(data);
      }
    },
    onUpdate: onCommentUpdate,
    onDelete: (oldComment) => {
      if (onCommentDelete) {
        onCommentDelete(oldComment.id);
      }
    },
  });
}

// Specialized hook for likes realtime sync
export function useRealtimeLikes(
  postId: string,
  onLikeChange: (liked: boolean, likeCount: number) => void,
) {
  return useRealtimeSync({
    table: "wolfpack_post_likes",
    filter: `video_id=eq.${postId}`,
    onInsert: async () => {
      // Refresh like count when someone likes
      const { count } = await supabase
        .from("wolfpack_post_likes")
        .select("*", { count: "exact", head: true })
        .eq("video_id", postId);

      onLikeChange(true, count || 0);
    },
    onDelete: async () => {
      // Refresh like count when someone unlikes
      const { count } = await supabase
        .from("wolfpack_post_likes")
        .select("*", { count: "exact", head: true })
        .eq("video_id", postId);

      onLikeChange(false, count || 0);
    },
  });
}

// Specialized hook for content_posts realtime sync
export function useRealtimecontent_posts(
  onNewPost: (post: unknown) => void,
  onPostUpdate?: (post: unknown) => void,
  onPostDelete?: (postId: string) => void,
) {
  return useRealtimeSync({
    table: "content_posts",
    onInsert: async (newPost) => {
      // Fetch the full post with user data
      const { data } = await supabase
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
        .eq("id", newPost.id)
        .single();

      if (data) {
        onNewPost(data);
      }
    },
    onUpdate: onPostUpdate,
    onDelete: (oldPost) => {
      if (onPostDelete) {
        onPostDelete(oldPost.id);
      }
    },
  });
}
