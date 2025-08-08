export interface PostCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (post: WolfpackPost) => void;
}

export interface WolfpackPost {
  id: string;
  user_id: string;
  title?: string;
  description?: string;
  caption?: string;
  video_url: string | null;
  thumbnail_url: string | null;
  duration?: number | null;
  view_count: number;
  like_count: number;
  wolfpack_comments_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface FeedVideo {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  caption: string;
  video_url: string;
  thumbnail_url?: string;
  likes_count: number;
  wolfpack_comments_count: number;
  shares_count: number;
  created_at: string;
  music_name: string;
  hashtags: string[];
  view_count: number;
  user?: {
    id: string;
    username?: string;
    display_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    profile_image_url?: string;
    wolf_emoji?: string;
  };
}

export interface User {
  id: string;
  auth_id: string;
  email: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}
