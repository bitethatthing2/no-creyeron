// lib/database.types.ts
// Minimal database types to fix TypeScript errors in enhanced-wolfpack-client.ts

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
          auth_id: string | null;
          email: string;
          first_name: string | null;
          last_name: string | null;
          display_name: string | null;
          avatar_url: string | null;
          avatar_id: string | null;
          custom_avatar_id: string | null;
          profile_image_url: string | null;
          wolf_emoji: string | null;
          bio: string | null;
          gender: string | null;
          pronouns: string | null;
          vibe_status: string | null;
          favorite_drink: string | null;
          favorite_bartender: string | null;
          looking_for: string | null;
          instagram_handle: string | null;
          is_online: boolean | null;
          last_seen_at: string | null;
          last_activity: string | null;
          last_login: string | null;
          location_id: string | null;
          location_permissions_granted: boolean;
          is_wolfpack_member: boolean;
          wolfpack_status: string | null;
          wolfpack_joined_at: string | null;
          wolfpack_tier: string | null;
          role: "user" | "admin" | "dj" | "bartender";
          status: "active" | "inactive" | "blocked";
          is_approved: boolean;
          permanent_member_since: string | null;
          permanent_member_benefits: Json | null;
          permanent_member_notes: string | null;
          phone: string | null;
          phone_verified: boolean;
          phone_verification_code: string | null;
          phone_verification_sent_at: string | null;
          permissions: Json | null;
          notification_preferences: Json | null;
          privacy_settings: Json | null;
          sensitive_data_encrypted: Json | null;
          notes: string | null;
          password_hash: string | null;
          block_reason: string | null;
          blocked_at: string | null;
          blocked_by: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
          daily_customization: Json | null;
          allow_messages: boolean;
          session_id: string | null;
        };
        Insert: {
          id?: string;
          auth_id?: string | null;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          avatar_id?: string | null;
          custom_avatar_id?: string | null;
          profile_image_url?: string | null;
          wolf_emoji?: string | null;
          bio?: string | null;
          gender?: string | null;
          pronouns?: string | null;
          vibe_status?: string | null;
          favorite_drink?: string | null;
          favorite_bartender?: string | null;
          looking_for?: string | null;
          instagram_handle?: string | null;
          is_online?: boolean | null;
          last_seen_at?: string | null;
          last_activity?: string | null;
          last_login?: string | null;
          location_id?: string | null;
          location_permissions_granted?: boolean;
          is_wolfpack_member?: boolean;
          wolfpack_status?: string | null;
          wolfpack_joined_at?: string | null;
          wolfpack_tier?: string | null;
          role?: "user" | "admin" | "dj" | "bartender";
          status?: "active" | "inactive" | "blocked";
          is_approved?: boolean;
          permanent_member_since?: string | null;
          permanent_member_benefits?: Json | null;
          permanent_member_notes?: string | null;
          phone?: string | null;
          phone_verified?: boolean;
          phone_verification_code?: string | null;
          phone_verification_sent_at?: string | null;
          permissions?: Json | null;
          notification_preferences?: Json | null;
          privacy_settings?: Json | null;
          sensitive_data_encrypted?: Json | null;
          notes?: string | null;
          password_hash?: string | null;
          block_reason?: string | null;
          blocked_at?: string | null;
          blocked_by?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          daily_customization?: Json | null;
          allow_messages?: boolean;
          session_id?: string | null;
        };
        Update: {
          id?: string;
          auth_id?: string | null;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          avatar_id?: string | null;
          custom_avatar_id?: string | null;
          profile_image_url?: string | null;
          wolf_emoji?: string | null;
          bio?: string | null;
          gender?: string | null;
          pronouns?: string | null;
          vibe_status?: string | null;
          favorite_drink?: string | null;
          favorite_bartender?: string | null;
          looking_for?: string | null;
          instagram_handle?: string | null;
          is_online?: boolean | null;
          last_seen_at?: string | null;
          last_activity?: string | null;
          last_login?: string | null;
          location_id?: string | null;
          location_permissions_granted?: boolean;
          is_wolfpack_member?: boolean;
          wolfpack_status?: string | null;
          wolfpack_joined_at?: string | null;
          wolfpack_tier?: string | null;
          role?: "user" | "admin" | "dj" | "bartender";
          status?: "active" | "inactive" | "blocked";
          is_approved?: boolean;
          permanent_member_since?: string | null;
          permanent_member_benefits?: Json | null;
          permanent_member_notes?: string | null;
          phone?: string | null;
          phone_verified?: boolean;
          phone_verification_code?: string | null;
          phone_verification_sent_at?: string | null;
          permissions?: Json | null;
          notification_preferences?: Json | null;
          privacy_settings?: Json | null;
          sensitive_data_encrypted?: Json | null;
          notes?: string | null;
          password_hash?: string | null;
          block_reason?: string | null;
          blocked_at?: string | null;
          blocked_by?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          daily_customization?: Json | null;
          allow_messages?: boolean;
          session_id?: string | null;
        };
      };
      wolf_pack_members: {
        Row: {
          id: string;
          user_id: string;
          location_id: string | null;
          status: string | null;
          tier: string | null;
          membership_ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          location_id?: string | null;
          status?: string | null;
          tier?: string | null;
          membership_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          location_id?: string | null;
          status?: string | null;
          tier?: string | null;
          membership_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          city: string | null;
          state: string | null;
          latitude: number;
          longitude: number;
          radius_miles: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          latitude: number;
          longitude: number;
          radius_miles?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          latitude?: number;
          longitude?: number;
          radius_miles?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_wolfpack_live_stats: {
        Args: {
          p_location_id: string;
        };
        Returns: {
          total_active: number;
          very_active: number;
          gender_breakdown: Json;
          top_vibers: Json[];
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Export shorthand types for convenience
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
