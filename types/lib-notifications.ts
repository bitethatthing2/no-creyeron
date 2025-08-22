// Unified notification types for the entire application
// These types match the unified_notifications table in Supabase

// Define specific metadata types for different notification contexts
export interface BaseMetadata {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | undefined
    | string[]
    | number[];
}

export interface OrderMetadata extends BaseMetadata {
  order_id?: string;
  order_number?: string;
  table_number?: number;
  items_count?: number;
  total_amount?: number;
  status?: string;
}

export interface WolfpackMetadata extends BaseMetadata {
  post_id?: string;
  post_type?: "video" | "image" | "text";
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  mentioned_users?: string[];
}

export interface EventMetadata extends BaseMetadata {
  event_id?: string;
  event_name?: string;
  event_date?: string;
  event_time?: string;
  location?: string;
  dj_name?: string;
}

export interface SystemMetadata extends BaseMetadata {
  action?: string;
  severity?: "low" | "medium" | "high";
  affected_service?: string;
}

export type NotificationMetadata =
  | OrderMetadata
  | WolfpackMetadata
  | EventMetadata
  | SystemMetadata
  | BaseMetadata;

export interface Notification {
  id: string; // uuid in database
  recipient_id: string; // This is the user_id who receives the notification
  type: string; // Text field - can be any notification type
  title: string;
  body: string; // This is the message content
  actor_id?: string | null; // User who triggered the notification
  entity_type?: string | null; // Type of entity (e.g., 'order', 'wolfpack_post')
  entity_id?: string | null; // ID of the related entity
  action_url?: string | null; // URL to navigate to
  image_url?: string | null; // Optional image for the notification
  is_read: boolean;
  read_at?: string | null;
  is_archived?: boolean;
  archived_at?: string | null;
  push_sent?: boolean;
  push_sent_at?: string | null;
  push_error?: string | null;
  priority?: "low" | "normal" | "high";
  expires_at?: string | null;
  metadata?: NotificationMetadata;
  created_at: string;
  updated_at: string;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  dismissAllNotifications: () => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
}

// Common notification types used in your app
export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "order_new"
  | "order_ready"
  | "wolfpack"
  | "wolfpack_like"
  | "wolfpack_comment"
  | "wolfpack_follow"
  | "wolfpack_mention"
  | "dj_event"
  | "food_ready"
  | "welcome"
  | "broadcast"
  | "system";

// For creating notifications using the create_notification function
export interface CreateNotificationData {
  recipient_id: string; // The user who will receive the notification
  type: NotificationType | string; // Can be custom types too
  title: string;
  body: string; // The message content
  actor_id?: string | null; // User who triggered the notification
  entity_type?: string | null; // e.g., 'wolfpack_video', 'order'
  entity_id?: string | null; // ID of related entity
  action_url?: string | null; // Where to navigate when clicked
  metadata?: NotificationMetadata; // Properly typed metadata
}

// Simplified version for basic notifications
export interface CreateSimpleNotificationData {
  recipient_id: string;
  message: string; // Maps to body
  type: NotificationType | string;
  link?: string | null; // Maps to action_url
  metadata?: NotificationMetadata;
}

// For the notifications_get function
export interface WolfpackNotificationParams {
  limit?: number;
  unread_only?: boolean;
}

// Type preferences for each notification type
export interface NotificationChannelPreferences {
  push?: boolean;
  email?: boolean;
  sms?: boolean;
  in_app?: boolean;
}

// Notification preferences
export interface NotificationPreferences {
  push_enabled?: boolean;
  email_enabled?: boolean;
  sms_enabled?: boolean;
  in_app_enabled?: boolean;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  type_preferences?: Partial<
    Record<NotificationType, NotificationChannelPreferences>
  >;
  max_notifications_per_day?: number;
  max_notifications_per_hour?: number;
  timezone?: string;
}

// Push notification data structure
export interface PushNotificationData {
  notification_id?: string;
  type?: NotificationType;
  entity_type?: string;
  entity_id?: string;
  action_url?: string;
  custom_data?: BaseMetadata;
}

// For admin sending push notifications
export interface AdminPushNotificationData {
  title: string;
  body: string;
  target_type: "all" | "specific" | "role";
  target_users?: string[];
  target_role?: string;
  data?: PushNotificationData;
}
