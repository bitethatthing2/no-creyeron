'use client';

import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Bell, Check, CheckCheck, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
// Remove the NotificationIndicator import for now since it's causing errors
// import { NotificationIndicator } from './NotificationIndicator';

/**
 * Notification interface matching your fetch_notifications function return type
 */
interface Notification {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Unified notification popover component
 * Displays notifications in a popover with tabs for unread and all notifications
 */
export function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('unread');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Supabase client
    // Fetch notifications directly from Supabase
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('fetch_notifications', {
        p_user_id: undefined, // null means current user
        p_limit: 50,
        p_offset: 0
      });

      if (error) {
        // Handle missing notifications table gracefully
        if (error.code === '42P01' && error.message?.includes('notifications')) {
          console.log('Notifications table not yet created - this is expected during development');
          setNotifications([]);
          return;
        }
        console.error('Error fetching notifications:', error);
        setNotifications([]);
        return;
      }

      setNotifications((data as any[]) || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId
      });

      if (error) {
        console.error('Failed to mark notification as read:', error);
        return;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Dismiss notification (mark as read)
  const dismissNotification = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  // Mark all as read
  const dismissAllNotifications = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      for (const id of unreadIds) {
        await markAsRead(id);
      }
      
      // Refresh notifications
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Refresh notifications
  const refreshNotifications = () => {
    fetchNotifications();
  };

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Get unread notifications
  const unreadNotifications = notifications.filter(n => !n.read);
  
  // Get all notifications
  const allNotifications = notifications;
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Date unknown';
    }
  };
  
  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_new':
        return <Bell className="h-4 w-4 text-blue-500" />;
      case 'order_ready':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'info':
        return <Bell className="h-4 w-4 text-gray-500" />;
      case 'warning':
        return <Bell className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <Bell className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };
  
  // Handle marking all notifications as read
  const handleDismissAll = async () => {
    await dismissAllNotifications();
    setActiveTab('all');
  };
  
  // Handle clicking a notification
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if it's unread
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate to link if provided in data
    if (notification.data?.link) {
      if (typeof window !== 'undefined') {
        window.location.href = notification.data.link as string;
      }
    }
    
    setOpen(false);
  };
  
  // Handle individual dismiss (mark as dismissed)
  const handleDismissNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await dismissNotification(notificationId);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    refreshNotifications();
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="end">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h4 className="font-medium">Notifications</h4>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <Clock className="h-4 w-4" />
              <span className="sr-only">Refresh</span>
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDismissAll}
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
                <span className="sr-only">Mark all as read</span>
              </Button>
            )}
          </div>
        </div>
        
        <Tabs
          defaultValue="unread"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="unread" className="relative">
              Unread
              {unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <TabsContent value="unread" className="p-0">
            <ScrollArea className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading notifications...</p>
                </div>
              ) : unreadNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="bg-muted/50 rounded-full p-3 mb-2">
                    <CheckCheck className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">All caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">No unread notifications</p>
                </div>
              ) : (
                <div>
                  {unreadNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="py-2 px-4 hover:bg-muted/50 cursor-pointer border-b last:border-0 transition-colors"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">{notification.title}</p>
                          {notification.message !== notification.title && (
                            <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-50 hover:opacity-100"
                          onClick={(e) => handleDismissNotification(e, notification.id)}
                          title="Dismiss notification"
                        >
                          <Check className="h-3 w-3" />
                          <span className="sr-only">Mark as read</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="all" className="p-0">
            <ScrollArea className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading notifications...</p>
                </div>
              ) : allNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="bg-muted/50 rounded-full p-3 mb-2">
                    <Bell className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No notifications</p>
                  <p className="text-xs text-muted-foreground mt-1">You&#39;ll see notifications here when you receive them</p>
                </div>
              ) : (
                <div>
                  {allNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`py-2 px-4 hover:bg-muted/50 cursor-pointer border-b last:border-0 transition-colors ${
                        !notification.read ? 'bg-muted/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm line-clamp-2 ${
                            !notification.read ? 'font-medium' : ''
                          }`}>
                            {notification.title}
                          </p>
                          {notification.message !== notification.title && (
                            <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="mt-1">
                            <div className="h-2 w-2 bg-primary rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationPopover;