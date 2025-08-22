// Firebase-related types for FCM integration

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface FcmMessagePayload {
  notification?: {
    title?: string;
    body?: string;
    image?: string;
    icon?: string;
    badge?: string;
    clickAction?: string;
  };
  data?: {
    [key: string]: string;
  } & {
    title?: string;
    body?: string;
    image?: string;
    link?: string;
    type?: string;
    action?: string;
    conversationId?: string; // Fixed camelCase
    orderId?: string;
    wolfpackId?: string;
  };
  fcmOptions?: {
    link?: string;
    analyticsLabel?: string;
  };
  from?: string;
  messageId?: string;
  collapseKey?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  image?: string;
  icon?: string;
  badge?: string;
  data?: {
    [key: string]: string;
  };
  link?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
  timestamp?: number;
}

export interface DeviceTokenInfo {
  token: string;
  platform: "web" | "ios" | "android" | "windows" | "mac" | "linux" | "unknown";
  isActive: boolean;
  lastUsed: string;
  userAgent?: string;
  deviceName?: string;
  deviceModel?: string;
  appVersion?: string;
}

export interface TopicSubscription {
  token: string;
  topic: string;
  conversationId?: string; // Fixed camelCase
  subscribedAt: string;
}

export interface NotificationTopic {
  key: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  requiresRole?: ValidRole; // Using proper role type
  requiresVip?: boolean; // Added VIP flag requirement
  requiresWolfpackStatus?: WolfpackStatus; // Added wolfpack status requirement
}

export interface FcmError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface FcmResponse {
  success: boolean;
  messageId?: string;
  error?: FcmError;
  simulated?: boolean;
}

export interface BulkNotificationResult {
  successCount: number;
  failureCount: number;
  responses: FcmResponse[];
  invalidTokens: string[];
}

// Valid roles from backend
export type ValidRole = "admin" | "bartender" | "user";

// Wolfpack status types
export type WolfpackStatus = "pending" | "active" | "inactive" | "suspended";

// Wolfpack tier types
export type WolfpackTier = "basic" | "premium" | "vip" | "permanent";

// Notification permission states
export type NotificationPermission = "default" | "granted" | "denied";

// Service worker message types
export interface ServiceWorkerMessage {
  type: "FCM_MESSAGE" | "NOTIFICATION_CLICK" | "BACKGROUND_SYNC";
  payload: Record<string, unknown>;
}

// Push notification subscription
export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Wolfpack-specific notification types
export interface WolfpackNotificationData {
  type:
    | "wolfpack_join"
    | "wolfpack_leave"
    | "wolfpack_message"
    | "wolfpack_order"
    | "wolfpack_event"
    | "wolfpack_broadcast"; // Added for admin/VIP broadcasts
  wolfpackId: string;
  conversationId?: string; // Fixed camelCase
  userName?: string;
  message?: string;
  timestamp: string;
  isVipMessage?: boolean; // Added VIP indicator
}

// Order notification types
export interface OrderNotificationData {
  type: "order_placed" | "order_ready" | "order_completed" | "order_cancelled";
  orderId: string;
  orderNumber: number;
  customerName?: string;
  status: string;
  estimatedTime?: number;
  timestamp: string;
  bartenderId?: string; // Added bartender reference
}

// Event notification types
export interface EventNotificationData {
  type:
    | "event_created"
    | "event_updated"
    | "event_cancelled"
    | "event_reminder"
    | "broadcast_announcement"; // Added for admin/VIP broadcasts
  eventId: string;
  eventTitle: string;
  eventDate: string;
  location?: string;
  timestamp: string;
  broadcasterId?: string; // ID of admin/VIP who sent broadcast
  isVipBroadcast?: boolean; // Flag for VIP broadcasts
}

// Admin broadcast notification types
export interface BroadcastNotificationData {
  type: "admin_broadcast" | "vip_broadcast" | "system_broadcast";
  broadcastId: string;
  title: string;
  message: string;
  priority: "low" | "normal" | "high" | "urgent";
  senderId: string;
  senderRole: ValidRole;
  senderIsVip: boolean;
  timestamp: string;
  expiresAt?: string;
}

