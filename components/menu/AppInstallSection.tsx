'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Bell, 
  CheckCircle,
  Zap,
  Wifi,
  Smartphone
} from 'lucide-react';
import { PwaInstallGuide } from '@/components/shared/PwaInstallGuide';
import NotificationGuide from '@/components/shared/NotificationGuide';

export function AppInstallSection() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if app is installed
      const standaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      const iosStandalone = (window.navigator as any).standalone === true;
      const isWebApk = window.matchMedia('(display-mode: fullscreen)').matches;
      setIsInstalled(standaloneMode || iosStandalone || isWebApk);

      // Check notification permission
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
      
      setIsLoading(false);
    }
  }, []);

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 dark:border-orange-800">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-2">
          <Download className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Get the App Experience</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Install our app for faster access & push notifications
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Loading State */}
        {isLoading ? (
          <div className="text-center space-y-3 p-4">
            <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Checking app status...</p>
          </div>
        ) : isInstalled ? (
          <div className="text-center space-y-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">App Installed Successfully!</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              You're enjoying the full Side Hustle PWA experience with offline access and fast loading!
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <h4 className="font-semibold text-lg dark:text-white">Install Side Hustle App</h4>
              <Badge variant="secondary" className="text-xs">
                PWA • Offline • Fast • Native Feel
              </Badge>
            </div>
            <PwaInstallGuide fullButton className="max-w-sm mx-auto" />
          </div>
        )}

        {/* Notification Setup */}
        <div className="border-t pt-4">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Bell className="h-5 w-5 text-orange-600" />
              <h4 className="font-semibold text-lg dark:text-white">Enable Notifications</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Get notified about your orders, special offers, and live events
            </p>
            <NotificationGuide variant="button" className="max-w-sm mx-auto" />
          </div>
        </div>

        {/* PWA Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center pt-4 border-t">
          <div className="space-y-2">
            <div className="mx-auto w-8 h-8 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center">
              <Wifi className="h-4 w-4 text-green-600" />
            </div>
            <h5 className="font-medium text-sm dark:text-white">Works Offline</h5>
            <p className="text-xs text-muted-foreground">Browse menu without internet using service worker cache</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-8 h-8 bg-blue-100 dark:bg-blue-950/30 rounded-full flex items-center justify-center">
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
            <h5 className="font-medium text-sm dark:text-white">Native Performance</h5>
            <p className="text-xs text-muted-foreground">App shell architecture for instant loading</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-8 h-8 bg-purple-100 dark:bg-purple-950/30 rounded-full flex items-center justify-center">
              <Bell className="h-4 w-4 text-purple-600" />
            </div>
            <h5 className="font-medium text-sm dark:text-white">Real-time Updates</h5>
            <p className="text-xs text-muted-foreground">Push notifications for orders & specials</p>
          </div>
        </div>

        {/* PWA Install Guide */}
        {!isLoading && !isInstalled && (
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">PWA Installation Guide:</p>
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <div className="flex items-center gap-2">
                <Smartphone className="h-3 w-3" />
                <span><strong>Mobile:</strong> Tap "Add to Home Screen" from your browser menu</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="h-3 w-3" />
                <span><strong>Desktop:</strong> Click the install button in the address bar or browser prompt</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                <span><strong>Benefits:</strong> Fullscreen experience, app launcher icon, background sync</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}