/**
 * Unified Wolfpack Types
 * Central type definitions for all wolfpack-related features
 */

export interface ItemCustomization {
  [key: string]: string | number | boolean;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  description?: string;
  image_url?: string;
  customizations?: ItemCustomization;
}

export function createCartItem(
  id: string,
  name: string,
  price: number,
  quantity: number = 1,
  category: string = 'default',
  customizations?: ItemCustomization
): CartItem {
  return {
    id,
    name,
    price,
    quantity,
    category,
    customizations
  };
}

export interface WolfpackUser {
  id: string;
  display_name: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  location: string | null;
  wolfpack_status: string | null;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
}

export interface WolfpackVideo {
  id: string;
  user_id: string;
  caption: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  location_tag: string | null;
  is_active: boolean;
  view_count: number;
  user?: WolfpackUser;
  liked_by_user?: boolean;
}

export interface WolfpackComment {
  id: string;
  user_id: string;
  video_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  likes_count: number;
  user?: WolfpackUser;
  replies?: WolfpackComment[];
}

export interface NotificationPreferences {
  events?: boolean;
  chatMessages?: boolean;
  socialInteractions?: boolean;
  announcements?: boolean;
  marketing?: boolean;
}