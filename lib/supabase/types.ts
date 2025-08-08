export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          role: string | null;
          location_id: string | null;
          created_at: string;
          updated_at: string;
          permissions: Json | null;
          last_login: string | null;
          is_approved: boolean | null;
          password_hash: string | null;
          auth_id: string | null;
          deleted_at: string | null;
          sensitive_data_encrypted: Json | null;
          status: string | null;
          blocked_at: string | null;
          blocked_by: string | null;
          block_reason: string | null;
          notes: string | null;
          avatar_id: string | null;
          wolfpack_status: string | null;
          wolfpack_joined_at: string | null;
          wolfpack_tier: string | null;
          location_permissions_granted: boolean | null;
          phone: string | null;
          phone_verified: boolean | null;
          privacy_settings: Json | null;
          notification_preferences: Json | null;
          session_id: string | null;
          last_activity: string | null;
          is_online: boolean | null;
          display_name: string | null;
          wolf_emoji: string | null;
          bio: string | null;
          favorite_drink: string | null;
          vibe_status: string | null;
          profile_pic_url: string | null;
          instagram_handle: string | null;
          favorite_song: string | null;
          looking_for: string | null;
          is_profile_visible: boolean | null;
          profile_last_seen_at: string | null;
          custom_avatar_id: string | null;
          gender: string | null;
          pronouns: string | null;
          daily_customization: Json | null;
          profile_image_url: string | null;
          allow_messages: boolean | null;
          favorite_bartender: string | null;
          last_seen_at: string | null;
          has_open_tab: boolean | null;
          is_side_hustle: boolean | null;
          card_on_file: boolean | null;
          city: string | null;
          state: string | null;
          location_verified: boolean | null;
          verified_region: string | null;
          email_normalized: string | null;
          full_name_normalized: string | null;
          phone_number: string | null;
          phone_normalized: string | null;
          id_verified: boolean | null;
          id_verification_method: string | null;
          verified_by: string | null;
          verified_at: string | null;
          occupation: string | null;
          loyalty_score: number | null;
          leader_rank: string | null;
          pack_badges: Json | null;
          pack_achievements: Json | null;
          wolfpack_bio: string | null;
          wolfpack_interests: string[] | null;
          wolfpack_skills: string[] | null;
          wolfpack_availability_status: string | null;
          last_location_update: string | null;
          preferred_pack_activities: string[] | null;
          wolfpack_social_links: Json | null;
          username: string | null;
          location: string | null;
          business_account: boolean | null;
          artist_account: boolean | null;
          verified: boolean | null;
          is_vip: boolean | null;
          last_location_check: string | null;
          location_accuracy: number | null;
          last_known_lat: number | null;
          last_known_lng: number | null;
          location_verification_status: string | null;
          location_verification_date: string | null;
          location_verification_method: string | null;
          location_report_count: number | null;
          location_last_reported: string | null;
          is_wolfpack_member: boolean | null;
          website: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          location_id?: string | null;
          created_at?: string;
          updated_at?: string;
          permissions?: Json | null;
          last_login?: string | null;
          is_approved?: boolean | null;
          password_hash?: string | null;
          auth_id?: string | null;
          deleted_at?: string | null;
          sensitive_data_encrypted?: Json | null;
          status?: string | null;
          blocked_at?: string | null;
          blocked_by?: string | null;
          block_reason?: string | null;
          notes?: string | null;
          avatar_id?: string | null;
          wolfpack_status?: string | null;
          wolfpack_joined_at?: string | null;
          wolfpack_tier?: string | null;
          location_permissions_granted?: boolean | null;
          phone?: string | null;
          phone_verified?: boolean | null;
          privacy_settings?: Json | null;
          notification_preferences?: Json | null;
          session_id?: string | null;
          last_activity?: string | null;
          is_online?: boolean | null;
          display_name?: string | null;
          wolf_emoji?: string | null;
          bio?: string | null;
          favorite_drink?: string | null;
          vibe_status?: string | null;
          profile_pic_url?: string | null;
          instagram_handle?: string | null;
          favorite_song?: string | null;
          looking_for?: string | null;
          is_profile_visible?: boolean | null;
          profile_last_seen_at?: string | null;
          custom_avatar_id?: string | null;
          gender?: string | null;
          pronouns?: string | null;
          daily_customization?: Json | null;
          profile_image_url?: string | null;
          allow_messages?: boolean | null;
          favorite_bartender?: string | null;
          last_seen_at?: string | null;
          has_open_tab?: boolean | null;
          is_side_hustle?: boolean | null;
          card_on_file?: boolean | null;
          city?: string | null;
          state?: string | null;
          location_verified?: boolean | null;
          verified_region?: string | null;
          email_normalized?: string | null;
          full_name_normalized?: string | null;
          phone_number?: string | null;
          phone_normalized?: string | null;
          id_verified?: boolean | null;
          id_verification_method?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          occupation?: string | null;
          loyalty_score?: number | null;
          leader_rank?: string | null;
          pack_badges?: Json | null;
          pack_achievements?: Json | null;
          wolfpack_bio?: string | null;
          wolfpack_interests?: string[] | null;
          wolfpack_skills?: string[] | null;
          wolfpack_availability_status?: string | null;
          last_location_update?: string | null;
          preferred_pack_activities?: string[] | null;
          wolfpack_social_links?: Json | null;
          username?: string | null;
          location?: string | null;
          business_account?: boolean | null;
          artist_account?: boolean | null;
          verified?: boolean | null;
          is_vip?: boolean | null;
          last_location_check?: string | null;
          location_accuracy?: number | null;
          last_known_lat?: number | null;
          last_known_lng?: number | null;
          location_verification_status?: string | null;
          location_verification_date?: string | null;
          location_verification_method?: string | null;
          location_report_count?: number | null;
          location_last_reported?: string | null;
          is_wolfpack_member?: boolean | null;
          website?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          location_id?: string | null;
          created_at?: string;
          updated_at?: string;
          permissions?: Json | null;
          last_login?: string | null;
          is_approved?: boolean | null;
          password_hash?: string | null;
          auth_id?: string | null;
          deleted_at?: string | null;
          sensitive_data_encrypted?: Json | null;
          status?: string | null;
          blocked_at?: string | null;
          blocked_by?: string | null;
          block_reason?: string | null;
          notes?: string | null;
          avatar_id?: string | null;
          wolfpack_status?: string | null;
          wolfpack_joined_at?: string | null;
          wolfpack_tier?: string | null;
          location_permissions_granted?: boolean | null;
          phone?: string | null;
          phone_verified?: boolean | null;
          privacy_settings?: Json | null;
          notification_preferences?: Json | null;
          session_id?: string | null;
          last_activity?: string | null;
          is_online?: boolean | null;
          display_name?: string | null;
          wolf_emoji?: string | null;
          bio?: string | null;
          favorite_drink?: string | null;
          vibe_status?: string | null;
          profile_pic_url?: string | null;
          instagram_handle?: string | null;
          favorite_song?: string | null;
          looking_for?: string | null;
          is_profile_visible?: boolean | null;
          profile_last_seen_at?: string | null;
          custom_avatar_id?: string | null;
          gender?: string | null;
          pronouns?: string | null;
          daily_customization?: Json | null;
          profile_image_url?: string | null;
          allow_messages?: boolean | null;
          favorite_bartender?: string | null;
          last_seen_at?: string | null;
          has_open_tab?: boolean | null;
          is_side_hustle?: boolean | null;
          card_on_file?: boolean | null;
          city?: string | null;
          state?: string | null;
          location_verified?: boolean | null;
          verified_region?: string | null;
          email_normalized?: string | null;
          full_name_normalized?: string | null;
          phone_number?: string | null;
          phone_normalized?: string | null;
          id_verified?: boolean | null;
          id_verification_method?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          occupation?: string | null;
          loyalty_score?: number | null;
          leader_rank?: string | null;
          pack_badges?: Json | null;
          pack_achievements?: Json | null;
          wolfpack_bio?: string | null;
          wolfpack_interests?: string[] | null;
          wolfpack_skills?: string[] | null;
          wolfpack_availability_status?: string | null;
          last_location_update?: string | null;
          preferred_pack_activities?: string[] | null;
          wolfpack_social_links?: Json | null;
          username?: string | null;
          location?: string | null;
          business_account?: boolean | null;
          artist_account?: boolean | null;
          verified?: boolean | null;
          is_vip?: boolean | null;
          last_location_check?: string | null;
          location_accuracy?: number | null;
          last_known_lat?: number | null;
          last_known_lng?: number | null;
          location_verification_status?: string | null;
          location_verification_date?: string | null;
          location_verification_method?: string | null;
          location_report_count?: number | null;
          location_last_reported?: string | null;
          is_wolfpack_member?: boolean | null;
          website?: string | null;
        };
      };
      locations: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          latitude: number;
          longitude: number;
          radius_miles: number | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          hours: Json | null;
          venue_type: string | null;
          venue_capacity: number | null;
          venue_amenities: string[] | null;
          venue_metadata: Json | null;
          timezone: string | null;
          is_active: boolean | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          latitude: number;
          longitude: number;
          radius_miles?: number | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          hours?: Json | null;
          venue_type?: string | null;
          venue_capacity?: number | null;
          venue_amenities?: string[] | null;
          venue_metadata?: Json | null;
          timezone?: string | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          latitude?: number;
          longitude?: number;
          radius_miles?: number | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          hours?: Json | null;
          venue_type?: string | null;
          venue_capacity?: number | null;
          venue_amenities?: string[] | null;
          venue_metadata?: Json | null;
          timezone?: string | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      wolfpack_videos: {
        Row: {
          id: string;
          user_id: string;
          upload_id: string | null;
          title: string | null;
          description: string | null;
          status: string | null;
          privacy: string | null;
          category: string | null;
          tags: string[] | null;
          metadata: Json | null;
          analytics_data: Json | null;
          is_featured: boolean | null;
          featured_at: string | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
          latitude: number | null;
          longitude: number | null;
          location_name: string | null;
          location_id: string | null;
          hashtags: string[] | null;
          is_nsfw: boolean | null;
          featured_by: string | null;
          trending_score: number | null;
          order_index: number | null;
          featured_until: string | null;
          caption: string | null;
          song_id: string | null;
          is_private: boolean | null;
          allow_wolfpack_comments: boolean | null;
          allow_downloads: boolean | null;
          processed_at: string | null;
          processing_attempts: number | null;
          last_processing_error: string | null;
          original_width: number | null;
          original_height: number | null;
          original_duration: number | null;
          processed_qualities: string[] | null;
          cdn_url: string | null;
          view_count: number | null;
          like_count: number | null;
          comment_count: number | null;
          share_count: number | null;
          wolfpack_ingestion_status: string | null;
          content_moderation_status: string | null;
          moderation_notes: string | null;
          is_local_content: boolean | null;
          source_platform: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          upload_id?: string | null;
          title?: string | null;
          description?: string | null;
          status?: string | null;
          privacy?: string | null;
          category?: string | null;
          tags?: string[] | null;
          metadata?: Json | null;
          analytics_data?: Json | null;
          is_featured?: boolean | null;
          featured_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          location_name?: string | null;
          location_id?: string | null;
          hashtags?: string[] | null;
          is_nsfw?: boolean | null;
          featured_by?: string | null;
          trending_score?: number | null;
          order_index?: number | null;
          featured_until?: string | null;
          caption?: string | null;
          song_id?: string | null;
          is_private?: boolean | null;
          allow_wolfpack_comments?: boolean | null;
          allow_downloads?: boolean | null;
          processed_at?: string | null;
          processing_attempts?: number | null;
          last_processing_error?: string | null;
          original_width?: number | null;
          original_height?: number | null;
          original_duration?: number | null;
          processed_qualities?: string[] | null;
          cdn_url?: string | null;
          view_count?: number | null;
          like_count?: number | null;
          comment_count?: number | null;
          share_count?: number | null;
          wolfpack_ingestion_status?: string | null;
          content_moderation_status?: string | null;
          moderation_notes?: string | null;
          is_local_content?: boolean | null;
          source_platform?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          upload_id?: string | null;
          title?: string | null;
          description?: string | null;
          status?: string | null;
          privacy?: string | null;
          category?: string | null;
          tags?: string[] | null;
          metadata?: Json | null;
          analytics_data?: Json | null;
          is_featured?: boolean | null;
          featured_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          location_name?: string | null;
          location_id?: string | null;
          hashtags?: string[] | null;
          is_nsfw?: boolean | null;
          featured_by?: string | null;
          trending_score?: number | null;
          order_index?: number | null;
          featured_until?: string | null;
          caption?: string | null;
          song_id?: string | null;
          is_private?: boolean | null;
          allow_wolfpack_comments?: boolean | null;
          allow_downloads?: boolean | null;
          processed_at?: string | null;
          processing_attempts?: number | null;
          last_processing_error?: string | null;
          original_width?: number | null;
          original_height?: number | null;
          original_duration?: number | null;
          processed_qualities?: string[] | null;
          cdn_url?: string | null;
          view_count?: number | null;
          like_count?: number | null;
          comment_count?: number | null;
          share_count?: number | null;
          wolfpack_ingestion_status?: string | null;
          content_moderation_status?: string | null;
          moderation_notes?: string | null;
          is_local_content?: boolean | null;
          source_platform?: string | null;
        };
      };
      wolfpack_posts: {
        Row: {
          id: string;
          user_id: string;
          content: string | null;
          media_urls: string[] | null;
          video_id: string | null;
          location_id: string | null;
          location_name: string | null;
          latitude: number | null;
          longitude: number | null;
          visibility: string | null;
          hashtags: string[] | null;
          mentioned_users: string[] | null;
          is_pinned: boolean | null;
          pinned_at: string | null;
          like_count: number | null;
          comment_count: number | null;
          share_count: number | null;
          view_count: number | null;
          trending_score: number | null;
          engagement_rate: number | null;
          is_featured: boolean | null;
          featured_at: string | null;
          featured_by: string | null;
          featured_until: string | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
          metadata: Json | null;
          post_type: string | null;
          reply_to_post_id: string | null;
          is_repost: boolean | null;
          original_post_id: string | null;
          poll_options: Json | null;
          poll_end_time: string | null;
          event_date: string | null;
          event_location: string | null;
          media_type: string | null;
          content_warning: string | null;
          is_sponsored: boolean | null;
          sponsor_info: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          content?: string | null;
          media_urls?: string[] | null;
          video_id?: string | null;
          location_id?: string | null;
          location_name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          visibility?: string | null;
          hashtags?: string[] | null;
          mentioned_users?: string[] | null;
          is_pinned?: boolean | null;
          pinned_at?: string | null;
          like_count?: number | null;
          comment_count?: number | null;
          share_count?: number | null;
          view_count?: number | null;
          trending_score?: number | null;
          engagement_rate?: number | null;
          is_featured?: boolean | null;
          featured_at?: string | null;
          featured_by?: string | null;
          featured_until?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
          metadata?: Json | null;
          post_type?: string | null;
          reply_to_post_id?: string | null;
          is_repost?: boolean | null;
          original_post_id?: string | null;
          poll_options?: Json | null;
          poll_end_time?: string | null;
          event_date?: string | null;
          event_location?: string | null;
          media_type?: string | null;
          content_warning?: string | null;
          is_sponsored?: boolean | null;
          sponsor_info?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string | null;
          media_urls?: string[] | null;
          video_id?: string | null;
          location_id?: string | null;
          location_name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          visibility?: string | null;
          hashtags?: string[] | null;
          mentioned_users?: string[] | null;
          is_pinned?: boolean | null;
          pinned_at?: string | null;
          like_count?: number | null;
          comment_count?: number | null;
          share_count?: number | null;
          view_count?: number | null;
          trending_score?: number | null;
          engagement_rate?: number | null;
          is_featured?: boolean | null;
          featured_at?: string | null;
          featured_by?: string | null;
          featured_until?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
          metadata?: Json | null;
          post_type?: string | null;
          reply_to_post_id?: string | null;
          is_repost?: boolean | null;
          original_post_id?: string | null;
          poll_options?: Json | null;
          poll_end_time?: string | null;
          event_date?: string | null;
          event_location?: string | null;
          media_type?: string | null;
          content_warning?: string | null;
          is_sponsored?: boolean | null;
          sponsor_info?: Json | null;
        };
      };
      wolfpack_interactions: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          interaction_type: string;
          metadata: Json | null;
          created_at: string | null;
          expires_at: string | null;
          status: string | null;
          response: string | null;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          interaction_type: string;
          metadata?: Json | null;
          created_at?: string | null;
          expires_at?: string | null;
          status?: string | null;
          response?: string | null;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          interaction_type?: string;
          metadata?: Json | null;
          created_at?: string | null;
          expires_at?: string | null;
          status?: string | null;
          response?: string | null;
          responded_at?: string | null;
        };
      };
      wolfpack_follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string | null;
          is_mutual: boolean | null;
          notification_sent: boolean | null;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string | null;
          is_mutual?: boolean | null;
          notification_sent?: boolean | null;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string | null;
          is_mutual?: boolean | null;
          notification_sent?: boolean | null;
        };
      };
      wolfpack_chat_messages: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          content: string;
          message_type: string;
          display_name: string;
          avatar_url: string | null;
          image_url: string | null;
          reply_to_message_id: string | null;
          thread_id: string | null;
          is_deleted: boolean | null;
          is_flagged: boolean | null;
          edited_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          content: string;
          message_type?: string;
          display_name?: string;
          avatar_url?: string | null;
          image_url?: string | null;
          reply_to_message_id?: string | null;
          thread_id?: string | null;
          is_deleted?: boolean | null;
          is_flagged?: boolean | null;
          edited_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          content?: string;
          message_type?: string;
          display_name?: string;
          avatar_url?: string | null;
          image_url?: string | null;
          reply_to_message_id?: string | null;
          thread_id?: string | null;
          is_deleted?: boolean | null;
          is_flagged?: boolean | null;
          edited_at?: string | null;
          created_at?: string | null;
        };
      };
      wolfpack_direct_messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          content: string;
          is_read: boolean | null;
          read_at: string | null;
          metadata: Json | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          content: string;
          is_read?: boolean | null;
          read_at?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          content?: string;
          is_read?: boolean | null;
          read_at?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
      };
      wolfpack_activity_notifications: {
        Row: {
          id: string;
          recipient_id: string;
          type: string;
          title: string | null;
          message: string;
          link: string | null;
          related_user_id: string | null;
          related_video_id: string | null;
          metadata: Json | null;
          status: string;
          notification_type: string | null;
          data: Json | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          type?: string;
          title?: string | null;
          message: string;
          link?: string | null;
          related_user_id?: string | null;
          related_video_id?: string | null;
          metadata?: Json | null;
          status?: string;
          notification_type?: string | null;
          data?: Json | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          type?: string;
          title?: string | null;
          message?: string;
          link?: string | null;
          related_user_id?: string | null;
          related_video_id?: string | null;
          metadata?: Json | null;
          status?: string;
          notification_type?: string | null;
          data?: Json | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      dj_broadcasts: {
        Row: {
          id: string;
          dj_id: string | null;
          location_id: string | null;
          message: string;
          title: string;
          subtitle: string | null;
          broadcast_type: string | null;
          background_color: string | null;
          text_color: string | null;
          accent_color: string | null;
          animation_type: string | null;
          emoji_burst: string[] | null;
          interaction_config: Json | null;
          duration_seconds: number | null;
          auto_close: boolean | null;
          priority: string | null;
          status: string | null;
          sent_at: string | null;
          expires_at: string | null;
          closed_at: string | null;
          view_count: number | null;
          interaction_count: number | null;
          unique_participants: number | null;
          tags: string[] | null;
          category: string | null;
          session_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          dj_id?: string | null;
          location_id?: string | null;
          message: string;
          title: string;
          subtitle?: string | null;
          broadcast_type?: string | null;
          background_color?: string | null;
          text_color?: string | null;
          accent_color?: string | null;
          animation_type?: string | null;
          emoji_burst?: string[] | null;
          interaction_config?: Json | null;
          duration_seconds?: number | null;
          auto_close?: boolean | null;
          priority?: string | null;
          status?: string | null;
          sent_at?: string | null;
          expires_at?: string | null;
          closed_at?: string | null;
          view_count?: number | null;
          interaction_count?: number | null;
          unique_participants?: number | null;
          tags?: string[] | null;
          category?: string | null;
          session_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          dj_id?: string | null;
          location_id?: string | null;
          message?: string;
          title?: string;
          subtitle?: string | null;
          broadcast_type?: string | null;
          background_color?: string | null;
          text_color?: string | null;
          accent_color?: string | null;
          animation_type?: string | null;
          emoji_burst?: string[] | null;
          interaction_config?: Json | null;
          duration_seconds?: number | null;
          auto_close?: boolean | null;
          priority?: string | null;
          status?: string | null;
          sent_at?: string | null;
          expires_at?: string | null;
          closed_at?: string | null;
          view_count?: number | null;
          interaction_count?: number | null;
          unique_participants?: number | null;
          tags?: string[] | null;
          category?: string | null;
          session_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      dj_events: {
        Row: {
          id: string;
          dj_id: string | null;
          location_id: string | null;
          event_type: string;
          title: string;
          description: string | null;
          status: string | null;
          voting_ends_at: string | null;
          created_at: string | null;
          started_at: string | null;
          ended_at: string | null;
          winner_id: string | null;
          winner_data: Json | null;
          event_config: Json | null;
          voting_format: string | null;
          options: Json | null;
          start_time: string | null;
        };
        Insert: {
          id?: string;
          dj_id?: string | null;
          location_id?: string | null;
          event_type: string;
          title: string;
          description?: string | null;
          status?: string | null;
          voting_ends_at?: string | null;
          created_at?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          winner_id?: string | null;
          winner_data?: Json | null;
          event_config?: Json | null;
          voting_format?: string | null;
          options?: Json | null;
          start_time?: string | null;
        };
        Update: {
          id?: string;
          dj_id?: string | null;
          location_id?: string | null;
          event_type?: string;
          title?: string;
          description?: string | null;
          status?: string | null;
          voting_ends_at?: string | null;
          created_at?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          winner_id?: string | null;
          winner_data?: Json | null;
          event_config?: Json | null;
          voting_format?: string | null;
          options?: Json | null;
          start_time?: string | null;
        };
      };
      food_drink_categories: {
        Row: {
          id: string;
          name: string;
          type: string;
          description: string | null;
          display_order: number | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          created_by: string | null;
          icon: string | null;
          color: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          description?: string | null;
          display_order?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: string | null;
          icon?: string | null;
          color?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          description?: string | null;
          display_order?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: string | null;
          icon?: string | null;
          color?: string | null;
        };
      };
      food_drink_items: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          image_id: string | null;
          display_order: number | null;
          is_available: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          image_id?: string | null;
          display_order?: number | null;
          is_available?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          image_id?: string | null;
          display_order?: number | null;
          is_available?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: string | null;
        };
      };
      images: {
        Row: {
          id: string;
          name: string;
          url: string;
          storage_path: string | null;
          mime_type: string | null;
          size: number | null;
          image_type: string | null;
          uploaded_by: string | null;
          metadata: Json | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          url: string;
          storage_path?: string | null;
          mime_type?: string | null;
          size?: number | null;
          image_type?: string | null;
          uploaded_by?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          url?: string;
          storage_path?: string | null;
          mime_type?: string | null;
          size?: number | null;
          image_type?: string | null;
          uploaded_by?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
      };
      wolfpack_comments: {
        Row: {
          id: string;
          post_id: string | null;
          video_id: string | null;
          user_id: string;
          content: string;
          parent_comment_id: string | null;
          like_count: number | null;
          reply_count: number | null;
          is_edited: boolean | null;
          edited_at: string | null;
          is_deleted: boolean | null;
          deleted_at: string | null;
          deleted_by: string | null;
          mentioned_users: string[] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          post_id?: string | null;
          video_id?: string | null;
          user_id: string;
          content: string;
          parent_comment_id?: string | null;
          like_count?: number | null;
          reply_count?: number | null;
          is_edited?: boolean | null;
          edited_at?: string | null;
          is_deleted?: boolean | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          mentioned_users?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string | null;
          video_id?: string | null;
          user_id?: string;
          content?: string;
          parent_comment_id?: string | null;
          like_count?: number | null;
          reply_count?: number | null;
          is_edited?: boolean | null;
          edited_at?: string | null;
          is_deleted?: boolean | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          mentioned_users?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      feature_flags: {
        Row: {
          id: string;
          flag_name: string;
          description: string | null;
          is_enabled: boolean | null;
          enabled_for_roles: string[] | null;
          enabled_for_users: string[] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          flag_name: string;
          description?: string | null;
          is_enabled?: boolean | null;
          enabled_for_roles?: string[] | null;
          enabled_for_users?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          flag_name?: string;
          description?: string | null;
          is_enabled?: boolean | null;
          enabled_for_roles?: string[] | null;
          enabled_for_users?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      system_config: {
        Row: {
          id: string;
          config_key: string;
          config_value: Json;
          description: string | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          config_key: string;
          config_value: Json;
          description?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          config_key?: string;
          config_value?: Json;
          description?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
      };
    };
    Views: {
      active_wolfpack_members: {
        Row: {
          id: string | null;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          wolfpack_status: string | null;
          wolfpack_tier: string | null;
          is_online: boolean | null;
          last_seen_at: string | null;
          location: string | null;
        };
      };
      profiles: {
        Row: {
          id: string | null;
          email: string | null;
          first_name: string | null;
          last_name: string | null;
          display_name: string | null;
          avatar_url: string | null;
          role: string | null;
          is_wolfpack_member: boolean | null;
          wolfpack_status: string | null;
          wolfpack_tier: string | null;
          location: string | null;
          is_online: boolean | null;
          last_seen_at: string | null;
        };
      };
    };
    Functions: object;
    Enums: {
      user_role: "admin" | "bartender" | "dj" | "user" | "vip";
      user_status: "active" | "blocked" | "suspended" | "pending" | "inactive";
      wolfpack_status: "pending" | "active" | "inactive" | "suspended";
      wolfpack_tier: "basic" | "premium" | "vip" | "permanent";
      location_verification_status:
        | "unverified"
        | "verified"
        | "pending"
        | "failed"
        | "reported";
      gender: "male" | "female" | "other" | "prefer_not_to_say";
      notification_type:
        | "follow"
        | "like"
        | "comment"
        | "mention"
        | "message"
        | "wink"
        | "video_posted"
        | "system";
      interaction_type:
        | "wink"
        | "wave"
        | "cheers"
        | "highfive"
        | "hug"
        | "wolfpack_invite";
      broadcast_type:
        | "general"
        | "howl_request"
        | "contest_announcement"
        | "song_request"
        | "vibe_check"
        | "spotlight"
        | "event"
        | "single_ladies_spotlight"
        | "special_event"
        | "promotion"
        | "vip_announcement";
      dj_event_type:
        | "dance_battle"
        | "hottest_person"
        | "best_costume"
        | "name_that_tune"
        | "song_request"
        | "next_song_vote"
        | "trivia"
        | "contest"
        | "poll"
        | "custom";
      dj_event_status:
        | "pending"
        | "active"
        | "voting"
        | "completed"
        | "cancelled";
      food_drink_type: "food" | "drink";
      video_status: "uploading" | "processing" | "ready" | "failed" | "deleted";
      video_privacy: "public" | "wolfpack_only" | "followers_only" | "private";
      post_visibility:
        | "public"
        | "wolfpack_only"
        | "followers_only"
        | "private";
      post_type: "text" | "image" | "video" | "poll" | "event" | "repost";
      message_type: "text" | "image" | "voice" | "system" | "emoji";
    };
  };
};

// Utility types for easier usage
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

// Specific table types for convenience
export type User = Tables<"users">;
export type Location = Tables<"locations">;
export type WolfpackVideo = Tables<"wolfpack_videos">;
export type WolfpackPost = Tables<"wolfpack_posts">;
export type WolfpackInteraction = Tables<"wolfpack_interactions">;
export type WolfpackFollow = Tables<"wolfpack_follows">;
export type WolfpackChatMessage = Tables<"wolfpack_chat_messages">;
export type WolfpackDirectMessage = Tables<"wolfpack_direct_messages">;
export type WolfpackActivityNotification = Tables<
  "wolfpack_activity_notifications"
>;
export type DjBroadcast = Tables<"dj_broadcasts">;
export type DjEvent = Tables<"dj_events">;
export type FoodDrinkCategory = Tables<"food_drink_categories">;
export type FoodDrinkItem = Tables<"food_drink_items">;
export type Image = Tables<"images">;
export type WolfpackComment = Tables<"wolfpack_comments">;
export type FeatureFlag = Tables<"feature_flags">;
export type SystemConfig = Tables<"system_config">;

// Insert types
export type UserInsert = TablesInsert<"users">;
export type LocationInsert = TablesInsert<"locations">;
export type WolfpackVideoInsert = TablesInsert<"wolfpack_videos">;
export type WolfpackPostInsert = TablesInsert<"wolfpack_posts">;
export type WolfpackInteractionInsert = TablesInsert<"wolfpack_interactions">;
export type WolfpackFollowInsert = TablesInsert<"wolfpack_follows">;
export type WolfpackChatMessageInsert = TablesInsert<"wolfpack_chat_messages">;
export type WolfpackDirectMessageInsert = TablesInsert<
  "wolfpack_direct_messages"
>;
export type WolfpackActivityNotificationInsert = TablesInsert<
  "wolfpack_activity_notifications"
>;
export type DjBroadcastInsert = TablesInsert<"dj_broadcasts">;
export type DjEventInsert = TablesInsert<"dj_events">;
export type FoodDrinkCategoryInsert = TablesInsert<"food_drink_categories">;
export type FoodDrinkItemInsert = TablesInsert<"food_drink_items">;
export type ImageInsert = TablesInsert<"images">;
export type WolfpackCommentInsert = TablesInsert<"wolfpack_comments">;
export type FeatureFlagInsert = TablesInsert<"feature_flags">;
export type SystemConfigInsert = TablesInsert<"system_config">;

// Update types
export type UserUpdate = TablesUpdate<"users">;
export type LocationUpdate = TablesUpdate<"locations">;
export type WolfpackVideoUpdate = TablesUpdate<"wolfpack_videos">;
export type WolfpackPostUpdate = TablesUpdate<"wolfpack_posts">;
export type WolfpackInteractionUpdate = TablesUpdate<"wolfpack_interactions">;
export type WolfpackFollowUpdate = TablesUpdate<"wolfpack_follows">;
export type WolfpackChatMessageUpdate = TablesUpdate<"wolfpack_chat_messages">;
export type WolfpackDirectMessageUpdate = TablesUpdate<
  "wolfpack_direct_messages"
>;
export type WolfpackActivityNotificationUpdate = TablesUpdate<
  "wolfpack_activity_notifications"
>;
export type DjBroadcastUpdate = TablesUpdate<"dj_broadcasts">;
export type DjEventUpdate = TablesUpdate<"dj_events">;
export type FoodDrinkCategoryUpdate = TablesUpdate<"food_drink_categories">;
export type FoodDrinkItemUpdate = TablesUpdate<"food_drink_items">;
export type ImageUpdate = TablesUpdate<"images">;
export type WolfpackCommentUpdate = TablesUpdate<"wolfpack_comments">;
export type FeatureFlagUpdate = TablesUpdate<"feature_flags">;
export type SystemConfigUpdate = TablesUpdate<"system_config">;

// View types
export type ActiveWolfpackMember = Views<"active_wolfpack_members">;
export type Profile = Views<"profiles">;

// Enum types
export type UserRole = Enums<"user_role">;
export type UserStatus = Enums<"user_status">;
export type WolfpackStatus = Enums<"wolfpack_status">;
export type WolfpackTier = Enums<"wolfpack_tier">;
export type LocationVerificationStatus = Enums<"location_verification_status">;
export type Gender = Enums<"gender">;
export type NotificationType = Enums<"notification_type">;
export type InteractionType = Enums<"interaction_type">;
export type BroadcastType = Enums<"broadcast_type">;
export type DjEventType = Enums<"dj_event_type">;
export type DjEventStatus = Enums<"dj_event_status">;
export type FoodDrinkType = Enums<"food_drink_type">;
export type wolfpack_videostatus = Enums<"video_status">;
export type VideoPrivacy = Enums<"video_privacy">;
export type PostVisibility = Enums<"post_visibility">;
export type PostType = Enums<"post_type">;
export type MessageType = Enums<"message_type">;

// ===== WOLFPACK ERROR TYPES =====
export interface WolfpackError extends Error {
  code?: string;
  details?: unknown;
  statusCode?: number;
}

// ===== WOLFPACK SERVICE RESPONSE TYPES =====
export interface WolfpackServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// ===== PAGINATION TYPES =====
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===== FILTER TYPES =====
export interface LocationFilter {
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
  locationId?: string;
  verified?: boolean;
}

export interface WolfpackMemberFilter extends LocationFilter {
  status?: WolfpackStatus;
  tier?: WolfpackTier;
  online?: boolean;
  hasOpenTab?: boolean;
}

export interface VideoFilter extends LocationFilter {
  userId?: string;
  status?: wolfpack_videostatus;
  privacy?: VideoPrivacy;
  featured?: boolean;
  category?: string;
  hashtags?: string[];
}

export interface PostFilter extends LocationFilter {
  userId?: string;
  visibility?: PostVisibility;
  postType?: PostType;
  featured?: boolean;
  hashtags?: string[];
}

// ===== INTERACTION TYPES =====
export interface CreateInteractionParams {
  receiverId: string;
  interactionType: InteractionType;
  metadata?: Json;
}

export interface InteractionResponse {
  interaction: WolfpackInteraction;
  notification?: WolfpackActivityNotification;
}

// ===== CHAT TYPES =====
export interface SendMessageParams {
  sessionId: string;
  content: string;
  messageType?: MessageType;
  imageUrl?: string | null;
  replyToMessageId?: string | null;
}

export interface DirectMessageParams {
  recipientId: string;
  content: string;
  metadata?: Json;
}

// ===== BROADCAST TYPES =====
export interface CreateBroadcastParams {
  title: string;
  message: string;
  subtitle?: string | null;
  broadcastType?: BroadcastType;
  duration?: number;
  interaction?: Json;
  styling?: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    animationType?: string;
    emojiBurst?: string[];
  };
}

// ===== WOLFPACK MEMBER TYPES =====
export interface WolfpackMemberProfile extends User {
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  wolfpack_videosCount?: number;
  isFollowing?: boolean;
  isFollower?: boolean;
}

// ===== NOTIFICATION PREFERENCES =====
export interface NotificationPreferences {
  events: boolean;
  marketing: boolean;
  announcements: boolean;
  chat_messages: boolean;
  order_updates: boolean;
  member_activity: boolean;
  social_interactions: boolean;
}

// ===== PRIVACY SETTINGS =====
export interface PrivacySettings {
  accept_winks: boolean;
  show_location: boolean;
  accept_messages: boolean;
  profile_visible: boolean;
}
