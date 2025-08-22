// 🎯 MODERN WOLFPACK TYPES - COMPLETELY REWRITTEN
// Resolves all naming conflicts and provides clean, consistent interfaces

// =============================================================================
// CORE CONTENT INTERFACES
// =============================================================================

/**
 * Base content interface - foundation for all content types
 */
export interface WolfpackBaseContent {
  // Core identifiers
  id: string;
  user_id: string;

  // Content data
  caption: string;
  description?: string;

  // Engagement metrics (standardized naming)
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;

  // User interaction states (dynamic based on current user)
  user_liked?: boolean;
  user_following?: boolean;
  has_viewed?: boolean;

  // Status and visibility
  is_active: boolean;
  is_featured?: boolean;
  visibility: "public" | "wolfpack" | "private";
  allow_comments: boolean;

  // Timestamps
  created_at: string;
  updated_at?: string;
}

/**
 * User information interface - standardized across all components
 */
export interface WolfpackUser {
  id: string;
  username: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  profile_image_url?: string;
  wolfpack_status?: "active" | "inactive" | "pending";
  is_vip?: boolean;
  wolf_emoji?: string;
}

/**
 * Main feed video item interface - single source of truth
 */
export interface FeedVideoItem extends WolfpackBaseContent {
  // User information (flattened for easy access)
  username: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  profile_image_url?: string;
  wolfpack_status?: "active" | "inactive" | "pending";
  is_vip?: boolean;
  wolf_emoji?: string;

  // Video-specific content
  video_url: string | null;
  thumbnail_url?: string;

  // Media metadata
  duration_seconds?: number;
  music_name?: string;
  hashtags?: string[];

  // Location data
  location_tag?: string;
  location_lat?: number;
  location_lng?: number;

  // Trending and algorithm data
  trending_score?: number;

  // User object (for detailed user data when needed)
  user?: WolfpackUser;
}

// =============================================================================
// API RESPONSE INTERFACES
// =============================================================================

/**
 * Raw API response from backend - handles ALL naming variations
 * This is what you get from supabase queries before transformation
 */
export interface ApiVideoResponse {
  // Core data
  id: string;
  user_id?: string;

  // User data (from joins or direct fields)
  user?: Partial<WolfpackUser>;
  username?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  profile_image_url?: string;
  wolfpack_status?: string;
  is_vip?: boolean;
  wolf_emoji?: string;

  // Content
  caption?: string;
  description?: string;
  video_url?: string | null;
  thumbnail_url?: string;

  // 🔥 ENGAGEMENT METRICS - HANDLES ALL NAMING VARIATIONS
  // Standardized names (preferred)
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  views_count?: number;

  // Legacy/alternative names (for backward compatibility)
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
  content_comments_count?: number;

  // User interaction states
  user_liked?: boolean;
  user_following?: boolean;
  has_viewed?: boolean;

  // Media metadata
  duration_seconds?: number;
  duration?: number;
  music_name?: string;
  hashtags?: string[];

  // Location
  location_tag?: string;
  location_lat?: number;
  location_lng?: number;

  // Status flags
  is_active?: boolean;
  is_featured?: boolean;
  visibility?: string;
  allow_comments?: boolean;

