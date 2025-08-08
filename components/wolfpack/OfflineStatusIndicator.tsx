/**
 * Offline Status Indicator for Wolfpack Feed
 * Shows pending actions and sync status
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import WolfpackOfflineManager from '@/lib/utils/wolfpack-offline-manager';

interface OfflineStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
  onSyncComplete?: () => void;
}

interface SyncStatus {
  pendingCount: number;
  lastSyncAttempt: number | null;
  isOnline: boolean;
}

export default function OfflineStatusIndicator({ 
  className = '', 
  showDetails = false,
  onSyncComplete 
}: OfflineStatusIndicatorProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    pendingCount: 0,
    lastSyncAttempt: null,
    isOnline: navigator.onLine
  });
  const [isForceSync, setIsForceSync] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Update sync status
  const updateSyncStatus = async () => {
    try {
      const status = await WolfpackOfflineManager.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error getting sync status:', error);
    }
  };

  useEffect(() => {
    // Initial load
    updateSyncStatus();

    // Listen for sync status changes
    const handleSyncStatusChanged = (event: CustomEvent) => {
      setSyncStatus(event.detail);
    };

    const handleSyncCompleted = (event: CustomEvent) => {
      updateSyncStatus();
      onSyncComplete?.();
      
      if (event.detail?.syncedActions?.length > 0) {
        toast({
          title: "Actions synced",
          description: `${event.detail.syncedActions.length} pending actions have been synced.`,
          variant: "default"
        });
      }
    };

    const handleSyncFailed = (event: CustomEvent) => {
      updateSyncStatus();
      
      if (event.detail?.failedActions?.length > 0) {
        toast({
          title: "Some actions failed to sync",
          description: `${event.detail.failedActions.length} actions couldn't be synced.`,
          variant: "destructive"
        });
      }
    };

    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      updateSyncStatus();
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    // Add event listeners
    window.addEventListener('wolfpack-sync-status-changed' as any, handleSyncStatusChanged);
    window.addEventListener('wolfpack-sync-completed' as any, handleSyncCompleted);
    window.addEventListener('wolfpack-sync-failed' as any, handleSyncFailed);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic status update
    const interval = setInterval(updateSyncStatus, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('wolfpack-sync-status-changed' as any, handleSyncStatusChanged);
      window.removeEventListener('wolfpack-sync-completed' as any, handleSyncCompleted);
      window.removeEventListener('wolfpack-sync-failed' as any, handleSyncFailed);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [onSyncComplete]);

  const handleForceSync = async () => {
    if (!syncStatus.isOnline || isForceSync) return;

    setIsForceSync(true);
    try {
      const result = await WolfpackOfflineManager.forceSyncNow();
      
      if (result.success) {
        toast({
          title: "Sync completed",
          description: `Successfully synced ${result.synced} actions.`,
          variant: "default"
        });
      } else {
        toast({
          title: "Sync partially failed",
          description: `Synced ${result.synced} actions, ${result.failed} failed.`,
          variant: "destructive"
        });
      }
      
      await updateSyncStatus();
      onSyncComplete?.();
    } catch (error) {
      console.error('Force sync error:', error);
      toast({
        title: "Sync failed",
        description: "Failed to sync pending actions.",
        variant: "destructive"
      });
    } finally {
      setIsForceSync(false);
    }
  };

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Don't show anything if online with no pending actions
  if (syncStatus.isOnline && syncStatus.pendingCount === 0 && !showDetails) {
    return null;
  }

  const StatusIcon = syncStatus.isOnline ? Wifi : WifiOff;
  const statusColor = syncStatus.isOnline 
    ? (syncStatus.pendingCount > 0 ? 'orange' : 'green')
    : 'red';

  return (
    <div className={`${className}`}>
      {/* Compact Status Badge */}
      {!expanded && (
        <div 
          className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-background/80 backdrop-blur-sm border"
          onClick={() => setExpanded(true)}
        >
          <StatusIcon 
            className={`h-4 w-4 ${
              statusColor === 'green' ? 'text-green-600' :
              statusColor === 'orange' ? 'text-orange-600' :
              'text-red-600'
            }`}
          />
          
          {syncStatus.pendingCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {syncStatus.pendingCount} pending
            </Badge>
          )}
          
          {!syncStatus.isOnline && (
            <span className="text-xs text-muted-foreground">Offline</span>
          )}
        </div>
      )}

      {/* Expanded Status Card */}
      {expanded && (
        <Card className="w-80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-4 w-4 ${
                  statusColor === 'green' ? 'text-green-600' :
                  statusColor === 'orange' ? 'text-orange-600' :
                  'text-red-600'
                }`} />
                {syncStatus.isOnline ? 'Online' : 'Offline'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-0 space-y-3">
            {/* Pending Actions */}
            {syncStatus.pendingCount > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Pending actions</span>
                </div>
                <Badge variant="secondary">
                  {syncStatus.pendingCount}
                </Badge>
              </div>
            )}

            {/* Last Sync */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Last sync:</span>
              <span>{formatLastSync(syncStatus.lastSyncAttempt)}</span>
            </div>

            {/* Sync Button */}
            {syncStatus.isOnline && syncStatus.pendingCount > 0 && (
              <Button
                onClick={handleForceSync}
                disabled={isForceSync}
                size="sm"
                className="w-full"
              >
                {isForceSync ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            )}

            {/* Status Messages */}
            {!syncStatus.isOnline && (
              <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                <AlertTriangle className="h-4 w-4" />
                Actions will sync when you're back online
              </div>
            )}

            {syncStatus.isOnline && syncStatus.pendingCount === 0 && (
              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                <CheckCircle className="h-4 w-4" />
                All actions synced
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}