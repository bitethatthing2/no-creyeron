// Database types based on your current clean table structure
import { Database } from "./database.types";

// Core user type (from users table)
export type User = Database["public"]["Tables"]["users"]["Row"];

// User profile (from user_profiles table)
export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

// Membership (from memberships table - simplified)
export type WolfpackMembership =
  Database["public"]["Tables"]["memberships"]["Row"];

// User location (from user_locations table)
export type UserLocation =
  Database["public"]["Tables"]["user_locations"]["Row"];

// User activity status (from user_activity_status table)
export type UserActivityStatus =
  Database["public"]["Tables"]["user_activity_status"]["Row"];

// Content posts (from content_posts table - replaces content_posts)
export type WolfpackVideo =
  Database["public"]["Tables"]["content_posts"]["Row"];

// Wolfpack post (from content_posts table - if still used)
export type WolfpackPost = Database["public"]["Tables"]["content_posts"]["Row"];

// Content comments (from content_comments table - replaces content_comments)
export type WolfpackComment =
  Database["public"]["Tables"]["content_comments"]["Row"];

// Content reactions (from content_reactions table - replaces content_reactions)
export type WolfpackReaction =
  Database["public"]["Tables"]["content_reactions"]["Row"];

// Social follows (from social_follows table - replaces wolfpack_follows)
export type WolfpackFollow =
  Database["public"]["Tables"]["social_follows"]["Row"];

// Wolfpack saved post (from wolfpack_saved_posts table)
export type WolfpackSavedPost =
  Database["public"]["Tables"]["wolfpack_saved_posts"]["Row"];

// Chat conversations (from chat_conversations table - replaces wolfpack_conversations)
export type WolfpackConversation =
  Database["public"]["Tables"]["chat_conversations"]["Row"];

// Chat messages (from chat_messages table - replaces wolfpack_messages)
export type WolfpackMessage =
  Database["public"]["Tables"]["chat_messages"]["Row"];

// Combined user data (with joined tables)
export interface UserWithProfile extends User {
  profile?: UserProfile;
  membership?: WolfpackMembership;
  location?: UserLocation;
  activity?: UserActivityStatus;
}

// Content type for feed (either video or post)
export type WolfpackContent =
  | (WolfpackVideo & { content_type: "video" })
  | (WolfpackPost & { content_type: "post" });

// Enhanced types with computed fields for UI
export interface EnrichedWolfpackVideo extends WolfpackVideo {
  user?: Partial<User>;
  user_liked?: boolean;
  user_saved?: boolean;
  shares_count?: number; // Computed from share_count for consistency
}

export interface EnrichedWolfpackPost extends WolfpackPost {
  user?: Partial<User>;
  user_liked?: boolean;
  user_saved?: boolean;
}

// Feed item with user data
export interface FeedItem {
  content: WolfpackContent;
  user: UserWithProfile;
  user_liked?: boolean;
  user_saved?: boolean;
}

// Helper type for partial updates
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];
export type UserProfileUpdate =
  Database["public"]["Tables"]["user_profiles"]["Update"];
export type WolfpackMembershipUpdate =
  Database["public"]["Tables"]["memberships"]["Update"];
export type UserLocationUpdate =
  Database["public"]["Tables"]["user_locations"]["Update"];
export type UserActivityStatusUpdate =
  Database["public"]["Tables"]["user_activity_status"]["Update"];
export type WolfpackVideoUpdate =
  Database["public"]["Tables"]["content_posts"]["Update"];
export type WolfpackPostUpdate =
  Database["public"]["Tables"]["content_posts"]["Update"];
export type WolfpackCommentUpdate =
  Database["public"]["Tables"]["content_comments"]["Update"];

// Helper type for inserts
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserProfileInsert =
  Database["public"]["Tables"]["user_profiles"]["Insert"];
export type WolfpackMembershipInsert =
  Database["public"]["Tables"]["memberships"]["Insert"];
export type UserLocationInsert =
  Database["public"]["Tables"]["user_locations"]["Insert"];
export type UserActivityStatusInsert =
  Database["public"]["Tables"]["user_activity_status"]["Insert"];
export type WolfpackVideoInsert =
  Database["public"]["Tables"]["content_posts"]["Insert"];
export type WolfpackPostInsert =
  Database["public"]["Tables"]["content_posts"]["Insert"];
export type WolfpackCommentInsert =
  Database["public"]["Tables"]["content_comments"]["Insert"];
export type WolfpackReactionInsert =
  Database["public"]["Tables"]["content_reactions"]["Insert"];
export type WolfpackFollowInsert =
  Database["public"]["Tables"]["social_follows"]["Insert"];
export type WolfpackSavedPostInsert =
  Database["public"]["Tables"]["wolfpack_saved_posts"]["Insert"];
export type WolfpackConversationInsert =
  Database["public"]["Tables"]["chat_conversations"]["Insert"];
export type WolfpackMessageInsert =
  Database["public"]["Tables"]["chat_messages"]["Insert"];
