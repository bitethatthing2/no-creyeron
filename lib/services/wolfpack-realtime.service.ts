/**
 * WOLFPACK REAL-TIME SERVICE
 * Real-time subscriptions for live social features
 *
 * ANALYSIS:
 * - Tables found in your database: content_posts, content_reactions, content_comments
 * - Tables NOT found: dj_broadcasts, wolfpack_direct_messages
 * - You're using newer unified tables for messaging (chat_messages, chat_conversations)
 */

import { supabase } from "@/lib/supabase";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Type aliases for better readability
type Tables = Database["public"]["Tables"];
type VideoRow = Tables["content_posts"]["Row"];
type CommentRow = Tables["content_comments"]["Row"];
type ReactionRow = Tables["content_reactions"]["Row"];
type UserRow = Tables["users"]["Row"];

// Define MessageRow based on actual database structure
interface MessageRow {
  id: string;
  conversation_id: string | null;
  sender_id: string;
  content: string | null;
  message_type: string | null;
  created_at: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  is_deleted: boolean | null;
  parent_message_id: string | null;
  metadata: Record<string, unknown> | null;
  reactions_count: Record<string, unknown> | null;
  reply_count: number | null;
  media_url: string | null;
  media_type: string | null;
  media_thumbnail_url: string | null;
  media_size: number | null;
  media_duration: number | null;
  media_metadata: Record<string, unknown> | null;
  attachments: Record<string, unknown> | null;
  is_read: boolean | null;
  read_at: string | null;
  delivered_at: string | null;
  status: string | null;
  is_edited: boolean | null;
  reply_to_id: string | null;
}

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
  user?: Pick<UserRow, "display_name" | "username" | "avatar_url">;
}

export interface VideoUpdate extends VideoRow {
  users?: Pick<
    UserRow,
    | "id"
    | "display_name"
    | "username"
    | "first_name"
    | "last_name"
    | "avatar_url"
    | "location"
    | "wolfpack_status"
  >;
}

export interface DirectMessageUpdate extends MessageRow {
  sender?: Pick<UserRow, "display_name" | "username" | "avatar_url">;
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
      .on<ReactionRow>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "content_reactions",
          filter: `content_id=eq.${videoId}`,
        },
        async (payload: RealtimePostgresChangesPayload<ReactionRow>) => {
          // Get updated like count
          const { data: video } = await supabase
            .from("content_posts")
            .select("like_count")
            .eq("id", videoId)
            .single();

          // Type guard to ensure we have the data we need
          const likeData = payload.new as PostLikeRow | undefined ||
            payload.old as PostLikeRow | undefined;

          if (likeData && "user_id" in likeData && likeData.user_id) {
            onLikeUpdate({
              video_id: videoId,
              user_id: likeData.user_id,
              liked: payload.eventType === "INSERT",
              new_like_count: video?.like_count || 0,
            });
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
      .on<CommentRow>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "content_comments",
          filter: `video_id=eq.${videoId}`,
        },
        async (payload: RealtimePostgresChangesPayload<CommentRow>) => {
          const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE";

          // Type guard to ensure we have proper CommentRow data
          const commentData = (payload.new || payload.old) as
            | CommentRow
            | undefined;

          if (!commentData || !("id" in commentData)) return;

          // For new comments, fetch user info
          let userInfo:
            | Pick<UserRow, "display_name" | "username" | "avatar_url">
            | null = null;

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
            created_at: commentData.created_at || new Date().toISOString(),
            user: userInfo || undefined,
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
    onNewVideo: (video: VideoUpdate) => void,
    onVideoUpdate: (video: VideoRow) => void,
    onVideoDelete: (videoId: string) => void,
  ): RealtimeSubscription {
    const channelName = "feed-updates";

    // Clean up existing subscription
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on<VideoRow>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "content_posts",
          filter: "is_active=eq.true",
        },
        async (payload: RealtimePostgresChangesPayload<VideoRow>) => {
          const eventType = payload.eventType;

          switch (eventType) {
            case "INSERT":
              if (payload.new && "id" in payload.new) {
                // Fetch full video data with user info
                const { data: newVideo } = await supabase
                  .from("content_posts")
                  .select(`
                    *,
                    users!content_posts_user_id_fkey (
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
                  onNewVideo(newVideo as VideoUpdate);
                }
              }
              break;

            case "UPDATE":
              if (payload.new && "id" in payload.new) {
                onVideoUpdate(payload.new as VideoRow);
              }
              break;

            case "DELETE":
              if (payload.old && "id" in payload.old && payload.old.id) {
                onVideoDelete(payload.old.id);
              }
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
   * Subscribe to conversation messages (replacement for direct messages)
   * Using the chat_messages table instead of non-existent wolfpack_direct_messages
   */
  subscribeToConversationMessages(
    conversationId: string,
    onMessage: (message: DirectMessageUpdate) => void,
  ): RealtimeSubscription {
    const channelName = `conversation-${conversationId}`;

    // Clean up existing subscription
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on<MessageRow>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload: RealtimePostgresChangesPayload<MessageRow>) => {
          // Type guard to ensure we have MessageRow data
          const messageData = payload.new as MessageRow | undefined;

          if (
            !messageData || !("id" in messageData) || !messageData.sender_id
          ) return;

          // Fetch sender info
          const { data: sender } = await supabase
            .from("users")
            .select("display_name, username, avatar_url")
            .eq("id", messageData.sender_id)
            .single();

          const messageUpdate: DirectMessageUpdate = {
            ...messageData,
            sender: sender || undefined,
          };

          onMessage(messageUpdate);
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
   * Subscribe to messages for a specific user (all their conversations)
   */
  subscribeToUserMessages(
    userId: string,
    onMessage: (
      message: DirectMessageUpdate & { conversation_id: string },
    ) => void,
  ): RealtimeSubscription {
    const channelName = `user-messages-${userId}`;

    // Clean up existing subscription
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on<MessageRow>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        async (payload: RealtimePostgresChangesPayload<MessageRow>) => {
          // Type guard to ensure we have MessageRow data
          const messageData = payload.new as MessageRow | undefined;

          if (
            !messageData || !("conversation_id" in messageData) ||
            !messageData.conversation_id
          ) return;

          // Check if user is part of the conversation
          const { data: conversation } = await supabase
            .from("wolfpack_dm_conversations")
            .select("user1_id, user2_id")
            .eq("id", messageData.conversation_id)
            .single();

          if (
            conversation &&
            (conversation.user1_id === userId ||
              conversation.user2_id === userId)
          ) {
            // Fetch sender info
            let sender = null;
            if (messageData.sender_id) {
              const { data: senderData } = await supabase
                .from("users")
                .select("display_name, username, avatar_url")
                .eq("id", messageData.sender_id)
                .single();
              sender = senderData;
            }

            const messageUpdate: DirectMessageUpdate & {
              conversation_id: string;
            } = {
              ...messageData,
              conversation_id: messageData.conversation_id, // We know this is not null from the check above
              sender: sender || undefined,
            };

            onMessage(messageUpdate);
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
    this.subscriptions.forEach((channel) => {
      channel.unsubscribe();
    });
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
