/**
 * Wolfpack Offline Manager
 * Extends the general offline manager with Wolfpack-specific functionality
 */

import { 
  queueForSync, 
  registerBackgroundSync, 
  getPendingSyncItems,
  removeSyncItem
} from './offlineManager';

// Wolfpack-specific action types
export interface WolfpackOfflineAction {
  id: string;
  type: 'wolfpack_like' | 'wolfpack_unlike' | 'wolfpack_comment' | 'wolfpack_follow' | 'wolfpack_unfollow';
  videoId?: string;
  userId: string;
  targetUserId?: string;
  content?: string;
  parentId?: string;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

// Enhanced sync item for Wolfpack actions
interface WolfpackSyncItem {
  id: string;
  type: 'wolfpack_action';
  data: WolfpackOfflineAction;
  timestamp: number;
}

export class WolfpackOfflineManager {
  /**
   * Queue a Wolfpack action for offline sync
   */
  static async queueWolfpackAction(action: Omit<WolfpackOfflineAction, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>): Promise<string> {
    const actionWithMetadata: WolfpackOfflineAction = {
      ...action,
      id: `wolfpack_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };

    try {
      // Use the general offline manager but with Wolfpack-specific data
      const syncId = await queueForSync('wolfpack_action' as any, actionWithMetadata);
      
      // Also queue directly with service worker for immediate sync attempt
      await this.queueWithServiceWorker(actionWithMetadata);
      
      return syncId;
    } catch (error) {
      console.error('Failed to queue Wolfpack action:', error);
      throw error;
    }
  }

  /**
   * Queue action directly with service worker
   */
  private static async queueWithServiceWorker(action: WolfpackOfflineAction): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Send message to service worker to queue the action
        const messageChannel = new MessageChannel();
        
        const promise = new Promise<void>((resolve, reject) => {
          messageChannel.port1.onmessage = (event) => {
            if (event.data.success) {
              resolve();
            } else {
              reject(new Error(event.data.error));
            }
          };
        });

        registration.active?.postMessage(
          {
            type: 'QUEUE_WOLFPACK_ACTION',
            data: action
          },
          [messageChannel.port2]
        );

        await promise;
      } catch (error) {
        console.warn('Failed to queue action with service worker:', error);
        // Don't throw - the general offline manager will handle it
      }
    }
  }

  /**
   * Check if we're currently offline
   */
  static isOffline(): boolean {
    return !navigator.onLine;
  }

  /**
   * Get pending Wolfpack actions
   */
  static async getPendingWolfpackActions(): Promise<WolfpackOfflineAction[]> {
    try {
      const allPendingItems = await getPendingSyncItems();
      return allPendingItems
        .filter(item => item.type === 'wolfpack_action')
        .map(item => item.data as WolfpackOfflineAction)
        .sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Failed to get pending Wolfpack actions:', error);
      return [];
    }
  }

  /**
   * Remove a successfully synced action
   */
  static async removeSyncedAction(actionId: string): Promise<void> {
    try {
      const allPendingItems = await getPendingSyncItems();
      const item = allPendingItems.find(
        item => item.type === 'wolfpack_action' && (item.data as WolfpackOfflineAction).id === actionId
      );
      
      if (item) {
        await removeSyncItem(item.id);
      }
    } catch (error) {
      console.error('Failed to remove synced action:', error);
    }
  }

  /**
   * Execute a Wolfpack action (online or queue for offline)
   */
  static async executeAction(
    action: Omit<WolfpackOfflineAction, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>
  ): Promise<{ success: boolean; data?: any; queued?: boolean }> {
    if (this.isOffline()) {
      // Queue for offline sync
      try {
        const actionId = await this.queueWolfpackAction(action);
        return { 
          success: true, 
          queued: true,
          data: { actionId, message: 'Action queued for sync when online' }
        };
      } catch (error) {
        return { 
          success: false, 
          data: { error: 'Failed to queue action for offline sync' }
        };
      }
    } else {
      // Execute immediately
      try {
        const response = await fetch('/api/wolfpack/actions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: action.type.replace('wolfpack_', ''), // Remove prefix for API
            videoId: action.videoId,
            userId: action.userId,
            targetUserId: action.targetUserId,
            content: action.content,
            parentId: action.parentId
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          
          // If it's a network error, queue for offline sync
          if (response.status >= 500 || response.status === 0) {
            const actionId = await this.queueWolfpackAction(action);
            return { 
              success: true, 
              queued: true,
              data: { actionId, message: 'Network error - action queued for sync' }
            };
          }
          
          throw new Error(errorData.error || 'Action failed');
        }

        const result = await response.json();
        return { success: true, data: result };
      } catch (error) {
        // If fetch fails due to network issues, queue for offline
        if (error instanceof TypeError && error.message.includes('fetch')) {
          try {
            const actionId = await this.queueWolfpackAction(action);
            return { 
              success: true, 
              queued: true,
              data: { actionId, message: 'Network error - action queued for sync' }
            };
          } catch (queueError) {
            return { 
              success: false, 
              data: { error: 'Failed to execute action and queue for offline sync' }
            };
          }
        }
        
        return { 
          success: false, 
          data: { error: error instanceof Error ? error.message : 'Unknown error' }
        };
      }
    }
  }

  /**
   * Sync a specific action
   */
  static async syncAction(action: WolfpackOfflineAction): Promise<boolean> {
    try {
      const response = await fetch('/api/wolfpack/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action.type.replace('wolfpack_', ''),
          videoId: action.videoId,
          userId: action.userId,
          targetUserId: action.targetUserId,
          content: action.content,
          parentId: action.parentId
        })
      });

      if (response.ok) {
        await this.removeSyncedAction(action.id);
        return true;
      } else if (response.status === 400) {
        // Bad request - don't retry, remove from queue
        console.warn('Removing invalid action from sync queue:', action);
        await this.removeSyncedAction(action.id);
        return true; // Consider it "successful" to remove from queue
      } else {
        // Server error - will retry
        return false;
      }
    } catch (error) {
      console.error('Error syncing Wolfpack action:', error);
      return false;
    }
  }

  /**
   * Get sync status for UI indicators
   */
  static async getSyncStatus(): Promise<{
    pendingCount: number;
    lastSyncAttempt: number | null;
    isOnline: boolean;
  }> {
    const pendingActions = await this.getPendingWolfpackActions();
    const lastSyncAttempt = localStorage.getItem('wolfpack_last_sync_attempt');
    
    return {
      pendingCount: pendingActions.length,
      lastSyncAttempt: lastSyncAttempt ? parseInt(lastSyncAttempt, 10) : null,
      isOnline: navigator.onLine
    };
  }

  /**
   * Initialize offline manager and set up event listeners
   */
  static initialize(): void {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Listen for sync completion from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
    }
  }

  /**
   * Handle coming back online
   */
  private static async handleOnline(): Promise<void> {
    console.log('[Wolfpack Offline] Back online - attempting sync');
    
    try {
      // Trigger background sync
      await registerBackgroundSync();
      
      // Update sync attempt timestamp
      localStorage.setItem('wolfpack_last_sync_attempt', Date.now().toString());
      
      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('wolfpack-sync-status-changed', {
        detail: await this.getSyncStatus()
      }));
    } catch (error) {
      console.error('Error handling online event:', error);
    }
  }

  /**
   * Handle going offline
   */
  private static handleOffline(): void {
    console.log('[Wolfpack Offline] Gone offline - actions will be queued');
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('wolfpack-sync-status-changed', {
      detail: { 
        pendingCount: 0, // Will be updated by getPendingWolfpackActions
        lastSyncAttempt: null,
        isOnline: false 
      }
    }));
  }

  /**
   * Handle messages from service worker
   */
  private static handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;
    
    switch (type) {
      case 'WOLFPACK_SYNC_COMPLETE':
        console.log('[Wolfpack Offline] Sync completed by service worker');
        // Update UI to reflect sync completion
        window.dispatchEvent(new CustomEvent('wolfpack-sync-completed', {
          detail: data
        }));
        break;
        
      case 'WOLFPACK_SYNC_FAILED':
        console.warn('[Wolfpack Offline] Sync failed:', data);
        window.dispatchEvent(new CustomEvent('wolfpack-sync-failed', {
          detail: data
        }));
        break;
    }
  }

  /**
   * Force sync now (if online)
   */
  static async forceSyncNow(): Promise<{ success: boolean; synced: number; failed: number }> {
    if (!navigator.onLine) {
      return { success: false, synced: 0, failed: 0 };
    }

    const pendingActions = await this.getPendingWolfpackActions();
    let synced = 0;
    let failed = 0;

    for (const action of pendingActions) {
      const success = await this.syncAction(action);
      if (success) {
        synced++;
      } else {
        failed++;
      }
    }

    // Update sync status
    localStorage.setItem('wolfpack_last_sync_attempt', Date.now().toString());
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('wolfpack-sync-status-changed', {
      detail: await this.getSyncStatus()
    }));

    return { success: failed === 0, synced, failed };
  }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  WolfpackOfflineManager.initialize();
}

export default WolfpackOfflineManager;