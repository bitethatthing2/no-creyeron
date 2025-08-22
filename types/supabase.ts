export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  public: {
    Tables: {
      app_config: {
        Row: {
          created_at: string | null;
          encrypted: boolean | null;
          key: string;
          updated_at: string | null;
          value: string | null;
        };
        Insert: {
          created_at?: string | null;
          encrypted?: boolean | null;
          key: string;
          updated_at?: string | null;
          value?: string | null;
        };
        Update: {
          created_at?: string | null;
          encrypted?: boolean | null;
          key?: string;
          updated_at?: string | null;
          value?: string | null;
        };
        Relationships: [];
      };
      feature_flags: {
        Row: {
          created_at: string | null;
          description: string | null;
          enabled_for_roles: string[] | null;
          enabled_for_users: string[] | null;
          flag_name: string;
          id: string;
          is_enabled: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          enabled_for_roles?: string[] | null;
          enabled_for_users?: string[] | null;
          flag_name: string;
          id?: string;
          is_enabled?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          enabled_for_roles?: string[] | null;
          enabled_for_users?: string[] | null;
          flag_name?: string;
          id?: string;
          is_enabled?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      images: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          image_type: string | null;
          metadata: Json | null;
          mime_type: string | null;
          name: string;
          size: number | null;
          storage_path: string | null;
          updated_at: string | null;
          uploaded_by: string | null;
          url: string;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          image_type?: string | null;
          metadata?: Json | null;
          mime_type?: string | null;
          name: string;
          size?: number | null;
          storage_path?: string | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
          url: string;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          image_type?: string | null;
          metadata?: Json | null;
          mime_type?: string | null;
          name?: string;
          size?: number | null;
          storage_path?: string | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "images_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "images_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "images_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "images_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "images_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "images_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "images_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "images_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "images_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      locations: {
        Row: {
          address: string | null;
          city: string | null;
          created_at: string;
          deleted_at: string | null;
          email: string | null;
          hours: Json | null;
          id: string;
          is_active: boolean | null;
          latitude: number;
          longitude: number;
          name: string;
          phone: string | null;
          radius_miles: number | null;
          state: string | null;
          timezone: string | null;
          updated_at: string;
          venue_amenities: string[] | null;
          venue_capacity: number | null;
          venue_metadata: Json | null;
          venue_type: string | null;
          website: string | null;
          zip: string | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email?: string | null;
          hours?: Json | null;
          id?: string;
          is_active?: boolean | null;
          latitude: number;
          longitude: number;
          name: string;
          phone?: string | null;
          radius_miles?: number | null;
          state?: string | null;
          timezone?: string | null;
          updated_at?: string;
          venue_amenities?: string[] | null;
          venue_capacity?: number | null;
          venue_metadata?: Json | null;
          venue_type?: string | null;
          website?: string | null;
          zip?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email?: string | null;
          hours?: Json | null;
          id?: string;
          is_active?: boolean | null;
          latitude?: number;
          longitude?: number;
          name?: string;
          phone?: string | null;
          radius_miles?: number | null;
          state?: string | null;
          timezone?: string | null;
          updated_at?: string;
          venue_amenities?: string[] | null;
          venue_capacity?: number | null;
          venue_metadata?: Json | null;
          venue_type?: string | null;
          website?: string | null;
          zip?: string | null;
        };
        Relationships: [];
      };
      menu_categories: {
        Row: {
          color: string | null;
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      menu_item_videos: {
        Row: {
          created_at: string | null;
          display_order: number | null;
          duration_seconds: number | null;
          id: string;
          is_active: boolean | null;
          menu_item_id: string | null;
          thumbnail_url: string | null;
          updated_at: string | null;
          video_title: string | null;
          video_type: string | null;
          video_url: string;
        };
        Insert: {
          created_at?: string | null;
          display_order?: number | null;
          duration_seconds?: number | null;
          id?: string;
          is_active?: boolean | null;
          menu_item_id?: string | null;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          video_title?: string | null;
          video_type?: string | null;
          video_url: string;
        };
        Update: {
          created_at?: string | null;
          display_order?: number | null;
          duration_seconds?: number | null;
          id?: string;
          is_active?: boolean | null;
          menu_item_id?: string | null;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          video_title?: string | null;
          video_type?: string | null;
          video_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_item_videos_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "menu_item_videos_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_view";
            referencedColumns: ["item_id"];
          },
        ];
      };
      menu_items: {
        Row: {
          category_id: string | null;
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          has_video: boolean | null;
          id: string;
          image_id: string | null;
          is_available: boolean | null;
          name: string;
          price: number;
          updated_at: string | null;
          video_thumbnail_url: string | null;
          video_url: string | null;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          has_video?: boolean | null;
          id?: string;
          image_id?: string | null;
          is_available?: boolean | null;
          name: string;
          price?: number;
          updated_at?: string | null;
          video_thumbnail_url?: string | null;
          video_url?: string | null;
        };
        Update: {
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          has_video?: boolean | null;
          id?: string;
          image_id?: string | null;
          is_available?: boolean | null;
          name?: string;
          price?: number;
          updated_at?: string | null;
          video_thumbnail_url?: string | null;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "menu_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "menu_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "menu_view";
            referencedColumns: ["category_id"];
          },
          {
            foreignKeyName: "menu_items_image_id_fkey";
            columns: ["image_id"];
            isOneToOne: false;
            referencedRelation: "images";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_topics: {
        Row: {
          created_at: string | null;
          description: string | null;
          display_name: string;
          id: string;
          is_active: boolean | null;
          requires_role: string | null;
          topic_key: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          display_name: string;
          id?: string;
          is_active?: boolean | null;
          requires_role?: string | null;
          topic_key: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          display_name?: string;
          id?: string;
          is_active?: boolean | null;
          requires_role?: string | null;
          topic_key?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      production_checklist: {
        Row: {
          category: string;
          created_at: string | null;
          id: string;
          item: string;
          notes: string | null;
          status: string | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          id?: string;
          item: string;
          notes?: string | null;
          status?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          id?: string;
          item?: string;
          notes?: string | null;
          status?: string | null;
        };
        Relationships: [];
      };
      production_features: {
        Row: {
          admin_only: boolean | null;
          created_at: string | null;
          description: string | null;
          feature_category: string;
          feature_name: string;
          id: string;
          tables_involved: string[] | null;
        };
        Insert: {
          admin_only?: boolean | null;
          created_at?: string | null;
          description?: string | null;
          feature_category: string;
          feature_name: string;
          id?: string;
          tables_involved?: string[] | null;
        };
        Update: {
          admin_only?: boolean | null;
          created_at?: string | null;
          description?: string | null;
          feature_category?: string;
          feature_name?: string;
          id?: string;
          tables_involved?: string[] | null;
        };
        Relationships: [];
      };
      rate_limit_config: {
        Row: {
          burst_size: number | null;
          created_at: string | null;
          endpoint: string;
          id: string;
          is_active: boolean | null;
          max_requests: number;
          scope: string;
          updated_at: string | null;
          window_seconds: number;
        };
        Insert: {
          burst_size?: number | null;
          created_at?: string | null;
          endpoint: string;
          id?: string;
          is_active?: boolean | null;
          max_requests?: number;
          scope?: string;
          updated_at?: string | null;
          window_seconds?: number;
        };
        Update: {
          burst_size?: number | null;
          created_at?: string | null;
          endpoint?: string;
          id?: string;
          is_active?: boolean | null;
          max_requests?: number;
          scope?: string;
          updated_at?: string | null;
          window_seconds?: number;
        };
        Relationships: [];
      };
      storage_paths: {
        Row: {
          allowed_mime_types: string[] | null;
          created_at: string | null;
          id: string;
          is_public: boolean | null;
          max_file_size_bytes: number | null;
          path_template: string;
          path_type: string;
        };
        Insert: {
          allowed_mime_types?: string[] | null;
          created_at?: string | null;
          id?: string;
          is_public?: boolean | null;
          max_file_size_bytes?: number | null;
          path_template: string;
          path_type: string;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          created_at?: string | null;
          id?: string;
          is_public?: boolean | null;
          max_file_size_bytes?: number | null;
          path_template?: string;
          path_type?: string;
        };
        Relationships: [];
      };
      user_fcm_tokens: {
        Row: {
          created_at: string | null;
          device_info: Json | null;
          id: string;
          is_active: boolean | null;
          last_used_at: string | null;
          platform: string | null;
          token: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          device_info?: Json | null;
          id?: string;
          is_active?: boolean | null;
          last_used_at?: string | null;
          platform?: string | null;
          token: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          device_info?: Json | null;
          id?: string;
          is_active?: boolean | null;
          last_used_at?: string | null;
          platform?: string | null;
          token?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_fcm_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_fcm_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_fcm_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_fcm_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_fcm_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_fcm_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_fcm_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_fcm_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_fcm_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          created_at: string | null;
          favorite_categories: string[] | null;
          favorite_content_types: string[] | null;
          id: string;
          interaction_patterns: Json | null;
          interests: string[] | null;
          last_updated: string | null;
          location_preferences: Json | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          favorite_categories?: string[] | null;
          favorite_content_types?: string[] | null;
          id?: string;
          interaction_patterns?: Json | null;
          interests?: string[] | null;
          last_updated?: string | null;
          location_preferences?: Json | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          favorite_categories?: string[] | null;
          favorite_content_types?: string[] | null;
          id?: string;
          interaction_patterns?: Json | null;
          interests?: string[] | null;
          last_updated?: string | null;
          location_preferences?: Json | null;
          user_id?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          allow_messages: boolean | null;
          artist_account: boolean | null;
          auth_id: string | null;
          avatar_id: string | null;
          avatar_url: string | null;
          bio: string | null;
          block_reason: string | null;
          blocked_at: string | null;
          blocked_by: string | null;
          business_account: boolean | null;
          card_on_file: boolean | null;
          city: string | null;
          created_at: string;
          custom_avatar_id: string | null;
          daily_customization: Json | null;
          deleted_at: string | null;
          display_name: string | null;
          email: string;
          email_normalized: string | null;
          favorite_bartender: string | null;
          favorite_drink: string | null;
          favorite_song: string | null;
          first_name: string | null;
          full_name_normalized: string | null;
          gender: string | null;
          has_open_tab: boolean | null;
          id: string;
          id_verification_method: string | null;
          id_verified: boolean | null;
          instagram_handle: string | null;
          is_approved: boolean | null;
          is_online: boolean | null;
          is_profile_visible: boolean | null;
          is_side_hustle: boolean | null;
          is_vip: boolean | null;
          is_wolfpack_member: boolean | null;
          last_activity: string | null;
          last_known_lat: number | null;
          last_known_lng: number | null;
          last_location_check: string | null;
          last_location_update: string | null;
          last_login: string | null;
          last_name: string | null;
          last_seen_at: string | null;
          leader_rank: string | null;
          location: string | null;
          location_accuracy: number | null;
          location_id: string | null;
          location_last_reported: string | null;
          location_permissions_granted: boolean | null;
          location_report_count: number | null;
          location_verification_date: string | null;
          location_verification_method: string | null;
          location_verification_status: string | null;
          location_verified: boolean | null;
          looking_for: string | null;
          loyalty_score: number | null;
          notes: string | null;
          notification_preferences: Json | null;
          occupation: string | null;
          pack_achievements: Json | null;
          pack_badges: Json | null;
          password_hash: string | null;
          permissions: Json | null;
          phone: string | null;
          phone_normalized: string | null;
          phone_number: string | null;
          phone_verified: boolean | null;
          preferred_pack_activities: string[] | null;
          privacy_settings: Json | null;
          profile_image_url: string | null;
          profile_last_seen_at: string | null;
          profile_pic_url: string | null;
          pronouns: string | null;
          role: string | null;
          sensitive_data_encrypted: Json | null;
          session_id: string | null;
          state: string | null;
          status: string | null;
          updated_at: string;
          username: string | null;
          verified: boolean | null;
          verified_at: string | null;
          verified_by: string | null;
          verified_region: string | null;
          vibe_status: string | null;
          website: string | null;
          wolf_emoji: string | null;
          wolfpack_availability_status: string | null;
          wolfpack_bio: string | null;
          wolfpack_interests: string[] | null;
          wolfpack_joined_at: string | null;
          wolfpack_skills: string[] | null;
          wolfpack_social_links: Json | null;
          wolfpack_status: string | null;
          wolfpack_tier: string | null;
        };
        Insert: {
          allow_messages?: boolean | null;
          artist_account?: boolean | null;
          auth_id?: string | null;
          avatar_id?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          block_reason?: string | null;
          blocked_at?: string | null;
          blocked_by?: string | null;
          business_account?: boolean | null;
          card_on_file?: boolean | null;
          city?: string | null;
          created_at?: string;
          custom_avatar_id?: string | null;
          daily_customization?: Json | null;
          deleted_at?: string | null;
          display_name?: string | null;
          email: string;
          email_normalized?: string | null;
          favorite_bartender?: string | null;
          favorite_drink?: string | null;
          favorite_song?: string | null;
          first_name?: string | null;
          full_name_normalized?: string | null;
          gender?: string | null;
          has_open_tab?: boolean | null;
          id?: string;
          id_verification_method?: string | null;
          id_verified?: boolean | null;
          instagram_handle?: string | null;
          is_approved?: boolean | null;
          is_online?: boolean | null;
          is_profile_visible?: boolean | null;
          is_side_hustle?: boolean | null;
          is_vip?: boolean | null;
          is_wolfpack_member?: boolean | null;
          last_activity?: string | null;
          last_known_lat?: number | null;
          last_known_lng?: number | null;
          last_location_check?: string | null;
          last_location_update?: string | null;
          last_login?: string | null;
          last_name?: string | null;
          last_seen_at?: string | null;
          leader_rank?: string | null;
          location?: string | null;
          location_accuracy?: number | null;
          location_id?: string | null;
          location_last_reported?: string | null;
          location_permissions_granted?: boolean | null;
          location_report_count?: number | null;
          location_verification_date?: string | null;
          location_verification_method?: string | null;
          location_verification_status?: string | null;
          location_verified?: boolean | null;
          looking_for?: string | null;
          loyalty_score?: number | null;
          notes?: string | null;
          notification_preferences?: Json | null;
          occupation?: string | null;
          pack_achievements?: Json | null;
          pack_badges?: Json | null;
          password_hash?: string | null;
          permissions?: Json | null;
          phone?: string | null;
          phone_normalized?: string | null;
          phone_number?: string | null;
          phone_verified?: boolean | null;
          preferred_pack_activities?: string[] | null;
          privacy_settings?: Json | null;
          profile_image_url?: string | null;
          profile_last_seen_at?: string | null;
          profile_pic_url?: string | null;
          pronouns?: string | null;
          role?: string | null;
          sensitive_data_encrypted?: Json | null;
          session_id?: string | null;
          state?: string | null;
          status?: string | null;
          updated_at?: string;
          username?: string | null;
          verified?: boolean | null;
          verified_at?: string | null;
          verified_by?: string | null;
          verified_region?: string | null;
          vibe_status?: string | null;
          website?: string | null;
          wolf_emoji?: string | null;
          wolfpack_availability_status?: string | null;
          wolfpack_bio?: string | null;
          wolfpack_interests?: string[] | null;
          wolfpack_joined_at?: string | null;
          wolfpack_skills?: string[] | null;
          wolfpack_social_links?: Json | null;
          wolfpack_status?: string | null;
          wolfpack_tier?: string | null;
        };
        Update: {
          allow_messages?: boolean | null;
          artist_account?: boolean | null;
          auth_id?: string | null;
          avatar_id?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          block_reason?: string | null;
          blocked_at?: string | null;
          blocked_by?: string | null;
          business_account?: boolean | null;
          card_on_file?: boolean | null;
          city?: string | null;
          created_at?: string;
          custom_avatar_id?: string | null;
          daily_customization?: Json | null;
          deleted_at?: string | null;
          display_name?: string | null;
          email?: string;
          email_normalized?: string | null;
          favorite_bartender?: string | null;
          favorite_drink?: string | null;
          favorite_song?: string | null;
          first_name?: string | null;
          full_name_normalized?: string | null;
          gender?: string | null;
          has_open_tab?: boolean | null;
          id?: string;
          id_verification_method?: string | null;
          id_verified?: boolean | null;
          instagram_handle?: string | null;
          is_approved?: boolean | null;
          is_online?: boolean | null;
          is_profile_visible?: boolean | null;
          is_side_hustle?: boolean | null;
          is_vip?: boolean | null;
          is_wolfpack_member?: boolean | null;
          last_activity?: string | null;
          last_known_lat?: number | null;
          last_known_lng?: number | null;
          last_location_check?: string | null;
          last_location_update?: string | null;
          last_login?: string | null;
          last_name?: string | null;
          last_seen_at?: string | null;
          leader_rank?: string | null;
          location?: string | null;
          location_accuracy?: number | null;
          location_id?: string | null;
          location_last_reported?: string | null;
          location_permissions_granted?: boolean | null;
          location_report_count?: number | null;
          location_verification_date?: string | null;
          location_verification_method?: string | null;
          location_verification_status?: string | null;
          location_verified?: boolean | null;
          looking_for?: string | null;
          loyalty_score?: number | null;
          notes?: string | null;
          notification_preferences?: Json | null;
          occupation?: string | null;
          pack_achievements?: Json | null;
          pack_badges?: Json | null;
          password_hash?: string | null;
          permissions?: Json | null;
          phone?: string | null;
          phone_normalized?: string | null;
          phone_number?: string | null;
          phone_verified?: boolean | null;
          preferred_pack_activities?: string[] | null;
          privacy_settings?: Json | null;
          profile_image_url?: string | null;
          profile_last_seen_at?: string | null;
          profile_pic_url?: string | null;
          pronouns?: string | null;
          role?: string | null;
          sensitive_data_encrypted?: Json | null;
          session_id?: string | null;
          state?: string | null;
          status?: string | null;
          updated_at?: string;
          username?: string | null;
          verified?: boolean | null;
          verified_at?: string | null;
          verified_by?: string | null;
          verified_region?: string | null;
          vibe_status?: string | null;
          website?: string | null;
          wolf_emoji?: string | null;
          wolfpack_availability_status?: string | null;
          wolfpack_bio?: string | null;
          wolfpack_interests?: string[] | null;
          wolfpack_joined_at?: string | null;
          wolfpack_skills?: string[] | null;
          wolfpack_social_links?: Json | null;
          wolfpack_status?: string | null;
          wolfpack_tier?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "users_avatar_id_fkey";
            columns: ["avatar_id"];
            isOneToOne: false;
            referencedRelation: "images";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_custom_avatar_id_fkey";
            columns: ["custom_avatar_id"];
            isOneToOne: false;
            referencedRelation: "images";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      wolfpack_activity_notifications: {
        Row: {
          created_at: string;
          data: Json | null;
          id: string;
          link: string | null;
          message: string;
          metadata: Json | null;
          notification_type: string | null;
          recipient_id: string;
          related_user_id: string | null;
          related_video_id: string | null;
          status: string;
          title: string | null;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          data?: Json | null;
          id?: string;
          link?: string | null;
          message: string;
          metadata?: Json | null;
          notification_type?: string | null;
          recipient_id: string;
          related_user_id?: string | null;
          related_video_id?: string | null;
          status?: string;
          title?: string | null;
          type?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          data?: Json | null;
          id?: string;
          link?: string | null;
          message?: string;
          metadata?: Json | null;
          notification_type?: string | null;
          recipient_id?: string;
          related_user_id?: string | null;
          related_video_id?: string | null;
          status?: string;
          title?: string | null;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName:
              "wolfpack_activity_notifications_related_user_id_fkey";
            columns: ["related_user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_activity_notifications_related_user_id_fkey";
            columns: ["related_user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_activity_notifications_related_user_id_fkey";
            columns: ["related_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_activity_notifications_related_user_id_fkey";
            columns: ["related_user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_activity_notifications_related_user_id_fkey";
            columns: ["related_user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_activity_notifications_related_user_id_fkey";
            columns: ["related_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_activity_notifications_related_user_id_fkey";
            columns: ["related_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_activity_notifications_related_user_id_fkey";
            columns: ["related_user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_activity_notifications_related_user_id_fkey";
            columns: ["related_user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      user_analytics: {
        Row: {
          created_at: string | null;
          event_data: Json | null;
          event_type: string;
          id: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          event_data?: Json | null;
          event_type: string;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          event_data?: Json | null;
          event_type?: string;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_analytics_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_analytics_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_analytics_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_analytics_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_analytics_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_analytics_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_analytics_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_analytics_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_analytics_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      social_blocks: {
        Row: {
          blocked_at: string | null;
          blocked_id: string;
          blocker_id: string;
          id: string;
          reason: string | null;
        };
        Insert: {
          blocked_at?: string | null;
          blocked_id: string;
          blocker_id: string;
          id?: string;
          reason?: string | null;
        };
        Update: {
          blocked_at?: string | null;
          blocked_id?: string;
          blocker_id?: string;
          id?: string;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_blocks_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_blocks_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_blocks_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_blocks_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_blocks_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_blocks_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_blocks_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_blocks_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_blocks_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "social_blocks_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_blocks_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_blocks_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_blocks_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_blocks_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_blocks_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_blocks_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_blocks_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_blocks_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      wolfpack_chat_messages: {
        Row: {
          avatar_url: string | null;
          content: string;
          created_at: string | null;
          display_name: string;
          edited_at: string | null;
          id: string;
          image_url: string | null;
          is_deleted: boolean | null;
          is_flagged: boolean | null;
          message_type: string;
          reply_to_message_id: string | null;
          session_id: string;
          thread_id: string | null;
          user_id: string;
        };
        Insert: {
          avatar_url?: string | null;
          content: string;
          created_at?: string | null;
          display_name?: string;
          edited_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_deleted?: boolean | null;
          is_flagged?: boolean | null;
          message_type?: string;
          reply_to_message_id?: string | null;
          session_id: string;
          thread_id?: string | null;
          user_id: string;
        };
        Update: {
          avatar_url?: string | null;
          content?: string;
          created_at?: string | null;
          display_name?: string;
          edited_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_deleted?: boolean | null;
          is_flagged?: boolean | null;
          message_type?: string;
          reply_to_message_id?: string | null;
          session_id?: string;
          thread_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_chat_messages_session";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_chat_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_chat_messages_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_chat_messages_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_chat_messages_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_chat_messages_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_chat_messages_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_chat_messages_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_chat_messages_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_chat_messages_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_chat_messages_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "wolfpack_chat_messages_reply_to_message_id_fkey";
            columns: ["reply_to_message_id"];
            isOneToOne: false;
            referencedRelation: "location_chat_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_messages_reply_to_message_id_fkey";
            columns: ["reply_to_message_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_chat_messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      wolfpack_chat_reactions: {
        Row: {
          created_at: string | null;
          emoji: string;
          id: string;
          message_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          emoji: string;
          id?: string;
          message_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          emoji?: string;
          id?: string;
          message_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "wolfpack_chat_reactions_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "location_chat_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_reactions_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_chat_messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      wolfpack_chat_sessions: {
        Row: {
          created_at: string | null;
          description: string | null;
          display_name: string;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          location_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          display_name: string;
          icon?: string | null;
          id: string;
          is_active?: boolean | null;
          location_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          display_name?: string;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          location_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "wolfpack_chat_sessions_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
        ];
      };
      wolfpack_comment_reactions: {
        Row: {
          comment_id: string;
          created_at: string | null;
          id: string;
          reaction_type: string;
          user_id: string;
        };
        Insert: {
          comment_id: string;
          created_at?: string | null;
          id?: string;
          reaction_type?: string;
          user_id: string;
        };
        Update: {
          comment_id?: string;
          created_at?: string | null;
          id?: string;
          reaction_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wolfpack_comment_reactions_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "content_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_comment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_comment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_comment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_comment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_comment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_comment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_comment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_comment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_comment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      content_comments: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          is_deleted: boolean | null;
          is_edited: boolean | null;
          is_pinned: boolean | null;
          like_count: number | null;
          likes_count: number | null;
          parent_comment_id: string | null;
          updated_at: string | null;
          user_id: string;
          video_id: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          is_edited?: boolean | null;
          is_pinned?: boolean | null;
          like_count?: number | null;
          likes_count?: number | null;
          parent_comment_id?: string | null;
          updated_at?: string | null;
          user_id: string;
          video_id: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          is_edited?: boolean | null;
          is_pinned?: boolean | null;
          like_count?: number | null;
          likes_count?: number | null;
          parent_comment_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_comments_parent_comment_id_fkey";
            columns: ["parent_comment_id"];
            isOneToOne: false;
            referencedRelation: "content_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "content_comments_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "my_videos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_comments_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_comments_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_feed_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_comments_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "content_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_comments_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "content_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_comments_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "content_posts_with_user_interaction";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_participants: {
        Row: {
          conversation_id: string;
          id: string;
          is_active: boolean | null;
          joined_at: string | null;
          last_read_at: string | null;
          left_at: string | null;
          notification_settings: Json | null;
          role: string | null;
          user_id: string;
        };
        Insert: {
          conversation_id: string;
          id?: string;
          is_active?: boolean | null;
          joined_at?: string | null;
          last_read_at?: string | null;
          left_at?: string | null;
          notification_settings?: Json | null;
          role?: string | null;
          user_id: string;
        };
        Update: {
          conversation_id?: string;
          id?: string;
          is_active?: boolean | null;
          joined_at?: string | null;
          last_read_at?: string | null;
          left_at?: string | null;
          notification_settings?: Json | null;
          role?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_participants_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "user_conversations_view";
            referencedColumns: ["conversation_id"];
          },
          {
            foreignKeyName: "chat_participants_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "chat_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      chat_conversations: {
        Row: {
          avatar_url: string | null;
          conversation_type: string;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          last_message_at: string | null;
          last_message_preview: string | null;
          last_message_sender_id: string | null;
          metadata: Json | null;
          name: string | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          conversation_type?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          last_message_sender_id?: string | null;
          metadata?: Json | null;
          name?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          conversation_type?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          last_message_sender_id?: string | null;
          metadata?: Json | null;
          name?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_conversations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey";
            columns: ["last_message_sender_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey";
            columns: ["last_message_sender_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey";
            columns: ["last_message_sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey";
            columns: ["last_message_sender_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey";
            columns: ["last_message_sender_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey";
            columns: ["last_message_sender_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey";
            columns: ["last_message_sender_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey";
            columns: ["last_message_sender_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey";
            columns: ["last_message_sender_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      social_follows: {
        Row: {
          created_at: string | null;
          follower_id: string;
          following_id: string;
          id: string;
        };
        Insert: {
          created_at?: string | null;
          follower_id: string;
          following_id: string;
          id?: string;
        };
        Update: {
          created_at?: string | null;
          follower_id?: string;
          following_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "social_follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "social_follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      wolfpack_friend_suggestions: {
        Row: {
          action_taken: string | null;
          common_interests: string[] | null;
          created_at: string | null;
          id: string;
          interacted_at: string | null;
          mutual_friend_count: number | null;
          reason: string | null;
          score: number | null;
          shown_at: string | null;
          suggested_user_id: string;
          suggestion_type: string;
          user_id: string;
        };
        Insert: {
          action_taken?: string | null;
          common_interests?: string[] | null;
          created_at?: string | null;
          id?: string;
          interacted_at?: string | null;
          mutual_friend_count?: number | null;
          reason?: string | null;
          score?: number | null;
          shown_at?: string | null;
          suggested_user_id: string;
          suggestion_type: string;
          user_id: string;
        };
        Update: {
          action_taken?: string | null;
          common_interests?: string[] | null;
          created_at?: string | null;
          id?: string;
          interacted_at?: string | null;
          mutual_friend_count?: number | null;
          reason?: string | null;
          score?: number | null;
          shown_at?: string | null;
          suggested_user_id?: string;
          suggestion_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName:
              "wolfpack_friend_suggestions_suggested_user_id_fkey";
            columns: ["suggested_user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_friend_suggestions_suggested_user_id_fkey";
            columns: ["suggested_user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_friend_suggestions_suggested_user_id_fkey";
            columns: ["suggested_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_friend_suggestions_suggested_user_id_fkey";
            columns: ["suggested_user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_friend_suggestions_suggested_user_id_fkey";
            columns: ["suggested_user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_friend_suggestions_suggested_user_id_fkey";
            columns: ["suggested_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_friend_suggestions_suggested_user_id_fkey";
            columns: ["suggested_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_friend_suggestions_suggested_user_id_fkey";
            columns: ["suggested_user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_friend_suggestions_suggested_user_id_fkey";
            columns: ["suggested_user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "wolfpack_friend_suggestions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_friend_suggestions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_friend_suggestions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_friend_suggestions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_friend_suggestions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_friend_suggestions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_friend_suggestions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_friend_suggestions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_friend_suggestions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      wolfpack_interactions: {
        Row: {
          created_at: string | null;
          expires_at: string | null;
          id: string;
          interaction_type: string;
          location_id: string | null;
          message_content: string | null;
          metadata: Json | null;
          read_at: string | null;
          receiver_id: string;
          sender_id: string;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          interaction_type: string;
          location_id?: string | null;
          message_content?: string | null;
          metadata?: Json | null;
          read_at?: string | null;
          receiver_id: string;
          sender_id: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          interaction_type?: string;
          location_id?: string | null;
          message_content?: string | null;
          metadata?: Json | null;
          read_at?: string | null;
          receiver_id?: string;
          sender_id?: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "wolf_pack_interactions_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      chat_messages: {
        Row: {
          attachments: Json | null;
          content: string;
          conversation_id: string;
          created_at: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          delivered_at: string | null;
          edited_at: string | null;
          id: string;
          is_deleted: boolean | null;
          is_edited: boolean | null;
          is_read: boolean | null;
          media_duration: number | null;
          media_metadata: Json | null;
          media_size: number | null;
          media_thumbnail_url: string | null;
          media_type: string | null;
          media_url: string | null;
          message_type: string | null;
          metadata: Json | null;
          parent_message_id: string | null;
          reactions_count: Json | null;
          read_at: string | null;
          reply_count: number | null;
          reply_to_id: string | null;
          sender_id: string;
          status: string | null;
        };
        Insert: {
          attachments?: Json | null;
          content: string;
          conversation_id: string;
          created_at?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          delivered_at?: string | null;
          edited_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          is_edited?: boolean | null;
          is_read?: boolean | null;
          media_duration?: number | null;
          media_metadata?: Json | null;
          media_size?: number | null;
          media_thumbnail_url?: string | null;
          media_type?: string | null;
          media_url?: string | null;
          message_type?: string | null;
          metadata?: Json | null;
          parent_message_id?: string | null;
          reactions_count?: Json | null;
          read_at?: string | null;
          reply_count?: number | null;
          reply_to_id?: string | null;
          sender_id: string;
          status?: string | null;
        };
        Update: {
          attachments?: Json | null;
          content?: string;
          conversation_id?: string;
          created_at?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          delivered_at?: string | null;
          edited_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          is_edited?: boolean | null;
          is_read?: boolean | null;
          media_duration?: number | null;
          media_metadata?: Json | null;
          media_size?: number | null;
          media_thumbnail_url?: string | null;
          media_type?: string | null;
          media_url?: string | null;
          message_type?: string | null;
          metadata?: Json | null;
          parent_message_id?: string | null;
          reactions_count?: Json | null;
          read_at?: string | null;
          reply_count?: number | null;
          reply_to_id?: string | null;
          sender_id?: string;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "user_conversations_view";
            referencedColumns: ["conversation_id"];
          },
          {
            foreignKeyName: "chat_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "chat_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "chat_messages_parent_message_id_fkey";
            columns: ["parent_message_id"];
            isOneToOne: false;
            referencedRelation: "messages_with_sender_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_parent_message_id_fkey";
            columns: ["parent_message_id"];
            isOneToOne: false;
            referencedRelation: "chat_messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey";
            columns: ["reply_to_id"];
            isOneToOne: false;
            referencedRelation: "messages_with_sender_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey";
            columns: ["reply_to_id"];
            isOneToOne: false;
            referencedRelation: "chat_messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      wolfpack_post_likes: {
        Row: {
          created_at: string | null;
          id: string;
          user_id: string;
          video_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          user_id: string;
          video_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          user_id?: string;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wolfpack_post_likes_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "my_videos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_post_likes_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_post_likes_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_feed_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_post_likes_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "content_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_post_likes_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "content_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_post_likes_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "content_posts_with_user_interaction";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      wolfpack_saved_posts: {
        Row: {
          created_at: string | null;
          id: string;
          user_id: string;
          video_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          user_id: string;
          video_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          user_id?: string;
          video_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "wolfpack_saved_posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_saved_posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_saved_posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_saved_posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_saved_posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_saved_posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_saved_posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_saved_posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_saved_posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "wolfpack_saved_posts_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "my_videos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_saved_posts_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_saved_posts_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_feed_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_saved_posts_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "content_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_saved_posts_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "content_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_saved_posts_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "content_posts_with_user_interaction";
            referencedColumns: ["id"];
          },
        ];
      };
      wolfpack_shares: {
        Row: {
          created_at: string | null;
          id: string;
          message: string | null;
          platform: string | null;
          share_type: string;
          shared_by_user_id: string;
          shared_to_user_id: string | null;
          video_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          message?: string | null;
          platform?: string | null;
          share_type: string;
          shared_by_user_id: string;
          shared_to_user_id?: string | null;
          video_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          message?: string | null;
          platform?: string | null;
          share_type?: string;
          shared_by_user_id?: string;
          shared_to_user_id?: string | null;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wolfpack_shares_shared_by_user_id_fkey";
            columns: ["shared_by_user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_by_user_id_fkey";
            columns: ["shared_by_user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_by_user_id_fkey";
            columns: ["shared_by_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_by_user_id_fkey";
            columns: ["shared_by_user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_by_user_id_fkey";
            columns: ["shared_by_user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_by_user_id_fkey";
            columns: ["shared_by_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_by_user_id_fkey";
            columns: ["shared_by_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_by_user_id_fkey";
            columns: ["shared_by_user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_by_user_id_fkey";
            columns: ["shared_by_user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_to_user_id_fkey";
            columns: ["shared_to_user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_to_user_id_fkey";
            columns: ["shared_to_user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_to_user_id_fkey";
            columns: ["shared_to_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_to_user_id_fkey";
            columns: ["shared_to_user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_to_user_id_fkey";
            columns: ["shared_to_user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_to_user_id_fkey";
            columns: ["shared_to_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_to_user_id_fkey";
            columns: ["shared_to_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_to_user_id_fkey";
            columns: ["shared_to_user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_to_user_id_fkey";
            columns: ["shared_to_user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "wolfpack_shares_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "my_videos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_feed_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "content_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "content_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "content_posts_with_user_interaction";
            referencedColumns: ["id"];
          },
        ];
      };
      wolfpack_user_settings: {
        Row: {
          allow_direct_messages: boolean | null;
          blocked_users: string[] | null;
          content_filters: string[] | null;
          created_at: string | null;
          date_format: string | null;
          default_post_visibility: string | null;
          enable_business_directory: boolean | null;
          enable_classifieds: boolean | null;
          enable_events: boolean | null;
          enable_polls: boolean | null;
          enable_recommendations: boolean | null;
          hide_anonymous_posts: boolean | null;
          id: string;
          language: string | null;
          muted_keywords: string[] | null;
          notify_classifieds: boolean | null;
          notify_comments: boolean | null;
          notify_events: boolean | null;
          notify_mentions: boolean | null;
          notify_new_posts: boolean | null;
          notify_polls: boolean | null;
          notify_recommendations: boolean | null;
          notify_safety_alerts: boolean | null;
          share_approximate_location: boolean | null;
          show_profile_to_neighbors: boolean | null;
          show_real_name: boolean | null;
          theme: string | null;
          timezone: string | null;
          updated_at: string | null;
          user_id: string;
          visible_in_directory: boolean | null;
        };
        Insert: {
          allow_direct_messages?: boolean | null;
          blocked_users?: string[] | null;
          content_filters?: string[] | null;
          created_at?: string | null;
          date_format?: string | null;
          default_post_visibility?: string | null;
          enable_business_directory?: boolean | null;
          enable_classifieds?: boolean | null;
          enable_events?: boolean | null;
          enable_polls?: boolean | null;
          enable_recommendations?: boolean | null;
          hide_anonymous_posts?: boolean | null;
          id?: string;
          language?: string | null;
          muted_keywords?: string[] | null;
          notify_classifieds?: boolean | null;
          notify_comments?: boolean | null;
          notify_events?: boolean | null;
          notify_mentions?: boolean | null;
          notify_new_posts?: boolean | null;
          notify_polls?: boolean | null;
          notify_recommendations?: boolean | null;
          notify_safety_alerts?: boolean | null;
          share_approximate_location?: boolean | null;
          show_profile_to_neighbors?: boolean | null;
          show_real_name?: boolean | null;
          theme?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
          user_id: string;
          visible_in_directory?: boolean | null;
        };
        Update: {
          allow_direct_messages?: boolean | null;
          blocked_users?: string[] | null;
          content_filters?: string[] | null;
          created_at?: string | null;
          date_format?: string | null;
          default_post_visibility?: string | null;
          enable_business_directory?: boolean | null;
          enable_classifieds?: boolean | null;
          enable_events?: boolean | null;
          enable_polls?: boolean | null;
          enable_recommendations?: boolean | null;
          hide_anonymous_posts?: boolean | null;
          id?: string;
          language?: string | null;
          muted_keywords?: string[] | null;
          notify_classifieds?: boolean | null;
          notify_comments?: boolean | null;
          notify_events?: boolean | null;
          notify_mentions?: boolean | null;
          notify_new_posts?: boolean | null;
          notify_polls?: boolean | null;
          notify_recommendations?: boolean | null;
          notify_safety_alerts?: boolean | null;
          share_approximate_location?: boolean | null;
          show_profile_to_neighbors?: boolean | null;
          show_real_name?: boolean | null;
          theme?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
          user_id?: string;
          visible_in_directory?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "wolfpack_user_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_user_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_user_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_user_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_user_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_user_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_user_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_user_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_user_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      wolfpack_video_uploads: {
        Row: {
          created_at: string | null;
          duration_seconds: number | null;
          error_message: string | null;
          file_name: string;
          file_size: number;
          height: number | null;
          id: string;
          metadata: Json | null;
          mime_type: string;
          storage_path: string | null;
          thumbnail_url: string | null;
          updated_at: string | null;
          upload_progress: number | null;
          upload_status: string | null;
          user_id: string;
          video_url: string | null;
          width: number | null;
        };
        Insert: {
          created_at?: string | null;
          duration_seconds?: number | null;
          error_message?: string | null;
          file_name: string;
          file_size: number;
          height?: number | null;
          id?: string;
          metadata?: Json | null;
          mime_type: string;
          storage_path?: string | null;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          upload_progress?: number | null;
          upload_status?: string | null;
          user_id: string;
          video_url?: string | null;
          width?: number | null;
        };
        Update: {
          created_at?: string | null;
          duration_seconds?: number | null;
          error_message?: string | null;
          file_name?: string;
          file_size?: number;
          height?: number | null;
          id?: string;
          metadata?: Json | null;
          mime_type?: string;
          storage_path?: string | null;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          upload_progress?: number | null;
          upload_status?: string | null;
          user_id?: string;
          video_url?: string | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "wolfpack_video_uploads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_uploads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_uploads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_uploads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_uploads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_uploads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_uploads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_uploads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_uploads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      content_posts: {
        Row: {
          algorithm_boost: number | null;
          allow_comments: boolean | null;
          allow_duets: boolean | null;
          allow_stitches: boolean | null;
          aspect_ratio: string | null;
          caption: string | null;
          comment_count: number | null;
          comments_count: number | null;
          created_at: string | null;
          description: string | null;
          duration: number | null;
          duration_seconds: number | null;
          effect_id: string | null;
          effect_name: string | null;
          featured_at: string | null;
          hashtags: string[] | null;
          id: string;
          images: string[] | null;
          ingested_content_id: string | null;
          is_active: boolean | null;
          is_ad: boolean | null;
          is_featured: boolean | null;
          like_count: number | null;
          likes_count: number | null;
          location_id: string | null;
          location_lat: number | null;
          location_lng: number | null;
          location_tag: string | null;
          metadata: Json | null;
          music_id: string | null;
          music_name: string | null;
          post_type: string | null;
          processing_status: string | null;
          share_count: number | null;
          source: string | null;
          tags: string[] | null;
          thumbnail_url: string | null;
          title: string | null;
          trending_score: number | null;
          updated_at: string | null;
          user_id: string | null;
          video_url: string | null;
          view_count: number | null;
          views_count: number | null;
          visibility: string | null;
        };
        Insert: {
          algorithm_boost?: number | null;
          allow_comments?: boolean | null;
          allow_duets?: boolean | null;
          allow_stitches?: boolean | null;
          aspect_ratio?: string | null;
          caption?: string | null;
          comment_count?: number | null;
          comments_count?: number | null;
          created_at?: string | null;
          description?: string | null;
          duration?: number | null;
          duration_seconds?: number | null;
          effect_id?: string | null;
          effect_name?: string | null;
          featured_at?: string | null;
          hashtags?: string[] | null;
          id?: string;
          images?: string[] | null;
          ingested_content_id?: string | null;
          is_active?: boolean | null;
          is_ad?: boolean | null;
          is_featured?: boolean | null;
          like_count?: number | null;
          likes_count?: number | null;
          location_id?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_tag?: string | null;
          metadata?: Json | null;
          music_id?: string | null;
          music_name?: string | null;
          post_type?: string | null;
          processing_status?: string | null;
          share_count?: number | null;
          source?: string | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title?: string | null;
          trending_score?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
          video_url?: string | null;
          view_count?: number | null;
          views_count?: number | null;
          visibility?: string | null;
        };
        Update: {
          algorithm_boost?: number | null;
          allow_comments?: boolean | null;
          allow_duets?: boolean | null;
          allow_stitches?: boolean | null;
          aspect_ratio?: string | null;
          caption?: string | null;
          comment_count?: number | null;
          comments_count?: number | null;
          created_at?: string | null;
          description?: string | null;
          duration?: number | null;
          duration_seconds?: number | null;
          effect_id?: string | null;
          effect_name?: string | null;
          featured_at?: string | null;
          hashtags?: string[] | null;
          id?: string;
          images?: string[] | null;
          ingested_content_id?: string | null;
          is_active?: boolean | null;
          is_ad?: boolean | null;
          is_featured?: boolean | null;
          like_count?: number | null;
          likes_count?: number | null;
          location_id?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_tag?: string | null;
          metadata?: Json | null;
          music_id?: string | null;
          music_name?: string | null;
          post_type?: string | null;
          processing_status?: string | null;
          share_count?: number | null;
          source?: string | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title?: string | null;
          trending_score?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
          video_url?: string | null;
          view_count?: number | null;
          views_count?: number | null;
          visibility?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "content_posts_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
    };
    Views: {
      active_wolfpack_members: {
        Row: {
          allow_messages: boolean | null;
          artist_account: boolean | null;
          auth_id: string | null;
          avatar_id: string | null;
          avatar_url: string | null;
          bio: string | null;
          block_reason: string | null;
          blocked_at: string | null;
          blocked_by: string | null;
          business_account: boolean | null;
          card_on_file: boolean | null;
          city: string | null;
          created_at: string | null;
          custom_avatar_id: string | null;
          daily_customization: Json | null;
          deleted_at: string | null;
          display_name: string | null;
          email: string | null;
          email_normalized: string | null;
          favorite_bartender: string | null;
          favorite_drink: string | null;
          favorite_song: string | null;
          first_name: string | null;
          full_name_normalized: string | null;
          gender: string | null;
          has_open_tab: boolean | null;
          id: string | null;
          id_verification_method: string | null;
          id_verified: boolean | null;
          instagram_handle: string | null;
          is_approved: boolean | null;
          is_online: boolean | null;
          is_profile_visible: boolean | null;
          is_side_hustle: boolean | null;
          is_vip: boolean | null;
          is_wolfpack_member: boolean | null;
          last_activity: string | null;
          last_known_lat: number | null;
          last_known_lng: number | null;
          last_location_check: string | null;
          last_location_update: string | null;
          last_login: string | null;
          last_name: string | null;
          last_seen_at: string | null;
          leader_rank: string | null;
          location: string | null;
          location_accuracy: number | null;
          location_id: string | null;
          location_last_reported: string | null;
          location_permissions_granted: boolean | null;
          location_report_count: number | null;
          location_verification_date: string | null;
          location_verification_method: string | null;
          location_verification_status: string | null;
          location_verified: boolean | null;
          looking_for: string | null;
          loyalty_score: number | null;
          notes: string | null;
          notification_preferences: Json | null;
          occupation: string | null;
          pack_achievements: Json | null;
          pack_badges: Json | null;
          password_hash: string | null;
          permissions: Json | null;
          phone: string | null;
          phone_normalized: string | null;
          phone_number: string | null;
          phone_verified: boolean | null;
          preferred_pack_activities: string[] | null;
          privacy_settings: Json | null;
          profile_image_url: string | null;
          profile_last_seen_at: string | null;
          profile_pic_url: string | null;
          pronouns: string | null;
          role: string | null;
          sensitive_data_encrypted: Json | null;
          session_id: string | null;
          state: string | null;
          status: string | null;
          updated_at: string | null;
          username: string | null;
          verified: boolean | null;
          verified_at: string | null;
          verified_by: string | null;
          verified_region: string | null;
          vibe_status: string | null;
          wolf_emoji: string | null;
          wolfpack_availability_status: string | null;
          wolfpack_bio: string | null;
          wolfpack_interests: string[] | null;
          wolfpack_joined_at: string | null;
          wolfpack_skills: string[] | null;
          wolfpack_social_links: Json | null;
          wolfpack_status: string | null;
          wolfpack_tier: string | null;
        };
        Insert: {
          allow_messages?: boolean | null;
          artist_account?: boolean | null;
          auth_id?: string | null;
          avatar_id?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          block_reason?: string | null;
          blocked_at?: string | null;
          blocked_by?: string | null;
          business_account?: boolean | null;
          card_on_file?: boolean | null;
          city?: string | null;
          created_at?: string | null;
          custom_avatar_id?: string | null;
          daily_customization?: Json | null;
          deleted_at?: string | null;
          display_name?: string | null;
          email?: string | null;
          email_normalized?: string | null;
          favorite_bartender?: string | null;
          favorite_drink?: string | null;
          favorite_song?: string | null;
          first_name?: string | null;
          full_name_normalized?: string | null;
          gender?: string | null;
          has_open_tab?: boolean | null;
          id?: string | null;
          id_verification_method?: string | null;
          id_verified?: boolean | null;
          instagram_handle?: string | null;
          is_approved?: boolean | null;
          is_online?: boolean | null;
          is_profile_visible?: boolean | null;
          is_side_hustle?: boolean | null;
          is_vip?: boolean | null;
          is_wolfpack_member?: boolean | null;
          last_activity?: string | null;
          last_known_lat?: number | null;
          last_known_lng?: number | null;
          last_location_check?: string | null;
          last_location_update?: string | null;
          last_login?: string | null;
          last_name?: string | null;
          last_seen_at?: string | null;
          leader_rank?: string | null;
          location?: string | null;
          location_accuracy?: number | null;
          location_id?: string | null;
          location_last_reported?: string | null;
          location_permissions_granted?: boolean | null;
          location_report_count?: number | null;
          location_verification_date?: string | null;
          location_verification_method?: string | null;
          location_verification_status?: string | null;
          location_verified?: boolean | null;
          looking_for?: string | null;
          loyalty_score?: number | null;
          notes?: string | null;
          notification_preferences?: Json | null;
          occupation?: string | null;
          pack_achievements?: Json | null;
          pack_badges?: Json | null;
          password_hash?: string | null;
          permissions?: Json | null;
          phone?: string | null;
          phone_normalized?: string | null;
          phone_number?: string | null;
          phone_verified?: boolean | null;
          preferred_pack_activities?: string[] | null;
          privacy_settings?: Json | null;
          profile_image_url?: string | null;
          profile_last_seen_at?: string | null;
          profile_pic_url?: string | null;
          pronouns?: string | null;
          role?: string | null;
          sensitive_data_encrypted?: Json | null;
          session_id?: string | null;
          state?: string | null;
          status?: string | null;
          updated_at?: string | null;
          username?: string | null;
          verified?: boolean | null;
          verified_at?: string | null;
          verified_by?: string | null;
          verified_region?: string | null;
          vibe_status?: string | null;
          wolf_emoji?: string | null;
          wolfpack_availability_status?: string | null;
          wolfpack_bio?: string | null;
          wolfpack_interests?: string[] | null;
          wolfpack_joined_at?: string | null;
          wolfpack_skills?: string[] | null;
          wolfpack_social_links?: Json | null;
          wolfpack_status?: string | null;
          wolfpack_tier?: string | null;
        };
        Update: {
          allow_messages?: boolean | null;
          artist_account?: boolean | null;
          auth_id?: string | null;
          avatar_id?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          block_reason?: string | null;
          blocked_at?: string | null;
          blocked_by?: string | null;
          business_account?: boolean | null;
          card_on_file?: boolean | null;
          city?: string | null;
          created_at?: string | null;
          custom_avatar_id?: string | null;
          daily_customization?: Json | null;
          deleted_at?: string | null;
          display_name?: string | null;
          email?: string | null;
          email_normalized?: string | null;
          favorite_bartender?: string | null;
          favorite_drink?: string | null;
          favorite_song?: string | null;
          first_name?: string | null;
          full_name_normalized?: string | null;
          gender?: string | null;
          has_open_tab?: boolean | null;
          id?: string | null;
          id_verification_method?: string | null;
          id_verified?: boolean | null;
          instagram_handle?: string | null;
          is_approved?: boolean | null;
          is_online?: boolean | null;
          is_profile_visible?: boolean | null;
          is_side_hustle?: boolean | null;
          is_vip?: boolean | null;
          is_wolfpack_member?: boolean | null;
          last_activity?: string | null;
          last_known_lat?: number | null;
          last_known_lng?: number | null;
          last_location_check?: string | null;
          last_location_update?: string | null;
          last_login?: string | null;
          last_name?: string | null;
          last_seen_at?: string | null;
          leader_rank?: string | null;
          location?: string | null;
          location_accuracy?: number | null;
          location_id?: string | null;
          location_last_reported?: string | null;
          location_permissions_granted?: boolean | null;
          location_report_count?: number | null;
          location_verification_date?: string | null;
          location_verification_method?: string | null;
          location_verification_status?: string | null;
          location_verified?: boolean | null;
          looking_for?: string | null;
          loyalty_score?: number | null;
          notes?: string | null;
          notification_preferences?: Json | null;
          occupation?: string | null;
          pack_achievements?: Json | null;
          pack_badges?: Json | null;
          password_hash?: string | null;
          permissions?: Json | null;
          phone?: string | null;
          phone_normalized?: string | null;
          phone_number?: string | null;
          phone_verified?: boolean | null;
          preferred_pack_activities?: string[] | null;
          privacy_settings?: Json | null;
          profile_image_url?: string | null;
          profile_last_seen_at?: string | null;
          profile_pic_url?: string | null;
          pronouns?: string | null;
          role?: string | null;
          sensitive_data_encrypted?: Json | null;
          session_id?: string | null;
          state?: string | null;
          status?: string | null;
          updated_at?: string | null;
          username?: string | null;
          verified?: boolean | null;
          verified_at?: string | null;
          verified_by?: string | null;
          verified_region?: string | null;
          vibe_status?: string | null;
          wolf_emoji?: string | null;
          wolfpack_availability_status?: string | null;
          wolfpack_bio?: string | null;
          wolfpack_interests?: string[] | null;
          wolfpack_joined_at?: string | null;
          wolfpack_skills?: string[] | null;
          wolfpack_social_links?: Json | null;
          wolfpack_status?: string | null;
          wolfpack_tier?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "users_avatar_id_fkey";
            columns: ["avatar_id"];
            isOneToOne: false;
            referencedRelation: "images";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_custom_avatar_id_fkey";
            columns: ["custom_avatar_id"];
            isOneToOne: false;
            referencedRelation: "images";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      core_table_stats: {
        Row: {
          columns: number | null;
          size: string | null;
          system: string | null;
          table_name: unknown | null;
        };
        Relationships: [];
      };
      current_user_profile: {
        Row: {
          allow_messages: boolean | null;
          artist_account: boolean | null;
          auth_id: string | null;
          auth_user_id: string | null;
          avatar_id: string | null;
          avatar_url: string | null;
          bio: string | null;
          block_reason: string | null;
          blocked_at: string | null;
          blocked_by: string | null;
          business_account: boolean | null;
          card_on_file: boolean | null;
          city: string | null;
          created_at: string | null;
          custom_avatar_id: string | null;
          daily_customization: Json | null;
          deleted_at: string | null;
          display_name: string | null;
          email: string | null;
          email_normalized: string | null;
          favorite_bartender: string | null;
          favorite_drink: string | null;
          favorite_song: string | null;
          first_name: string | null;
          full_name_normalized: string | null;
          gender: string | null;
          has_open_tab: boolean | null;
          id: string | null;
          id_verification_method: string | null;
          id_verified: boolean | null;
          instagram_handle: string | null;
          is_approved: boolean | null;
          is_online: boolean | null;
          is_profile_visible: boolean | null;
          is_side_hustle: boolean | null;
          is_vip: boolean | null;
          is_wolfpack_member: boolean | null;
          last_activity: string | null;
          last_known_lat: number | null;
          last_known_lng: number | null;
          last_location_check: string | null;
          last_location_update: string | null;
          last_login: string | null;
          last_name: string | null;
          last_seen_at: string | null;
          leader_rank: string | null;
          location: string | null;
          location_accuracy: number | null;
          location_id: string | null;
          location_last_reported: string | null;
          location_permissions_granted: boolean | null;
          location_report_count: number | null;
          location_verification_date: string | null;
          location_verification_method: string | null;
          location_verification_status: string | null;
          location_verified: boolean | null;
          looking_for: string | null;
          loyalty_score: number | null;
          notes: string | null;
          notification_preferences: Json | null;
          occupation: string | null;
          pack_achievements: Json | null;
          pack_badges: Json | null;
          password_hash: string | null;
          permissions: Json | null;
          phone: string | null;
          phone_normalized: string | null;
          phone_number: string | null;
          phone_verified: boolean | null;
          preferred_pack_activities: string[] | null;
          privacy_settings: Json | null;
          profile_image_url: string | null;
          profile_last_seen_at: string | null;
          profile_pic_url: string | null;
          pronouns: string | null;
          role: string | null;
          sensitive_data_encrypted: Json | null;
          session_id: string | null;
          state: string | null;
          status: string | null;
          updated_at: string | null;
          username: string | null;
          verified: boolean | null;
          verified_at: string | null;
          verified_by: string | null;
          verified_region: string | null;
          vibe_status: string | null;
          website: string | null;
          wolf_emoji: string | null;
          wolfpack_availability_status: string | null;
          wolfpack_bio: string | null;
          wolfpack_interests: string[] | null;
          wolfpack_joined_at: string | null;
          wolfpack_skills: string[] | null;
          wolfpack_social_links: Json | null;
          wolfpack_status: string | null;
          wolfpack_tier: string | null;
        };
        Insert: {
          allow_messages?: boolean | null;
          artist_account?: boolean | null;
          auth_id?: string | null;
          auth_user_id?: never;
          avatar_id?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          block_reason?: string | null;
          blocked_at?: string | null;
          blocked_by?: string | null;
          business_account?: boolean | null;
          card_on_file?: boolean | null;
          city?: string | null;
          created_at?: string | null;
          custom_avatar_id?: string | null;
          daily_customization?: Json | null;
          deleted_at?: string | null;
          display_name?: string | null;
          email?: string | null;
          email_normalized?: string | null;
          favorite_bartender?: string | null;
          favorite_drink?: string | null;
          favorite_song?: string | null;
          first_name?: string | null;
          full_name_normalized?: string | null;
          gender?: string | null;
          has_open_tab?: boolean | null;
          id?: string | null;
          id_verification_method?: string | null;
          id_verified?: boolean | null;
          instagram_handle?: string | null;
          is_approved?: boolean | null;
          is_online?: boolean | null;
          is_profile_visible?: boolean | null;
          is_side_hustle?: boolean | null;
          is_vip?: boolean | null;
          is_wolfpack_member?: boolean | null;
          last_activity?: string | null;
          last_known_lat?: number | null;
          last_known_lng?: number | null;
          last_location_check?: string | null;
          last_location_update?: string | null;
          last_login?: string | null;
          last_name?: string | null;
          last_seen_at?: string | null;
          leader_rank?: string | null;
          location?: string | null;
          location_accuracy?: number | null;
          location_id?: string | null;
          location_last_reported?: string | null;
          location_permissions_granted?: boolean | null;
          location_report_count?: number | null;
          location_verification_date?: string | null;
          location_verification_method?: string | null;
          location_verification_status?: string | null;
          location_verified?: boolean | null;
          looking_for?: string | null;
          loyalty_score?: number | null;
          notes?: string | null;
          notification_preferences?: Json | null;
          occupation?: string | null;
          pack_achievements?: Json | null;
          pack_badges?: Json | null;
          password_hash?: string | null;
          permissions?: Json | null;
          phone?: string | null;
          phone_normalized?: string | null;
          phone_number?: string | null;
          phone_verified?: boolean | null;
          preferred_pack_activities?: string[] | null;
          privacy_settings?: Json | null;
          profile_image_url?: string | null;
          profile_last_seen_at?: string | null;
          profile_pic_url?: string | null;
          pronouns?: string | null;
          role?: string | null;
          sensitive_data_encrypted?: Json | null;
          session_id?: string | null;
          state?: string | null;
          status?: string | null;
          updated_at?: string | null;
          username?: string | null;
          verified?: boolean | null;
          verified_at?: string | null;
          verified_by?: string | null;
          verified_region?: string | null;
          vibe_status?: string | null;
          website?: string | null;
          wolf_emoji?: string | null;
          wolfpack_availability_status?: string | null;
          wolfpack_bio?: string | null;
          wolfpack_interests?: string[] | null;
          wolfpack_joined_at?: string | null;
          wolfpack_skills?: string[] | null;
          wolfpack_social_links?: Json | null;
          wolfpack_status?: string | null;
          wolfpack_tier?: string | null;
        };
        Update: {
          allow_messages?: boolean | null;
          artist_account?: boolean | null;
          auth_id?: string | null;
          auth_user_id?: never;
          avatar_id?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          block_reason?: string | null;
          blocked_at?: string | null;
          blocked_by?: string | null;
          business_account?: boolean | null;
          card_on_file?: boolean | null;
          city?: string | null;
          created_at?: string | null;
          custom_avatar_id?: string | null;
          daily_customization?: Json | null;
          deleted_at?: string | null;
          display_name?: string | null;
          email?: string | null;
          email_normalized?: string | null;
          favorite_bartender?: string | null;
          favorite_drink?: string | null;
          favorite_song?: string | null;
          first_name?: string | null;
          full_name_normalized?: string | null;
          gender?: string | null;
          has_open_tab?: boolean | null;
          id?: string | null;
          id_verification_method?: string | null;
          id_verified?: boolean | null;
          instagram_handle?: string | null;
          is_approved?: boolean | null;
          is_online?: boolean | null;
          is_profile_visible?: boolean | null;
          is_side_hustle?: boolean | null;
          is_vip?: boolean | null;
          is_wolfpack_member?: boolean | null;
          last_activity?: string | null;
          last_known_lat?: number | null;
          last_known_lng?: number | null;
          last_location_check?: string | null;
          last_location_update?: string | null;
          last_login?: string | null;
          last_name?: string | null;
          last_seen_at?: string | null;
          leader_rank?: string | null;
          location?: string | null;
          location_accuracy?: number | null;
          location_id?: string | null;
          location_last_reported?: string | null;
          location_permissions_granted?: boolean | null;
          location_report_count?: number | null;
          location_verification_date?: string | null;
          location_verification_method?: string | null;
          location_verification_status?: string | null;
          location_verified?: boolean | null;
          looking_for?: string | null;
          loyalty_score?: number | null;
          notes?: string | null;
          notification_preferences?: Json | null;
          occupation?: string | null;
          pack_achievements?: Json | null;
          pack_badges?: Json | null;
          password_hash?: string | null;
          permissions?: Json | null;
          phone?: string | null;
          phone_normalized?: string | null;
          phone_number?: string | null;
          phone_verified?: boolean | null;
          preferred_pack_activities?: string[] | null;
          privacy_settings?: Json | null;
          profile_image_url?: string | null;
          profile_last_seen_at?: string | null;
          profile_pic_url?: string | null;
          pronouns?: string | null;
          role?: string | null;
          sensitive_data_encrypted?: Json | null;
          session_id?: string | null;
          state?: string | null;
          status?: string | null;
          updated_at?: string | null;
          username?: string | null;
          verified?: boolean | null;
          verified_at?: string | null;
          verified_by?: string | null;
          verified_region?: string | null;
          vibe_status?: string | null;
          website?: string | null;
          wolf_emoji?: string | null;
          wolfpack_availability_status?: string | null;
          wolfpack_bio?: string | null;
          wolfpack_interests?: string[] | null;
          wolfpack_joined_at?: string | null;
          wolfpack_skills?: string[] | null;
          wolfpack_social_links?: Json | null;
          wolfpack_status?: string | null;
          wolfpack_tier?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "users_avatar_id_fkey";
            columns: ["avatar_id"];
            isOneToOne: false;
            referencedRelation: "images";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_custom_avatar_id_fkey";
            columns: ["custom_avatar_id"];
            isOneToOne: false;
            referencedRelation: "images";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      database_health_dashboard: {
        Row: {
          category: string | null;
          dead_rows: string | null;
          item: string | null;
          live_rows: string | null;
          size: string | null;
          status: string | null;
        };
        Relationships: [];
      };
      feature_flag_dashboard: {
        Row: {
          description: string | null;
          enabled_for_roles: string[] | null;
          feature_category: string | null;
          flag_name: string | null;
          globally_enabled: boolean | null;
          specific_users_count: number | null;
          total_users_with_access: number | null;
          updated_at: string | null;
        };
        Insert: {
          description?: string | null;
          enabled_for_roles?: string[] | null;
          feature_category?: never;
          flag_name?: string | null;
          globally_enabled?: boolean | null;
          specific_users_count?: never;
          total_users_with_access?: never;
          updated_at?: string | null;
        };
        Update: {
          description?: string | null;
          enabled_for_roles?: string[] | null;
          feature_category?: never;
          flag_name?: string | null;
          globally_enabled?: boolean | null;
          specific_users_count?: never;
          total_users_with_access?: never;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      index_usage_monitor: {
        Row: {
          feature_area: string | null;
          index_name: unknown | null;
          index_size: string | null;
          schemaname: unknown | null;
          table_name: unknown | null;
          times_used: number | null;
          usage_status: string | null;
        };
        Relationships: [];
      };
      location_chat_view: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          display_name: string | null;
          first_name: string | null;
          id: string | null;
          image_url: string | null;
          is_deleted: boolean | null;
          is_flagged: boolean | null;
          last_name: string | null;
          location_id: string | null;
          location_name: string | null;
          message: string | null;
          message_type: string | null;
          reaction_count: number | null;
          session_id: string | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_chat_messages_session";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_chat_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_chat_messages_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_chat_messages_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_chat_messages_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_chat_messages_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_chat_messages_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_chat_messages_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_chat_messages_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_chat_messages_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_chat_messages_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "wolfpack_chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "wolfpack_chat_sessions_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_view: {
        Row: {
          category_color: string | null;
          category_icon: string | null;
          category_id: string | null;
          category_name: string | null;
          category_order: number | null;
          category_type: string | null;
          image_path: string | null;
          image_url: string | null;
          is_available: boolean | null;
          item_description: string | null;
          item_id: string | null;
          item_name: string | null;
          item_order: number | null;
          price: number | null;
        };
        Relationships: [];
      };
      messages_with_sender_view: {
        Row: {
          attachments: Json | null;
          content: string | null;
          conversation_id: string | null;
          created_at: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          delivered_at: string | null;
          edited_at: string | null;
          id: string | null;
          is_deleted: boolean | null;
          is_edited: boolean | null;
          is_read: boolean | null;
          media_duration: number | null;
          media_metadata: Json | null;
          media_size: number | null;
          media_thumbnail_url: string | null;
          media_type: string | null;
          media_url: string | null;
          message_type: string | null;
          metadata: Json | null;
          parent_message_id: string | null;
          reactions_count: Json | null;
          read_at: string | null;
          reply_count: number | null;
          reply_to_id: string | null;
          sender_avatar_url: string | null;
          sender_display_name: string | null;
          sender_first_name: string | null;
          sender_id: string | null;
          sender_last_name: string | null;
          sender_username: string | null;
          status: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "user_conversations_view";
            referencedColumns: ["conversation_id"];
          },
          {
            foreignKeyName: "chat_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "chat_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "chat_messages_parent_message_id_fkey";
            columns: ["parent_message_id"];
            isOneToOne: false;
            referencedRelation: "messages_with_sender_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_parent_message_id_fkey";
            columns: ["parent_message_id"];
            isOneToOne: false;
            referencedRelation: "chat_messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey";
            columns: ["reply_to_id"];
            isOneToOne: false;
            referencedRelation: "messages_with_sender_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey";
            columns: ["reply_to_id"];
            isOneToOne: false;
            referencedRelation: "chat_messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      my_comment_reactions: {
        Row: {
          comment_id: string | null;
          created_at: string | null;
          id: string | null;
          reaction_type: string | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "wolfpack_comment_reactions_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "content_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_comment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_comment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_comment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_comment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_comment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_comment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_comment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_comment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_comment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      my_fcm_tokens: {
        Row: {
          created_at: string | null;
          device_info: Json | null;
          id: string | null;
          is_active: boolean | null;
          last_used_at: string | null;
          platform: string | null;
          token: string | null;
        };
        Relationships: [];
      };
      my_videos: {
        Row: {
          algorithm_boost: number | null;
          allow_comments: boolean | null;
          allow_duets: boolean | null;
          allow_stitches: boolean | null;
          aspect_ratio: string | null;
          caption: string | null;
          comment_count: number | null;
          comments_count: number | null;
          created_at: string | null;
          description: string | null;
          display_name: string | null;
          duration: number | null;
          duration_seconds: number | null;
          effect_id: string | null;
          effect_name: string | null;
          featured_at: string | null;
          first_name: string | null;
          hashtags: string[] | null;
          id: string | null;
          images: string[] | null;
          ingested_content_id: string | null;
          is_active: boolean | null;
          is_ad: boolean | null;
          is_featured: boolean | null;
          last_name: string | null;
          like_count: number | null;
          likes_count: number | null;
          location_id: string | null;
          location_lat: number | null;
          location_lng: number | null;
          location_tag: string | null;
          metadata: Json | null;
          music_id: string | null;
          music_name: string | null;
          post_type: string | null;
          processing_status: string | null;
          share_count: number | null;
          source: string | null;
          tags: string[] | null;
          thumbnail_url: string | null;
          title: string | null;
          trending_score: number | null;
          updated_at: string | null;
          user_email: string | null;
          user_id: string | null;
          user_profile_image: string | null;
          video_url: string | null;
          view_count: number | null;
          views_count: number | null;
          visibility: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "content_posts_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string | null;
          id: string | null;
          link: string | null;
          message: string | null;
          metadata: Json | null;
          notification_type: string | null;
          recipient_id: string | null;
          related_user_id: string | null;
          related_video_id: string | null;
          status: string | null;
          type: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string | null;
          link?: string | null;
          message?: string | null;
          metadata?: Json | null;
          notification_type?: string | null;
          recipient_id?: string | null;
          related_user_id?: string | null;
          related_video_id?: string | null;
          status?: string | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string | null;
          link?: string | null;
          message?: string | null;
          metadata?: Json | null;
          notification_type?: string | null;
          recipient_id?: string | null;
          related_user_id?: string | null;
          related_video_id?: string | null;
          status?: string | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName:
              "wolfpack_activity_notifications_related_user_id_fkey";
            columns: ["related_user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_activity_notifications_related_user_id_fkey";
            columns: ["related_user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_activity_notifications_related_user_id_fkey";
            columns: ["related_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_activity_notifications_related_user_id_fkey";
            columns: ["related_user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_activity_notifications_related_user_id_fkey";
            columns: ["related_user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_activity_notifications_related_user_id_fkey";
            columns: ["related_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_activity_notifications_related_user_id_fkey";
            columns: ["related_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_activity_notifications_related_user_id_fkey";
            columns: ["related_user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_activity_notifications_related_user_id_fkey";
            columns: ["related_user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      production_summary: {
        Row: {
          admin_features: number | null;
          all_tables: string[] | null;
          feature_category: string | null;
          feature_count: number | null;
          user_features: number | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          auth_id: string | null;
          avatar_url: string | null;
          bio: string | null;
          city: string | null;
          computed_avatar_url: string | null;
          computed_display_name: string | null;
          created_at: string | null;
          display_name: string | null;
          email: string | null;
          favorite_drink: string | null;
          favorite_song: string | null;
          first_name: string | null;
          id: string | null;
          instagram_handle: string | null;
          is_online: boolean | null;
          is_vip: boolean | null;
          last_name: string | null;
          last_seen_at: string | null;
          location: string | null;
          occupation: string | null;
          profile_image_url: string | null;
          profile_pic_url: string | null;
          state: string | null;
          updated_at: string | null;
          username: string | null;
          verified: boolean | null;
          vibe_status: string | null;
          wolf_emoji: string | null;
          wolfpack_bio: string | null;
          wolfpack_status: string | null;
          wolfpack_tier: string | null;
        };
        Insert: {
          auth_id?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          computed_avatar_url?: never;
          computed_display_name?: never;
          created_at?: string | null;
          display_name?: string | null;
          email?: string | null;
          favorite_drink?: string | null;
          favorite_song?: string | null;
          first_name?: string | null;
          id?: string | null;
          instagram_handle?: string | null;
          is_online?: boolean | null;
          is_vip?: boolean | null;
          last_name?: string | null;
          last_seen_at?: string | null;
          location?: string | null;
          occupation?: string | null;
          profile_image_url?: string | null;
          profile_pic_url?: string | null;
          state?: string | null;
          updated_at?: string | null;
          username?: string | null;
          verified?: boolean | null;
          vibe_status?: string | null;
          wolf_emoji?: string | null;
          wolfpack_bio?: string | null;
          wolfpack_status?: string | null;
          wolfpack_tier?: string | null;
        };
        Update: {
          auth_id?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          computed_avatar_url?: never;
          computed_display_name?: never;
          created_at?: string | null;
          display_name?: string | null;
          email?: string | null;
          favorite_drink?: string | null;
          favorite_song?: string | null;
          first_name?: string | null;
          id?: string | null;
          instagram_handle?: string | null;
          is_online?: boolean | null;
          is_vip?: boolean | null;
          last_name?: string | null;
          last_seen_at?: string | null;
          location?: string | null;
          occupation?: string | null;
          profile_image_url?: string | null;
          profile_pic_url?: string | null;
          state?: string | null;
          updated_at?: string | null;
          username?: string | null;
          verified?: boolean | null;
          vibe_status?: string | null;
          wolf_emoji?: string | null;
          wolfpack_bio?: string | null;
          wolfpack_status?: string | null;
          wolfpack_tier?: string | null;
        };
        Relationships: [];
      };
      secure_user_profiles: {
        Row: {
          allow_messages: boolean | null;
          artist_account: boolean | null;
          auth_id: string | null;
          avatar_id: string | null;
          avatar_url: string | null;
          bio: string | null;
          block_reason: string | null;
          blocked_at: string | null;
          blocked_by: string | null;
          business_account: boolean | null;
          card_on_file: boolean | null;
          city: string | null;
          created_at: string | null;
          custom_avatar_id: string | null;
          daily_customization: Json | null;
          deleted_at: string | null;
          display_name: string | null;
          email: string | null;
          email_normalized: string | null;
          favorite_bartender: string | null;
          favorite_drink: string | null;
          favorite_song: string | null;
          first_name: string | null;
          full_name_normalized: string | null;
          gender: string | null;
          has_open_tab: boolean | null;
          id: string | null;
          id_verification_method: string | null;
          id_verified: boolean | null;
          instagram_handle: string | null;
          is_approved: boolean | null;
          is_online: boolean | null;
          is_profile_visible: boolean | null;
          is_side_hustle: boolean | null;
          is_vip: boolean | null;
          is_wolfpack_member: boolean | null;
          last_activity: string | null;
          last_known_lat: number | null;
          last_known_lng: number | null;
          last_location_check: string | null;
          last_location_update: string | null;
          last_login: string | null;
          last_name: string | null;
          last_seen_at: string | null;
          leader_rank: string | null;
          location: string | null;
          location_accuracy: number | null;
          location_id: string | null;
          location_last_reported: string | null;
          location_permissions_granted: boolean | null;
          location_report_count: number | null;
          location_verification_date: string | null;
          location_verification_method: string | null;
          location_verification_status: string | null;
          location_verified: boolean | null;
          looking_for: string | null;
          loyalty_score: number | null;
          notes: string | null;
          notification_preferences: Json | null;
          occupation: string | null;
          pack_achievements: Json | null;
          pack_badges: Json | null;
          password_hash: string | null;
          permissions: Json | null;
          phone: string | null;
          phone_normalized: string | null;
          phone_number: string | null;
          phone_verified: boolean | null;
          preferred_pack_activities: string[] | null;
          privacy_settings: Json | null;
          profile_image_url: string | null;
          profile_last_seen_at: string | null;
          profile_pic_url: string | null;
          pronouns: string | null;
          role: string | null;
          sensitive_data_encrypted: Json | null;
          session_id: string | null;
          state: string | null;
          status: string | null;
          updated_at: string | null;
          username: string | null;
          verified: boolean | null;
          verified_at: string | null;
          verified_by: string | null;
          verified_region: string | null;
          vibe_status: string | null;
          website: string | null;
          wolf_emoji: string | null;
          wolfpack_availability_status: string | null;
          wolfpack_bio: string | null;
          wolfpack_interests: string[] | null;
          wolfpack_joined_at: string | null;
          wolfpack_skills: string[] | null;
          wolfpack_social_links: Json | null;
          wolfpack_status: string | null;
          wolfpack_tier: string | null;
        };
        Insert: {
          allow_messages?: boolean | null;
          artist_account?: boolean | null;
          auth_id?: string | null;
          avatar_id?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          block_reason?: string | null;
          blocked_at?: string | null;
          blocked_by?: string | null;
          business_account?: boolean | null;
          card_on_file?: boolean | null;
          city?: string | null;
          created_at?: string | null;
          custom_avatar_id?: string | null;
          daily_customization?: Json | null;
          deleted_at?: string | null;
          display_name?: string | null;
          email?: string | null;
          email_normalized?: string | null;
          favorite_bartender?: string | null;
          favorite_drink?: string | null;
          favorite_song?: string | null;
          first_name?: string | null;
          full_name_normalized?: string | null;
          gender?: string | null;
          has_open_tab?: boolean | null;
          id?: string | null;
          id_verification_method?: string | null;
          id_verified?: boolean | null;
          instagram_handle?: string | null;
          is_approved?: boolean | null;
          is_online?: boolean | null;
          is_profile_visible?: boolean | null;
          is_side_hustle?: boolean | null;
          is_vip?: boolean | null;
          is_wolfpack_member?: boolean | null;
          last_activity?: string | null;
          last_known_lat?: number | null;
          last_known_lng?: number | null;
          last_location_check?: string | null;
          last_location_update?: string | null;
          last_login?: string | null;
          last_name?: string | null;
          last_seen_at?: string | null;
          leader_rank?: string | null;
          location?: string | null;
          location_accuracy?: number | null;
          location_id?: string | null;
          location_last_reported?: string | null;
          location_permissions_granted?: boolean | null;
          location_report_count?: number | null;
          location_verification_date?: string | null;
          location_verification_method?: string | null;
          location_verification_status?: string | null;
          location_verified?: boolean | null;
          looking_for?: string | null;
          loyalty_score?: number | null;
          notes?: string | null;
          notification_preferences?: Json | null;
          occupation?: string | null;
          pack_achievements?: Json | null;
          pack_badges?: Json | null;
          password_hash?: string | null;
          permissions?: Json | null;
          phone?: string | null;
          phone_normalized?: string | null;
          phone_number?: string | null;
          phone_verified?: boolean | null;
          preferred_pack_activities?: string[] | null;
          privacy_settings?: Json | null;
          profile_image_url?: string | null;
          profile_last_seen_at?: string | null;
          profile_pic_url?: string | null;
          pronouns?: string | null;
          role?: string | null;
          sensitive_data_encrypted?: Json | null;
          session_id?: string | null;
          state?: string | null;
          status?: string | null;
          updated_at?: string | null;
          username?: string | null;
          verified?: boolean | null;
          verified_at?: string | null;
          verified_by?: string | null;
          verified_region?: string | null;
          vibe_status?: string | null;
          website?: string | null;
          wolf_emoji?: string | null;
          wolfpack_availability_status?: string | null;
          wolfpack_bio?: string | null;
          wolfpack_interests?: string[] | null;
          wolfpack_joined_at?: string | null;
          wolfpack_skills?: string[] | null;
          wolfpack_social_links?: Json | null;
          wolfpack_status?: string | null;
          wolfpack_tier?: string | null;
        };
        Update: {
          allow_messages?: boolean | null;
          artist_account?: boolean | null;
          auth_id?: string | null;
          avatar_id?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          block_reason?: string | null;
          blocked_at?: string | null;
          blocked_by?: string | null;
          business_account?: boolean | null;
          card_on_file?: boolean | null;
          city?: string | null;
          created_at?: string | null;
          custom_avatar_id?: string | null;
          daily_customization?: Json | null;
          deleted_at?: string | null;
          display_name?: string | null;
          email?: string | null;
          email_normalized?: string | null;
          favorite_bartender?: string | null;
          favorite_drink?: string | null;
          favorite_song?: string | null;
          first_name?: string | null;
          full_name_normalized?: string | null;
          gender?: string | null;
          has_open_tab?: boolean | null;
          id?: string | null;
          id_verification_method?: string | null;
          id_verified?: boolean | null;
          instagram_handle?: string | null;
          is_approved?: boolean | null;
          is_online?: boolean | null;
          is_profile_visible?: boolean | null;
          is_side_hustle?: boolean | null;
          is_vip?: boolean | null;
          is_wolfpack_member?: boolean | null;
          last_activity?: string | null;
          last_known_lat?: number | null;
          last_known_lng?: number | null;
          last_location_check?: string | null;
          last_location_update?: string | null;
          last_login?: string | null;
          last_name?: string | null;
          last_seen_at?: string | null;
          leader_rank?: string | null;
          location?: string | null;
          location_accuracy?: number | null;
          location_id?: string | null;
          location_last_reported?: string | null;
          location_permissions_granted?: boolean | null;
          location_report_count?: number | null;
          location_verification_date?: string | null;
          location_verification_method?: string | null;
          location_verification_status?: string | null;
          location_verified?: boolean | null;
          looking_for?: string | null;
          loyalty_score?: number | null;
          notes?: string | null;
          notification_preferences?: Json | null;
          occupation?: string | null;
          pack_achievements?: Json | null;
          pack_badges?: Json | null;
          password_hash?: string | null;
          permissions?: Json | null;
          phone?: string | null;
          phone_normalized?: string | null;
          phone_number?: string | null;
          phone_verified?: boolean | null;
          preferred_pack_activities?: string[] | null;
          privacy_settings?: Json | null;
          profile_image_url?: string | null;
          profile_last_seen_at?: string | null;
          profile_pic_url?: string | null;
          pronouns?: string | null;
          role?: string | null;
          sensitive_data_encrypted?: Json | null;
          session_id?: string | null;
          state?: string | null;
          status?: string | null;
          updated_at?: string | null;
          username?: string | null;
          verified?: boolean | null;
          verified_at?: string | null;
          verified_by?: string | null;
          verified_region?: string | null;
          vibe_status?: string | null;
          website?: string | null;
          wolf_emoji?: string | null;
          wolfpack_availability_status?: string | null;
          wolfpack_bio?: string | null;
          wolfpack_interests?: string[] | null;
          wolfpack_joined_at?: string | null;
          wolfpack_skills?: string[] | null;
          wolfpack_social_links?: Json | null;
          wolfpack_status?: string | null;
          wolfpack_tier?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_users_blocked_by";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "users_avatar_id_fkey";
            columns: ["avatar_id"];
            isOneToOne: false;
            referencedRelation: "images";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_custom_avatar_id_fkey";
            columns: ["custom_avatar_id"];
            isOneToOne: false;
            referencedRelation: "images";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      user_conversations_view: {
        Row: {
          avatar_url: string | null;
          conversation_id: string | null;
          conversation_type: string | null;
          created_at: string | null;
          display_name: string | null;
          joined_at: string | null;
          last_message_at: string | null;
          last_message_preview: string | null;
          last_message_sender_id: string | null;
          last_read_at: string | null;
          notification_settings: Json | null;
          participant_count: number | null;
          participants: Json[] | null;
          unread_count: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey";
            columns: ["last_message_sender_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey";
            columns: ["last_message_sender_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey";
            columns: ["last_message_sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey";
            columns: ["last_message_sender_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey";
            columns: ["last_message_sender_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey";
            columns: ["last_message_sender_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey";
            columns: ["last_message_sender_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey";
            columns: ["last_message_sender_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_last_message_sender_id_fkey";
            columns: ["last_message_sender_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      user_interaction_permissions: {
        Row: {
          allow_messages: boolean | null;
          display_name: string | null;
          id: string | null;
          is_wolfpack_member: boolean | null;
          privacy_settings: Json | null;
        };
        Insert: {
          allow_messages?: boolean | null;
          display_name?: string | null;
          id?: string | null;
          is_wolfpack_member?: boolean | null;
          privacy_settings?: Json | null;
        };
        Update: {
          allow_messages?: boolean | null;
          display_name?: string | null;
          id?: string | null;
          is_wolfpack_member?: boolean | null;
          privacy_settings?: Json | null;
        };
        Relationships: [];
      };
      user_profile_cache: {
        Row: {
          avatar_url: string | null;
          display_name: string | null;
          email: string | null;
          first_name: string | null;
          follower_count: number | null;
          following_count: number | null;
          id: string | null;
          is_online: boolean | null;
          last_activity: string | null;
          last_name: string | null;
          location_verified: boolean | null;
          role: string | null;
          verified_region: string | null;
          wolfpack_status: string | null;
          wolfpack_tier: string | null;
        };
        Relationships: [];
      };
      videos: {
        Row: {
          allow_comments: boolean | null;
          allow_duets: boolean | null;
          allow_stitches: boolean | null;
          aspect_ratio: string | null;
          comment_count: number | null;
          created_at: string | null;
          description: string | null;
          duration_seconds: number | null;
          id: string | null;
          is_active: boolean | null;
          is_featured: boolean | null;
          like_count: number | null;
          location_id: string | null;
          metadata: Json | null;
          processing_status: string | null;
          share_count: number | null;
          tags: string[] | null;
          thumbnail_url: string | null;
          title: string | null;
          updated_at: string | null;
          user_id: string | null;
          video_url: string | null;
          view_count: number | null;
          visibility: string | null;
        };
        Insert: {
          allow_comments?: boolean | null;
          allow_duets?: boolean | null;
          allow_stitches?: boolean | null;
          aspect_ratio?: string | null;
          comment_count?: number | null;
          created_at?: string | null;
          description?: string | null;
          duration_seconds?: number | null;
          id?: string | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          like_count?: number | null;
          location_id?: string | null;
          metadata?: Json | null;
          processing_status?: string | null;
          share_count?: number | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          video_url?: string | null;
          view_count?: number | null;
          visibility?: string | null;
        };
        Update: {
          allow_comments?: boolean | null;
          allow_duets?: boolean | null;
          allow_stitches?: boolean | null;
          aspect_ratio?: string | null;
          comment_count?: number | null;
          created_at?: string | null;
          description?: string | null;
          duration_seconds?: number | null;
          id?: string | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          like_count?: number | null;
          location_id?: string | null;
          metadata?: Json | null;
          processing_status?: string | null;
          share_count?: number | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          video_url?: string | null;
          view_count?: number | null;
          visibility?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "content_posts_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      wolfpack_active_members: {
        Row: {
          avatar_url: string | null;
          display_name: string | null;
          id: string | null;
          is_online: boolean | null;
          last_seen_at: string | null;
          location_id: string | null;
          user_id: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          display_name?: string | null;
          id?: string | null;
          is_online?: boolean | null;
          last_seen_at?: string | null;
          location_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          display_name?: string | null;
          id?: string | null;
          is_online?: boolean | null;
          last_seen_at?: string | null;
          location_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      wolfpack_comment_reaction_summary: {
        Row: {
          comment_id: string | null;
          count: number | null;
          reaction_type: string | null;
          user_ids: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "wolfpack_comment_reactions_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "content_comments";
            referencedColumns: ["id"];
          },
        ];
      };
      wolfpack_feed_cache: {
        Row: {
          avatar_url: string | null;
          comments_count: number | null;
          content: string | null;
          created_at: string | null;
          first_name: string | null;
          hashtags: string[] | null;
          id: string | null;
          images: string[] | null;
          is_featured: boolean | null;
          last_name: string | null;
          likes_count: number | null;
          media_type: string | null;
          media_url: string | null;
          shares_count: number | null;
          updated_at: string | null;
          user_id: string | null;
          username: string | null;
          verified: boolean | null;
          video_url: string | null;
          views_count: number | null;
          visibility: string | null;
          wolf_emoji: string | null;
          wolfpack_status: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      content_posts: {
        Row: {
          comments_count: number | null;
          content: string | null;
          created_at: string | null;
          hashtags: string[] | null;
          id: string | null;
          is_featured: boolean | null;
          likes_count: number | null;
          location: string | null;
          media_type: string | null;
          media_url: string | null;
          mentions: string[] | null;
          shares_count: number | null;
          updated_at: string | null;
          user_id: string | null;
          views_count: number | null;
          visibility: string | null;
        };
        Insert: {
          comments_count?: never;
          content?: string | null;
          created_at?: string | null;
          hashtags?: string[] | null;
          id?: string | null;
          is_featured?: never;
          likes_count?: never;
          location?: string | null;
          media_type?: never;
          media_url?: never;
          mentions?: never;
          shares_count?: never;
          updated_at?: string | null;
          user_id?: string | null;
          views_count?: never;
          visibility?: string | null;
        };
        Update: {
          comments_count?: never;
          content?: string | null;
          created_at?: string | null;
          hashtags?: string[] | null;
          id?: string | null;
          is_featured?: never;
          likes_count?: never;
          location?: string | null;
          media_type?: never;
          media_url?: never;
          mentions?: never;
          shares_count?: never;
          updated_at?: string | null;
          user_id?: string | null;
          views_count?: never;
          visibility?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      wolfpack_video_likes: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          id: string | null;
          user_id: string | null;
          username: string | null;
          video_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "wolfpack_post_likes_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "my_videos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_post_likes_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_post_likes_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_feed_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_post_likes_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "content_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_post_likes_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "content_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_post_likes_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "content_posts_with_user_interaction";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      wolfpack_video_shares: {
        Row: {
          created_at: string | null;
          id: string | null;
          message: string | null;
          platform: string | null;
          share_type: string | null;
          shared_by_user_id: string | null;
          shared_to_user_id: string | null;
          video_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string | null;
          message?: string | null;
          platform?: string | null;
          share_type?: string | null;
          shared_by_user_id?: string | null;
          shared_to_user_id?: string | null;
          video_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string | null;
          message?: string | null;
          platform?: string | null;
          share_type?: string | null;
          shared_by_user_id?: string | null;
          shared_to_user_id?: string | null;
          video_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "wolfpack_shares_shared_by_user_id_fkey";
            columns: ["shared_by_user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_by_user_id_fkey";
            columns: ["shared_by_user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_by_user_id_fkey";
            columns: ["shared_by_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_by_user_id_fkey";
            columns: ["shared_by_user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_by_user_id_fkey";
            columns: ["shared_by_user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_by_user_id_fkey";
            columns: ["shared_by_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_by_user_id_fkey";
            columns: ["shared_by_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_by_user_id_fkey";
            columns: ["shared_by_user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_by_user_id_fkey";
            columns: ["shared_by_user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_to_user_id_fkey";
            columns: ["shared_to_user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_to_user_id_fkey";
            columns: ["shared_to_user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_to_user_id_fkey";
            columns: ["shared_to_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_to_user_id_fkey";
            columns: ["shared_to_user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_to_user_id_fkey";
            columns: ["shared_to_user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_to_user_id_fkey";
            columns: ["shared_to_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_to_user_id_fkey";
            columns: ["shared_to_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_to_user_id_fkey";
            columns: ["shared_to_user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_shared_to_user_id_fkey";
            columns: ["shared_to_user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "wolfpack_shares_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "my_videos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_feed_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "content_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "content_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_shares_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "content_posts_with_user_interaction";
            referencedColumns: ["id"];
          },
        ];
      };
      content_posts_with_user_interaction: {
        Row: {
          algorithm_boost: number | null;
          allow_comments: boolean | null;
          allow_duets: boolean | null;
          allow_stitches: boolean | null;
          aspect_ratio: string | null;
          caption: string | null;
          comment_count: number | null;
          created_at: string | null;
          description: string | null;
          duration: number | null;
          duration_seconds: number | null;
          effect_id: string | null;
          effect_name: string | null;
          featured_at: string | null;
          hashtags: string[] | null;
          id: string | null;
          images: string[] | null;
          ingested_content_id: string | null;
          is_active: boolean | null;
          is_ad: boolean | null;
          is_featured: boolean | null;
          like_count: number | null;
          location_id: string | null;
          location_lat: number | null;
          location_lng: number | null;
          location_tag: string | null;
          metadata: Json | null;
          music_id: string | null;
          music_name: string | null;
          post_type: string | null;
          processing_status: string | null;
          share_count: number | null;
          source: string | null;
          tags: string[] | null;
          thumbnail_url: string | null;
          title: string | null;
          trending_score: number | null;
          updated_at: string | null;
          user_following: boolean | null;
          user_id: string | null;
          user_liked: boolean | null;
          video_url: string | null;
          view_count: number | null;
          visibility: string | null;
        };
        Insert: {
          algorithm_boost?: number | null;
          allow_comments?: boolean | null;
          allow_duets?: boolean | null;
          allow_stitches?: boolean | null;
          aspect_ratio?: string | null;
          caption?: string | null;
          comment_count?: never;
          created_at?: string | null;
          description?: string | null;
          duration?: number | null;
          duration_seconds?: number | null;
          effect_id?: string | null;
          effect_name?: string | null;
          featured_at?: string | null;
          hashtags?: string[] | null;
          id?: string | null;
          images?: string[] | null;
          ingested_content_id?: string | null;
          is_active?: boolean | null;
          is_ad?: boolean | null;
          is_featured?: boolean | null;
          like_count?: never;
          location_id?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_tag?: string | null;
          metadata?: Json | null;
          music_id?: string | null;
          music_name?: string | null;
          post_type?: string | null;
          processing_status?: string | null;
          share_count?: number | null;
          source?: string | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title?: string | null;
          trending_score?: number | null;
          updated_at?: string | null;
          user_following?: never;
          user_id?: string | null;
          user_liked?: never;
          video_url?: string | null;
          view_count?: never;
          visibility?: string | null;
        };
        Update: {
          algorithm_boost?: number | null;
          allow_comments?: boolean | null;
          allow_duets?: boolean | null;
          allow_stitches?: boolean | null;
          aspect_ratio?: string | null;
          caption?: string | null;
          comment_count?: never;
          created_at?: string | null;
          description?: string | null;
          duration?: number | null;
          duration_seconds?: number | null;
          effect_id?: string | null;
          effect_name?: string | null;
          featured_at?: string | null;
          hashtags?: string[] | null;
          id?: string | null;
          images?: string[] | null;
          ingested_content_id?: string | null;
          is_active?: boolean | null;
          is_ad?: boolean | null;
          is_featured?: boolean | null;
          like_count?: never;
          location_id?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_tag?: string | null;
          metadata?: Json | null;
          music_id?: string | null;
          music_name?: string | null;
          post_type?: string | null;
          processing_status?: string | null;
          share_count?: number | null;
          source?: string | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title?: string | null;
          trending_score?: number | null;
          updated_at?: string | null;
          user_following?: never;
          user_id?: string | null;
          user_liked?: never;
          video_url?: string | null;
          view_count?: never;
          visibility?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "content_posts_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "active_wolfpack_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "current_user_profile";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "secure_user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_interaction_permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profile_cache";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "wolfpack_active_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
    };
    Functions: {
      add_chat_reaction: {
        Args: { p_message_id: string; p_emoji: string };
        Returns: string;
      };
      add_comment: {
        Args:
          | { p_video_id: string; p_content: string }
          | {
            p_video_id: string;
            p_content: string;
            p_parent_comment_id?: string;
          };
        Returns: string;
      };
      add_conversation_participants: {
        Args: { p_conversation_id: string; p_user_ids: string[] };
        Returns: number;
      };
      add_event_contestant: {
        Args: { p_event_id: string; p_contestant_id: string };
        Returns: Json;
      };
      add_modifier_to_group: {
        Args: {
          p_group_id: string;
          p_modifier_id: string;
          p_display_order?: number;
          p_is_default?: boolean;
        };
        Returns: string;
      };
      add_video_comment: {
        Args: {
          p_video_id: string;
          p_user_id: string;
          p_content: string;
          p_parent_comment_id?: string;
        };
        Returns: Json;
      };
      admin_add_item_modifiers: {
        Args: {
          p_item_id: string;
          p_group_name: string;
          p_modifier_names: string[];
          p_is_required?: boolean;
        };
        Returns: Json;
      };
      admin_approve_redemption: {
        Args: { p_redemption_id: string };
        Returns: Json;
      };
      admin_block_user: {
        Args: { p_user_id: string; p_reason?: string };
        Returns: Json;
      };
      admin_create_menu_category: {
        Args: {
          p_name: string;
          p_type: string;
          p_icon?: string;
          p_color?: string;
          p_description?: string;
        };
        Returns: Json;
      };
      admin_create_menu_item: {
        Args: {
          p_name: string;
          p_description: string;
          p_price: number;
          p_category_id: string;
          p_is_available?: boolean;
        };
        Returns: Json;
      };
      admin_create_user: {
        Args: {
          p_email: string;
          p_password: string;
          p_first_name?: string;
          p_last_name?: string;
          p_role?: string;
        };
        Returns: Json;
      };
      admin_delete_announcement: {
        Args: { p_id: string };
        Returns: Json;
      };
      admin_delete_chat_message: {
        Args: { p_message_id: string };
        Returns: boolean;
      };
      admin_delete_image: {
        Args: { p_image_id: string };
        Returns: Json;
      };
      admin_delete_menu_category: {
        Args: { p_category_id: string };
        Returns: Json;
      };
      admin_delete_menu_item: {
        Args: { p_item_id: string };
        Returns: Json;
      };
      admin_delete_message: {
        Args: { p_message_id: string; p_message_type: string };
        Returns: boolean;
      };
      admin_delete_user: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      admin_force_checkout: {
        Args: { p_checkin_id: string };
        Returns: Json;
      };
      admin_get_all_blocks: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      admin_get_all_chat_messages: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: {
          message_id: string;
          session_id: string;
          user_id: string;
          display_name: string;
          content: string;
          message_type: string;
          image_url: string;
          created_at: string;
          edited_at: string;
          is_flagged: boolean;
          is_deleted: boolean;
          user_role: string;
          reaction_count: number;
        }[];
      };
      admin_get_all_roles: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      admin_get_analytics: {
        Args: { p_metric?: string; p_date_from?: string; p_date_to?: string };
        Returns: Json;
      };
      admin_get_app_config: {
        Args: { p_key?: string };
        Returns: Json;
      };
      admin_get_blocked_users: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      admin_get_checkin_history: {
        Args: { p_user_id?: string; p_limit?: number };
        Returns: Json;
      };
      admin_get_connection_stats: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      admin_get_current_checkins: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      admin_get_image_stats: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      admin_get_images: {
        Args: { p_limit?: number };
        Returns: Json;
      };
      admin_get_menu_stats: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      admin_get_messageable_users: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      admin_get_notification_preferences: {
        Args: { p_user_id?: string };
        Returns: Json;
      };
      admin_get_private_message_overview: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      admin_get_private_message_overview_bypass: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      admin_get_private_message_overview_explicit: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      admin_get_private_messages: {
        Args: { p_limit?: number; p_offset?: number; p_user_filter?: string };
        Returns: {
          message_id: string;
          from_user_id: string;
          from_email: string;
          from_name: string;
          to_user_id: string;
          to_email: string;
          to_name: string;
          message: string;
          image_url: string;
          is_read: boolean;
          created_at: string;
          read_at: string;
        }[];
      };
      admin_get_public_chat_monitor: {
        Args: { p_limit?: number; p_offset?: number; p_filter_admin?: boolean };
        Returns: {
          message_id: string;
          user_id: string;
          display_name: string;
          content: string;
          created_at: string;
          is_flagged: boolean;
          is_deleted: boolean;
          is_admin: boolean;
          flag_count: number;
        }[];
      };
      admin_get_push_audit_log: {
        Args: { p_limit?: number };
        Returns: Json;
      };
      admin_get_push_history: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: Json;
      };
      admin_get_quick_stats: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      admin_get_recent_private_conversations: {
        Args: { p_limit?: number };
        Returns: Json;
      };
      admin_get_role_permissions: {
        Args: { p_role_id: string };
        Returns: Json;
      };
      admin_get_simple_chat_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          total_messages: number;
          active_users: number;
          messages_today: number;
          flagged_messages: number;
          deleted_messages: number;
          total_reactions: number;
        }[];
      };
      admin_get_system_summary: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      admin_get_table_assignments: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      admin_get_user_connections: {
        Args: { p_user_id?: string };
        Returns: Json;
      };
      admin_get_user_stats: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      admin_get_users: {
        Args: { p_search?: string; p_status?: string; p_role?: string };
        Returns: {
          user_id: string;
          email: string;
          first_name: string;
          last_name: string;
          role: string;
          status: string;
          is_blocked: boolean;
          blocked_at: string;
          block_reason: string;
          created_at: string;
          last_login: string;
          avatar_url: string;
        }[];
      };
      admin_manage_user_status: {
        Args: { p_user_id: string; p_action: string; p_reason?: string };
        Returns: boolean;
      };
      admin_moderate_report: {
        Args: { p_report_id: string; p_action: string; p_notes?: string };
        Returns: Json;
      };
      admin_reorder_menu_items: {
        Args: { p_item_orders: Json };
        Returns: Json;
      };
      admin_restore_user: {
        Args: { target_user_id: string };
        Returns: Json;
      };
      admin_search_private_messages: {
        Args: { p_search_term: string };
        Returns: Json;
      };
      admin_send_announcement_push: {
        Args: { p_announcement_id: string };
        Returns: Json;
      };
      admin_send_chat_message: {
        Args: { p_message: string; p_image_url?: string };
        Returns: string;
      };
      admin_send_message: {
        Args: { p_to_user_id: string; p_message: string; p_image_id?: string };
        Returns: string;
      };
      admin_send_private_message: {
        Args: { p_to_user_id: string; p_message: string; p_image_url?: string };
        Returns: Json;
      };
      admin_send_push_notification: {
        Args: {
          p_title: string;
          p_body: string;
          p_target_type: string;
          p_target_users?: string[];
          p_target_role?: string;
        };
        Returns: Json;
      };
      admin_set_app_config: {
        Args: { p_key: string; p_value: string };
        Returns: Json;
      };
      admin_toggle_item_availability: {
        Args: { p_item_id: string };
        Returns: Json;
      };
      admin_unblock_user: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      admin_update_announcement: {
        Args: {
          p_id: string;
          p_title?: string;
          p_content?: string;
          p_active?: boolean;
          p_featured_image?: string;
        };
        Returns: Json;
      };
      admin_update_item_image: {
        Args: { p_item_id: string; p_image_url: string };
        Returns: Json;
      };
      admin_update_menu_category: {
        Args: {
          p_category_id: string;
          p_name?: string;
          p_description?: string;
          p_icon?: string;
          p_color?: string;
          p_display_order?: number;
          p_is_active?: boolean;
        };
        Returns: Json;
      };
      admin_update_menu_item: {
        Args: {
          p_item_id: string;
          p_name?: string;
          p_description?: string;
          p_price?: number;
          p_category_id?: string;
          p_is_available?: boolean;
        };
        Returns: Json;
      };
      admin_update_user: {
        Args: {
          p_user_id: string;
          p_email?: string;
          p_first_name?: string;
          p_last_name?: string;
          p_role?: string;
          p_status?: string;
        };
        Returns: Json;
      };
      admin_update_user_password: {
        Args: { p_user_id: string; p_new_password: string };
        Returns: Json;
      };
      admin_update_user_status: {
        Args: { target_user_id: string; new_status: string };
        Returns: Json;
      };
      analyze_content_with_ai: {
        Args: { p_content_type: string; p_content: string; p_context?: Json };
        Returns: Json;
      };
      analyze_content_with_ai_enhanced: {
        Args: { p_content_id: string; p_content_type: string };
        Returns: Json;
      };
      analyze_index_efficiency: {
        Args: Record<PropertyKey, never>;
        Returns: {
          schema_name: string;
          table_name: string;
          index_name: string;
          index_size: string;
          index_scans: number;
          rows_per_scan: number;
          efficiency_score: number;
          recommendation: string;
        }[];
      };
      analyze_index_usage: {
        Args: Record<PropertyKey, never>;
        Returns: {
          schema_name: string;
          table_name: string;
          index_name: string;
          index_size: string;
          usage_count: number;
          recommendation: string;
        }[];
      };
      analyze_table_bloat: {
        Args: Record<PropertyKey, never>;
        Returns: {
          schemaname: unknown;
          tablename: unknown;
          table_size: string;
          bloat_size: string;
          bloat_ratio: number;
          index_bloat_size: string;
          total_bloat_size: string;
        }[];
      };
      apply_for_wolfpack_membership: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      approve_user_bartab: {
        Args: {
          p_user_id: string;
          p_location_id: string;
          p_credit_limit?: number;
        };
        Returns: Json;
      };
      approve_wolfpack_membership: {
        Args: { target_user_id: string };
        Returns: Json;
      };
      assign_user_role: {
        Args: { p_user_id: string; p_role: string; p_assigned_by?: string };
        Returns: Json;
      };
      auto_checkout_users: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      automated_monitoring_check: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      award_loyalty_points: {
        Args: {
          p_user_id: string;
          p_action_type: string;
          p_points: number;
          p_entity_type?: string;
          p_entity_id?: string;
        };
        Returns: undefined;
      };
      background_location_sync: {
        Args: { p_locations: Json };
        Returns: Json;
      };
      bar_checkin: {
        Args:
          | { p_location_id: string; p_qr_code?: string }
          | { p_qr_code: string; p_latitude?: number; p_longitude?: number };
        Returns: Json;
      };
      bartender_control_user_ordering: {
        Args: {
          p_user_id: string;
          p_location_id: string;
          p_action: string;
          p_notes?: string;
        };
        Returns: Json;
      };
      bartender_message_customer: {
        Args: { p_customer_id: string; p_message: string; p_order_id?: string };
        Returns: string;
      };
      bartender_respond_to_request: {
        Args: {
          p_request_id: string;
          p_bartender_id: string;
          p_response: string;
          p_reason?: string;
          p_open_tab?: boolean;
        };
        Returns: Json;
      };
      boost_content_trending: {
        Args: { p_video_id: string; p_boost_factor?: number };
        Returns: undefined;
      };
      broadcast_pack_movement: {
        Args: { p_position_x: number; p_position_y: number };
        Returns: Json;
      };
      calculate_crowd_energy: {
        Args: { p_location_id: string };
        Returns: number;
      };
      calculate_trending_score: {
        Args: {
          p_view_count: number;
          p_like_count: number;
          p_comment_count: number;
          p_share_count: number;
          p_created_at: string;
        };
        Returns: number;
      };
      can_access_bar_tab: {
        Args: { user_id: string; location_id: string };
        Returns: boolean;
      };
      can_access_wolf_chat: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      can_bypass_location_verification: {
        Args: { p_user_id?: string };
        Returns: boolean;
      };
      can_customer_order: {
        Args: { p_user_id: string; p_location_id: string };
        Returns: Json;
      };
      can_join_pack: {
        Args: { user_id: string; pack_name: string };
        Returns: boolean;
      };
      can_message_user: {
        Args:
          | { p_sender_id: string; p_receiver_id: string }
          | { p_target_user_id: string };
        Returns: boolean;
      };
      can_user_order: {
        Args: { p_user_id?: string; p_location_id?: string };
        Returns: boolean;
      };
      can_user_post: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      can_user_send_interaction: {
        Args: { target_user_id: string };
        Returns: Json;
      };
      capture_slow_queries: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      capture_wolfpack_metrics: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      cart_implementation_guide: {
        Args: Record<PropertyKey, never>;
        Returns: {
          user_state: string;
          cart_storage: string;
          implementation: string;
          security_note: string;
        }[];
      };
      cast_dj_event_vote: {
        Args: {
          p_voter_id: string;
          p_event_id: string;
          p_voted_for_id?: string;
          p_participant_id?: string;
          p_choice?: string;
        };
        Returns: string;
      };
      check_auth_setup: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      check_cart_access: {
        Args: {
          user_id: string;
          user_lat: number;
          user_lng: number;
          location_id: string;
        };
        Returns: Json;
      };
      check_city_activity: {
        Args: { p_city: string; p_hours_threshold?: number };
        Returns: Json;
      };
      check_cron_job_runs: {
        Args: { p_limit?: number };
        Returns: Json;
      };
      check_cron_jobs: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      check_database_health: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      check_duplicate_account: {
        Args: {
          p_email: string;
          p_first_name: string;
          p_last_name: string;
          p_phone?: string;
        };
        Returns: Json;
      };
      check_email_exists: {
        Args: { check_email: string };
        Returns: boolean;
      };
      check_feature_access: {
        Args: { p_flag_name: string; p_user_id?: string };
        Returns: Json;
      };
      check_functions_without_search_path: {
        Args: Record<PropertyKey, never>;
        Returns: {
          function_name: string;
          security_type: string;
          recommendation: string;
        }[];
      };
      check_in_at_bar: {
        Args: { p_table_number?: number; p_mood?: string };
        Returns: Json;
      };
      check_index_bloat: {
        Args: Record<PropertyKey, never>;
        Returns: {
          schemaname: string;
          tablename: string;
          indexname: string;
          bloat_estimate: number;
        }[];
      };
      check_is_admin: {
        Args: { check_auth_id: string };
        Returns: boolean;
      };
      check_is_admin_no_rls: {
        Args: { check_auth_id: string };
        Returns: boolean;
      };
      check_is_admin_simple: {
        Args: { check_auth_id: string };
        Returns: boolean;
      };
      check_location_requirement: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      check_my_access: {
        Args: Record<PropertyKey, never>;
        Returns: {
          role_name: string;
          is_logged_in: boolean;
          user_id: string;
          can_access_wolf_pack: boolean;
          can_place_orders: boolean;
          can_view_menu: boolean;
        }[];
      };
      check_out_of_bar: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      check_rate_limit: {
        Args: {
          p_key: string;
          p_window_seconds: number;
          p_max_attempts: number;
        };
        Returns: {
          allowed: boolean;
          current_count: number;
          reset_at: string;
        }[];
      };
      check_rls_performance_issues: {
        Args: Record<PropertyKey, never>;
        Returns: {
          table_name: string;
          policy_name: string;
          issue_type: string;
          recommendation: string;
        }[];
      };
      check_rls_status: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      check_security_issues: {
        Args: Record<PropertyKey, never>;
        Returns: {
          issue_type: string;
          object_name: string;
          schema_name: string;
          severity: string;
          recommendation: string;
        }[];
      };
      check_security_status: {
        Args: Record<PropertyKey, never>;
        Returns: {
          status: string;
          critical_issues: number;
          warnings: number;
          notes: string;
        }[];
      };
      check_service_health: {
        Args: { p_service: string };
        Returns: Json;
      };
      check_srid_exists: {
        Args: { check_srid: number };
        Returns: boolean;
      };
      check_storage_quota: {
        Args: { p_user_id: string; p_file_size: number };
        Returns: boolean;
      };
      check_system_health: {
        Args: Record<PropertyKey, never>;
        Returns: {
          check_name: string;
          status: string;
          details: Json;
          check_timestamp: string;
        }[];
      };
      check_table_bloat: {
        Args: Record<PropertyKey, never>;
        Returns: {
          schemaname: string;
          tablename: string;
          bloat_ratio: number;
          wasted_bytes: number;
          recommendation: string;
        }[];
      };
      check_user_exists: {
        Args: { p_name: string };
        Returns: Json;
      };
      check_user_is_staff: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      check_user_liked_video: {
        Args: { p_video_id: string };
        Returns: boolean;
      };
      check_user_locations: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      check_user_membership: {
        Args: { user_uuid: string; location_uuid: string };
        Returns: {
          is_member: boolean;
          membership_id: string;
          status: string;
          joined_at: string;
        }[];
      };
      check_user_milestones: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      check_user_permissions: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      check_user_session_status: {
        Args: { p_email?: string };
        Returns: Json;
      };
      check_video_ownership: {
        Args: { video_id: string };
        Returns: {
          video_exists: boolean;
          belongs_to_current_user: boolean;
          video_user_id: string;
          current_user_id: string;
          current_auth_id: string;
        }[];
      };
      check_wolfpack_access: {
        Args: Record<PropertyKey, never> | { p_user_id: string };
        Returns: {
          can_bypass_geolocation: boolean;
          is_always_active: boolean;
          is_whitelisted: boolean;
        }[];
      };
      check_wolfpack_eligibility: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      check_wolfpack_location_access: {
        Args: { user_lat: number; user_lng: number };
        Returns: Json;
      };
      check_wolfpack_operating_hours: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      check_wolfpack_performance: {
        Args: Record<PropertyKey, never>;
        Returns: {
          check_name: string;
          status: string;
          value: string;
        }[];
      };
      clean_old_chat_messages: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      cleanup_cache: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      cleanup_expired_live_moments: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      cleanup_expired_typing_indicators: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      cleanup_invalid_device_tokens: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      cleanup_old_data: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      cleanup_old_messages: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      cleanup_old_profile_images: {
        Args: { p_user_id: string; p_keep_last_n?: number };
        Returns: Json;
      };
      cleanup_old_uploads: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      cleanup_rate_limits: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      close_customer_tab: {
        Args: {
          p_user_id: string;
          p_location_id: string;
          p_bartender_id: string;
        };
        Returns: Json;
      };
      close_dj_event: {
        Args: { p_event_id: string };
        Returns: Json;
      };
      close_old_wolfpack_tabs: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      complete_order: {
        Args: { p_order_id: string };
        Returns: undefined;
      };
      complete_order_delivery: {
        Args: { p_order_id: string };
        Returns: undefined;
      };
      complete_user_registration: {
        Args: { p_first_name?: string; p_last_name?: string; p_role?: string };
        Returns: Json;
      };
      create_announcement: {
        Args: {
          p_title: string;
          p_content: string;
          p_type?: string;
          p_priority?: string;
          p_featured_image?: string;
        };
        Returns: Json;
      };
      create_auth_account_for_user: {
        Args: { p_user_id: string; p_temporary_password: string };
        Returns: Json;
      };
      create_auth_accounts_for_existing_users: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      create_auth_for_user: {
        Args: { p_email: string; p_password: string };
        Returns: Json;
      };
      create_bartender_order: {
        Args: {
          p_customer_id: string;
          p_items: Json;
          p_total: number;
          p_order_type: string;
          p_table_location?: string;
          p_customer_notes?: string;
        };
        Returns: string;
      };
      create_broadcast_from_template: {
        Args: {
          p_template_id: string;
          p_dj_id: string;
          p_location_id: string;
          p_customizations?: Json;
        };
        Returns: string;
      };
      create_comment: {
        Args: { p_video_id: string; p_content: string; p_parent_id?: string };
        Returns: Json;
      };
      create_community_event: {
        Args:
          | {
            p_title: string;
            p_description: string;
            p_event_type: string;
            p_start_time: string;
            p_end_time: string;
            p_location: string;
            p_business_id?: string;
            p_pack_only?: boolean;
            p_target_pack_id?: string;
            p_max_attendees?: number;
          }
          | {
            p_title: string;
            p_description: string;
            p_start_time: string;
            p_end_time: string;
            p_location_id?: string;
            p_max_attendees?: number;
            p_is_pack_only?: boolean;
            p_pack_id?: string;
          };
        Returns: Json;
      };
      create_connection: {
        Args: {
          p_user_one_id: string;
          p_user_two_id: string;
          p_connection_type?: string;
        };
        Returns: undefined;
      };
      create_customer_order: {
        Args: {
          p_items: Json;
          p_order_type?: string;
          p_table_location?: string;
          p_notes?: string;
        };
        Returns: Json;
      };
      create_dj_broadcast: {
        Args: {
          p_title: string;
          p_message: string;
          p_broadcast_type?: string;
          p_subtitle?: string;
          p_background_color?: string;
          p_text_color?: string;
          p_accent_color?: string;
          p_animation_type?: string;
          p_emoji_burst?: string[];
          p_duration_seconds?: number;
          p_priority?: string;
        };
        Returns: string;
      };
      create_dj_contest_event: {
        Args: {
          p_dj_id: string;
          p_location_id: string;
          p_title: string;
          p_description: string;
          p_contestant_count: number;
          p_event_config?: Json;
        };
        Returns: string;
      };
      create_dj_event: {
        Args:
          | {
            p_dj_id: string;
            p_location_id: string;
            p_event_type: string;
            p_title: string;
            p_description?: string;
            p_voting_duration_minutes?: number;
            p_options?: Json;
          }
          | {
            p_event_type: string;
            p_title: string;
            p_description?: string;
            p_voting_duration_minutes?: number;
            p_location_id?: string;
          };
        Returns: Json;
      };
      create_group_conversation: {
        Args: {
          p_name: string;
          p_description?: string;
          p_user_ids?: string[];
          p_avatar_url?: string;
        };
        Returns: string;
      };
      create_image_record: {
        Args: {
          p_name: string;
          p_url: string;
          p_size?: number;
          p_type?: string;
          p_dimensions?: Json;
        };
        Returns: Json;
      };
      create_ingestion_job: {
        Args: { p_platform: string; p_url: string; p_user_id?: string };
        Returns: string;
      };
      create_live_contest: {
        Args: {
          p_dj_id: string;
          p_location_id: string;
          p_title: string;
          p_contestant_names: string[];
          p_contest_type?: string;
        };
        Returns: string;
      };
      create_menu_item_complete: {
        Args: {
          p_category_id: string;
          p_name: string;
          p_description: string;
          p_price: number;
          p_modifier_groups?: Json;
        };
        Returns: string;
      };
      create_monthly_partition_template: {
        Args: { p_parent_table: string; p_partition_column?: string };
        Returns: string;
      };
      create_notification: {
        Args: {
          p_recipient_id: string;
          p_message: string;
          p_type?: string;
          p_link?: string;
          p_metadata?: Json;
        };
        Returns: string;
      };
      create_pack: {
        Args: {
          p_name: string;
          p_description?: string;
          p_pack_type?: string;
          p_parent_pack_id?: string;
          p_location_id?: string;
          p_max_members?: number;
          p_visibility?: string;
        };
        Returns: Json;
      };
      create_pack_post: {
        Args:
          | {
            p_pack_id: string;
            p_content: string;
            p_post_type?: string;
            p_media_urls?: string[];
          }
          | {
            p_pack_id: string;
            p_content: string;
            p_post_type?: string;
            p_media_urls?: string[];
            p_business_id?: string;
            p_event_id?: string;
          };
        Returns: Json;
      };
      create_push_notification: {
        Args: {
          p_user_id: string;
          p_title: string;
          p_body: string;
          p_type?: string;
          p_data?: Json;
          p_priority?: string;
          p_device_token_id?: string;
          p_announcement_id?: string;
        };
        Returns: string;
      };
      create_test_notification: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      create_video_post: {
        Args: {
          p_video_url: string;
          p_caption?: string;
          p_tags?: string[];
          p_thumbnail_url?: string;
        };
        Returns: Json;
      };
      create_wolf_interaction: {
        Args: {
          p_receiver_id: string;
          p_interaction_type: string;
          p_message_content?: string;
          p_location_id?: string;
        };
        Returns: Json;
      };
      current_user_is_wolfpack_member: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      daily_broadcast_cleanup: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      daily_wolfpack_reset: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      debug_auth_context: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      debug_broadcast_insert: {
        Args: { p_broadcast_type: string };
        Returns: {
          input_type: string;
          normalized_type: string;
          is_valid: boolean;
          valid_types: string[];
        }[];
      };
      debug_my_auth_status: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      debug_storage_upload: {
        Args: { p_bucket_id: string; p_file_path: string };
        Returns: Json;
      };
      debug_user_auth_mapping: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      debug_video_upload: {
        Args: { p_user_id: string; p_file_size: number; p_mime_type: string };
        Returns: Json;
      };
      decrement_video_likes: {
        Args: { video_uuid: string };
        Returns: undefined;
      };
      delete_chat_message: {
        Args: { p_message_id: string };
        Returns: boolean;
      };
      delete_env_var: {
        Args: { p_key: string };
        Returns: Json;
      };
      delete_my_video: {
        Args: { video_id: string };
        Returns: Json;
      };
      delete_old_broadcasts: {
        Args: {
          days_to_keep_active?: number;
          days_to_keep_completed?: number;
          days_to_keep_expired?: number;
        };
        Returns: {
          deleted_active: number;
          deleted_completed: number;
          deleted_expired: number;
          deleted_messages: number;
        }[];
      };
      delete_user_video: {
        Args: { video_id_param: string };
        Returns: Json;
      };
      demo_complete_order_flow: {
        Args: { p_customer_id: string; p_location_id: string };
        Returns: Json;
      };
      demo_wolf_pack_complete_flow: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      diagnose_user_issues: {
        Args: { p_email: string };
        Returns: Json;
      };
      disable_rls_for_admin_work: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      discover_local_events: {
        Args: {
          p_location_id: string;
          p_radius_miles?: number;
          p_days_ahead?: number;
        };
        Returns: Json;
      };
      dismiss_friend_suggestion: {
        Args: { p_user_id: string; p_suggested_user_id: string };
        Returns: undefined;
      };
      dj_broadcast_message: {
        Args: { p_message: string; p_broadcast_type?: string };
        Returns: Json;
      };
      dj_create_dance_battle: {
        Args: { p_dancer1_id: string; p_dancer2_id: string };
        Returns: Json;
      };
      dj_create_song_vote: {
        Args: { p_songs: Json };
        Returns: Json;
      };
      dj_create_voting_event: {
        Args: {
          p_event_type: string;
          p_title: string;
          p_description: string;
          p_voting_duration_minutes: number;
          p_participants: string[];
        };
        Returns: Json;
      };
      edit_chat_message: {
        Args: { p_message_id: string; p_new_content: string };
        Returns: boolean;
      };
      enable_rls_after_admin_work: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      ensure_user_exists: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      ensure_user_in_public: {
        Args: { p_auth_user_id: string };
        Returns: undefined;
      };
      ensure_whitelisted_users_in_wolfpack: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      example_efficient_feed_usage: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      expire_old_wolfpack_sessions: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      fetch_notifications: {
        Args: { p_limit?: number; p_offset?: number; p_user_id?: string };
        Returns: {
          id: string;
          recipient_id: string;
          related_user_id: string;
          type: string;
          title: string;
          message: string;
          data: Json;
          read: boolean;
          created_at: string;
          related_user_name: string;
          related_user_avatar: string;
        }[];
      };
      find_nearby_locations: {
        Args: { user_lat: number; user_lng: number; radius_meters?: number };
        Returns: {
          id: string;
          name: string;
          distance_meters: number;
        }[];
      };
      find_nearby_wolfpack_sessions: {
        Args: { user_lat: number; user_lng: number; radius_meters?: number };
        Returns: {
          id: string;
          bar_location_id: string;
          bar_name: string;
          distance_meters: number;
          member_count: number;
          max_members: number;
          created_at: string;
          expires_at: string;
        }[];
      };
      find_nearest_location: {
        Args: {
          user_lat: number;
          user_lon: number;
          max_distance_meters?: number;
        };
        Returns: {
          location_id: string;
          location_name: string;
          distance_meters: number;
        }[];
      };
      find_or_create_direct_conversation: {
        Args: { other_user_id: string };
        Returns: string;
      };
      find_unindexed_foreign_keys: {
        Args: Record<PropertyKey, never>;
        Returns: {
          constraint_name: unknown;
          schema_name: unknown;
          table_name: unknown;
          column_name: unknown;
          foreign_schema: unknown;
          foreign_table: unknown;
          foreign_column: unknown;
        }[];
      };
      find_unused_indexes: {
        Args: Record<PropertyKey, never>;
        Returns: {
          schema_name: string;
          table_name: string;
          indexname: string;
          index_size: string;
          index_size_bytes: number;
          index_scan: number;
          tuples_read: number;
          tuples_fetched: number;
        }[];
      };
      fix_firebase_credentials: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      flag_chat_message: {
        Args: { p_message_id: string; p_reason?: string };
        Returns: boolean;
      };
      flag_content_for_review: {
        Args: {
          p_video_id: string;
          p_reporter_id: string;
          p_reason: string;
          p_details?: string;
        };
        Returns: Json;
      };
      format_location_hours: {
        Args: { location_hours: Json };
        Returns: string;
      };
      generate_ai_content_post: {
        Args: { p_city: string; p_content_type: string };
        Returns: string;
      };
      generate_ai_recommendations: {
        Args: { p_user_id: string; p_recommendation_type: string };
        Returns: Json;
      };
      generate_all_friend_suggestions: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      generate_friend_suggestions_for_user: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      generate_location_based_suggestions: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      generate_maintenance_report: {
        Args: Record<PropertyKey, never>;
        Returns: {
          report_section: string;
          metric_name: string;
          metric_value: string;
          recommendation: string;
        }[];
      };
      generate_optimization_report: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      generate_optimization_summary: {
        Args: Record<PropertyKey, never>;
        Returns: {
          metric_name: string;
          current_value: string;
          target_value: string;
          status: string;
          recommendation: string;
        }[];
      };
      generate_project_summary: {
        Args: Record<PropertyKey, never>;
        Returns: {
          section: string;
          metric: string;
          value: string;
          status: string;
        }[];
      };
      generate_storage_path: {
        Args: { p_user_id: string; p_file_type: string; p_filename: string };
        Returns: string;
      };
      generate_unique_filename: {
        Args: { original_filename: string; user_id: string };
        Returns: string;
      };
      generate_video_upload_path: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_active_menu_items: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          name: string;
          category: string;
          price: number;
          description: string;
          availability: boolean;
          image_url: string;
          sort_order: number;
        }[];
      };
      get_active_orders: {
        Args: Record<PropertyKey, never>;
        Returns: {
          order_id: string;
          order_number: number;
          customer_name: string;
          table_location: string;
          items: Json;
          total_amount: number;
          status: string;
          payment_status: string;
          time_waiting: unknown;
          order_type: string;
          customer_notes: string;
        }[];
      };
      get_active_pack_members: {
        Args: { p_location_id?: string };
        Returns: Json;
      };
      get_active_session: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          session_code: string;
          member_count: number;
          location_name: string;
        }[];
      };
      get_active_users: {
        Args: Record<PropertyKey, never>;
        Returns: {
          user_id: string;
          email: string;
          first_name: string;
          last_name: string;
          avatar_url: string;
          display_name: string;
          wolf_emoji: string;
          vibe_status: string;
          checked_in_at: string;
          table_number: number;
          mood: string;
        }[];
      };
      get_active_wolfpack_members: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      get_admin_dashboard_overview: {
        Args: Record<PropertyKey, never>;
        Returns: {
          total_users: number;
          users_today: number;
          users_this_week: number;
          approved_users: number;
          active_users: number;
          last_updated: string;
        }[];
      };
      get_admin_simple_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          total_users: number;
          current_wolf_pack: number;
          orders_today: number;
          active_events: number;
        }[];
      };
      get_all_users: {
        Args: Record<PropertyKey, never>;
        Returns: {
          allow_messages: boolean | null;
          artist_account: boolean | null;
          auth_id: string | null;
          avatar_id: string | null;
          avatar_url: string | null;
          bio: string | null;
          block_reason: string | null;
          blocked_at: string | null;
          blocked_by: string | null;
          business_account: boolean | null;
          card_on_file: boolean | null;
          city: string | null;
          created_at: string;
          custom_avatar_id: string | null;
          daily_customization: Json | null;
          deleted_at: string | null;
          display_name: string | null;
          email: string;
          email_normalized: string | null;
          favorite_bartender: string | null;
          favorite_drink: string | null;
          favorite_song: string | null;
          first_name: string | null;
          full_name_normalized: string | null;
          gender: string | null;
          has_open_tab: boolean | null;
          id: string;
          id_verification_method: string | null;
          id_verified: boolean | null;
          instagram_handle: string | null;
          is_approved: boolean | null;
          is_online: boolean | null;
          is_profile_visible: boolean | null;
          is_side_hustle: boolean | null;
          is_vip: boolean | null;
          is_wolfpack_member: boolean | null;
          last_activity: string | null;
          last_known_lat: number | null;
          last_known_lng: number | null;
          last_location_check: string | null;
          last_location_update: string | null;
          last_login: string | null;
          last_name: string | null;
          last_seen_at: string | null;
          leader_rank: string | null;
          location: string | null;
          location_accuracy: number | null;
          location_id: string | null;
          location_last_reported: string | null;
          location_permissions_granted: boolean | null;
          location_report_count: number | null;
          location_verification_date: string | null;
          location_verification_method: string | null;
          location_verification_status: string | null;
          location_verified: boolean | null;
          looking_for: string | null;
          loyalty_score: number | null;
          notes: string | null;
          notification_preferences: Json | null;
          occupation: string | null;
          pack_achievements: Json | null;
          pack_badges: Json | null;
          password_hash: string | null;
          permissions: Json | null;
          phone: string | null;
          phone_normalized: string | null;
          phone_number: string | null;
          phone_verified: boolean | null;
          preferred_pack_activities: string[] | null;
          privacy_settings: Json | null;
          profile_image_url: string | null;
          profile_last_seen_at: string | null;
          profile_pic_url: string | null;
          pronouns: string | null;
          role: string | null;
          sensitive_data_encrypted: Json | null;
          session_id: string | null;
          state: string | null;
          status: string | null;
          updated_at: string;
          username: string | null;
          verified: boolean | null;
          verified_at: string | null;
          verified_by: string | null;
          verified_region: string | null;
          vibe_status: string | null;
          website: string | null;
          wolf_emoji: string | null;
          wolfpack_availability_status: string | null;
          wolfpack_bio: string | null;
          wolfpack_interests: string[] | null;
          wolfpack_joined_at: string | null;
          wolfpack_skills: string[] | null;
          wolfpack_social_links: Json | null;
          wolfpack_status: string | null;
          wolfpack_tier: string | null;
        }[];
      };
      get_analytics_overview: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_announcements: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: Json;
      };
      get_anonymous_access_summary: {
        Args: Record<PropertyKey, never>;
        Returns: {
          resource_type: string;
          resource_name: string;
          access_level: string;
          purpose: string;
        }[];
      };
      get_app_env_vars: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_artist_recommendations: {
        Args: { p_user_id: string; p_limit?: number };
        Returns: {
          artist_id: string;
          stage_name: string;
          match_score: number;
          common_genres: string[];
          upcoming_events: number;
        }[];
      };
      get_auth_user_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_auth_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_available_contestants: {
        Args: { p_location_id?: string };
        Returns: {
          user_id: string;
          display_name: string;
          avatar_url: string;
          wolf_emoji: string;
          position_x: number;
          position_y: number;
        }[];
      };
      get_available_packs: {
        Args: { user_id: string };
        Returns: {
          pack_name: string;
          city: string;
          state: string;
          is_member: boolean;
        }[];
      };
      get_bartender_pending_requests: {
        Args: { p_bartender_id: string };
        Returns: {
          request_id: string;
          customer_name: string;
          customer_phone: string;
          request_notes: string;
          minutes_waiting: number;
          expires_in_minutes: number;
        }[];
      };
      get_bartender_stats: {
        Args: { bartender_uuid: string };
        Returns: Json;
      };
      get_basic_metrics: {
        Args: Record<PropertyKey, never>;
        Returns: {
          metric: string;
          value: number;
        }[];
      };
      get_blocked_users: {
        Args: Record<PropertyKey, never> | { user_id: string };
        Returns: Json;
      };
      get_broadcast_results: {
        Args: { p_broadcast_id: string };
        Returns: Json;
      };
      get_cached_data: {
        Args: { p_key: string; p_ttl_minutes?: number };
        Returns: Json;
      };
      get_chat_data: {
        Args: { p_current_user_id: string; p_other_user_id: string };
        Returns: Json;
      };
      get_chat_messages: {
        Args: { p_other_user_id: string; p_limit?: number };
        Returns: {
          message_id: string;
          message: string;
          image_url: string;
          is_from_me: boolean;
          created_at: string;
          is_read: boolean;
        }[];
      };
      get_cleanup_job_status: {
        Args: Record<PropertyKey, never>;
        Returns: {
          job_id: number;
          job_name: string;
          schedule: string;
          command: string;
          is_active: boolean;
        }[];
      };
      get_comment_reactions: {
        Args: { p_comment_id: string };
        Returns: {
          reaction_type: string;
          reaction_count: number;
          users: Json;
        }[];
      };
      get_comment_replies: {
        Args: {
          p_parent_comment_id: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          comment_id: string;
          video_id: string;
          user_id: string;
          content: string;
          created_at: string;
          parent_comment_id: string;
          like_count: number;
          is_pinned: boolean;
          is_edited: boolean;
          username: string;
          full_name: string;
          avatar_url: string;
          email: string;
          user_has_liked: boolean;
        }[];
      };
      get_comment_stats: {
        Args: { p_video_id: string };
        Returns: Json;
      };
      get_connection_stats: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_conversation: {
        Args: { p_user1_id: string; p_user2_id: string; p_limit?: number };
        Returns: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          message: string;
          image_url: string;
          is_read: boolean;
          created_at: string;
        }[];
      };
      get_conversation_messages: {
        Args:
          | {
            p_conversation_id: string;
            p_limit?: number;
            p_before_id?: string;
          }
          | {
            p_conversation_id: string;
            p_user_id: string;
            p_limit?: number;
            p_before_id?: string;
          };
        Returns: {
          message_id: string;
          sender_id: string;
          sender_name: string;
          sender_avatar: string;
          content: string;
          message_type: string;
          msg_created_at: string;
          msg_edited_at: string;
          is_deleted: boolean;
        }[];
      };
      get_conversation_safe: {
        Args: { conv_id: string };
        Returns: Json;
      };
      get_conversation_stats: {
        Args: { p_conversation_id: string };
        Returns: {
          total_messages: number;
          total_participants: number;
          active_participants: number;
          total_attachments: number;
          most_active_user_id: string;
          most_active_user_name: string;
          most_active_user_messages: number;
        }[];
      };
      get_cron_jobs: {
        Args: Record<PropertyKey, never>;
        Returns: {
          jobid: number;
          schedule: string;
          command: string;
          nodename: string;
          nodeport: number;
          database: string;
          username: string;
          active: boolean;
          jobname: string;
        }[];
      };
      get_cron_status: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_current_user_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_current_user_info: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_current_user_profile: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          role: string;
          permissions: Json;
          is_approved: boolean;
          is_admin: boolean;
          auth_id: string;
        }[];
      };
      get_database_health: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_device_tokens_admin: {
        Args: {
          p_limit?: number;
          p_offset?: number;
          p_filter_platform?: string;
          p_filter_active?: boolean;
        };
        Returns: Json;
      };
      get_dj_dashboard_analytics: {
        Args: { p_dj_id: string; p_timeframe?: string };
        Returns: Json;
      };
      get_dj_dashboard_overview: {
        Args: { p_dj_id: string };
        Returns: {
          active_broadcasts: number;
          active_events: number;
          total_participants: number;
          todays_interactions: number;
          current_crowd_size: number;
          energy_level: number;
          quick_actions: Json;
          recent_activity: Json;
        }[];
      };
      get_dj_event_stats: {
        Args: { p_event_id: string };
        Returns: {
          total_contestants: number;
          active_contestants: number;
          eliminated_contestants: number;
          total_votes: number;
          current_round_number: number;
          current_round_name: string;
        }[];
      };
      get_dm_conversation_id: {
        Args: { user1: string; user2: string };
        Returns: string;
      };
      get_env_var: {
        Args: { p_key: string };
        Returns: string;
      };
      get_env_vars_by_category: {
        Args: { p_category: string };
        Returns: Json;
      };
      get_event_leaderboard: {
        Args: { p_event_id?: string };
        Returns: {
          event_id: string;
          event_title: string;
          event_type: string;
          participant_id: string;
          participant_name: string;
          vote_count: number;
          rank: number;
        }[];
      };
      get_event_results: {
        Args: { p_event_id: string };
        Returns: Json;
      };
      get_events_for_posting: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          title: string;
          enhanced_description: string;
          category: string;
          start_time: string;
          pack_relevance_score: number;
        }[];
      };
      get_firebase_config: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_firebase_credentials: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_friend_suggestions: {
        Args: { p_user_id: string; p_limit?: number };
        Returns: {
          suggested_user_id: string;
          username: string;
          display_name: string;
          avatar_url: string;
          bio: string;
          location: string;
          common_interests: string[];
          score: number;
          suggestion_type: string;
        }[];
      };
      get_hot_events_at_bar: {
        Args: { p_location_id: string; p_limit?: number };
        Returns: {
          event_id: string;
          event_name: string;
          start_time: string;
          venue_name: string;
          event_type: string;
          buzz_score: number;
          rsvp_count: number;
          ai_vibe_score: number;
          ai_summary: string;
          ticket_url: string;
        }[];
      };
      get_image_url: {
        Args: { image_id: string };
        Returns: string;
      };
      get_index_recommendations: {
        Args: Record<PropertyKey, never>;
        Returns: {
          recommendation: string;
          index_name: string;
          table_name: string;
          reason: string;
        }[];
      };
      get_index_usage_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          schema_name: string;
          table_name: string;
          index_name: string;
          index_scans: number;
          tuples_read: number;
          tuples_fetched: number;
          index_size: string;
          usage_category: string;
        }[];
      };
      get_item_modifiers: {
        Args: { p_item_id: string };
        Returns: {
          group_name: string;
          modifier_type: string;
          is_required: boolean;
          min_selections: number;
          max_selections: number;
          modifiers: Json;
        }[];
      };
      get_kitchen_display_orders: {
        Args: Record<PropertyKey, never>;
        Returns: {
          order_id: string;
          order_number: number;
          customer_name: string;
          table_location: string;
          order_status: string;
          kitchen_status: string;
          wait_time_minutes: number;
          customer_notes: string;
          priority: number;
        }[];
      };
      get_like_stats: {
        Args: { p_video_id: string };
        Returns: Json;
      };
      get_live_moments_feed: {
        Args: { p_user_id?: string; p_location_id?: string; p_limit?: number };
        Returns: Json;
      };
      get_live_pack_counts: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_location_directions: {
        Args: { p_location_id: string };
        Returns: Json;
      };
      get_location_djs: {
        Args: { p_location_id: string };
        Returns: {
          dj_id: string;
          dj_name: string;
          dj_email: string;
          is_primary: boolean;
          is_online: boolean;
          city: string;
        }[];
      };
      get_location_id: {
        Args: { location_name: string };
        Returns: string;
      };
      get_menu_items_modifier_summary: {
        Args: Record<PropertyKey, never>;
        Returns: {
          item_name: string;
          category: string;
          display_order: number;
          required_modifiers: string[];
          description: string;
        }[];
      };
      get_menu_items_with_modifier_groups: {
        Args: Record<PropertyKey, never>;
        Returns: {
          item_id: string;
          item_name: string;
          description: string;
          price: number;
          is_available: boolean;
          category: string;
          category_order: number;
          modifier_groups: Json;
        }[];
      };
      get_menu_items_with_modifiers: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          name: string;
          description: string;
          price: string;
          is_available: boolean;
          category_id: string;
          category_name: string;
          menu_type: string;
          category_icon: string;
          modifiers: Json;
        }[];
      };
      get_menu_items_with_videos: {
        Args: Record<PropertyKey, never>;
        Returns: {
          menu_item_id: string;
          menu_item_name: string;
          description: string;
          price: number;
          video_url: string;
          has_video: boolean;
          category_name: string;
        }[];
      };
      get_menu_with_images: {
        Args: Record<PropertyKey, never>;
        Returns: {
          item_id: string;
          item_name: string;
          item_description: string;
          item_price: number;
          item_display_order: number;
          item_is_available: boolean;
          category_id: string;
          category_name: string;
          category_type: string;
          category_display_order: number;
          image_url: string;
        }[];
      };
      get_message_statistics: {
        Args: Record<PropertyKey, never>;
        Returns: {
          msg_type: string;
          total_messages: number;
          active_messages: number;
          deleted_messages: number;
          oldest_active_message: string;
          newest_message: string;
          messages_to_be_deleted: number;
        }[];
      };
      get_messageable_users: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_moderation_queue: {
        Args: { p_status?: string; p_limit?: number };
        Returns: {
          video_id: string;
          user_id: string;
          username: string;
          video_url: string;
          thumbnail_url: string;
          caption: string;
          flag_reason: string;
          flag_count: number;
          created_at: string;
          flagged_at: string;
        }[];
      };
      get_my_conversations: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_my_event_recommendations: {
        Args: { p_user_id: string; p_limit?: number };
        Returns: {
          event_id: string;
          event_name: string;
          start_time: string;
          venue_name: string;
          event_type: string;
          recommendation_score: number;
          reason: string;
          ai_summary: string;
          ticket_url: string;
          is_free: boolean;
          min_price: number;
        }[];
      };
      get_my_public_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_my_tab_orders: {
        Args: { p_user_id: string };
        Returns: {
          order_id: string;
          item_name: string;
          quantity: number;
          price: number;
          total: number;
          status: string;
          created_at: string;
        }[];
      };
      get_my_wolf_pack_status: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_notification_analytics: {
        Args: { p_days?: number };
        Returns: Json;
      };
      get_optimization_recommendations: {
        Args: Record<PropertyKey, never>;
        Returns: {
          priority: string;
          category: string;
          recommendation: string;
          impact: string;
          effort: string;
        }[];
      };
      get_or_create_conversation: {
        Args: { p_user1_id: string; p_user2_id: string };
        Returns: string;
      };
      get_or_create_dm_conversation: {
        Args: { p_user1_id: string; p_user2_id: string };
        Returns: {
          id: string;
          user1_id: string;
          user2_id: string;
          created_at: string;
          last_message_at: string;
          last_message_preview: string;
          updated_at: string;
          is_archived: boolean;
          archived_at: string;
          last_read_user1: string;
          last_read_user2: string;
          unread_count_user1: number;
          unread_count_user2: number;
        }[];
      };
      get_or_create_wolfpack_session: {
        Args: { p_user_id: string; p_location_id: string };
        Returns: Json;
      };
      get_orders: {
        Args: { status_filter?: string };
        Returns: {
          id: string;
          customer_id: string;
          bartender_id: string;
          status: string;
          total_amount: number;
          items: Json;
          notes: string;
          created_at: string;
          updated_at: string;
          completed_at: string;
        }[];
      };
      get_pack_health_metrics: {
        Args: { p_pack_id: string; p_days?: number };
        Returns: Json;
      };
      get_pack_role: {
        Args: { pack_id_param: string; user_id_param?: string };
        Returns: string;
      };
      get_pending_ingestion_jobs: {
        Args: { p_limit?: number };
        Returns: {
          id: string;
          platform: string;
          source_url: string;
          created_by: string;
          created_at: string;
        }[];
      };
      get_pending_orders: {
        Args: { p_location_id?: string };
        Returns: {
          order_id: string;
          user_id: string;
          customer_name: string;
          item_name: string;
          quantity: number;
          special_instructions: string;
          total_amount: number;
          created_at: string;
          wait_time_seconds: number;
        }[];
      };
      get_performance_metrics: {
        Args: Record<PropertyKey, never>;
        Returns: {
          metric_name: string;
          metric_value: string;
          metric_category: string;
        }[];
      };
      get_post_or_video: {
        Args: { content_id: string };
        Returns: {
          id: string;
          user_id: string;
          video_url: string;
          thumbnail_url: string;
          caption: string;
          likes_count: number;
          comments_count: number;
          views_count: number;
          created_at: string;
        }[];
      };
      get_private_chats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          other_user_id: string;
          display_name: string;
          wolf_emoji: string;
          last_message: string;
          last_message_time: string;
          is_from_me: boolean;
          unread_count: number;
        }[];
      };
      get_private_conversation: {
        Args: { p_user_id: string; p_other_user_id: string; p_limit?: number };
        Returns: {
          message_id: string;
          from_user_id: string;
          from_user_name: string;
          from_user_emoji: string;
          is_from_me: boolean;
          message: string;
          image_url: string;
          created_at: string;
          is_read: boolean;
        }[];
      };
      get_profile_image_upload_path: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_project_health_report: {
        Args: Record<PropertyKey, never>;
        Returns: {
          metric_name: string;
          metric_value: string;
          status: string;
          details: string;
        }[];
      };
      get_public_user_id: {
        Args: { auth_user_id: string };
        Returns: string;
      };
      get_push_notification_audience_count: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_push_notification_stats: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_recent_conversations: {
        Args: { p_user_id: string; p_limit?: number };
        Returns: {
          other_user_id: string;
          other_user_display_name: string;
          other_user_wolf_emoji: string;
          other_user_profile_image_url: string;
          last_message: string;
          last_message_time: string;
          unread_count: number;
          is_blocked: boolean;
        }[];
      };
      get_role_details: {
        Args: { p_role: string };
        Returns: Json;
      };
      get_role_permissions: {
        Args: { p_role: string };
        Returns: Json;
      };
      get_salem_wolfpack_members: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          display_name: string;
          wolf_emoji: string;
          avatar_url: string;
          is_online: boolean;
          last_activity: string;
          role: string;
        }[];
      };
      get_secure_credential: {
        Args: { p_name: string };
        Returns: string;
      };
      get_security_health_summary: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_security_improvements_summary: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_security_summary: {
        Args: Record<PropertyKey, never>;
        Returns: {
          table_schema: string;
          table_name: string;
          rls_enabled: boolean;
          policy_count: number;
        }[];
      };
      get_session_id_by_code: {
        Args: { session_code_param: string };
        Returns: string;
      };
      get_setup_checklist: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_slow_queries: {
        Args: { threshold_ms?: number };
        Returns: {
          query: string;
          calls: number;
          total_time: number;
          mean_time: number;
          max_time: number;
          cache_hit_ratio: number;
        }[];
      };
      get_slow_query_summary: {
        Args: { p_hours?: number };
        Returns: {
          query_fingerprint: string;
          occurrences: number;
          avg_time_ms: number;
          max_time_ms: number;
          min_time_ms: number;
          total_time_ms: number;
          avg_rows: number;
        }[];
      };
      get_spatial_reference: {
        Args: { p_srid: number };
        Returns: {
          srid: number;
          auth_name: string;
          auth_srid: number;
          srtext: string;
        }[];
      };
      get_srid_info: {
        Args: { p_srid: number };
        Returns: {
          srid: number;
          auth_name: string;
          auth_srid: number;
          srtext: string;
          proj4text: string;
        }[];
      };
      get_storage_public_url: {
        Args: { bucket_name: string; file_path: string };
        Returns: string;
      };
      get_system_config: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_system_health_summary: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_tab_total: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      get_table_health_metrics: {
        Args: Record<PropertyKey, never>;
        Returns: {
          schema_name: string;
          table_name: string;
          total_size: string;
          live_rows: number;
          dead_rows: number;
          dead_percent: number;
          last_vacuum: string;
          last_autovacuum: string;
          health_status: string;
        }[];
      };
      get_table_performance_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          schemaname: string;
          tablename: string;
          seq_scan: number;
          seq_tup_read: number;
          idx_scan: number;
          idx_tup_fetch: number;
          index_hit_ratio: number;
        }[];
      };
      get_trending_content: {
        Args: {
          p_user_id?: string;
          p_location?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          id: string;
          user_id: string;
          username: string;
          display_name: string;
          avatar_url: string;
          video_url: string;
          thumbnail_url: string;
          caption: string;
          hashtags: string[];
          location_tag: string;
          post_type: string;
          view_count: number;
          like_count: number;
          comment_count: number;
          share_count: number;
          trending_score: number;
          created_at: string;
          user_has_liked: boolean;
        }[];
      };
      get_trending_hashtags: {
        Args: { p_days?: number; p_limit?: number };
        Returns: {
          hashtag_id: string;
          tag: string;
          usage_count: number;
          recent_post_count: number;
          sample_posts: Json;
        }[];
      };
      get_trending_venues: {
        Args: { p_limit?: number };
        Returns: {
          venue_id: string;
          venue_name: string;
          activity_score: number;
          avg_crowd_level: number;
          checkin_count: number;
          pulse_update_count: number;
        }[];
      };
      get_unread_count: {
        Args:
          | { p_conversation_type: string; p_conversation_id: string }
          | { p_user_id: string };
        Returns: number;
      };
      get_unread_counts: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_unread_message_count: {
        Args: { p_user_id: string };
        Returns: number;
      };
      get_user_conversations: {
        Args: { input_user_id: string };
        Returns: Json;
      };
      get_user_dashboard: {
        Args: Record<PropertyKey, never>;
        Returns: {
          unread_messages: number;
          total_connections: number;
          active_users_count: number;
          recent_announcements: Json;
        }[];
      };
      get_user_drafts: {
        Args: { p_user_id?: string };
        Returns: {
          upload_id: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          duration_seconds: number;
          thumbnail_path: string;
          status: string;
          error_message: string;
          created_at: string;
        }[];
      };
      get_user_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_id_from_auth: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_image_history: {
        Args: { p_user_id: string; p_image_type?: string };
        Returns: Json;
      };
      get_user_interactions: {
        Args: { user_uuid: string; interaction_types?: string[] };
        Returns: {
          id: string;
          other_user_id: string;
          interaction_type: string;
          is_sender: boolean;
          message_content: string;
          status: string;
          read_at: string;
          created_at: string;
        }[];
      };
      get_user_liked_videos: {
        Args: { target_user_id?: string };
        Returns: {
          video_id: string;
          liked_at: string;
        }[];
      };
      get_user_location: {
        Args: Record<PropertyKey, never> | { user_id: string };
        Returns: string;
      };
      get_user_pack_status: {
        Args: { user_uuid: string };
        Returns: Json;
      };
      get_user_profile: {
        Args: { p_user_id: string };
        Returns: {
          user_id: string;
          display_name: string;
          wolf_emoji: string;
          bio: string;
          favorite_drink: string;
          vibe_status: string;
          instagram_handle: string;
          favorite_song: string;
          looking_for: string;
          is_here_now: boolean;
          last_seen: string;
          total_howls: number;
          member_since: string;
        }[];
      };
      get_user_profile_cached: {
        Args: { user_id_param: string };
        Returns: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          display_name: string;
          avatar_url: string;
          role: string;
          wolfpack_status: string;
          wolfpack_tier: string;
          is_online: boolean;
          last_activity: string;
          location_verified: boolean;
          verified_region: string;
          follower_count: number;
          following_count: number;
        }[];
      };
      get_user_role: {
        Args: Record<PropertyKey, never> | { user_id: string };
        Returns: string;
      };
      get_user_social_stats: {
        Args: { user_uuid: string };
        Returns: Json;
      };
      get_user_storage_path: {
        Args: { user_id: string; filename: string };
        Returns: string;
      };
      get_user_storage_usage: {
        Args: { user_id: string };
        Returns: {
          total_size_bytes: number;
          image_count: number;
          size_formatted: string;
        }[];
      };
      get_users_at_bar: {
        Args: Record<PropertyKey, never>;
        Returns: {
          user_id: string;
          display_name: string;
          wolf_emoji: string;
          table_number: number;
          mood: string;
          checked_in_at: string;
          minutes_here: number;
        }[];
      };
      get_users_for_notification: {
        Args: { p_notification_type: string; p_user_ids?: string[] };
        Returns: {
          user_id: string;
          auth_id: string;
          email: string;
          display_name: string;
          notification_enabled: boolean;
        }[];
      };
      get_users_needing_auth: {
        Args: Record<PropertyKey, never>;
        Returns: {
          user_id: string;
          email: string;
          first_name: string;
          last_name: string;
          role: string;
          needs_auth_account: boolean;
        }[];
      };
      get_valid_roles: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_venue_crowd_level: {
        Args: { venue_id_param: string };
        Returns: {
          avg_crowd_level: number;
          recent_reports: number;
          last_update: string;
        }[];
      };
      get_venue_pulse_summary: {
        Args: { p_location_id: string; p_hours_back?: number };
        Returns: Json;
      };
      get_video_comment_count: {
        Args: { p_video_id: string };
        Returns: number;
      };
      get_video_comment_stats: {
        Args: { p_video_id: string };
        Returns: {
          total_comments: number;
          total_reactions: number;
          unique_commenters: number;
        }[];
      };
      get_video_comments: {
        Args: { p_video_id: string; p_limit?: number; p_offset?: number };
        Returns: {
          comment_id: string;
          video_id: string;
          user_id: string;
          content: string;
          created_at: string;
          parent_comment_id: string;
          like_count: number;
          is_pinned: boolean;
          is_edited: boolean;
          username: string;
          full_name: string;
          avatar_url: string;
          email: string;
          user_has_liked: boolean;
          reply_count: number;
        }[];
      };
      get_video_comments_with_reactions: {
        Args: { p_video_id: string; p_limit?: number; p_offset?: number };
        Returns: {
          comment_id: string;
          video_id: string;
          user_id: string;
          content: string;
          created_at: string;
          parent_comment_id: string;
          like_count: number;
          is_pinned: boolean;
          is_edited: boolean;
          username: string;
          full_name: string;
          avatar_url: string;
          email: string;
          user_has_liked: boolean;
          reply_count: number;
          reactions: Json;
        }[];
      };
      get_video_feed: {
        Args: { p_user_id: string; p_limit: number; p_offset: number };
        Returns: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          video_url: string;
          thumbnail_url: string;
          duration: number;
          view_count: number;
          like_count: number;
          comment_count: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          tags: string[];
          category: string;
          is_featured: boolean;
          music_info: Json;
          location_info: Json;
        }[];
      };
      get_video_share_analytics: {
        Args: { p_video_id: string };
        Returns: {
          total_shares: number;
          link_shares: number;
          social_shares: number;
          platforms: Json;
        }[];
      };
      get_video_stats: {
        Args: { video_uuid: string };
        Returns: Json;
      };
      get_video_stats_public: {
        Args: { p_video_id: string };
        Returns: Json;
      };
      get_video_upload_path: {
        Args: { p_user_id: string };
        Returns: string;
      };
      get_video_with_status: {
        Args: { p_video_id: string; p_user_id: string };
        Returns: Json;
      };
      get_vip_status: {
        Args: { p_email?: string };
        Returns: {
          email: string;
          name: string;
          role: string;
          vip_level: string;
          is_active: boolean;
          can_broadcast: boolean;
          has_auth: boolean;
        }[];
      };
      get_wolf_pack_at_location: {
        Args: { p_location_id: string };
        Returns: {
          member_id: string;
          user_id: string;
          display_name: string;
          wolf_emoji: string;
          vibe_status: string;
          table_location: string;
          joined_at: string;
          last_activity: string;
        }[];
      };
      get_wolfpack_access_status: {
        Args: { p_user_id?: string };
        Returns: Json;
      };
      get_wolfpack_chat_messages: {
        Args: { p_session_id: string; p_limit?: number; p_offset?: number };
        Returns: Json;
      };
      get_wolfpack_dashboard: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_wolfpack_feed: {
        Args:
          | Record<PropertyKey, never>
          | {
            user_auth_id: string;
            limit_count?: number;
            offset_count?: number;
          };
        Returns: {
          id: string;
          user_id: string;
          content: string;
          media_url: string;
          media_type: string;
          visibility: string;
          location: string;
          created_at: string;
          updated_at: string;
          likes_count: number;
          comments_count: number;
          shares_count: number;
          views_count: number;
          is_featured: boolean;
          hashtags: string[];
          mentions: string[];
          username: string;
          first_name: string;
          last_name: string;
          avatar_url: string;
          wolf_emoji: string;
          verified: boolean;
        }[];
      };
      get_wolfpack_feed_basic: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          user_id: string;
          content: string;
          media_url: string;
          created_at: string;
          username: string;
          avatar_url: string;
        }[];
      };
      get_wolfpack_feed_cached: {
        Args: { limit_count: number; offset_count: number };
        Returns: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          video_url: string;
          like_count: number;
          comment_count: number;
          created_at: string;
        }[];
      };
      get_wolfpack_feed_cursor: {
        Args: {
          p_user_id?: string;
          p_limit?: number;
          p_cursor?: string;
          p_cursor_id?: string;
          p_following_only?: boolean;
        };
        Returns: {
          id: string;
          user_id: string;
          content: string;
          media_url: string;
          media_type: string;
          video_url: string;
          thumbnail_url: string;
          duration: number;
          view_count: number;
          like_count: number;
          comments_count: number;
          shares_count: number;
          hashtags: string[];
          created_at: string;
          username: string;
          display_name: string;
          first_name: string;
          last_name: string;
          avatar_url: string;
          profile_image_url: string;
          wolf_emoji: string;
          verified: boolean;
          user_liked: boolean;
          user_following: boolean;
          next_cursor: string;
          next_cursor_id: string;
        }[];
      };
      get_wolfpack_feed_from_cache: {
        Args: { p_user_id: string; p_limit?: number; p_offset?: number };
        Returns: {
          id: string;
          user_id: string;
          content: string;
          media_url: string;
          media_type: string;
          video_url: string;
          created_at: string;
          username: string;
          first_name: string;
          last_name: string;
          avatar_url: string;
          wolf_emoji: string;
          verified: boolean;
          likes_count: number;
          comments_count: number;
          shares_count: number;
          views_count: number;
        }[];
      };
      get_wolfpack_feed_integrated: {
        Args: {
          p_user_id?: string;
          p_limit?: number;
          p_offset?: number;
          p_following_only?: boolean;
          p_location_filter?: string;
        };
        Returns: {
          id: string;
          user_id: string;
          content: string;
          media_url: string;
          media_type: string;
          visibility: string;
          location: string;
          created_at: string;
          updated_at: string;
          likes_count: number;
          comments_count: number;
          shares_count: number;
          views_count: number;
          is_featured: boolean;
          hashtags: string[];
          mentions: string[];
          username: string;
          first_name: string;
          last_name: string;
          avatar_url: string;
          wolf_emoji: string;
          verified: boolean;
          is_liked: boolean;
          is_saved: boolean;
          user_liked: boolean;
          user_saved: boolean;
        }[];
      };
      get_wolfpack_feed_lite: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_wolfpack_feed_optimized: {
        Args: {
          user_auth_id: string;
          limit_count?: number;
          offset_count?: number;
        };
        Returns: {
          id: string;
          user_id: string;
          content: string;
          media_url: string;
          media_type: string;
          visibility: string;
          location_tag: string;
          created_at: string;
          updated_at: string;
          likes_count: number;
          comments_count: number;
          shares_count: number;
          views_count: number;
          is_featured: boolean;
          hashtags: string[];
          username: string;
          first_name: string;
          last_name: string;
          avatar_url: string;
          wolf_emoji: string;
          verified: boolean;
          user_has_liked: boolean;
        }[];
      };
      get_wolfpack_feed_public: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: {
          id: string;
          user_id: string;
          caption: string;
          video_url: string;
          thumbnail_url: string;
          visibility: string;
          created_at: string;
          updated_at: string;
          likes_count: number;
          comments_count: number;
          views_count: number;
          is_featured: boolean;
          hashtags: string[];
          username: string;
          display_name: string;
          first_name: string;
          last_name: string;
          avatar_url: string;
          wolf_emoji: string;
          verified: boolean;
          is_wolfpack_member: boolean;
          content: string;
          media_url: string;
          media_type: string;
          shares_count: number;
          location: string;
        }[];
      };
      get_wolfpack_feed_simple: {
        Args: { limit_count?: number; offset_count?: number };
        Returns: {
          id: string;
          user_id: string;
          content: string;
          media_url: string;
          media_type: string;
          visibility: string;
          location: string;
          created_at: string;
          updated_at: string;
          likes_count: number;
          comments_count: number;
          shares_count: number;
          views_count: number;
          is_featured: boolean;
          hashtags: string[];
          mentions: string[];
          username: string;
          first_name: string;
          last_name: string;
          avatar_url: string;
          wolf_emoji: string;
          verified: boolean;
        }[];
      };
      get_wolfpack_feed_v2: {
        Args: { limit_count?: number; offset_count?: number };
        Returns: {
          id: string;
          user_id: string;
          caption: string;
          video_url: string;
          thumbnail_url: string;
          visibility: string;
          created_at: string;
          updated_at: string;
          likes_count: number;
          comments_count: number;
          views_count: number;
          is_featured: boolean;
          hashtags: string[];
          username: string;
          first_name: string;
          last_name: string;
          avatar_url: string;
          wolf_emoji: string;
          verified: boolean;
          is_wolfpack_member: boolean;
        }[];
      };
      get_wolfpack_feed_with_details: {
        Args: {
          p_user_id?: string;
          p_feed_type?: string;
          p_location?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          post_id: string;
          user_id: string;
          username: string;
          display_name: string;
          avatar_url: string;
          verified: boolean;
          is_vip: boolean;
          video_url: string;
          thumbnail_url: string;
          caption: string;
          visibility: string;
          views_count: number;
          likes_count: number;
          comments_count: number;
          shares_count: number;
          created_at: string;
          location_name: string;
          user_has_liked: boolean;
          user_has_saved: boolean;
          is_following: boolean;
          latest_comments: Json;
          liked_by_friends: Json;
          engagement_score: number;
          trending_score: number;
          post_type: string;
          duration: number;
          hashtags: string[];
        }[];
      };
      get_wolfpack_live_stats: {
        Args: { p_location_id: string };
        Returns: Json;
      };
      get_wolfpack_members: {
        Args: { p_session_id?: string };
        Returns: {
          id: string;
          display_name: string;
          wolf_emoji: string;
          avatar_url: string;
          profile_pic_url: string;
          is_online: boolean;
          last_activity: string;
          bio: string;
          vibe_status: string;
          favorite_drink: string;
          favorite_song: string;
          instagram_handle: string;
          looking_for: string;
          is_permanent_pack_member: boolean;
          wolfpack_tier: string;
        }[];
      };
      get_wolfpack_members_at_location: {
        Args: { p_location_id: string };
        Returns: Json;
      };
      get_wolfpack_members_by_location: {
        Args: { p_location_id?: string };
        Returns: {
          id: string;
          display_name: string;
          wolf_emoji: string;
          avatar_url: string;
          is_online: boolean;
          last_activity: string;
          location_id: string;
          location_name: string;
          role: string;
          is_permanent_pack_member: boolean;
        }[];
      };
      get_wolfpack_members_with_profiles: {
        Args: { location_uuid?: string };
        Returns: {
          id: string;
          user_id: string;
          location_id: string;
          status: string;
          display_name: string;
          emoji: string;
          current_vibe: string;
          favorite_drink: string;
          looking_for: string;
          instagram_handle: string;
          joined_at: string;
          last_active: string;
          is_active: boolean;
          user_email: string;
          user_first_name: string;
          user_last_name: string;
          user_avatar_url: string;
          wolf_profile_id: string;
          wolf_bio: string;
          wolf_profile_pic_url: string;
          wolf_is_visible: boolean;
        }[];
      };
      get_wolfpack_metrics: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_content_posts_comments: {
        Args: { p_post_ids: string[]; p_limit_per_post?: number };
        Returns: {
          post_id: string;
          comments: Json;
        }[];
      };
      get_content_posts_interactions: {
        Args: { p_user_id: string; p_post_ids: string[] };
        Returns: {
          post_id: string;
          user_has_liked: boolean;
          user_has_saved: boolean;
          total_likes: number;
          total_comments: number;
          is_following_author: boolean;
        }[];
      };
      get_wolfpack_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          total_packs: number;
          total_members: number;
          active_packs: number;
          total_messages: number;
          total_posts: number;
          avg_members_per_pack: number;
          most_active_pack: Json;
          stats_updated_at: string;
        }[];
      };
      get_wolfpack_status: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      give_pack_love: {
        Args:
          | {
            p_receiver_membership_id: string;
            p_love_type: string;
            p_message?: string;
            p_pack_id?: string;
            p_is_anonymous?: boolean;
            p_points?: number;
          }
          | {
            p_receiver_membership_id: string;
            p_love_type: string;
            p_points?: number;
            p_message?: string;
            p_is_anonymous?: boolean;
          };
        Returns: Json;
      };
      grant_permanent_pack_member_status: {
        Args: { p_user_email: string; p_admin_notes?: string };
        Returns: Json;
      };
      handle_image_upload: {
        Args: {
          p_user_id: string;
          p_file_name: string;
          p_file_size: number;
          p_mime_type: string;
          p_image_type: string;
        };
        Returns: string;
      };
      handle_order_request: {
        Args: { p_request_id: string; p_action: string; p_response?: string };
        Returns: Json;
      };
      handle_user_logout: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      handle_venue_checkin: {
        Args: { p_location_id: string };
        Returns: Json;
      };
      handle_venue_checkout: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      has_role_permission: {
        Args: { required_roles: string[] };
        Returns: boolean;
      };
      hello_rpc: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      identify_policy_consolidation_targets: {
        Args: Record<PropertyKey, never>;
        Returns: {
          table_name: string;
          role_name: string;
          action_type: string;
          policy_count: number;
          policy_names: string[];
        }[];
      };
      increment_event_participants: {
        Args: { event_id: string };
        Returns: undefined;
      };
      increment_moment_view_count: {
        Args: { p_moment_id: string };
        Returns: boolean;
      };
      increment_video_likes: {
        Args: { video_id_param: string };
        Returns: Json;
      };
      init_user_app: {
        Args: { p_platform: string; p_app_version: string };
        Returns: Json;
      };
      is_admin: {
        Args: Record<PropertyKey, never> | { user_auth_id: string };
        Returns: boolean;
      };
      is_admin_by_email: {
        Args: { p_email?: string };
        Returns: boolean;
      };
      is_admin_cached: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_admin_or_staff: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_authenticated: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_authenticated_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_bartender_cached: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_checked_in_at_venue: {
        Args: { venue_id_param?: string };
        Returns: boolean;
      };
      is_conversation_participant: {
        Args: { conv_id: string };
        Returns: boolean;
      };
      is_current_user_dj: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_current_user_dj_or_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_current_user_staff: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_dj: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_dj_cached: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_duplicate_event: {
        Args:
          | {
            p_source_name: string;
            p_source_event_id: string;
            p_title: string;
            p_start_time: string;
          }
          | { p_title: string; p_start_time: string; p_venue_name: string };
        Returns: boolean;
      };
      is_feature_enabled: {
        Args:
          | { p_flag_name: string }
          | { p_flag_name: string; p_user_id?: string };
        Returns: boolean;
      };
      is_in_wolf_pack: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_in_wolf_pack_at_location: {
        Args: { p_location_id: string };
        Returns: boolean;
      };
      is_location_open: {
        Args: { location_hours: Json; location_timezone?: string };
        Returns: boolean;
      };
      is_pack_member: {
        Args: { pack_id_param: string; user_id_param?: string };
        Returns: boolean;
      };
      is_super_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_system_owner: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_user_blocked: {
        Args: { blocker_id: string; blocked_id: string };
        Returns: boolean;
      };
      is_user_in_wolf_pack: {
        Args: { user_id: string; location_id: string };
        Returns: boolean;
      };
      is_user_within_location: {
        Args: { user_lat: number; user_lng: number; location_id: string };
        Returns: boolean;
      };
      is_valid_role: {
        Args: { p_role: string };
        Returns: boolean;
      };
      is_valid_user_id: {
        Args: { input_id: string };
        Returns: boolean;
      };
      is_verified_artist: {
        Args: { artist_id_param?: string };
        Returns: boolean;
      };
      is_vip_user: {
        Args: { p_user_id?: string };
        Returns: boolean;
      };
      is_voting_allowed: {
        Args: { event_uuid: string };
        Returns: boolean;
      };
      is_within_location_radius: {
        Args: { user_lat: number; user_lon: number; location_id: string };
        Returns: boolean;
      };
      is_within_service_area: {
        Args: { lat: number; lng: number };
        Returns: boolean;
      };
      is_wolf_pack_available: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_wolfpack_member: {
        Args: Record<PropertyKey, never> | { check_user_id: string };
        Returns: boolean;
      };
      is_wolfpack_open: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      join_pack: {
        Args:
          | { p_pack_id: string }
          | { p_pack_id: string; p_invitation_code?: string };
        Returns: Json;
      };
      join_wolf_pack: {
        Args:
          | {
            p_user_id: string;
            p_location_id: string;
            p_latitude: number;
            p_longitude: number;
            p_table_location?: string;
          }
          | {
            p_user_lat: number;
            p_user_lon: number;
            p_table_location?: string;
          };
        Returns: string;
      };
      join_wolfpack: {
        Args:
          | {
            p_location_id: string;
            p_latitude?: number;
            p_longitude?: number;
            p_table_location?: string;
          }
          | {
            user_uuid: string;
            location_uuid: string;
            display_name_param?: string;
            emoji_param?: string;
            current_vibe_param?: string;
            favorite_drink_param?: string;
            looking_for_param?: string;
            instagram_handle_param?: string;
          };
        Returns: Json;
      };
      join_wolfpack_enhanced: {
        Args: { p_location_id?: string };
        Returns: Json;
      };
      join_wolfpack_membership: {
        Args: { p_table_location?: string };
        Returns: Json;
      };
      join_wolfpack_permanent_safe: {
        Args: {
          p_location_id?: string;
          p_latitude?: number;
          p_longitude?: number;
          p_table_location?: string;
        };
        Returns: Json;
      };
      join_wolfpack_simple: {
        Args: { p_location_id?: string; p_table_location?: string };
        Returns: Json;
      };
      kick_all_from_wolf_pack: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      leave_conversation: {
        Args: { p_conversation_id: string };
        Returns: boolean;
      };
      leave_wolf_pack: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      leave_wolfpack: {
        Args: { user_uuid: string; location_uuid: string };
        Returns: {
          success: boolean;
          message: string;
        }[];
      };
      like_comment: {
        Args:
          | { p_comment_id: string }
          | { p_comment_id: string; p_user_id: string };
        Returns: boolean;
      };
      like_video: {
        Args: { p_video_id: string };
        Returns: Json;
      };
      link_existing_users_to_auth: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      link_my_auth_account: {
        Args: { p_user_email: string };
        Returns: Json;
      };
      link_user_to_auth: {
        Args: { p_user_id: string; p_auth_id: string };
        Returns: Json;
      };
      link_video_to_menu_item: {
        Args: {
          p_menu_item_name: string;
          p_video_url: string;
          p_video_type?: string;
        };
        Returns: boolean;
      };
      list_common_srids: {
        Args: Record<PropertyKey, never>;
        Returns: {
          srid: number;
          auth_name: string;
          description: string;
        }[];
      };
      list_env_vars: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      log_admin_operation: {
        Args: {
          p_operation_type: string;
          p_function_name: string;
          p_target_table?: string;
          p_target_id?: string;
          p_details?: Json;
          p_success?: boolean;
          p_error_message?: string;
        };
        Returns: undefined;
      };
      log_event_discovery: {
        Args: {
          p_source_name: string;
          p_events_discovered?: number;
          p_events_processed?: number;
          p_events_posted?: number;
          p_errors_encountered?: number;
          p_error_details?: string;
        };
        Returns: string;
      };
      log_pack_activity: {
        Args: {
          p_pack_id: string;
          p_user_id: string;
          p_activity_type: string;
          p_metadata?: Json;
        };
        Returns: string;
      };
      log_slow_query: {
        Args: {
          p_query: string;
          p_execution_time: number;
          p_rows: number;
          p_query_type?: string;
          p_table_names?: string[];
        };
        Returns: undefined;
      };
      maintain_wolfpack_whitelist: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      manage_customer_tab: {
        Args: {
          p_user_id: string;
          p_bartender_id: string;
          p_action: string;
          p_location_id?: string;
        };
        Returns: Json;
      };
      manual_message_cleanup: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      manual_wolfpack_reset: {
        Args: { p_force?: boolean };
        Returns: Json;
      };
      mark_message_read: {
        Args: { p_message_id: string; p_user_id: string };
        Returns: undefined;
      };
      mark_messages_as_read: {
        Args: { p_conversation_id: string; p_user_id?: string };
        Returns: number;
      };
      mark_messages_read: {
        Args:
          | {
            p_conversation_type: string;
            p_conversation_id: string;
            p_last_message_id: string;
          }
          | { p_from_user_id: string }
          | { p_user_id: string; p_from_user_id: string };
        Returns: Json;
      };
      mark_notification_read: {
        Args: { notification_id: string };
        Returns: undefined;
      };
      mark_order_paid: {
        Args: { p_order_id: string; p_payment_method?: string };
        Returns: boolean;
      };
      mark_order_ready: {
        Args: { p_bartender_order_id: string; p_bartender_id: string };
        Returns: Json;
      };
      migrate_old_direct_messages: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      migrate_user_to_auth: {
        Args: { p_email: string; p_password?: string };
        Returns: Json;
      };
      moderate_content: {
        Args: {
          p_video_id: string;
          p_moderator_id: string;
          p_action: string;
          p_notes?: string;
        };
        Returns: Json;
      };
      monitor_admin_activity: {
        Args: Record<PropertyKey, never>;
        Returns: {
          alert_type: string;
          severity: string;
          details: Json;
        }[];
      };
      monitor_index_usage: {
        Args: Record<PropertyKey, never>;
        Returns: {
          table_name: string;
          index_name: string;
          size: string;
          scans: number;
          status: string;
        }[];
      };
      monitor_table_growth: {
        Args: Record<PropertyKey, never>;
        Returns: {
          table_name: string;
          current_size: string;
          row_count: number;
          avg_row_size: number;
          partitioning_recommendation: string;
          suggested_partition_key: string;
        }[];
      };
      needs_location_verification: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      next_opening_time: {
        Args: { location_id: string };
        Returns: string;
      };
      normalize_location: {
        Args: { loc: string };
        Returns: string;
      };
      open_wolfpack_bar_tab: {
        Args: { location_id: string };
        Returns: Json;
      };
      optimize_session_settings: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      optimize_uploaded_image: {
        Args: { bucket: string; file_path: string };
        Returns: Json;
      };
      perform_routine_maintenance: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      perform_table_maintenance: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      ping: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      place_order: {
        Args: {
          p_user_id: string;
          p_menu_item_id: string;
          p_quantity?: number;
          p_special_instructions?: string;
          p_location_id?: string;
        };
        Returns: Json;
      };
      place_wolf_pack_order: {
        Args: {
          p_customer_id: string;
          p_location_id: string;
          p_items: Json;
          p_seating_location?: string;
          p_modification_notes?: string;
          p_customer_notes?: string;
          p_bartender_id?: string;
        };
        Returns: string;
      };
      post_ai_event_to_feed: {
        Args: { p_ai_event_id: string; p_target_pack_id?: string };
        Returns: Json;
      };
      post_video: {
        Args: {
          p_title: string;
          p_description: string;
          p_video_url: string;
          p_thumbnail_url: string;
        };
        Returns: Json;
      };
      process_ai_events: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      process_content_ingestion_queue: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      process_ingested_content: {
        Args: {
          p_job_id: string;
          p_platform_id: string;
          p_title: string;
          p_description: string;
          p_media_url: string;
          p_thumbnail_url: string;
          p_author_name: string;
          p_author_id?: string;
          p_metadata?: Json;
        };
        Returns: string;
      };
      process_notifications_direct: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      process_order_request: {
        Args: {
          p_order_id: string;
          p_bartender_id: string;
          p_action: string;
          p_message?: string;
        };
        Returns: Json;
      };
      process_pending_image_deletions: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      process_push_notifications_cron: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      process_tiktok_content: {
        Args: { p_job_id: string };
        Returns: Json;
      };
      process_youtube_content: {
        Args: { p_job_id: string };
        Returns: Json;
      };
      promote_user_to_admin: {
        Args: { user_email: string };
        Returns: Json;
      };
      quick_vibe_check: {
        Args: { p_dj_id: string; p_location_id: string };
        Returns: string;
      };
      react_to_message: {
        Args: { p_message_id: string; p_emoji: string };
        Returns: Json;
      };
      record_broadcast_response: {
        Args: {
          p_broadcast_id: string;
          p_response_type: string;
          p_option_id?: string;
          p_text_response?: string;
          p_emoji?: string;
        };
        Returns: Json;
      };
      record_video_view: {
        Args:
          | { p_post_id: string }
          | { p_post_id: string; p_viewer_id?: string };
        Returns: undefined;
      };
      refresh_admin_views: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      refresh_dashboard_stats: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      refresh_user_profile_cache: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      refresh_user_stats: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      refresh_wolfpack_feed_cache: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      refresh_wolfpack_stats: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      register_business: {
        Args: {
          p_business_name: string;
          p_business_type: string;
          p_location_id: string;
          p_description?: string;
          p_contact_info?: Json;
          p_pack_discount_percentage?: number;
        };
        Returns: Json;
      };
      register_device_token: {
        Args: {
          p_token: string;
          p_platform: string;
          p_device_name?: string;
          p_device_model?: string;
          p_app_version?: string;
        };
        Returns: Json;
      };
      register_new_user: {
        Args: {
          p_email: string;
          p_first_name: string;
          p_last_name: string;
          p_phone?: string;
        };
        Returns: Json;
      };
      remove_chat_reaction: {
        Args: { p_message_id: string; p_emoji: string };
        Returns: boolean;
      };
      replace_chat_message_image: {
        Args: {
          p_message_id: string;
          p_new_image_url: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      replace_user_profile_image: {
        Args:
          | { new_image_url_param: string; new_image_id_param?: string }
          | {
            p_user_id: string;
            p_new_image_url: string;
            p_new_storage_path?: string;
            p_delete_old?: boolean;
          };
        Returns: Json;
      };
      report_location_violation: {
        Args: {
          p_reporter_id: string;
          p_reported_user_id: string;
          p_reason?: string;
        };
        Returns: Json;
      };
      report_message: {
        Args: {
          p_message_id: string;
          p_message_type: string;
          p_reason: string;
          p_details?: string;
        };
        Returns: Json;
      };
      request_ordering_approval: {
        Args: {
          p_user_id: string;
          p_location_id: string;
          p_table_location?: string;
          p_customer_notes?: string;
        };
        Returns: Json;
      };
      request_password_reset: {
        Args: { p_email: string };
        Returns: Json;
      };
      request_song: {
        Args: { p_song_name: string; p_artist_name: string; p_notes?: string };
        Returns: string;
      };
      request_to_order: {
        Args: { p_location_id: string; p_message?: string };
        Returns: Json;
      };
      reset_password_with_token: {
        Args: { p_token: string; p_new_password: string };
        Returns: Json;
      };
      reset_query_stats: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      reset_user_password: {
        Args: { user_email: string; new_password: string };
        Returns: Json;
      };
      reset_wolf_pack: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      reset_wolfpack_daily: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      resolve_monitoring_alert: {
        Args: { p_alert_id: string; p_notes?: string };
        Returns: undefined;
      };
      resolve_user_id: {
        Args: { input_id: string };
        Returns: string;
      };
      rsvp_to_event: {
        Args:
          | { p_event_id: string; p_status: string }
          | { p_event_id: string; p_status?: string };
        Returns: Json;
      };
      run_comprehensive_health_check: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      run_daily_maintenance: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      run_event_discovery_for_all_locations: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      run_message_cleanup: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      run_security_audit: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      safe_get_srid_info: {
        Args: { srid_param: number };
        Returns: {
          srid: number;
          auth_name: string;
          auth_srid: number;
        }[];
      };
      save_fcm_token: {
        Args: { p_token: string; p_platform?: string; p_device_info?: Json };
        Returns: Json;
      };
      schedule_event_notifications: {
        Args: { p_event_id: string };
        Returns: undefined;
      };
      search_messages: {
        Args: {
          p_search_term: string;
          p_conversation_id?: string;
          p_limit?: number;
        };
        Returns: {
          message_id: string;
          conversation_id: string;
          content: string;
          sender_name: string;
          created_at: string;
          relevance: number;
        }[];
      };
      search_posts_by_hashtag: {
        Args: { p_hashtag: string; p_limit?: number; p_offset?: number };
        Returns: {
          post_id: string;
          user_id: string;
          username: string;
          display_name: string;
          avatar_url: string;
          video_url: string;
          thumbnail_url: string;
          caption: string;
          view_count: number;
          like_count: number;
          comment_count: number;
          share_count: number;
          created_at: string;
        }[];
      };
      search_users: {
        Args: { p_query: string; p_limit?: number };
        Returns: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          role: string;
          status: string;
          avatar_url: string;
          display_name: string;
          wolf_emoji: string;
        }[];
      };
      search_wolfpack_users: {
        Args: { p_search_term: string; p_limit?: number; p_offset?: number };
        Returns: {
          user_id: string;
          username: string;
          display_name: string;
          avatar_url: string;
          verified: boolean;
          is_vip: boolean;
          follower_count: number;
          following_count: number;
          post_count: number;
          is_following: boolean;
        }[];
      };
      send_announcement_with_push: {
        Args: {
          p_title: string;
          p_content: string;
          p_priority?: string;
          p_type?: string;
          p_send_push?: boolean;
        };
        Returns: Json;
      };
      send_broadcast: {
        Args: { p_broadcast_id: string };
        Returns: Json;
      };
      send_broadcast_notification: {
        Args: { p_broadcast_id: string };
        Returns: Json;
      };
      send_chat_message: {
        Args: { p_message: string; p_image_url?: string };
        Returns: string;
      };
      send_chat_message_simple: {
        Args: { p_content: string; p_session_id?: string };
        Returns: Json;
      };
      send_conversation_message: {
        Args: {
          p_conversation_id: string;
          p_content: string;
          p_sender_auth_id?: string;
        };
        Returns: string;
      };
      send_direct_message: {
        Args: {
          p_sender_id: string;
          p_recipient_id: string;
          p_message: string;
          p_message_type?: string;
        };
        Returns: Json;
      };
      send_dj_broadcast_to_pack: {
        Args: {
          p_dj_id: string;
          p_location_id: string;
          p_message: string;
          p_template_id?: string;
        };
        Returns: string;
      };
      send_dj_broadcast_with_questions: {
        Args: {
          p_dj_id: string;
          p_location_id: string;
          p_title: string;
          p_message: string;
          p_broadcast_type: string;
          p_questions?: Json;
          p_duration_seconds?: number;
        };
        Returns: string;
      };
      send_dm: {
        Args: {
          p_recipient_email: string;
          p_content: string;
          p_media_url?: string;
        };
        Returns: Json;
      };
      send_flirt_interaction: {
        Args: {
          p_from_user_id: string;
          p_to_user_id: string;
          p_location_id: string;
          p_flirt_type: string;
        };
        Returns: string;
      };
      send_food_ready_notification: {
        Args: {
          p_user_id: string;
          p_order_details: string;
          p_table_number?: number;
        };
        Returns: Json;
      };
      send_mass_broadcast: {
        Args: {
          p_dj_id: string;
          p_location_id: string;
          p_broadcast_name: string;
          p_message: string;
          p_target_audience: string;
          p_questions?: Json;
          p_custom_criteria?: Json;
        };
        Returns: string;
      };
      send_message: {
        Args: {
          p_conversation_id: string;
          p_content: string;
          p_message_type?: string;
          p_parent_message_id?: string;
          p_media_urls?: string[];
          p_metadata?: Json;
        };
        Returns: string;
      };
      send_message_to_user: {
        Args: {
          p_recipient_email: string;
          p_content: string;
          p_media_url?: string;
        };
        Returns: Json;
      };
      send_order_ready_notification: {
        Args: {
          p_order_id: string;
          p_bartender_id: string;
          p_custom_message?: string;
        };
        Returns: boolean;
      };
      send_pack_message: {
        Args: {
          p_pack_id: string;
          p_content: string;
          p_message_type?: string;
          p_media_url?: string;
          p_reply_to_id?: string;
        };
        Returns: Json;
      };
      send_private_message: {
        Args:
          | {
            p_from_user_id: string;
            p_to_user_id: string;
            p_message: string;
            p_image_url?: string;
          }
          | {
            p_receiver_id: string;
            p_message: string;
            p_image_url?: string;
            p_is_flirt_message?: boolean;
          }
          | { p_to_user_id: string; p_message: string; p_image_url?: string };
        Returns: string;
      };
      send_private_message_simple: {
        Args: { p_to_user_id: string; p_message: string };
        Returns: Json;
      };
      send_push_notification: {
        Args: {
          target_user_ids: string[];
          notification_title: string;
          notification_body: string;
          notification_data?: Json;
        };
        Returns: Json;
      };
      send_wolf_chat_message: {
        Args: {
          p_user_id: string;
          p_location_id: string;
          p_message: string;
          p_image_id?: string;
          p_chat_type?: string;
        };
        Returns: string;
      };
      send_wolf_pack_interaction: {
        Args: {
          p_from_user_id: string;
          p_to_user_id: string;
          p_location_id: string;
          p_interaction_type: string;
        };
        Returns: string;
      };
      send_wolf_pack_welcome_notification: {
        Args: { p_user_id: string; p_location_name: string };
        Returns: undefined;
      };
      send_wolfpack_chat_message: {
        Args: {
          p_content: string;
          p_image_url?: string;
          p_session_id?: string;
        };
        Returns: string;
      };
      set_cached_data: {
        Args: { p_key: string; p_value: Json; p_ttl_minutes?: number };
        Returns: undefined;
      };
      set_env_var: {
        Args: { p_key: string; p_value: string; p_description?: string };
        Returns: Json;
      };
      set_performance_config: {
        Args: { p_key: string; p_value: string };
        Returns: boolean;
      };
      setup_item_modifiers: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      show_schema_standards: {
        Args: Record<PropertyKey, never>;
        Returns: {
          category: string;
          standard: string;
        }[];
      };
      show_video_table_summary: {
        Args: Record<PropertyKey, never>;
        Returns: {
          table_name: string;
          purpose: string;
          key_column: string;
          status: string;
        }[];
      };
      single_ladies_spotlight: {
        Args: {
          p_dj_id: string;
          p_location_id: string;
          p_custom_message?: string;
        };
        Returns: string;
      };
      smart_location_check: {
        Args:
          | { p_user_lat: number; p_user_lon: number }
          | {
            p_user_lat: number;
            p_user_lon: number;
            p_table_location?: string;
          };
        Returns: Json;
      };
      soft_delete_my_video: {
        Args: { video_id: string };
        Returns: Json;
      };
      start_event_round: {
        Args: {
          p_event_id: string;
          p_round_number: number;
          p_round_name: string;
          p_round_type: string;
        };
        Returns: string;
      };
      start_event_voting: {
        Args: { p_event_id: string };
        Returns: boolean;
      };
      start_preparing_order: {
        Args: { p_order_id: string };
        Returns: undefined;
      };
      store_discovered_event: {
        Args:
          | {
            p_source_name: string;
            p_source_event_id: string;
            p_title: string;
            p_description: string;
            p_location: string;
            p_venue_name: string;
            p_start_time: string;
            p_end_time: string;
            p_event_url: string;
            p_image_url: string;
          }
          | {
            p_source_name: string;
            p_source_event_id: string;
            p_title: string;
            p_description: string;
            p_location: string;
            p_venue_name: string;
            p_start_time: string;
            p_end_time?: string;
            p_event_url?: string;
            p_image_url?: string;
            p_category?: string;
          };
        Returns: string;
      };
      store_secure_credential: {
        Args: { p_name: string; p_value: string; p_metadata?: Json };
        Returns: Json;
      };
      submit_event_vote: {
        Args: { p_event_id: string; p_voted_for_id: string };
        Returns: Json;
      };
      sync_comment_like_counts: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      test_all_user_features: {
        Args: { p_email: string };
        Returns: Json;
      };
      test_api_health: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      test_location_verification: {
        Args: { p_lat?: number; p_lng?: number };
        Returns: Json;
      };
      test_profile_image_update_for_user: {
        Args: { p_email: string; p_test_image_url?: string };
        Returns: Json;
      };
      test_user_permissions: {
        Args: { p_email: string };
        Returns: Json;
      };
      toggle_block_user: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      toggle_comment_like: {
        Args: { p_comment_id: string };
        Returns: Json;
      };
      toggle_comment_reaction: {
        Args: { p_comment_id: string; p_reaction_type?: string };
        Returns: Json;
      };
      toggle_feature_for_testing: {
        Args: { p_flag_name: string; p_enabled: boolean };
        Returns: Json;
      };
      toggle_post_like: {
        Args: { p_video_id: string };
        Returns: Json;
      };
      toggle_private_message_reaction: {
        Args: { p_message_id: string; p_emoji: string };
        Returns: boolean;
      };
      toggle_video_like: {
        Args: { p_video_id: string; p_user_id: string } | { video_id: string };
        Returns: Json;
      };
      track_business_support: {
        Args:
          | {
            p_business_id: string;
            p_support_type: string;
            p_amount?: number;
            p_metadata?: Json;
          }
          | { p_business_id: string; p_support_type: string; p_notes?: string };
        Returns: Json;
      };
      track_contestant_interaction: {
        Args: {
          p_contestant_id: string;
          p_user_id: string;
          p_interaction_type: string;
          p_interaction_data?: Json;
        };
        Returns: undefined;
      };
      track_event_interest: {
        Args: { p_user_id: string; p_event_id: string; p_action: string };
        Returns: Json;
      };
      track_upload_performance: {
        Args: {
          p_upload_start: string;
          p_upload_end: string;
          p_file_size: number;
          p_success?: boolean;
          p_error?: string;
        };
        Returns: undefined;
      };
      track_video_share: {
        Args: {
          p_video_id: string;
          p_share_type?: string;
          p_platform?: string;
          p_message?: string;
        };
        Returns: string;
      };
      track_wolfpack_event: {
        Args: { event_type: string; event_data?: Json; location_id?: string };
        Returns: undefined;
      };
      trigger_push_notifications: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      trigger_wolfpack_onboarding: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      unlike_video: {
        Args: { p_video_id: string };
        Returns: Json;
      };
      update_contestant_details: {
        Args: {
          p_contestant_id: string;
          p_name?: string;
          p_photo_url?: string;
          p_details?: Json;
        };
        Returns: boolean;
      };
      update_dj_performance_metrics: {
        Args: { p_dj_id: string };
        Returns: undefined;
      };
      update_event_status: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      update_feature_flag: {
        Args: {
          p_flag_name: string;
          p_is_enabled?: boolean;
          p_enabled_for_roles?: string[];
          p_enabled_for_users?: string[];
          p_description?: string;
        };
        Returns: Json;
      };
      update_ingestion_job_status: {
        Args: { p_job_id: string; p_status: string; p_error_message?: string };
        Returns: undefined;
      };
      update_kitchen_order_status: {
        Args: {
          p_kitchen_order_id: string;
          p_new_status: string;
          p_notes?: string;
        };
        Returns: undefined;
      };
      update_location_geofence: {
        Args: {
          location_id: string;
          latitude: number;
          longitude: number;
          radius_meters?: number;
        };
        Returns: undefined;
      };
      update_location_permission: {
        Args: { p_granted: boolean };
        Returns: Json;
      };
      update_my_profile: {
        Args: { p_updates: Json };
        Returns: Json;
      };
      update_notification_preferences: {
        Args: { p_user_id: string; p_preferences: Json };
        Returns: Json;
      };
      update_notification_status: {
        Args: {
          p_notification_id: string;
          p_status: string;
          p_firebase_message_id?: string;
        };
        Returns: Json;
      };
      update_order_status: {
        Args:
          | {
            p_order_id: string;
            p_new_status: string;
            p_bartender_id: string;
            p_message?: string;
          }
          | {
            p_order_id: string;
            p_new_status: string;
            p_bartender_notes?: string;
          };
        Returns: Json;
      };
      update_pack_member_position: {
        Args: { p_user_id: string; p_position_x: number; p_position_y: number };
        Returns: Json;
      };
      update_trending_hashtags: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      update_trending_scores: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      update_typing_indicator: {
        Args: { p_conversation_type: string; p_conversation_id: string };
        Returns: undefined;
      };
      update_user_location: {
        Args: { p_location_id: string };
        Returns: undefined;
      };
      update_user_online_status: {
        Args: { user_uuid: string; online_status: boolean };
        Returns: undefined;
      };
      update_user_profile_image: {
        Args: { p_new_image_url: string };
        Returns: Json;
      };
      update_user_role: {
        Args: { user_id: string; new_role: string };
        Returns: Json;
      };
      update_wolf_profile: {
        Args: {
          p_user_id: string;
          p_display_name?: string;
          p_bio?: string;
          p_favorite_drink?: string;
          p_vibe_status?: string;
          p_instagram_handle?: string;
          p_favorite_song?: string;
          p_looking_for?: string;
          p_wolf_emoji?: string;
        };
        Returns: Json;
      };
      upload_video: {
        Args: {
          p_video_url: string;
          p_thumbnail_url: string;
          p_caption: string;
          p_duration?: number;
        };
        Returns: string;
      };
      upload_video_with_metadata: {
        Args: {
          p_user_id: string;
          p_video_filename: string;
          p_thumbnail_filename: string;
          p_caption: string;
          p_location_id?: string;
        };
        Returns: Json;
      };
      upload_wolf_profile_image: {
        Args: {
          p_user_id: string;
          p_image_data: string;
          p_content_type: string;
          p_filename: string;
        };
        Returns: string;
      };
      upsert_fcm_token: {
        Args: {
          p_user_id: string;
          p_token: string;
          p_device_info?: Json;
          p_platform?: string;
        };
        Returns: string;
      };
      user_check_in: {
        Args: { p_table_number?: number; p_mood?: string };
        Returns: string;
      };
      user_check_out: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      user_has_any_role: {
        Args: { required_roles: string[] };
        Returns: boolean;
      };
      user_has_liked_comment: {
        Args:
          | { p_comment_id: string }
          | { p_comment_id: string; p_user_id: string };
        Returns: boolean;
      };
      user_has_permission: {
        Args: { p_resource: string; p_action: string };
        Returns: boolean;
      };
      user_has_role: {
        Args: { required_role: string };
        Returns: boolean;
      };
      user_is_conversation_participant: {
        Args: { conversation_uuid: string; user_auth_uuid: string };
        Returns: boolean;
      };
      user_liked_video: {
        Args: { p_video_id: string };
        Returns: boolean;
      };
      user_logout: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      user_saved_video: {
        Args: { video_id: string };
        Returns: boolean;
      };
      validate_admin_access: {
        Args: { p_required_role?: string; p_operation_name?: string };
        Returns: boolean;
      };
      validate_env_vars: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      validate_file_upload: {
        Args: {
          p_user_id: string;
          p_file_type: string;
          p_file_size: number;
          p_mime_type: string;
        };
        Returns: Json;
      };
      validate_image_format: {
        Args: { file_extension: string };
        Returns: boolean;
      };
      validate_modifiers: {
        Args: { modifiers: Json };
        Returns: boolean;
      };
      validate_order_items: {
        Args: { items: Json };
        Returns: boolean;
      };
      validate_performance_fixes: {
        Args: Record<PropertyKey, never>;
        Returns: {
          check_name: string;
          status: string;
          details: Json;
        }[];
      };
      validate_production_readiness: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      validate_security_fixes: {
        Args: Record<PropertyKey, never>;
        Returns: {
          check_name: string;
          status: string;
          details: Json;
        }[];
      };
      validate_storage_path: {
        Args: { bucket: string; file_path: string; user_id: string };
        Returns: boolean;
      };
      validate_system_setup: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      validate_video_format: {
        Args: { file_extension: string };
        Returns: boolean;
      };
      validate_video_upload: {
        Args: {
          p_file_size: number;
          p_mime_type: string;
          p_duration_seconds: number;
        };
        Returns: boolean;
      };
      validate_video_upload_simple: {
        Args: { p_user_id: string; p_file_size: number };
        Returns: Json;
      };
      verify_location_access: {
        Args: {
          p_latitude: number;
          p_longitude: number;
          p_claimed_location_id?: string;
        };
        Returns: Json;
      };
      verify_pack_membership: {
        Args: { p_user_id: string; p_location_id: string };
        Returns: Json;
      };
      verify_user_identity: {
        Args: {
          p_user_id: string;
          p_method: string;
          p_is_local?: boolean;
          p_notes?: string;
        };
        Returns: Json;
      };
      verify_user_location: {
        Args: {
          p_user_id: string;
          p_lat: number;
          p_lng: number;
          p_method?: string;
        };
        Returns: Json;
      };
      verify_user_location_postgis: {
        Args: {
          p_user_id: string;
          p_latitude: number;
          p_longitude: number;
          p_method?: string;
        };
        Returns: Json;
      };
      vote_for_contestant: {
        Args: { p_contestant_id: string; p_user_id: string };
        Returns: boolean;
      };
      whats_happening_now: {
        Args: { p_location_id?: string };
        Returns: {
          event_name: string;
          venue_name: string;
          started_ago: unknown;
          ends_in: unknown;
          buzz_score: number;
          ai_summary: string;
          event_type: string;
        }[];
      };
      where_to_next: {
        Args: { p_current_time?: string; p_location_id?: string };
        Returns: {
          event_name: string;
          venue_name: string;
          starts_in: unknown;
          event_type: string;
          ai_vibe_score: number;
          ai_recommendations: string[];
          walking_distance: boolean;
        }[];
      };
      which_table_to_use: {
        Args: { p_feature: string };
        Returns: string;
      };
      wolfpack_complete_video_upload: {
        Args: {
          p_upload_id: string;
          p_caption?: string;
          p_hashtags?: string[];
          p_is_private?: boolean;
          p_allows_comments?: boolean;
          p_allows_duets?: boolean;
          p_location_id?: string;
        };
        Returns: Json;
      };
      wolfpack_daily_reset: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      wolfpack_initiate_video_upload: {
        Args: { p_file_name: string; p_file_size: number; p_mime_type: string };
        Returns: Json;
      };
      wolfpack_process_hashtags: {
        Args: { p_post_id: string; p_hashtags: string[] };
        Returns: undefined;
      };
      your_function_name: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      event_category_enum:
        | "concert"
        | "party"
        | "birthday"
        | "quincinera"
        | "local_news"
        | "community_gathering"
        | "other";
      reaction_target_type_enum: "event" | "event_post" | "comment";
      reaction_type_enum: "will_attend" | "fire" | "lame" | "like" | "heart";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema =
  DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ? keyof (
      & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
        "Tables"
      ]
      & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
        "Views"
      ]
    )
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? (
    & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
      "Tables"
    ]
    & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
      "Views"
    ]
  )[TableName] extends {
    Row: infer R;
  } ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (
    & DefaultSchema["Tables"]
    & DefaultSchema["Views"]
  ) ? (
      & DefaultSchema["Tables"]
      & DefaultSchema["Views"]
    )[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    } ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
      "Tables"
    ]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
    "Tables"
  ][TableName] extends {
    Insert: infer I;
  } ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    } ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
      "Tables"
    ]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
    "Tables"
  ][TableName] extends {
    Update: infer U;
  } ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    } ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]][
      "Enums"
    ]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][
    EnumName
  ]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ? keyof DatabaseWithoutInternals[
      PublicCompositeTypeNameOrOptions["schema"]
    ]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]][
    "CompositeTypes"
  ][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      event_category_enum: [
        "concert",
        "party",
        "birthday",
        "quincinera",
        "local_news",
        "community_gathering",
        "other",
      ],
      reaction_target_type_enum: ["event", "event_post", "comment"],
      reaction_type_enum: ["will_attend", "fire", "lame", "like", "heart"],
    },
  },
} as const;
