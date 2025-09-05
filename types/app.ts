// =============================================================================
// SIDE HUSTLE APP - CORE TYPES
// =============================================================================

export interface User {
  id: string;
  email: string;
  auth_id: string;
  role: 'admin' | 'user';
  first_name?: string;
  last_name?: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  profile_image_url?: string;
  phone?: string;
  account_status: 'active' | 'inactive' | 'pending' | 'suspended';
  settings?: UserSettings;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  notifications?: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
    marketing?: boolean;
    orderUpdates?: boolean;
    socialUpdates?: boolean;
  };
  privacy?: {
    profileVisible?: boolean;
    showActivity?: boolean;
    allowMessages?: boolean;
  };
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    timezone?: string;
  };
}

// =============================================================================
// CONTENT & SOCIAL TYPES
// =============================================================================

export interface ContentPost {
  id: string;
  user_id: string;
  caption: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count?: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface ContentComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  like_count: number;
  created_at: string;
  updated_at: string;
  user?: User;
  replies?: ContentComment[];
}

export interface ContentLike {
  id: string;
  user_id: string;
  post_id?: string;
  comment_id?: string;
  created_at: string;
}

// =============================================================================
// FEED & VIDEO TYPES
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
}

export interface VideoUploadData {
  file: File | Blob;
  caption: string;
  duration?: number;
  thumbnail?: File | Blob;
}

// =============================================================================
// MESSAGING TYPES  
// =============================================================================

export interface Conversation {
  id: string;
  participants: string[];
  title?: string;
  type: 'direct' | 'group';
  last_message?: Message;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'file';
  media_url?: string;
  read_by: string[];
  created_at: string;
  updated_at: string;
  sender?: User;
}

// =============================================================================
// MENU & RESTAURANT TYPES
// =============================================================================

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  is_available: boolean;
  preparation_time?: number;
  allergens?: string[];
  dietary_info?: string[];
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  items?: MenuItem[];
}


// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'social' | 'booking';
  read: boolean;
  action_url?: string;
  data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// =============================================================================
// FCM & PUSH NOTIFICATION TYPES
// =============================================================================

export interface FcmDeviceInfo {
  device_id: string;
  userAgent?: string;
  platform?: string;
  language?: string;
  screen?: {
    width: number;
    height: number;
  };
}

export interface FcmTokenState {
  token: string | null;
  permission: NotificationPermission | null;
  isLoading: boolean;
  error: string | null;
  lastRefresh: number;
}

export interface FcmMessagePayload {
  notification?: {
    title?: string;
    body?: string;
    icon?: string;
    image?: string;
  };
  data?: Record<string, string>;
  fcmOptions?: {
    link?: string;
  };
}

export interface FcmTokenRegistrationParams {
  p_token: string;
  p_platform: 'web' | 'ios' | 'android';
  p_device_info: FcmDeviceInfo;
}

export interface UseFcmTokenReturn {
  token: string | null;
  notificationPermissionStatus: NotificationPermission | null;
  isLoading: boolean;
  error: string | null;
  registerToken: () => Promise<string | null>;
  hasPermission: boolean;
  isTokenValid: boolean;
  refreshToken: () => Promise<string | null>;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// =============================================================================
// FORM & INPUT TYPES
// =============================================================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  username?: string;
  phone?: string;
  settings?: Partial<UserSettings>;
}


// =============================================================================
// UTILITY TYPES
// =============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingAction<T = unknown> {
  state: LoadingState;
  data?: T;
  error?: string;
}

export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  field: string;
  order: SortOrder;
  label: string;
}

export interface FilterOption {
  key: string;
  value: unknown;
  label: string;
}

// =============================================================================
// COMPONENT PROP TYPES
// =============================================================================

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

// =============================================================================
// THEME & STYLING TYPES
// =============================================================================

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  muted: string;
  accent: string;
  destructive: string;
  border: string;
}

export interface ThemeConfig {
  colors: ThemeColors;
  fonts: {
    default: string;
    heading: string;
    mono: string;
  };
  spacing: Record<string, string>;
  breakpoints: Record<string, string>;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export interface AppError {
  code?: string;
  message: string;
  details?: unknown;
  statusCode?: number;
}

export interface ValidationError extends AppError {
  field?: string;
  value?: unknown;
}

export interface NetworkError extends AppError {
  url?: string;
  method?: string;
  status?: number;
}