// Unified notification types for the entire application
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
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
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'order_new' | 'order_ready' | 'wolfpack' | 'dj_event';

export interface CreateNotificationData {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  metadata?: Record<string, any>;
}