  // Algorithm data
  trending_score?: number;

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

/**
 * Feed page wrapper for pagination
 */
export interface FeedPage {
  items: FeedVideoItem[];
  nextCursor?: string;
  hasMore: boolean;
  totalCount?: number;
}

/**
 * Feed fetch response from API
 */
export interface FetchFeedResponse {
  items: FeedVideoItem[];
  totalItems: number;
  hasMore: boolean;
  nextCursor?: string;
}

// =============================================================================
// COMPONENT PROP INTERFACES
// =============================================================================

/**
 * Props for the main WolfpackFeed wrapper component
 */
export interface WolfpackFeedProps {
  initialVideoId?: string;
  className?: string;
  userId?: string;
  limit?: number;
}

/**
 * Props for TikTokStyleFeed display component
 */
export interface TikTokStyleFeedProps {
  content_posts: FeedVideoItem[]; // Note: component expects 'content_posts'
  currentUser?: WolfpackUser | null;
  onLike: (videoId: string) => void;
  onComment: (videoId: string) => void;
  onShare: (videoId: string) => void;
  onFollow: (userId: string) => void;
  onDelete?: (videoId: string) => void;
  onCreatePost?: () => void;
  onLoadMore?: () => Promise<FeedVideoItem[]>;
  hasMore?: boolean;
  isLoading?: boolean;
  userLikes?: Set<string>;
  initialVideoId?: string;
  className?: string;
}

/**
 * Feed state interface for component state management
 */
export interface FeedState {
  videos: FeedVideoItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  userLikes: Set<string>;
  currentIndex: number;
}

/**
 * Video interaction handlers type
 */
export interface VideoInteractionHandlers {
  onLike: (videoId: string) => void;
  onComment: (videoId: string) => void;
  onShare: (videoId: string) => void;
  onFollow?: (userId: string) => void;
  onDelete?: (videoId: string) => void;
}

// =============================================================================
// UTILITY AND SERVICE INTERFACES
// =============================================================================

/**
 * Service response wrapper
 */
export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
  cursor?: string;
}

/**
 * Location information
 */
export interface LocationInfo {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

/**
 * Social stats for users
 */
export interface SocialStats {
  followers: number;
  following: number;
  posts: number;
  likes: number;
}

// =============================================================================
// TRANSFORMATION FUNCTIONS
// =============================================================================

/**
 * 🎯 MAIN TRANSFORM FUNCTION - Converts API response to clean FeedVideoItem
 * This handles ALL naming conflicts and provides consistent data structure
 */
export function transformToFeedVideoItem(
  apiData: ApiVideoResponse,
): FeedVideoItem {
  // Example transformation logic, adjust as needed for your actual data
  return {
    id: apiData.id,
    user_id: apiData.user_id ?? "",
    caption: apiData.caption ?? "",
    description: apiData.description,
    likes_count: apiData.likes_count ?? apiData.like_count ?? 0,
    comments_count: apiData.comments_count ?? apiData.comment_count ??
      apiData.content_comments_count ?? 0,
    shares_count: apiData.shares_count ?? apiData.share_count ?? 0,
    views_count: apiData.views_count ?? apiData.view_count ?? 0,
    user_liked: apiData.user_liked,
    user_following: apiData.user_following,
    has_viewed: apiData.has_viewed,
    is_active: apiData.is_active ?? true,
    is_featured: apiData.is_featured,
    visibility: (apiData.visibility as "public" | "wolfpack" | "private") ??
      "public",
    allow_comments: apiData.allow_comments ?? true,
    created_at: apiData.created_at ?? "",
    updated_at: apiData.updated_at,
    username: apiData.username ?? apiData.user?.username ?? "",
    display_name: apiData.display_name ?? apiData.user?.display_name,
    first_name: apiData.first_name ?? apiData.user?.first_name,
    last_name: apiData.last_name ?? apiData.user?.last_name,
    avatar_url: apiData.avatar_url ?? apiData.user?.avatar_url,
    profile_image_url: apiData.profile_image_url ??
      apiData.user?.profile_image_url,
    wolfpack_status:
      (apiData.wolfpack_status as "active" | "inactive" | "pending") ??
        (apiData.user?.wolfpack_status as "active" | "inactive" | "pending"),
    is_vip: apiData.is_vip ?? apiData.user?.is_vip,
    wolf_emoji: apiData.wolf_emoji ?? apiData.user?.wolf_emoji,
    video_url: apiData.video_url ?? null,
    thumbnail_url: apiData.thumbnail_url,
    duration_seconds: apiData.duration_seconds ?? apiData.duration,
    music_name: apiData.music_name,
    hashtags: apiData.hashtags,
    location_tag: apiData.location_tag,
    location_lat: apiData.location_lat,
    location_lng: apiData.location_lng,
    trending_score: apiData.trending_score,
    user: apiData.user ? { ...apiData.user } as WolfpackUser : undefined,
  };
}
