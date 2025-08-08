// Comprehensive TypeScript interfaces for the notification system

export interface TopicSubscription {
  id?: string;
  token: string;
  topic: string;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationTopic {
  topic_key: string;
  display_name: string;
  description: string | null;
  requires_role: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DeviceToken {
  id: string;
  token: string;
  device_type: 'ios' | 'android' | 'web';
  device_name?: string | null;
  app_version?: string | null;
  is_active: boolean;
  last_used_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PushNotification {
  id?: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  topic?: string | null;
  device_token?: string | null;
  sent_at?: string | null;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationPreferences {
  id: string;
  subscribed_topics: string[];
  fcm_token?: string;
  device_type?: 'ios' | 'android' | 'web';
  updated_at?: string;
}

// Firebase Cloud Messaging types
export interface FCMTokenData {
  token: string;
  deviceType: 'ios' | 'android' | 'web';
  deviceName?: string;
  appVersion?: string;
}

// Notification permission states
export type NotificationPermission = 'default' | 'granted' | 'denied';

// Topic subscription result
export interface SubscriptionResult {
  success: boolean;
  error?: Error | string | null;
  message?: string;
}

// Available topics result
export interface TopicsResult {
  topics: NotificationTopic[];
  error?: Error | string | null;
}

// User role types for topic access control
export type UserRole = 'customer' | 'bartender' | 'dj' | 'admin' | 'staff';

// Location-based topic types
export type WolfPackLocation = 'salem' | 'portland';

// Notification types for different contexts
export interface NotificationContextData {
  type: 'order' | 'wolfpack' | 'event' | 'promotion' | 'announcement' | 'alert';
  action?: string;
  url?: string;
  data?: Record<string, unknown>;
}

// Device platform detection
export interface DeviceInfo {
  type: 'ios' | 'android' | 'web';
  name: string;
  version?: string;
  isStandalone?: boolean; // For PWA detection
}
