"use client";

import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceToken } from '@/lib/hooks/useDeviceToken';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellRing, Smartphone, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface NotificationTestProps {
  className?: string;
}

export function NotificationTest({ className }: NotificationTestProps) {
  const { currentUser } = useAuth();
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
  } = useDeviceToken(currentUser?.id);

  const [sending, setSending] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const sendTestNotification = async () => {
    if (!currentUser?.id) {
      setTestResult({
        success: false,
        message: 'User not logged in'
      });
      return;
    }

    setSending(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '🎉 Test Notification',
          body: 'If you see this, push notifications are working perfectly!',
          userId: currentUser.id,
          data: {
            type: 'test',
            timestamp: new Date().toISOString()
          },
          requireInteraction: true,
          icon: '/icons/android-big-icon.png',
          badge: '/icons/android-lil-icon-white.png'
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setTestResult({
          success: true,
          message: 'Test notification sent successfully!'
        });
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Failed to send notification'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setSending(false);
    }
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { icon: CheckCircle, text: 'Granted', className: 'text-green-600' };
      case 'denied':
        return { icon: XCircle, text: 'Denied', className: 'text-red-600' };
      case 'default':
        return { icon: AlertCircle, text: 'Not Asked', className: 'text-yellow-600' };
      default:
        return { icon: AlertCircle, text: 'Unknown', className: 'text-gray-600' };
    }
  };

  const permissionStatus = getPermissionStatus();
  const PermissionIcon = permissionStatus.icon;

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Push Notifications Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Push notifications are not supported in this browser or device.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notification Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Permission Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <PermissionIcon className={`h-4 w-4 ${permissionStatus.className}`} />
              <span className="font-medium text-gray-900 dark:text-gray-100">Permission</span>
            </div>
            <Badge variant={permission === 'granted' ? 'default' : 'secondary'}>
              {permissionStatus.text}
            </Badge>
          </div>

          {/* Device Info */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-gray-900 dark:text-gray-100">Device</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{deviceInfo.type}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{deviceInfo.name}</div>
            </div>
          </div>

          {/* Token Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-gray-900 dark:text-gray-100">FCM Token</span>
            </div>
            <Badge variant={fcmToken ? 'default' : 'secondary'}>
              {fcmToken ? 'Active' : 'None'}
            </Badge>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Error</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <div className={`p-3 rounded-lg border ${
              testResult.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className={`flex items-center gap-2 ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {testResult.success ? 'Success' : 'Failed'}
                </span>
              </div>
              <p className={`text-sm mt-1 ${
                testResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {testResult.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {permission !== 'granted' && registerToken && (
              <Button
                onClick={registerToken}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                variant="default"
              >
                {loading ? 'Setting up...' : 'Enable Notifications'}
              </Button>
            )}

            {permission === 'granted' && !fcmToken && (
              <Button
                onClick={refresh}
                disabled={loading || !refresh}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                variant="default"
              >
                {loading ? 'Refreshing...' : 'Refresh Token'}
              </Button>
            )}

            {permission === 'granted' && fcmToken && (
              <Button
                onClick={sendTestNotification}
                disabled={sending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                variant="default"
              >
                {sending ? 'Sending...' : 'Send Test Notification'}
              </Button>
            )}

            {deviceToken && (
              <Button
                onClick={deactivateToken}
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50"
                size="sm"
              >
                Disable Notifications
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      {fcmToken && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              <div>
                <strong>FCM Token:</strong>
                <div className="font-mono bg-gray-100 p-2 rounded mt-1 break-all">
                  {fcmToken.substring(0, 50)}...
                </div>
              </div>
              <div>
                <strong>User ID:</strong> {currentUser?.id}
              </div>
              <div>
                <strong>Device Type:</strong> {deviceInfo.type}
              </div>
              <div>
                <strong>Device Name:</strong> {deviceInfo.name}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}