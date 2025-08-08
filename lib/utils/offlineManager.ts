/**
 * Offline Manager - Handles offline operations and background sync
 * 
 * This utility provides functions to:
 * 1. Check network status
 * 2. Queue operations for background sync
 * 3. Register for periodic background sync
 * 4. Listen for service worker messages
 */

// Types for offline operations
interface SyncItem {
  id: string;
  type: 'order' | 'profile' | 'feedback';
  data: Order | { profile: unknown } | { feedback: unknown };
  timestamp: number;
}

interface OfflineStatus {
  isOnline: boolean;
  lastOnline: number | null;
  syncPending: boolean;
  syncItems: number;
}

// Explicitly define interfaces for Background Sync API if not found by TS
interface SyncManager {
  register(tag: string): Promise<void>;
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  readonly sync: SyncManager;
}

// Generate a unique ID for sync items
function generateSyncId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Add an item to the sync queue for background processing
 */
export async function queueForSync(
  type: 'order' | 'profile' | 'feedback',
  data: Order | { profile: unknown } | { feedback: unknown }
): Promise<string> {
  // Create a sync item
  const syncItem: SyncItem = {
    id: generateSyncId(),
    type,
    data,
    timestamp: Date.now()
  };
  
  try {
    // Add to IndexedDB
    await addToIndexedDB(syncItem);
    
    // Register for background sync if supported
    await registerBackgroundSync();
    
    return syncItem.id;
  } catch (error) {
    console.error('Failed to queue item for sync:', error);
    throw error;
  }
}

/**
 * Add a sync item to IndexedDB
 */
async function addToIndexedDB(item: SyncItem): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sideHustleOfflineDB', 1);
    
    request.onerror = () => reject(new Error('Failed to open offline database'));
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction('syncQueue', 'readwrite');
      const store = transaction.objectStore('syncQueue');
      
      const addRequest = store.add(item);
      
      addRequest.onsuccess = () => {
        // Dispatch event to notify the app about the sync queue change
        window.dispatchEvent(new CustomEvent('sync-queue-updated', {
          detail: { action: 'add', item }
        }));
        resolve();
      };
      
      addRequest.onerror = () => reject(new Error('Failed to add item to sync queue'));
      
      transaction.oncomplete = () => db.close();
    };
  });
}

/**
 * Get all pending sync items
 */
export async function getPendingSyncItems(): Promise<SyncItem[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sideHustleOfflineDB', 1);
    
    request.onerror = () => reject(new Error('Failed to open offline database'));
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction('syncQueue', 'readonly');
      const store = transaction.objectStore('syncQueue');
      
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };
      
      getAllRequest.onerror = () => reject(new Error('Failed to get sync items'));
      
      transaction.oncomplete = () => db.close();
    };
  });
}

/**
 * Remove a sync item after it has been processed
 */
export async function removeSyncItem(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sideHustleOfflineDB', 1);
    
    request.onerror = () => reject(new Error('Failed to open offline database'));
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction('syncQueue', 'readwrite');
      const store = transaction.objectStore('syncQueue');
      
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => {
        // Dispatch event to notify the app about the sync queue change
        window.dispatchEvent(new CustomEvent('sync-queue-updated', {
          detail: { action: 'remove', id }
        }));
        resolve();
      };
      
      deleteRequest.onerror = () => reject(new Error('Failed to remove sync item'));
      
      transaction.oncomplete = () => db.close();
    };
  });
}

/**
 * Register for background sync
 */
export async function registerBackgroundSync(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return;
  }

  // Check if Background Sync is supported
  if (!('sync' in ServiceWorkerRegistration.prototype)) {
    console.warn('Background Sync not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // Cast registration to the interface that includes 'sync'
    await (registration as ServiceWorkerRegistrationWithSync).sync.register(
      'sync-data'
    );
    console.log('Background sync registered');
  } catch (error) {
    console.error('Failed to register background sync:', error);
  }
}

/**
 * Register for periodic background sync
 */
interface NavigatorWithPeriodicSync extends Navigator {
  serviceWorker: Navigator['serviceWorker'] & {
    periodicSync?: PeriodicSyncManager;
  };
}

