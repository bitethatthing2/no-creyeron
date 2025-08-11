/**
 * WOLFPACK REAL-TIME SERVICE
 * Real-time subscriptions for live social features
 */

import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export interface VideoLikeUpdate {
  video_id: string;
  user_id: string;
  liked: boolean;
  new_like_count: number;
}

export interface CommentUpdate {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    display_name: string;
    username: string;
    avatar_url: string;
  };
}

class WolfpackRealtimeService {
  private static instance: WolfpackRealtimeService;
  private subscriptions: Map<string, RealtimeChannel> = new Map();

  static getInstance(): WolfpackRealtimeService {
    if (!WolfpackRealtimeService.instance) {
      WolfpackRealtimeService.instance = new WolfpackRealtimeService();
    }
    return WolfpackRealtimeService.instance;
  }

  /**
   * Subscribe to video likes for a specific video
   */
  subscribeToVideoLikes(
    videoId: string,
    onLikeUpdate: (update: VideoLikeUpdate) => void,
  ): RealtimeSubscription {
    const channelName = `video-likes-${videoId}`;

    // Clean up existing subscription
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wolfpack_post_likes",
          filter: `video_id=eq.${videoId}`,
        },
        async (payload) => {
          // Get updated like count
          const { data: video } = await supabase
            .from("wolfpack_videos")
            .select("like_count")
            .eq("id", videoId)
            .single();

          onLikeUpdate({
            video_id: videoId,
            user_id: payload.new?.user_id || payload.old?.user_id,
            liked: payload.eventType === "INSERT",
            new_like_count: video?.like_count || 0,
          });
        },
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);

    return {
      channel,
      unsubscribe: () => this.unsubscribe(channelName),
    };
  }

  /**
   * Subscribe to comments for a specific video
   */
  subscribeToVideoComments(
    videoId: string,
    onCommentUpdate: (
      comment: CommentUpdate,
      action: "INSERT" | "UPDATE" | "DELETE",
    ) => void,
  ): RealtimeSubscription {
    const channelName = `video-comments-${videoId}`;

    // Clean up existing subscription
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wolfpack_comments",
          filter: `video_id=eq.${videoId}`,
        },
        async (payload) => {
          const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
          const commentData = payload.new || payload.old;

          if (!commentData) return;

          // For new comments, fetch user info
          let userInfo = null;
          if (eventType === "INSERT" && commentData.user_id) {
            const { data: user } = await supabase
              .from("users")
              .select("display_name, username, avatar_url")
              .eq("id", commentData.user_id)
              .single();

            userInfo = user;
          }

          onCommentUpdate({
            id: commentData.id,
            video_id: commentData.video_id,
            user_id: commentData.user_id,
            content: commentData.content,
            created_at: commentData.created_at,
            user: userInfo,
          }, eventType);
        },
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);

    return {
      channel,
      unsubscribe: () => this.unsubscribe(channelName),
    };
  }

  /**
   * Subscribe to new videos in the feed
   */
  subscribeToFeedUpdates(
    onNewVideo: (video: any) => void,
    onVideoUpdate: (video: any) => void,
    onVideoDelete: (videoId: string) => void,
  ): RealtimeSubscription {
    const channelName = "feed-updates";

    // Clean up existing subscription
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wolfpack_videos",
          filter: "is_active=eq.true",
        },
        async (payload) => {
          const eventType = payload.eventType;

          switch (eventType) {
            case "INSERT":
              // Fetch full video data with user info
              const { data: newVideo } = await supabase
                .from("wolfpack_videos")
                .select(`
                  *,
                  users!user_id (
                    id,
                    display_name,
                    username,
                    first_name,
                    last_name,
                    avatar_url,
                    location,
                    wolfpack_status
                  )
                `)
                .eq("id", payload.new.id)
                .single();

              if (newVideo) {
                onNewVideo(newVideo);
              }
              break;

            case "UPDATE":
              onVideoUpdate(payload.new);
              break;

            case "DELETE":
              onVideoDelete(payload.old.id);
              break;
          }
        },
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);

    return {
      channel,
      unsubscribe: () => this.unsubscribe(channelName),
    };
  }

  /**
   * Subscribe to DJ broadcasts
   */
  subscribeToDJBroadcasts(
    locationId: string,
    onBroadcast: (broadcast: any) => void,
  ): RealtimeSubscription {
    const channelName = `dj-broadcasts-${locationId}`;

    // Clean up existing subscription
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dj_broadcasts",
          filter: `location_id=eq.${locationId}`,
        },
        (payload) => {
          onBroadcast(payload.new);
        },
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);

    return {
      channel,
      unsubscribe: () => this.unsubscribe(channelName),
    };
  }

  /**
   * Subscribe to direct messages
   */
  subscribeToDirectMessages(
    conversationid: string,
    onMessage: (message: any) => void,
  ): RealtimeSubscription {
    const channelName = `dm-${userId}`;

    // Clean up existing subscription
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wolfpack_direct_messages",
          filter: `recipient_id=eq.${userId}`,
        },
        async (payload) => {
          // Fetch sender info
          const { data: sender } = await supabase
            .from("users")
            .select("display_name, username, avatar_url")
            .eq("id", payload.new.sender_id)
            .single();

          onMessage({
            ...payload.new,
            sender,
          });
        },
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);

    return {
      channel,
      unsubscribe: () => this.unsubscribe(channelName),
    };
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.subscriptions.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    for (const [channelName, channel] of this.subscriptions) {
      channel.unsubscribe();
    }
    this.subscriptions.clear();
  }

  /**
   * Get active subscription count
   */
  getActiveSubscriptionCount(): number {
    return this.subscriptions.size;
  }
}

export const wolfpackRealtimeService = WolfpackRealtimeService.getInstance();
