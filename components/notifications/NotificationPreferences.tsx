'use client';

import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { Bell, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Create Supabase client
// Define UserRole type to match your backend
type UserRole = 'admin' | 'bartender' | 'dj' | 'user';

interface NotificationPreferencesProps {
  userRole?: UserRole;
  userId?: string;
  onClose?: () => void;
}

interface NotificationPreferences {
  events: boolean;
  marketing: boolean;
  announcements: boolean;
  chat_messages: boolean;
  order_updates: boolean;
  member_activity: boolean;
  social_interactions: boolean;
}

interface NotificationCategory {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
  roles?: UserRole[];
}

const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  {
    key: 'announcements',
    label: 'Announcements',
    description: 'Important announcements from management'
  },
  {
    key: 'events',
    label: 'Events',
    description: 'DJ events, contests, and special activities'
  },
  {
    key: 'order_updates',
    label: 'Order Updates',
    description: 'Status updates for your food and drink orders'
  },
  {
    key: 'chat_messages',
    label: 'Chat Messages',
    description: 'New messages and mentions in Wolf Pack chat'
  },
  {
    key: 'member_activity',
    label: 'Member Activity',
    description: 'New members, check-ins, and pack activity'
  },
  {
    key: 'social_interactions',
    label: 'Social Interactions',
    description: 'Winks, reactions, and other social features'
  },
  {
    key: 'marketing',
    label: 'Promotions & Marketing',
    description: 'Special offers, deals, and promotional content'
  }
];

export function NotificationPreferences({ 
  userRole = 'user', 
  userId,
  onClose 
}: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    events: true,
    marketing: false,
    announcements: true,
    chat_messages: true,
    order_updates: true,
    member_activity: true,
    social_interactions: true
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load current preferences from the user's notification_preferences column
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        const { data, error: dbError } = await supabase
          .from('users')
          .select('notification_preferences')
          .eq('auth_id', user.id)
          .single();

        if (dbError) {
          throw new Error(`Failed to load preferences: ${dbError.message}`);
        }

        if (data?.notification_preferences) {
          setPreferences(data.notification_preferences as unknown as NotificationPreferences);
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load notification preferences';
        console.error('Failed to load notification preferences:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const handlePreferenceToggle = async (key: keyof NotificationPreferences, enabled: boolean) => {
    setUpdating(key);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const newPreferences = {
        ...preferences,
        [key]: enabled
      };

      // Update preferences using the RPC function
      const { data, error: updateError } = await supabase
        .rpc('update_notification_preferences', {
          p_user_id: userId || user.id,
          p_preferences: { [key]: enabled }
        });

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update local state with the returned preferences
      if (data) {
        setPreferences(data as unknown as NotificationPreferences);
      } else {
        setPreferences(newPreferences);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preference';
      console.error('Failed to update preference:', err);
      setError(errorMessage);
    } finally {
      setUpdating(null);
    }
  };

  const getFilteredCategories = () => {
    return NOTIFICATION_CATEGORIES.filter(category => {
      // If category has role restrictions, check if user's role is included
      if (category.roles && category.roles.length > 0) {
        return category.roles.includes(userRole) || userRole === 'admin';
      }
      return true;
    });
  };

  const getEnabledCount = () => {
    return Object.values(preferences).filter(Boolean).length;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Preferences...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-3 bg-gray-100 rounded w-48 animate-pulse"></div>
                </div>
                <div className="h-6 w-11 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredCategories = getFilteredCategories();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose which notifications you want to receive
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {filteredCategories.length === 0 ? (
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription>
              No notification preferences available for your role ({userRole}).
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {filteredCategories.map(category => {
              const isEnabled = preferences[category.key];
              const isUpdating = updating === category.key;
              
              return (
                <div key={category.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">{category.label}</h4>
                      {category.roles && (
                        <Badge variant="secondary" className="text-xs">
                          {category.roles.join(', ')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handlePreferenceToggle(category.key, checked)}
                      disabled={isUpdating}
                    />
                    
                    {isUpdating && (
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-4 border-t space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3 w-3" />
            <span>
              {getEnabledCount()} of {filteredCategories.length} notification types enabled
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            These preferences control what push notifications you receive. Some notifications may be required for app functionality.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Export as both named and default for flexibility
export default NotificationPreferences;