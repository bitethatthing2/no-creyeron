export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          created_at: string | null
          encrypted: boolean | null
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          encrypted?: boolean | null
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          encrypted?: boolean | null
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          avatar_url: string | null
          conversation_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_archived: boolean | null
          is_group: boolean | null
          is_pinned: boolean | null
          last_message_at: string | null
          last_message_preview: string | null
          last_message_sender_id: string | null
          message_count: number | null
          metadata: Json | null
          name: string | null
          participant_count: number | null
          settings: Json | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          conversation_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_archived?: boolean | null
          is_group?: boolean | null
          is_pinned?: boolean | null
          last_message_at?: string | null
          last_message_preview?: string | null
          last_message_sender_id?: string | null
          message_count?: number | null
          metadata?: Json | null
          name?: string | null
          participant_count?: number | null
          settings?: Json | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          conversation_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_archived?: boolean | null
          is_group?: boolean | null
          is_pinned?: boolean | null
          last_message_at?: string | null
          last_message_preview?: string | null
          last_message_sender_id?: string | null
          message_count?: number | null
          metadata?: Json | null
          name?: string | null
          participant_count?: number | null
          settings?: Json | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey"
            columns: ["last_message_sender_id"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey"
            columns: ["last_message_sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey"
            columns: ["last_message_sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey"
            columns: ["last_message_sender_id"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_reactions: {
        Row: {
          created_at: string | null
          id: string
          message_id: string | null
          reaction: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id?: string | null
          reaction: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string | null
          reaction?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages_with_reactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_receipts: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          id: string
          message_id: string | null
          read_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          message_id?: string | null
          read_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          message_id?: string | null
          read_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages_with_reactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_message_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          media_duration: number | null
          media_metadata: Json | null
          media_size: number | null
          media_thumbnail_url: string | null
          media_type: string | null
          media_url: string | null
          message_type: string | null
          metadata: Json | null
          reply_count: number | null
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          media_duration?: number | null
          media_metadata?: Json | null
          media_size?: number | null
          media_thumbnail_url?: string | null
          media_type?: string | null
          media_url?: string | null
          message_type?: string | null
          metadata?: Json | null
          reply_count?: number | null
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          media_duration?: number | null
          media_metadata?: Json | null
          media_size?: number | null
          media_thumbnail_url?: string | null
          media_type?: string | null
          media_url?: string | null
          message_type?: string | null
          metadata?: Json | null
          reply_count?: number | null
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "v_active_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages_with_reactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          conversation_id: string
          id: string
          is_active: boolean | null
          joined_at: string | null
          last_read_at: string | null
          left_at: string | null
          notification_settings: Json | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          left_at?: string | null
          notification_settings?: Json | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          left_at?: string | null
          notification_settings?: Json | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "v_active_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
        ]
      }
      cleanup_logs: {
        Row: {
          created_at: string | null
          error: string | null
          executed_at: string | null
          id: string
          response_id: number | null
          results: Json | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          executed_at?: string | null
          id?: string
          response_id?: number | null
          results?: Json | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          executed_at?: string | null
          id?: string
          response_id?: number | null
          results?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      content_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          is_pinned: boolean | null
          likes_count: number | null
          parent_comment_id: string | null
          updated_at: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
        ]
      }
      content_interactions: {
        Row: {
          content_id: string
          created_at: string | null
          id: string
          interaction_type: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string | null
          id?: string
          interaction_type: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string | null
          id?: string
          interaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
        ]
      }
      content_posts: {
        Row: {
          algorithm_boost: number | null
          allow_comments: boolean | null
          allow_duets: boolean | null
          allow_stitches: boolean | null
          aspect_ratio: string | null
          caption: string | null
          comments_count: number | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          effect_id: string | null
          effect_name: string | null
          featured_at: string | null
          id: string
          images: string[] | null
          ingested_content_id: string | null
          is_active: boolean | null
          is_ad: boolean | null
          is_featured: boolean | null
          likes_count: number | null
          location_lat: number | null
          location_lng: number | null
          location_tag: string | null
          metadata: Json | null
          music_id: string | null
          music_name: string | null
          post_type: string | null
          processing_status: string | null
          seo_description: string | null
          shares_count: number | null
          slug: string | null
          source: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          trending_score: number | null
          updated_at: string | null
          user_id: string | null
          video_url: string | null
          views_count: number | null
          visibility: string | null
        }
        Insert: {
          algorithm_boost?: number | null
          allow_comments?: boolean | null
          allow_duets?: boolean | null
          allow_stitches?: boolean | null
          aspect_ratio?: string | null
          caption?: string | null
          comments_count?: number | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          effect_id?: string | null
          effect_name?: string | null
          featured_at?: string | null
          id?: string
          images?: string[] | null
          ingested_content_id?: string | null
          is_active?: boolean | null
          is_ad?: boolean | null
          is_featured?: boolean | null
          likes_count?: number | null
          location_lat?: number | null
          location_lng?: number | null
          location_tag?: string | null
          metadata?: Json | null
          music_id?: string | null
          music_name?: string | null
          post_type?: string | null
          processing_status?: string | null
          seo_description?: string | null
          shares_count?: number | null
          slug?: string | null
          source?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          trending_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
          views_count?: number | null
          visibility?: string | null
        }
        Update: {
          algorithm_boost?: number | null
          allow_comments?: boolean | null
          allow_duets?: boolean | null
          allow_stitches?: boolean | null
          aspect_ratio?: string | null
          caption?: string | null
          comments_count?: number | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          effect_id?: string | null
          effect_name?: string | null
          featured_at?: string | null
          id?: string
          images?: string[] | null
          ingested_content_id?: string | null
          is_active?: boolean | null
          is_ad?: boolean | null
          is_featured?: boolean | null
          likes_count?: number | null
          location_lat?: number | null
          location_lng?: number | null
          location_tag?: string | null
          metadata?: Json | null
          music_id?: string | null
          music_name?: string | null
          post_type?: string | null
          processing_status?: string | null
          seo_description?: string | null
          shares_count?: number | null
          slug?: string | null
          source?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          trending_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
          views_count?: number | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          allergens: string[] | null
          category_id: string | null
          content_postsrc: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          has_video: boolean | null
          id: string
          image_id: string | null
          image_url: string | null
          is_active: boolean | null
          is_available: boolean | null
          is_featured: boolean | null
          name: string
          prep_time_minutes: number | null
          price: number
          spice_level: number | null
          storage_path: string | null
          updated_at: string | null
          video_thumbnail_url: string | null
          video_url: string | null
        }
        Insert: {
          allergens?: string[] | null
          category_id?: string | null
          content_postsrc?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          has_video?: boolean | null
          id?: string
          image_id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_featured?: boolean | null
          name: string
          prep_time_minutes?: number | null
          price: number
          spice_level?: number | null
          storage_path?: string | null
          updated_at?: string | null
          video_thumbnail_url?: string | null
          video_url?: string | null
        }
        Update: {
          allergens?: string[] | null
          category_id?: string | null
          content_postsrc?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          has_video?: boolean | null
          id?: string
          image_id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_featured?: boolean | null
          name?: string
          prep_time_minutes?: number | null
          price?: number
          spice_level?: number | null
          storage_path?: string | null
          updated_at?: string | null
          video_thumbnail_url?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_menu_full"
            referencedColumns: ["category_id"]
          },
        ]
      }
      notification_topics: {
        Row: {
          created_at: string | null
          default_enabled: boolean | null
          description: string | null
          id: string
          is_active: boolean | null
          topic_key: string
          topic_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_enabled?: boolean | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          topic_key: string
          topic_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_enabled?: boolean | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          topic_key?: string
          topic_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          content_id: string | null
          content_type: string | null
          created_at: string
          data: Json | null
          expires_at: string | null
          id: string
          is_push_sent: boolean | null
          is_read: boolean | null
          message: string
          priority: string | null
          push_sent_at: string | null
          read_at: string | null
          recipient_id: string
          related_user_id: string | null
          status: string
          title: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          action_url?: string | null
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_push_sent?: boolean | null
          is_read?: boolean | null
          message: string
          priority?: string | null
          push_sent_at?: string | null
          read_at?: string | null
          recipient_id: string
          related_user_id?: string | null
          status?: string
          title?: string | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          action_url?: string | null
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_push_sent?: boolean | null
          is_read?: boolean | null
          message?: string
          priority?: string | null
          push_sent_at?: string | null
          read_at?: string | null
          recipient_id?: string
          related_user_id?: string | null
          status?: string
          title?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_user_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_related_user_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_user_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_user_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string | null
          device_info: Json | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          platform: string | null
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          platform?: string | null
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          platform?: string | null
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_fcm_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_fcm_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_fcm_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_fcm_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
        ]
      }
      social_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "social_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "social_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
        ]
      }
      social_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_follows_follower_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "social_follows_follower_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_follows_follower_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_follows_follower_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_follows_following_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "social_follows_following_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_follows_following_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_follows_following_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_documentation: {
        Row: {
          allowed_extensions: string[] | null
          bucket_name: string
          created_at: string | null
          description: string | null
          file_type: string
          id: string
          is_public: boolean | null
          max_size_mb: number | null
          updated_at: string | null
        }
        Insert: {
          allowed_extensions?: string[] | null
          bucket_name: string
          created_at?: string | null
          description?: string | null
          file_type: string
          id?: string
          is_public?: boolean | null
          max_size_mb?: number | null
          updated_at?: string | null
        }
        Update: {
          allowed_extensions?: string[] | null
          bucket_name?: string
          created_at?: string | null
          description?: string | null
          file_type?: string
          id?: string
          is_public?: boolean | null
          max_size_mb?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      storage_migration_plan: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          migration_type: string
          source_bucket: string
          started_at: string | null
          status: string | null
          target_bucket: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          migration_type: string
          source_bucket: string
          started_at?: string | null
          status?: string | null
          target_bucket: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          migration_type?: string
          source_bucket?: string
          started_at?: string | null
          status?: string | null
          target_bucket?: string
        }
        Relationships: []
      }
      system_config: {
        Row: {
          created_at: string | null
          is_secret: boolean | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          is_secret?: boolean | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          is_secret?: boolean | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      user_post_interactions: {
        Row: {
          created_at: string | null
          has_liked: boolean | null
          has_viewed: boolean | null
          id: string
          last_viewed_at: string | null
          liked_at: string | null
          post_id: string | null
          updated_at: string | null
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          has_liked?: boolean | null
          has_viewed?: boolean | null
          id?: string
          last_viewed_at?: string | null
          liked_at?: string | null
          post_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          has_liked?: boolean | null
          has_viewed?: boolean | null
          id?: string
          last_viewed_at?: string | null
          liked_at?: string | null
          post_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_post_interactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "content_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_post_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_post_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_post_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_post_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_status: string | null
          auth_id: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          deleted_at: string | null
          display_name: string | null
          email: string
          email_notifications: boolean | null
          first_name: string | null
          gender: string | null
          id: string
          is_private: boolean | null
          is_verified: boolean | null
          last_name: string | null
          last_seen_at: string | null
          location: string | null
          occupation: string | null
          phone: string | null
          postal_code: string | null
          profile_image_url: string | null
          pronouns: string | null
          push_notifications: boolean | null
          role: string | null
          settings: Json | null
          state: string | null
          updated_at: string
          username: string
          website: string | null
        }
        Insert: {
          account_status?: string | null
          auth_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email: string
          email_notifications?: boolean | null
          first_name?: string | null
          gender?: string | null
          id?: string
          is_private?: boolean | null
          is_verified?: boolean | null
          last_name?: string | null
          last_seen_at?: string | null
          location?: string | null
          occupation?: string | null
          phone?: string | null
          postal_code?: string | null
          profile_image_url?: string | null
          pronouns?: string | null
          push_notifications?: boolean | null
          role?: string | null
          settings?: Json | null
          state?: string | null
          updated_at?: string
          username: string
          website?: string | null
        }
        Update: {
          account_status?: string | null
          auth_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string
          email_notifications?: boolean | null
          first_name?: string | null
          gender?: string | null
          id?: string
          is_private?: boolean | null
          is_verified?: boolean | null
          last_name?: string | null
          last_seen_at?: string | null
          location?: string | null
          occupation?: string | null
          phone?: string | null
          postal_code?: string | null
          profile_image_url?: string | null
          pronouns?: string | null
          push_notifications?: boolean | null
          role?: string | null
          settings?: Json | null
          state?: string | null
          updated_at?: string
          username?: string
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      chat_messages_with_reactions: {
        Row: {
          attachments: Json | null
          content: string | null
          conversation_id: string | null
          created_at: string | null
          current_user_has_reacted: boolean | null
          deleted_at: string | null
          deleted_by: string | null
          edited_at: string | null
          id: string | null
          is_deleted: boolean | null
          is_edited: boolean | null
          media_duration: number | null
          media_metadata: Json | null
          media_size: number | null
          media_thumbnail_url: string | null
          media_type: string | null
          media_url: string | null
          message_type: string | null
          metadata: Json | null
          reactions: Json | null
          reply_count: number | null
          reply_to_id: string | null
          sender_id: string | null
        }
        Insert: {
          attachments?: Json | null
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          current_user_has_reacted?: never
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          id?: string | null
          is_deleted?: boolean | null
          is_edited?: boolean | null
          media_duration?: number | null
          media_metadata?: Json | null
          media_size?: number | null
          media_thumbnail_url?: string | null
          media_type?: string | null
          media_url?: string | null
          message_type?: string | null
          metadata?: Json | null
          reactions?: never
          reply_count?: number | null
          reply_to_id?: string | null
          sender_id?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          current_user_has_reacted?: never
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          id?: string | null
          is_deleted?: boolean | null
          is_edited?: boolean | null
          media_duration?: number | null
          media_metadata?: Json | null
          media_size?: number | null
          media_thumbnail_url?: string | null
          media_type?: string | null
          media_url?: string | null
          message_type?: string | null
          metadata?: Json | null
          reactions?: never
          reply_count?: number | null
          reply_to_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "v_active_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages_with_reactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
        ]
      }
      user_message_stats: {
        Row: {
          conversations_count: number | null
          last_message_at: string | null
          total_messages: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
      user_profiles_with_stats: {
        Row: {
          account_status: string | null
          auth_id: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          deleted_at: string | null
          display_name: string | null
          email: string | null
          email_notifications: boolean | null
          first_name: string | null
          followers_count: number | null
          following_count: number | null
          gender: string | null
          id: string | null
          is_private: boolean | null
          is_verified: boolean | null
          last_name: string | null
          last_seen_at: string | null
          location: string | null
          occupation: string | null
          phone: string | null
          postal_code: string | null
          posts_count: number | null
          profile_image_url: string | null
          pronouns: string | null
          push_notifications: boolean | null
          role: string | null
          settings: Json | null
          state: string | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Relationships: []
      }
      v_active_conversations: {
        Row: {
          actual_participant_count: number | null
          avatar_url: string | null
          conversation_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          is_archived: boolean | null
          is_group: boolean | null
          is_pinned: boolean | null
          last_message_at: string | null
          last_message_preview: string | null
          last_message_sender_id: string | null
          latest_message_time: string | null
          message_count: number | null
          metadata: Json | null
          name: string | null
          participant_count: number | null
          settings: Json | null
          slug: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey"
            columns: ["last_message_sender_id"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey"
            columns: ["last_message_sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey"
            columns: ["last_message_sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey"
            columns: ["last_message_sender_id"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
        ]
      }
      v_menu_full: {
        Row: {
          allergens: string[] | null
          category_color: string | null
          category_icon: string | null
          category_id: string | null
          category_name: string | null
          category_order: number | null
          category_type: string | null
          content_postsrc: string | null
          has_video: boolean | null
          image_id: string | null
          image_url: string | null
          is_available: boolean | null
          is_featured: boolean | null
          item_description: string | null
          item_id: string | null
          item_name: string | null
          item_order: number | null
          item_price: number | null
          prep_time_minutes: number | null
          spice_level: number | null
          storage_path: string | null
          video_thumbnail_url: string | null
          video_url: string | null
        }
        Relationships: []
      }
      v_typing_users: {
        Row: {
          conversation_id: string | null
          display_name: string | null
          is_typing: boolean | null
          typing_timestamp: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "v_active_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_message_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_activity"
            referencedColumns: ["id"]
          },
        ]
      }
      v_user_activity: {
        Row: {
          conversations_joined: number | null
          display_name: string | null
          id: string | null
          last_message_at: string | null
          last_seen_at: string | null
          messages_sent: number | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_comment: {
        Args: {
          p_content: string
          p_parent_comment_id?: string
          p_video_id: string
        }
        Returns: Json
      }
      batch_update_trending_scores: {
        Args: { updates: Json } | { updates: Json }
        Returns: undefined
      }
      block_user: {
        Args: { target_user_id: string }
        Returns: Json
      }
      check_system_health: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_user_session_status: {
        Args: { p_email?: string }
        Returns: Json
      }
      cleanup_old_typing_indicators: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_post: {
        Args: {
          p_caption?: string
          p_images?: string[]
          p_post_type?: string
          p_tags?: string[]
          p_thumbnail_url?: string
          p_video_url?: string
          p_visibility?: string
        }
        Returns: Json
      }
      follow_user: {
        Args: { target_user_id: string }
        Returns: Json
      }
      get_api_documentation: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_complete_menu: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_conversation_messages: {
        Args: {
          p_before_message_id?: string
          p_conversation_id: string
          p_limit?: number
        }
        Returns: Json
      }
      get_conversation_messages_enhanced: {
        Args: {
          p_before_message_id?: string
          p_conversation_id: string
          p_limit?: number
        }
        Returns: Json
      }
      get_cron_jobs_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          active: boolean
          jobname: string
          schedule: string
          username: string
        }[]
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_display_name: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_last_cleanup_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          hours_since_last_run: number
          last_executed: string
          results: Json
          status: string
        }[]
      }
      get_menu_items_by_type: {
        Args: { item_type?: string }
        Returns: Json
      }
      get_notifications: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_or_create_dm_conversation: {
        Args: { other_user_id: string }
        Returns: Json
      }
      get_performance_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_conversations: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_feed: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_user_posts: {
        Args: { p_limit?: number; p_offset?: number; target_user_id?: string }
        Returns: Json
      }
      get_user_posts_with_stats: {
        Args: {
          limit_count?: number
          offset_count?: number
          target_user_id: string
        }
        Returns: Json
      }
      get_user_profile: {
        Args: { target_user_id: string }
        Returns: Json
      }
      get_user_profile_with_counts: {
        Args: { target_user_id: string }
        Returns: Json
      }
      handle_user_logout: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      increment_view_counts: {
        Args: { post_ids: string[]; user_id_param: string }
        Returns: undefined
      }
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: Json
      }
      perform_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      register_push_token: {
        Args: { p_device_info?: Json; p_platform?: string; p_token: string }
        Returns: Json
      }
      run_automated_cleanup: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      run_cleanup_job: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_users: {
        Args: { p_limit?: number; p_query: string }
        Returns: Json
      }
      send_message: {
        Args: {
          p_content: string
          p_conversation_id: string
          p_media_type?: string
          p_media_url?: string
          p_message_type?: string
          p_reply_to_id?: string
        }
        Returns: Json
      }
      send_message_safe: {
        Args: {
          p_content: string
          p_conversation_id: string
          p_media_type?: string
          p_media_url?: string
          p_message_type?: string
          p_reply_to_id?: string
        }
        Returns: Json
      }
      set_typing_status: {
        Args: { p_conversation_id: string; p_is_typing?: boolean }
        Returns: Json
      }
      subscribe_to_conversation_messages: {
        Args: { p_conversation_id: string }
        Returns: Json
      }
      toggle_follow: {
        Args: { target_user_id: string }
        Returns: Json
      }
      toggle_post_like: {
        Args: { p_post_id: string; p_user_id: string } | { post_id: string }
        Returns: Json
      }
      unblock_user: {
        Args: { target_user_id: string }
        Returns: Json
      }
      unfollow_user: {
        Args: { target_user_id: string }
        Returns: Json
      }
      update_user_presence: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_user_profile: {
        Args: {
          p_avatar_url?: string
          p_display_name?: string
          p_first_name?: string
          p_last_name?: string
          p_settings?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
