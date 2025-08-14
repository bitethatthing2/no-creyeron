// Shared type definitions for wolfpack feed components
export interface WolfpackVideoItem {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  caption: string;
  video_url: string | null;
  thumbnail_url?: string; // Changed from string | null to string | undefined
  likes_count: number;
  wolfpack_comments_count: number;
  shares_count: number;
  created_at: string;
  music_name?: string;
  hashtags?: string[];
  location?: string;
  is_following?: boolean;
  has_viewed?: boolean;
  user_liked?: boolean;
  view_count?: number;
  location_tag?: string | null;
}

export interface FeedPage {
  items: WolfpackVideoItem[];
}