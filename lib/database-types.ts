/**
 * Supabase Database Types
 * Generated and verified on 2025-01-30
 *
 * Backend Status:
 * ✅ Fixed SECURITY DEFINER views (now using SECURITY INVOKER)
 * ✅ Removed duplicate indexes and constraints
 * ✅ Fixed function search paths for critical functions
 * ⚠️  Some functions still need search_path fixes (non-critical)
 *
 * Tables Overview:
 * - users: User profiles with authentication
 * - content_posts: TikTok-style video/image posts
 * - chat_conversations: Chat room metadata
 * - chat_participants: Users in conversations
 * - chat_messages: Individual messages
 * - chat_message_reactions: Emoji reactions
 * - chat_message_receipts: Read receipts
 * - social_follows: Following relationships
 * - social_blocks: User blocking
 * - notifications: Push notifications
 * - content_comments: Comments on posts
 * - content_interactions: Likes/views/shares
 * - user_post_interactions: User-specific interactions
 * - menu_categories: Food/drink categories
 * - menu_items: Menu items with media
 * - push_tokens: FCM tokens for notifications
 * - app_config: Application settings
 * - notification_topics: Notification subscriptions
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          auth_id: string | null;
          first_name: string | null;
          last_name: string | null;
          display_name: string | null;
          avatar_url: string | null;
          profile_image_url: string | null;
          bio: string | null;
          phone: string | null;
          role: "user" | "admin";
          account_status: "active" | "inactive" | "pending" | "suspended";
          is_verified: boolean;
          is_private: boolean;
          email_notifications: boolean;
          push_notifications: boolean;
          settings: Json;
          location: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          postal_code: string | null;
          website: string | null;
          date_of_birth: string | null;
          gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
          pronouns: string | null;
          occupation: string | null;
          company: string | null;
          last_seen_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["users"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };

      content_posts: {
        Row: {
          id: string;
          user_id: string | null;
          post_type: "video" | "image" | "text" | "carousel";
          video_url: string | null;
          thumbnail_url: string | null;
          images: string[] | null;
          title: string | null;
          caption: string | null;
          description: string | null;
          tags: string[];
          location_tag: string | null;
          location_lat: number | null;
          location_lng: number | null;
          likes_count: number;
          comments_count: number;
          views_count: number;
          shares_count: number;
          duration_seconds: number | null;
          aspect_ratio: string;
          processing_status: "pending" | "processing" | "completed" | "failed";
          metadata: Json;
          visibility: "public" | "followers" | "private";
          allow_comments: boolean;
          allow_duets: boolean;
          allow_stitches: boolean;
          is_featured: boolean;
          is_active: boolean;
          is_ad: boolean;
          source: "user" | "ingested" | "sponsored";
          trending_score: number;
          algorithm_boost: number;
          music_id: string | null;
          music_name: string | null;
          effect_id: string | null;
          effect_name: string | null;
          slug: string | null;
          seo_description: string | null;
          featured_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["content_posts"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["content_posts"]["Insert"]
        >;
      };

      chat_conversations: {
        Row: {
          id: string;
          conversation_type: "direct" | "group" | "location" | "broadcast";
          name: string | null;
          description: string | null;
          avatar_url: string | null;
          slug: string | null;
          created_by: string | null;
          is_active: boolean;
          is_archived: boolean;
          is_pinned: boolean;
          is_group: boolean; // Generated column
          participant_count: number;
          message_count: number;
          last_message_at: string | null;
          last_message_preview: string | null;
          last_message_sender_id: string | null;
          settings: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["chat_conversations"]["Row"],
          "id" | "is_group" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["chat_conversations"]["Insert"]
        >;
      };

      chat_participants: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: "admin" | "moderator" | "member";
          is_active: boolean;
          notification_settings: Json;
          joined_at: string;
          left_at: string | null;
          last_read_at: string | null;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["chat_participants"]["Row"],
          "id" | "joined_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["chat_participants"]["Insert"]
        >;
      };

      chat_messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type: "text" | "image" | "system" | "deleted";
          reply_to_id: string | null;
          reply_count: number;
          media_url: string | null;
          media_type: "image" | "video" | "audio" | "file" | "gif" | null;
          media_thumbnail_url: string | null;
          media_size: number | null;
          media_duration: number | null;
          media_metadata: Json;
          attachments: Json;
          metadata: Json;
          is_edited: boolean; // Generated column
          is_deleted: boolean; // Generated column
          edited_at: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["chat_messages"]["Row"],
          "id" | "is_edited" | "is_deleted" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["chat_messages"]["Insert"]
        >;
      };

      chat_message_reactions: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          reaction: string; // Emoji or up to 4 characters
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["chat_message_reactions"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["chat_message_reactions"]["Insert"]
        >;
      };

      chat_message_receipts: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          delivered_at: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["chat_message_receipts"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["chat_message_receipts"]["Insert"]
        >;
      };

      social_follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["social_follows"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["social_follows"]["Insert"]
        >;
      };

      social_blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["social_blocks"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["social_blocks"]["Insert"]
        >;
      };

      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          related_user_id: string | null;
          type:
            | "info"
            | "warning"
            | "error"
            | "success"
            | "order_new"
            | "order_ready"
            | "order_cancelled"
            | "follow"
            | "unfollow"
            | "like"
            | "comment"
            | "mention"
            | "share"
            | "post_like"
            | "post_comment"
            | "message"
            | "friend_request"
            | "system"
            | "promotion"
            | "achievement";
          status: "unread" | "read" | "dismissed";
          priority: "low" | "normal" | "high" | "urgent";
          title: string | null;
          message: string;
          data: Json;
          content_type:
            | "post"
            | "comment"
            | "user"
            | "order"
            | "message"
            | "conversation"
            | "event"
            | "menu_item"
            | null;
          content_id: string | null;
          action_url: string | null;
          is_read: boolean;
          read_at: string | null;
          is_push_sent: boolean;
          push_sent_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["notifications"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["notifications"]["Insert"]
        >;
      };

      content_comments: {
        Row: {
          id: string;
          video_id: string;
          user_id: string;
          parent_comment_id: string | null;
          content: string;
          likes_count: number;
          is_pinned: boolean;
          is_edited: boolean;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["content_comments"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["content_comments"]["Insert"]
        >;
      };

      content_interactions: {
        Row: {
          id: string;
          user_id: string;
          content_id: string;
          interaction_type: "like" | "view" | "share" | "save";
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["content_interactions"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["content_interactions"]["Insert"]
        >;
      };

      user_post_interactions: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          has_liked: boolean;
          has_viewed: boolean;
          view_count: number;
          last_viewed_at: string | null;
          liked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["user_post_interactions"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["user_post_interactions"]["Insert"]
        >;
      };

      menu_categories: {
        Row: {
          id: string;
          name: string;
          type: "food" | "drink";
          description: string | null;
          icon: string | null;
          color: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["menu_categories"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["menu_categories"]["Insert"]
        >;
      };

      menu_items: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number;
          image_id: string | null;
          image_url: string | null;
          video_url: string | null;
          video_thumbnail_url: string | null;
          has_video: boolean;
          storage_path: string | null;
          display_order: number;
          is_available: boolean;
          is_active: boolean;
          is_featured: boolean;
          spice_level: number | null;
          prep_time_minutes: number | null;
          allergens: string[];
          content_postsrc: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["menu_items"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["menu_items"]["Insert"]>;
      };

      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: "web" | "ios" | "android" | null;
          device_info: Json;
          is_active: boolean;
          last_used_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["push_tokens"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["push_tokens"]["Insert"]>;
      };

      app_config: {
        Row: {
          key: string;
          value: string | null;
          encrypted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["app_config"]["Row"],
          "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["app_config"]["Insert"]>;
      };

      notification_topics: {
        Row: {
          id: string;
          topic_key: string;
          topic_name: string;
          description: string | null;
          is_active: boolean;
          default_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["notification_topics"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["notification_topics"]["Insert"]
        >;
      };
    };

    Views: {
      v_active_conversations: {
        Row: {
          id: string;
          conversation_type: string;
          name: string | null;
          description: string | null;
          avatar_url: string | null;
          slug: string | null;
          created_by: string | null;
          is_active: boolean;
          is_archived: boolean;
          is_pinned: boolean;
          is_group: boolean;
          participant_count: number;
          message_count: number;
          last_message_at: string | null;
          last_message_preview: string | null;
          last_message_sender_id: string | null;
          settings: Json;
          metadata: Json;
          actual_participant_count: number;
          latest_message_time: string;
          created_at: string;
          updated_at: string;
        };
      };

      v_user_activity: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          last_seen_at: string | null;
          messages_sent: number;
          conversations_joined: number;
          last_message_at: string | null;
        };
      };

      v_typing_users: {
        Row: {
          conversation_id: string;
          user_id: string;
          username: string;
          display_name: string | null;
          is_typing: boolean;
          typing_timestamp: string;
        };
      };

      v_menu_full: {
        Row: {
          category_id: string;
          category_name: string;
          category_type: string;
          category_icon: string | null;
          category_color: string | null;
          category_order: number;
          item_id: string | null;
          item_name: string | null;
          item_description: string | null;
          item_price: number | null;
          image_id: string | null;
          image_url: string | null;
          item_order: number | null;
          is_available: boolean | null;
          is_featured: boolean | null;
          video_url: string | null;
          has_video: boolean | null;
          video_thumbnail_url: string | null;
          storage_path: string | null;
          spice_level: number | null;
          prep_time_minutes: number | null;
          allergens: string[] | null;
          content_postsrc: string | null;
        };
      };

      user_profiles_with_stats: {
        Row: {
          id: string;
          email: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          is_verified: boolean;
          is_private: boolean;
          followers_count: number;
          following_count: number;
          posts_count: number;
          created_at: string;
        };
      };

      chat_messages_with_reactions: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type: string;
          reactions: Json;
          current_user_has_reacted: boolean;
          created_at: string;
        };
      };
    };

    Functions: {
      // User Management
      get_user_profile: {
        Args: { target_user_id: string };
        Returns: Json;
      };
      update_user_profile: {
        Args: {
          p_avatar_url?: string;
          p_display_name?: string;
          p_first_name?: string;
          p_last_name?: string;
          p_settings?: Json;
        };
        Returns: Json;
      };
      search_users: {
        Args: { p_query: string; p_limit?: number };
        Returns: Json;
      };

      // Social Features
      follow_user: {
        Args: { target_user_id: string };
        Returns: Json;
      };
      unfollow_user: {
        Args: { target_user_id: string };
        Returns: Json;
      };
      toggle_follow: {
        Args: { target_user_id: string };
        Returns: Json;
      };
      block_user: {
        Args: { target_user_id: string };
        Returns: Json;
      };
      unblock_user: {
        Args: { target_user_id: string };
        Returns: Json;
      };

      // Content Management
      create_post: {
        Args: {
          p_caption?: string;
          p_images?: string[];
          p_post_type?: string;
          p_tags?: string[];
          p_thumbnail_url?: string;
          p_video_url?: string;
          p_visibility?: string;
        };
        Returns: Json;
      };
      get_user_feed: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: Json;
      };
      get_user_posts: {
        Args: {
          p_limit?: number;
          p_offset?: number;
          target_user_id?: string;
        };
        Returns: Json;
      };
      toggle_post_like: {
        Args: { p_post_id: string; p_user_id?: string };
        Returns: Json;
      };
      add_comment: {
        Args: {
          p_content: string;
          p_parent_comment_id?: string;
          p_video_id: string;
        };
        Returns: Json;
      };

      // Chat Features
      get_or_create_dm_conversation: {
        Args: { other_user_id: string };
        Returns: Json;
      };
      get_user_conversations: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_conversation_messages: {
        Args: {
          p_before_message_id?: string;
          p_conversation_id: string;
          p_limit?: number;
        };
        Returns: Json;
      };
      send_message: {
        Args: {
          p_content: string;
          p_conversation_id: string;
          p_media_type?: string;
          p_media_url?: string;
          p_message_type?: string;
          p_reply_to_id?: string;
        };
        Returns: Json;
      };
      set_typing_status: {
        Args: {
          p_conversation_id: string;
          p_is_typing?: boolean;
        };
        Returns: Json;
      };

      // Notifications
      get_notifications: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: Json;
      };
      mark_notification_read: {
        Args: { notification_id: string };
        Returns: Json;
      };
      mark_all_notifications_read: {
        Args: Record<string, never>;
        Returns: Json;
      };
      register_push_token: {
        Args: {
          p_device_info?: Json;
          p_platform?: string;
          p_token: string;
        };
        Returns: Json;
      };

      // Utility
      update_user_presence: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_current_user_id: {
        Args: {};
        Returns: string;
      };
    };
  };
}

// Helper types for common operations
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];

// Realtime subscription types
export interface RealtimePostgresChangesPayload<T> {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: T;
  errors: string[] | null;
}

// Common query filters
export interface QueryFilters {
  limit?: number;
  offset?: number;
  order?: { column: string; ascending?: boolean };
  filters?: Array<{
    column: string;
    operator:
      | "eq"
      | "neq"
      | "gt"
      | "gte"
      | "lt"
      | "lte"
      | "like"
      | "ilike"
      | "in";
    value:
      | string
      | number
      | boolean
      | null
      | string[]
      | number[]
      | boolean[]
      | null[]
      | Json;
  }>;
}

// Export for convenience
export default Database;
