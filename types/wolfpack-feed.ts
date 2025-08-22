// Consolidated feed video item interface
// This is the single source of truth for all feed components
export interface FeedVideoItem {
  // Core identifiers
  id: string;
  user_id: string;
  
  // User information
  username: string;
  display_name?: string;
  avatar_url?: string;
  profile_image_url?: string;
  wolfpack_status?: string;
  
  // Video content
  video_url: string | null;
  thumbnail_url?: string;
  caption: string;
  description?: string;
  
  // Engagement metrics
  likes_count: number;
  comments_count: number;  // Standardized name
  shares_count: number;
  views_count: number;
  
  // User interaction states
  user_liked?: boolean;
  user_following?: boolean;
  has_viewed?: boolean;
  
  // Metadata
  hashtags?: string[];
  music_name?: string;
  duration_seconds?: number;
  location_tag?: string;
  
  // Status flags
  is_featured?: boolean;
  visibility?: string;
  allow_comments?: boolean;
  is_active?: boolean;
  
  // Timestamps
  created_at: string;
  updated_at?: string;
}

// Legacy interface for backward compatibility (deprecated)
export interface WolfpackVideoItem extends FeedVideoItem {
  content_comments_count?: number; // Maps to comments_count
  view_count?: number; // Maps to views_count
}

// Page wrapper for feed items
export interface FeedPage {
  items: FeedVideoItem[];
  nextCursor?: string;
  hasMore?: boolean;
  totalCount?: number;
}

// Feed component props
export interface FeedProps {
  videos: FeedVideoItem[];
  currentUser: any;
  onLike: (videoId: string) => void;
  onComment: (videoId: string) => void;
  onShare: (videoId: string) => void;
  onFollow?: (userId: string) => void;
  onDelete?: (videoId: string) => void;
  initialVideoId?: string;
  className?: string;
}

// Feed state interface
export interface FeedState {
  videos: FeedVideoItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  userLikes: Set<string>;
  currentIndex: number;
}