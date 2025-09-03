// =============================================================================
// SOCIAL SERVICE TYPES - SIDE HUSTLE APP
// =============================================================================

import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';

// Extract types from the fresh database schema
export type User = Tables<'users'>;
export type ContentPost = Tables<'content_posts'>;
export type ContentComment = Tables<'content_comments'>;
export type UserPostInteraction = Tables<'user_post_interactions'>;
export type SocialFollow = Tables<'social_follows'>;
export type SocialBlock = Tables<'social_blocks'>;

// Insert and update types for mutations
export type ContentPostInsert = TablesInsert<'content_posts'>;
export type ContentCommentInsert = TablesInsert<'content_comments'>;
export type UserPostInteractionInsert = TablesInsert<'user_post_interactions'>;

// =============================================================================
// SOCIAL FEED TYPES
// =============================================================================

// Enhanced FeedVideoItem that includes both database fields and computed values
export interface FeedVideoItem {
  // Core post data from content_posts table
  id: string;
  user_id: string;
  caption: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  post_type: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  created_at: string;
  updated_at: string | null;
  is_active: boolean;
  
  // Extended content fields
  title?: string | null;
  description?: string | null;
  tags?: string[] | null;
  duration_seconds?: number | null;
  aspect_ratio?: string | null;
  processing_status?: string | null;
  metadata?: Record<string, unknown> | null;
  is_featured?: boolean | null;
  visibility?: string | null;
  allow_comments?: boolean | null;
  allow_duets?: boolean | null;
  allow_stitches?: boolean | null;
  is_ad?: boolean | null;
  source?: string | null;
  trending_score?: number | null;
  algorithm_boost?: number | null;
  images?: string[] | null;
  featured_at?: string | null;
  location_tag?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  music_id?: string | null;
  music_name?: string | null;
  effect_id?: string | null;
  effect_name?: string | null;
  slug?: string | null;
  seo_description?: string | null;
  
  // User information (joined from users table)
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
  is_verified?: boolean | null;
  
  // Computed/derived fields for UI
  is_liked?: boolean;
  is_following?: boolean;
  can_delete?: boolean;
  
  // Legacy compatibility fields
  content_type?: string; // Maps to post_type
  duration?: number; // Maps to duration_seconds  
  hashtags?: string[]; // Maps to tags
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
 * Transform database post with user info to feed video item
 */
export function transformToFeedVideoItem(
  post: ContentPost & { 
    users?: User | User[] | null;
    user?: User | null; // Fallback for different query structures
  }
): FeedVideoItem {
  // Handle both array and single user joins from Supabase
  const user = Array.isArray(post.users) ? post.users[0] : (post.users || post.user);
  
  return {
    // Core post data - direct mapping from database
    id: post.id,
    user_id: post.user_id || '',
    caption: post.caption,
    video_url: post.video_url,
    thumbnail_url: post.thumbnail_url,
    post_type: post.post_type,
    likes_count: post.likes_count || 0,
    comments_count: post.comments_count || 0,
    shares_count: post.shares_count || 0,
    views_count: post.views_count || 0,
    created_at: post.created_at || new Date().toISOString(),
    updated_at: post.updated_at,
    is_active: post.is_active ?? true,
    
    // Extended content fields - direct mapping
    title: post.title,
    description: post.description,
    tags: post.tags,
    duration_seconds: post.duration_seconds,
    aspect_ratio: post.aspect_ratio,
    processing_status: post.processing_status,
    metadata: post.metadata,
    is_featured: post.is_featured,
    visibility: post.visibility,
    allow_comments: post.allow_comments,
    allow_duets: post.allow_duets,
    allow_stitches: post.allow_stitches,
    is_ad: post.is_ad,
    source: post.source,
    trending_score: post.trending_score,
    algorithm_boost: post.algorithm_boost,
    images: post.images,
    featured_at: post.featured_at,
    location_tag: post.location_tag,
    location_lat: post.location_lat,
    location_lng: post.location_lng,
    music_id: post.music_id,
    music_name: post.music_name,
    effect_id: post.effect_id,
    effect_name: post.effect_name,
    slug: post.slug,
    seo_description: post.seo_description,
    
    // User information with fallbacks
    username: user?.username || user?.email?.split('@')[0] || 'anonymous',
    display_name: user?.display_name || user?.first_name,
    avatar_url: user?.avatar_url || user?.profile_image_url,
    is_verified: user?.is_verified,
    
    // Computed/derived fields - will be set by service layer
    is_liked: false,
    is_following: false,
    can_delete: false,
    
    // Legacy compatibility fields
    content_type: post.post_type || 'video',
    duration: post.duration_seconds || undefined,
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