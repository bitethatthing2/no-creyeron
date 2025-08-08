'use client';

import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
interface NotificationIndicatorProps {
  variant?: 'default' | 'outline' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export interface NotificationIndicatorRef {
  refresh: () => void;
}

/**
 * Unified notification indicator component
 * Displays a bell icon with an unread count badge
 */
export const NotificationIndicator = forwardRef<NotificationIndicatorRef, NotificationIndicatorProps>(({
  variant = 'default',
  size = 'md',
  onClick,
  className = '',
}, ref) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Supabase client
    // Fetch unread count from Supabase
  const fetchUnreadCount = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('fetch_notifications', {
        p_user_id: undefined, // null means current user
        p_limit: 100, // Get enough to count unread
        p_offset: 0
      });

      if (error) {
        // Handle missing notifications table gracefully
        if (error.code === '42P01' && error.message?.includes('notifications')) {
          console.log('Notifications table not yet created - this is expected during development');
          setUnreadCount(0);
          return;
        }
        console.error('Error fetching notifications:', error);
        setUnreadCount(0);
        return;
      }

      // Count unread notifications
      const unread = (data || []).filter((n: { read: boolean }) => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to fetch notification count:', err);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Expose refresh method to parent components
  useImperativeHandle(ref, () => ({
    refresh: fetchUnreadCount
  }));

  // Load unread count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);
  
  // Size configurations
  const sizeConfig = {
    sm: {
      button: 'h-8 w-8',
      icon: 'h-4 w-4',
      badge: 'h-4 w-4 text-[10px] min-w-[16px]',
    },
    md: {
      button: 'h-10 w-10',
      icon: 'h-5 w-5',
      badge: 'h-5 w-5 text-xs min-w-[20px]',
    },
    lg: {
      button: 'h-12 w-12',
      icon: 'h-6 w-6',
      badge: 'h-6 w-6 text-xs min-w-[24px]',
    },
  };
  
  // Variant configurations
  const variantConfig = {
    default: 'hover:bg-accent hover:text-accent-foreground',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    subtle: 'bg-transparent hover:bg-muted',
  };
  
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`relative ${sizeConfig[size].button} ${variantConfig[variant]} ${className}`}
      onClick={onClick}
      disabled={isLoading}
      title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
    >
      <Bell className={`${sizeConfig[size].icon} ${isLoading ? 'animate-pulse' : ''}`} />
      
      {unreadCount > 0 && (
        <Badge 
          variant="destructive"
          className={`absolute -top-1 -right-1 flex items-center justify-center p-0 ${sizeConfig[size].badge} rounded-full border-2 border-background`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full"></div>
        </div>
      )}
    </Button>
  );
});

NotificationIndicator.displayName = 'NotificationIndicator';

export default NotificationIndicator;