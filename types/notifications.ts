export type NotificationType = 
  | 'info'
  | 'warning'
  | 'error'
  | 'success'
  | 'message'
  | 'follow'
  | 'like'
  | 'comment'
  | 'order_new'
  | 'order_ready'
  | 'system';

export interface NotificationData {
  type?: NotificationType;
  action_url?: string;
  content_type?: string;
  content_id?: string;
  [key: string]: any;
}
