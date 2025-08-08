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
    userId?: string;
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
  platform: 'web' | 'ios' | 'android' | 'windows' | 'mac' | 'linux' | 'unknown';
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
  userId?: string;
  subscribedAt: string;
}

export interface NotificationTopic {
  key: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  requiresRole?: string;
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

// Notification permission states
export type NotificationPermission = 'default' | 'granted' | 'denied';

// Service worker message types
export interface ServiceWorkerMessage {
  type: 'FCM_MESSAGE' | 'NOTIFICATION_CLICK' | 'BACKGROUND_SYNC';
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
  type: 'wolfpack_join' | 'wolfpack_leave' | 'wolfpack_message' | 'wolfpack_order' | 'wolfpack_event';
  wolfpackId: string;
  userId?: string;
  userName?: string;
  message?: string;
  timestamp: string;
}

// Order notification types
export interface OrderNotificationData {
  type: 'order_placed' | 'order_ready' | 'order_completed' | 'order_cancelled';
  orderId: string;
  orderNumber: number;
  customerName?: string;
  status: string;
  estimatedTime?: number;
  timestamp: string;
}

// Event notification types
export interface EventNotificationData {
  type: 'event_created' | 'event_updated' | 'event_cancelled' | 'event_reminder';
  eventId: string;
  eventTitle: string;
  eventDate: string;
  location?: string;
  timestamp: string;
}

// Combined notification data types
export type NotificationData = 
  | WolfpackNotificationData 
  | OrderNotificationData 
  | EventNotificationData 
  | { [key: string]: string };

// FCM token registration states
export type TokenRegistrationState = 
  | 'idle' 
  | 'requesting_permission' 
  | 'registering_token' 
  | 'subscribing_to_topics' 
  | 'completed' 
  | 'error';

// Notification categories for topic management
export const NOTIFICATION_TOPICS = {
  ALL_DEVICES: 'all_devices',
  "wolf-pack-members": 'wolf-pack-members',
  WOLFPACK_SALEM: 'wolfpack_salem',
  WOLFPACK_PORTLAND: 'wolfpack_portland',
  BARTENDERS: 'bartenders',
  DJS: 'djs',
  ORDERS: 'orders',
  EVENTS: 'events',
  PROMOTIONS: 'promotions',
  EMERGENCY: 'emergency'
} as const;

export type NotificationTopicKey = typeof NOTIFICATION_TOPICS[keyof typeof NOTIFICATION_TOPICS];

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
}

// Notification display options
export interface NotificationDisplayOptions {
  showInForeground: boolean;
  playSound: boolean;
  vibrate: boolean;
  showBadge: boolean;
  requireInteraction: boolean;
  silent: boolean;
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
}

export default FirebaseConfig;