// Combined notification data types
export type NotificationData =
  | WolfpackNotificationData
  | OrderNotificationData
  | EventNotificationData
  | BroadcastNotificationData
  | { [key: string]: string };

// FCM token registration states
export type TokenRegistrationState =
  | "idle"
  | "requesting_permission"
  | "registering_token"
  | "subscribing_to_topics"
  | "completed"
  | "error";

// Notification categories for topic management
export const NOTIFICATION_TOPICS = {
  // General topics
  ALL_DEVICES: "all_devices",
  ALL_USERS: "all_users",

  // Location-based topics
  WOLFPACK_MEMBERS: "wolfpack_members",
  WOLFPACK_SALEM: "wolfpack_salem",
  WOLFPACK_PORTLAND: "wolfpack_portland",

  // Role-based topics (aligned with backend)
  ADMINS: "admins",
  BARTENDERS: "bartenders",
  VIP_MEMBERS: "vip_members", // For users with is_vip flag

  // Feature-based topics
  ORDERS: "orders",
  EVENTS: "events",
  PROMOTIONS: "promotions",
  BROADCASTS: "broadcasts", // For admin/VIP broadcasts

  // Priority topics
  EMERGENCY: "emergency",
  SYSTEM_ALERTS: "system_alerts",
} as const;

export type NotificationTopicKey =
  typeof NOTIFICATION_TOPICS[keyof typeof NOTIFICATION_TOPICS];

// Topic eligibility based on user attributes
export interface TopicEligibility {
  topic: NotificationTopicKey;
  eligible: boolean;
  reason?: string;
  requiredRole?: ValidRole;
  requiredVip?: boolean;
  requiredWolfpackStatus?: WolfpackStatus;
}

// User notification preferences
export interface UserNotificationPreferences {
  userId: string;
  role: ValidRole;
  isVip: boolean;
  wolfpackStatus: WolfpackStatus;
  wolfpackTier: WolfpackTier;
  enabledTopics: NotificationTopicKey[];
  mutedTopics: NotificationTopicKey[];
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    timezone: string;
  };
  preferences: {
    orders: boolean;
    events: boolean;
    broadcasts: boolean;
    promotions: boolean;
    socialInteractions: boolean;
    systemAlerts: boolean;
  };
}

// Browser capability checks
export interface BrowserCapabilities {
  supportsNotifications: boolean;
  supportsServiceWorker: boolean;
  supportsPushManager: boolean;
  supportsIndexedDB: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
}

// FCM initialization options
export interface FcmInitOptions {
  vapidKey: string;
  serviceWorkerPath?: string;
  enableLogging?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  userRole?: ValidRole;
  isVip?: boolean;
  wolfpackStatus?: WolfpackStatus;
}

// Notification display options
export interface NotificationDisplayOptions {
  showInForeground: boolean;
  playSound: boolean;
  vibrate: boolean;
  showBadge: boolean;
  requireInteraction: boolean;
  silent: boolean;
  priority?: "low" | "normal" | "high";
}

// Push notification statistics
export interface NotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalClicked: number;
  deliveryRate: number;
  clickRate: number;
  lastSent?: string;
  byRole?: {
    admin: number;
    bartender: number;
    user: number;
  };
  byVipStatus?: {
    vip: number;
    regular: number;
  };
}

// Helper functions for role/permission checks
export interface NotificationPermissionHelpers {
  canSendBroadcast: (role: ValidRole, isVip: boolean) => boolean;
  canManageOrders: (role: ValidRole) => boolean;
  canReceiveVipNotifications: (
    isVip: boolean,
    wolfpackTier: WolfpackTier,
  ) => boolean;
  getEligibleTopics: (
    role: ValidRole,
    isVip: boolean,
    wolfpackStatus: WolfpackStatus,
  ) => NotificationTopicKey[];
}

// Notification routing based on user attributes
export interface NotificationRouting {
  targetRoles?: ValidRole[];
  targetVipOnly?: boolean;
  targetWolfpackStatus?: WolfpackStatus[];
  targetWolfpackTiers?: WolfpackTier[];
  targetUserIds?: string[];
  excludeUserIds?: string[];
  targetLocations?: string[];
}

export default FirebaseConfig;