interface PeriodicSyncManager {
  register(tag: string, options: { minInterval: number }): Promise<void>;
  unregister(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
  permissionState(): Promise<'granted' | 'denied' | 'prompt'>;
}

export async function registerPeriodicSync(minInterval = 24 * 60 * 60 * 1000): Promise<boolean> {
  const nav = navigator as NavigatorWithPeriodicSync;
  if (!('serviceWorker' in nav) || !nav.serviceWorker.periodicSync) {
    console.warn('Periodic background sync not supported');
    return false;
  }
  
  try {
    const registration = await nav.serviceWorker.ready;
    const periodicSyncManager = (registration as ServiceWorkerRegistration & { periodicSync?: PeriodicSyncManager }).periodicSync as PeriodicSyncManager;
    
    // Check permission
    const status = await periodicSyncManager.permissionState();
    if (status !== 'granted') {
      console.warn('Periodic background sync permission not granted');
      return false;
    }
    
    // Register for periodic sync
    await periodicSyncManager.register('update-content', {
      minInterval
    });
    console.log('Periodic background sync registered');
    return true;
  } catch (error) {
    console.error('Failed to register periodic background sync:', error);
    return false;
  }
}

/**
 * Unregister periodic background sync
 */
export async function unregisterPeriodicSync(): Promise<boolean> {
  const nav = navigator as NavigatorWithPeriodicSync;
  if (!('serviceWorker' in nav) || !nav.serviceWorker.periodicSync) {
    return false;
  }
  
  try {
    const registration = await nav.serviceWorker.ready;
    const periodicSyncManager = (registration as ServiceWorkerRegistration & { periodicSync?: PeriodicSyncManager }).periodicSync as PeriodicSyncManager;
    
    await periodicSyncManager.unregister('update-content');
    console.log('Periodic background sync unregistered');
    return true;
  } catch (error) {
    console.error('Failed to unregister periodic background sync:', error);
    return false;
  }
}

/**
 * Get current offline status
 */
export async function getOfflineStatus(): Promise<OfflineStatus> {
  const isOnline = navigator.onLine;
  const pendingItems = await getPendingSyncItems();
  
  // Get last online time from localStorage
  const lastOnline = localStorage.getItem('lastOnlineTime') 
    ? parseInt(localStorage.getItem('lastOnlineTime') || '0', 10)
    : null;
  
  return {
    isOnline,
    lastOnline,
    syncPending: pendingItems.length > 0,
    syncItems: pendingItems.length
  };
}

/**
 * Initialize offline manager and set up event listeners
 */
export function initOfflineManager(): void {
  // Update last online time when online
  if (navigator.onLine) {
    localStorage.setItem('lastOnlineTime', Date.now().toString());
  }
  
  // Listen for online/offline events
  window.addEventListener('online', () => {
    localStorage.setItem('lastOnlineTime', Date.now().toString());
    
    // Trigger background sync when coming back online
    registerBackgroundSync().catch(console.error);
    
    // Dispatch event for the app to update UI
    window.dispatchEvent(new CustomEvent('connectivity-changed', {
      detail: { isOnline: true }
    }));
  });
  
  window.addEventListener('offline', () => {
    // Dispatch event for the app to update UI
    window.dispatchEvent(new CustomEvent('connectivity-changed', {
      detail: { isOnline: false }
    }));
  });
  
  // Listen for messages from the service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, timestamp } = event.data;
      
      if (type === 'CONTENT_UPDATED') {
        // Dispatch event for the app to update UI or refresh data
        window.dispatchEvent(new CustomEvent('content-updated', {
          detail: { timestamp }
        }));
      }
    });
  }
}

/**
 * Order interface for offline order creation
 */
export interface Order {
  // Define the properties of an order here
  // Example:
  id: string;
  items: Array<{ productId: string; quantity: number }>;
  total: number;
  customerId: string;
  [key: string]: unknown;
}

/**
 * Create an order that works offline
 * This is a specialized version of queueForSync for orders
 */
export async function createOfflineOrder(orderData: Order): Promise<string> {
  return queueForSync('order', orderData);
}

/**
 * Update user profile that works offline
 * This is a specialized version of queueForSync for profile updates
 */
export async function updateOfflineProfile(profileData: unknown): Promise<string> {
  return queueForSync('profile', { profile: profileData });
}

/**
 * Submit feedback that works offline
 * This is a specialized version of queueForSync for feedback
 */
export async function submitOfflineFeedback(feedbackData: unknown): Promise<string> {
  return queueForSync('feedback', { feedback: feedbackData });
}
