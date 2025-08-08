'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Settings, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useDeviceToken } from '@/hooks/useDeviceToken';
import NotificationPreferences from './NotificationPreferences'; // Import your component

// Define UserRole type to match your backend
type UserRole = 'admin' | 'bartender' | 'dj' | 'user';

interface NotificationManagerProps {
  userId?: string;
  userRole?: UserRole;
  showPreferences?: boolean;
  compact?: boolean;
}

export default function NotificationManager({
  userId,
  userRole,
  showPreferences = false,
  compact = false
}: NotificationManagerProps) {
  const [showSettings, setShowSettings] = useState(showPreferences);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const {
    fcmToken,
    deviceToken,
    loading,
    error,
    permission,
    registerToken,
    deactivateToken,
    refresh,
    isSupported,
    deviceInfo
  } = useDeviceToken(userId);

  // Initialize Firebase app
  useEffect(() => {
    const initializeFirebase = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        const { initializeApp, getApps } = await import('firebase/app');
        
        if (getApps().length === 0) {
          const firebaseConfig = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_sender_id,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APp_user_id
          };
          
          initializeApp(firebaseConfig);
        }
        setIsInitialized(true);
      } catch (err) {
        console.error('Error initializing Firebase:', err);
      }
    };

    initializeFirebase();
  }, []);

  const handleEnableNotifications = async () => {
    if (!userId || !registerToken) return;
    
    try {
      await registerToken();
      if (refresh) {
        await refresh();
      }
    } catch (err) {
      console.error('Error enabling notifications:', err);
    }
  };

  const handleDisableNotifications = async () => {
    if (!deactivateToken) return;
    
    try {
      await deactivateToken();
    } catch (err) {
      console.error('Error disabling notifications:', err);
    }
  };

  const getStatusInfo = () => {
    if (!isSupported) {
      return {
        status: 'unsupported',
        message: 'Notifications not supported on this device',
        color: 'gray' as const,
        icon: AlertCircle
      };
    }

    if (permission === 'denied') {
      return {
        status: 'denied',
        message: 'Notifications blocked - enable in browser settings',
        color: 'red' as const,
        icon: BellOff
      };
    }

    if (fcmToken && deviceToken) {
      return {
        status: 'enabled',
        message: 'Notifications enabled',
        color: 'green' as const,
        icon: CheckCircle
      };
    }

    if (permission === 'granted') {
      return {
        status: 'ready',
        message: 'Ready to enable notifications',
        color: 'blue' as const,
        icon: Bell
      };
    }

    return {
      status: 'default',
      message: 'Enable notifications to stay updated',
      color: 'yellow' as const,
      icon: Bell
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Compact view for embedded usage
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant={statusInfo.color === 'green' ? 'default' : 'secondary'}
          className="flex items-center gap-1"
        >
          <StatusIcon className="h-3 w-3" />
          {statusInfo.status === 'enabled' ? 'Notifications On' : 'Notifications Off'}
        </Badge>
        
        {fcmToken ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnableNotifications}
            disabled={loading || !userId || statusInfo.status === 'unsupported'}
          >
            Enable
          </Button>
        )}

        {showSettings && fcmToken && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 pb-20">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[calc(100vh-8rem)] overflow-auto">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">Notification Settings</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4">
                <NotificationPreferences 
                  userRole={userRole}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full card view
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
            <Badge variant={statusInfo.color === 'green' ? 'default' : 'secondary'}>
              {statusInfo.status}
            </Badge>
          </CardTitle>
          <CardDescription>
            Stay updated with real-time notifications
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Status Alert */}
          <Alert>
            <StatusIcon className="h-4 w-4" />
            <AlertDescription>{statusInfo.message}</AlertDescription>
          </Alert>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Device Info */}
          {deviceToken && (
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Device: {deviceInfo.name}</div>
              <div>Type: {deviceInfo.type.toUpperCase()}</div>
              {deviceInfo.isStandalone && <div>PWA Mode: Active</div>}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!fcmToken && isSupported && permission !== 'denied' && (
              <Button
                onClick={handleEnableNotifications}
                disabled={loading || !userId || !isInitialized}
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                {loading ? 'Enabling...' : 'Enable Notifications'}
              </Button>
            )}

            {fcmToken && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={handleDisableNotifications}
                  className="flex items-center gap-2"
                >
                  <BellOff className="h-4 w-4" />
                  Disable
                </Button>
              </>
            )}
          </div>

          {/* Platform-specific instructions */}
          {permission === 'denied' && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
              <p className="font-medium mb-2">To enable notifications:</p>
              {deviceInfo.type === 'ios' ? (
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open Safari Settings</li>
                  <li>Tap &ldquo;Websites&rdquo; → &ldquo;Notifications&rdquo;</li>
                  <li>Find this site and select &ldquo;Allow&rdquo;</li>
                </ol>
              ) : deviceInfo.type === 'android' ? (
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open Chrome Settings</li>
                  <li>Tap &ldquo;Site Settings&rdquo; → &ldquo;Notifications&rdquo;</li>
                  <li>Find this site and enable notifications</li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-1">
                  <li>Click the lock icon in the address bar</li>
                  <li>Change &ldquo;Notifications&rdquo; to &ldquo;Allow&rdquo;</li>
                  <li>Refresh the page</li>
                </ol>
              )}
            </div>
          )}

          {!isSupported && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
              <p>Notifications are not supported on this browser. Try using:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Chrome, Firefox, Safari, or Edge</li>
                <li>A more recent browser version</li>
                <li>Installing as a PWA (Add to Home Screen)</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      {showSettings && fcmToken && (
        <NotificationPreferences 
          userRole={userRole}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}