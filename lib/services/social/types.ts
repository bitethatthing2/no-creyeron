// =============================================================================
// SOCIAL SERVICE TYPES - SIDE HUSTLE APP
// =============================================================================

import type { Tables } from '@/types/database.types';

// Extract types from the database
export type User = Tables<'users'>;
export type ContentPost = Tables<'content_posts'>;
export type ContentComment = Tables<'content_comments'>;

// =============================================================================
// SOCIAL FEED TYPES
// =============================================================================

export interface FeedVideoItem {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  caption: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  is_liked?: boolean;
  is_following?: boolean;
  can_delete?: boolean;
  is_verified?: boolean;
  music_name?: string;
  hashtags?: string[];
}

export interface SocialFeedRequest {
  limit?: number;
  offset?: number;
  type?: 'for-you' | 'following' | 'trending';
  user_id?: string;
}

export interface SocialFeedResponse {
  success: boolean;
  data: FeedVideoItem[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  };
  error?: string;
}

// =============================================================================
// POST CREATION TYPES
// =============================================================================

export interface CreatePostRequest {
  caption: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
}

export interface CreatePostResponse {
  success: boolean;
  data?: ContentPost;
  error?: string;
}

// =============================================================================
// SOCIAL INTERACTIONS
// =============================================================================

export interface LikeActionRequest {
  post_id: string;
  action: 'like' | 'unlike';
}

export interface LikeActionResponse {
  success: boolean;
  data?: {
    is_liked: boolean;
    like_count: number;
  };
  error?: string;
}

export interface FollowActionRequest {
  user_id: string;
  action: 'follow' | 'unfollow';
}

export interface FollowActionResponse {
  success: boolean;
  data?: {
    is_following: boolean;
    follower_count: number;
  };
  error?: string;
}

export interface ShareActionRequest {
  post_id: string;
  platform?: 'native' | 'copy-link' | 'social-media';
}

export interface ShareActionResponse {
  success: boolean;
  data?: {
    share_url: string;
    share_count: number;
  };
  error?: string;
}

// =============================================================================
// COMMENTS TYPES
// =============================================================================

export interface GetCommentsRequest {
  post_id: string;
  limit?: number;
  offset?: number;
  sort?: 'newest' | 'oldest' | 'popular';
}

export interface GetCommentsResponse {
  success: boolean;
  data: ContentComment[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  };
  error?: string;
}

export interface CreateCommentRequest {
  post_id: string;
  content: string;
  parent_comment_id?: string;
}

export interface CreateCommentResponse {
  success: boolean;
  data?: ContentComment;
  error?: string;
}

// =============================================================================
// USER PROFILE TYPES
// =============================================================================

export interface UserProfileRequest {
  user_id: string;
  include_posts?: boolean;
  posts_limit?: number;
}

export interface UserProfileResponse {
  success: boolean;
  data?: {
    user: User;
    posts?: FeedVideoItem[];
    stats: {
      posts_count: number;
      followers_count: number;
      following_count: number;
      likes_received: number;
    };
    is_following?: boolean;
    is_own_profile: boolean;
  };
  error?: string;
}

// =============================================================================
// MEDIA UPLOAD TYPES
// =============================================================================

export interface MediaUploadRequest {
  file: File | Blob;
  type: 'video' | 'image';
  filename?: string;
}

export interface MediaUploadResponse {
  success: boolean;
  data?: {
    url: string;
    public_url: string;
    file_path: string;
    file_size: number;
    content_type: string;
  };
  error?: string;
}

// =============================================================================
// SEARCH TYPES
// =============================================================================

export interface SearchRequest {
  query: string;
  type?: 'users' | 'posts' | 'hashtags' | 'all';
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  success: boolean;
  data?: {
    users?: User[];
    posts?: FeedVideoItem[];
    hashtags?: string[];
  };
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  };
  error?: string;
}

// =============================================================================
// ANALYTICS TYPES
// =============================================================================

export interface PostAnalyticsRequest {
  post_id: string;
  time_range?: '24h' | '7d' | '30d' | '90d';
}

