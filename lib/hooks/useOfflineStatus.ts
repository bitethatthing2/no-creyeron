/**
 * Hook for detecting and managing offline status
 */

import { useState, useEffect, useCallback } from 'react';
import WolfpackOfflineManager from '@/lib/utils/wolfpack-offline-manager';

interface OfflineStatus {
  isOnline: boolean;
  hasPendingActions: boolean;
  pendingCount: number;
  lastSyncAttempt: number | null;
  isRetrying: boolean;
}

interface UseOfflineStatusOptions {
  autoSync?: boolean;
  syncInterval?: number;
}

export function useOfflineStatus(options: UseOfflineStatusOptions = {}) {
  const { autoSync = true, syncInterval = 30000 } = options;
  
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    hasPendingActions: false,
    pendingCount: 0,
    lastSyncAttempt: null,
    isRetrying: false
  });

  // Update status from WolfpackOfflineManager
  const updateStatus = useCallback(async () => {
    try {
      const syncStatus = await WolfpackOfflineManager.getSyncStatus();
      setStatus(prev => ({
        ...prev,
        ...syncStatus,
        hasPendingActions: syncStatus.pendingCount > 0
      }));
    } catch (error) {
      console.error('Error updating offline status:', error);
    }
  }, []);

  // Force sync pending actions
  const forceSyncNow = useCallback(async () => {
    if (!status.isOnline || status.isRetrying) return { success: false, synced: 0, failed: 0 };

    setStatus(prev => ({ ...prev, isRetrying: true }));
    
    try {
      const result = await WolfpackOfflineManager.forceSyncNow();
      await updateStatus();
      return result;
    } catch (error) {
      console.error('Error forcing sync:', error);
      return { success: false, synced: 0, failed: 0 };
    } finally {
      setStatus(prev => ({ ...prev, isRetrying: false }));
    }
  }, [status.isOnline, status.isRetrying, updateStatus]);

  // Check if we should auto-retry sync
  const shouldAutoRetry = useCallback(() => {
    if (!autoSync || !status.isOnline || !status.hasPendingActions || status.isRetrying) {
      return false;
    }

    // Don't retry too frequently
    if (status.lastSyncAttempt) {
      const timeSinceLastSync = Date.now() - status.lastSyncAttempt;
      return timeSinceLastSync > syncInterval;
    }

    return true;
  }, [autoSync, status.isOnline, status.hasPendingActions, status.isRetrying, status.lastSyncAttempt, syncInterval]);

  useEffect(() => {
    // Initial status load
    updateStatus();

    // Set up event listeners
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      // Auto-sync when coming back online
      if (autoSync) {
        setTimeout(() => {
          updateStatus().then(() => {
            if (status.hasPendingActions) {
              forceSyncNow();
            }
          });
        }, 1000); // Small delay to ensure network is stable
      }
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    const handleSyncStatusChanged = (event: CustomEvent) => {
      setStatus(prev => ({
        ...prev,
        ...event.detail,
        hasPendingActions: event.detail.pendingCount > 0
      }));
    };

    const handleSyncCompleted = () => {
      updateStatus();
    };

    const handleSyncFailed = () => {
      updateStatus();
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('wolfpack-sync-status-changed' as any, handleSyncStatusChanged);
    window.addEventListener('wolfpack-sync-completed' as any, handleSyncCompleted);
    window.addEventListener('wolfpack-sync-failed' as any, handleSyncFailed);

    // Set up periodic status updates
    const statusInterval = setInterval(() => {
      updateStatus();
      
      // Auto-retry sync if conditions are met
      if (shouldAutoRetry()) {
        forceSyncNow();
      }
    }, Math.min(syncInterval, 30000)); // Check at least every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('wolfpack-sync-status-changed' as any, handleSyncStatusChanged);
      window.removeEventListener('wolfpack-sync-completed' as any, handleSyncCompleted);
      window.removeEventListener('wolfpack-sync-failed' as any, handleSyncFailed);
      clearInterval(statusInterval);
    };
  }, [autoSync, syncInterval, shouldAutoRetry, forceSyncNow, updateStatus, status.hasPendingActions]);

  return {
    ...status,
    updateStatus,
    forceSyncNow,
    isConnected: status.isOnline,
    hasQueuedActions: status.hasPendingActions,
    canSync: status.isOnline && status.hasPendingActions && !status.isRetrying
  };
}

// Simplified hook for just online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export default useOfflineStatus;