export interface PostAnalyticsResponse {
  success: boolean;
  data?: {
    views: {
      total: number;
      unique: number;
      by_hour?: { hour: number; count: number }[];
      by_day?: { date: string; count: number }[];
    };
    engagement: {
      likes: number;
      comments: number;
      shares: number;
      saves: number;
    };
    audience: {
      demographics?: {
        age_groups: { range: string; percentage: number }[];
        locations: { city: string; percentage: number }[];
      };
    };
  };
  error?: string;
}

// =============================================================================
// CONTENT MODERATION TYPES
// =============================================================================

export interface ReportContentRequest {
  post_id?: string;
  comment_id?: string;
  user_id?: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'copyright' | 'other';
  description?: string;
}

export interface ReportContentResponse {
  success: boolean;
  data?: {
    report_id: string;
    status: 'pending' | 'reviewed' | 'resolved';
  };
  error?: string;
}

// =============================================================================
// TRANSFORM UTILITIES
// =============================================================================

/**
 * Transform database post to feed video item
 */
export function transformToFeedVideoItem(post: ContentPost & { user?: User }): FeedVideoItem {
  return {
    id: post.id,
    user_id: post.user_id || '',
    username: post.user?.username || post.user?.email?.split('@')[0] || 'user',
    display_name: post.user?.display_name || post.user?.first_name || undefined,
    avatar_url: post.user?.avatar_url || post.user?.profile_image_url || undefined,
    caption: post.caption || '',
    video_url: post.video_url || undefined,
    thumbnail_url: post.thumbnail_url || undefined,
    duration: post.duration_seconds || undefined,
    views_count: post.views_count || 0,
    likes_count: post.likes_count || 0,
    comments_count: post.comments_count || 0,
    shares_count: post.shares_count || 0,
    created_at: post.created_at || new Date().toISOString(),
    is_liked: false, // Will be populated by service
    is_following: false, // Will be populated by service
    can_delete: false, // Will be populated by service
    is_verified: post.user?.is_verified || false,
    music_name: post.music_name || undefined,
    hashtags: post.tags || undefined,
  };
}

/**
 * Transform user data for social display
 */
export function transformUserForSocial(user: User): Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'> {
  return {
    id: user.id,
    username: user.username || user.email?.split('@')[0] || 'user',
    display_name: user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || null,
    avatar_url: user.avatar_url || user.profile_image_url || null,
  };
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

export interface PostValidation {
  caption: {
    minLength: number;
    maxLength: number;
    required: boolean;
  };
  video: {
    maxSize: number; // in bytes
    allowedFormats: string[];
    maxDuration: number; // in seconds
  };
  thumbnail: {
    maxSize: number;
    allowedFormats: string[];
    dimensions: {
      minWidth: number;
      minHeight: number;
      maxWidth: number;
      maxHeight: number;
    };
  };
}

export const DEFAULT_POST_VALIDATION: PostValidation = {
  caption: {
    minLength: 1,
    maxLength: 500,
    required: true,
  },
  video: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedFormats: ['mp4', 'webm', 'mov'],
    maxDuration: 180, // 3 minutes
  },
  thumbnail: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    dimensions: {
      minWidth: 100,
      minHeight: 100,
      maxWidth: 1920,
      maxHeight: 1080,
    },
  },
};

// =============================================================================
// CONSTANTS
// =============================================================================

// =============================================================================
// COMPONENT TYPES (alias for backward compatibility)
// =============================================================================

export type SocialVideoItem = FeedVideoItem;

// =============================================================================
// CONSTANTS
// =============================================================================

export const SOCIAL_CONSTANTS = {
  FEED_PAGE_SIZE: 20,
  COMMENTS_PAGE_SIZE: 50,
  MAX_SEARCH_RESULTS: 100,
  RATE_LIMITS: {
    POSTS_PER_HOUR: 10,
    LIKES_PER_MINUTE: 30,
    COMMENTS_PER_MINUTE: 5,
    FOLLOWS_PER_HOUR: 100,
  },
  MEDIA_SETTINGS: {
    VIDEO_QUALITY_PRESETS: ['480p', '720p', '1080p'],
    THUMBNAIL_SIZES: ['small', 'medium', 'large'],
    SUPPORTED_CODECS: ['h264', 'vp9', 'av1'],
  },
} as const;