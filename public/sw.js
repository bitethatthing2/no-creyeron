// Side Hustle Service Worker
// Main service worker that integrates caching, background sync, and offline functionality

// Import the caching utilities
importScripts('/sw-cache.js');

// Import Firebase messaging service worker for push notifications
importScripts('/firebase-messaging-sw.js');

// Service Worker version and cache names
const SW_VERSION = '1.0.12';
const SW_NAME = `side-hustle-sw-v${SW_VERSION}`;

// Assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/android-big-icon.png',
  '/icons/android-lil-icon-white.png',
  '/icons/favicon-for-public/web-app-manifest-192x192.png',
  '/icons/favicon-for-public/web-app-manifest-512x512.png',
  // Critical CSS and JS will be added dynamically by the build process
];

// Background sync tags
const SYNC_TAGS = {
  WOLFPACK_ACTIONS: 'wolfpack-actions-sync',
  OFFLINE_DATA: 'sync-data',
  PERIODIC_CONTENT: 'update-content'
};

// IndexedDB setup for offline data
let dbPromise;

function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('sideHustleOfflineDB', 2);
      
      request.onerror = () => reject(request.error);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp');
          syncStore.createIndex('type', 'type');
        }
        
        // Wolfpack feed cache store
        if (!db.objectStoreNames.contains('feedCache')) {
          const feedStore = db.createObjectStore('feedCache', { keyPath: 'id' });
          feedStore.createIndex('timestamp', 'timestamp');
          feedStore.createIndex('user_id', 'user_id');
        }
        
        // Offline actions queue for Wolfpack
        if (!db.objectStoreNames.contains('wolfpackActions')) {
          const actionsStore = db.createObjectStore('wolfpackActions', { keyPath: 'id' });
          actionsStore.createIndex('timestamp', 'timestamp');
          actionsStore.createIndex('type', 'type');
          actionsStore.createIndex('videoId', 'videoId');
        }
      };
      
      request.onsuccess = () => resolve(request.result);
    });
  }
  return dbPromise;
}

// Service Worker Install Event
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker version:', SW_VERSION);
  
  event.waitUntil(
    (async () => {
      try {
        // Precache critical assets
        const cache = await caches.open(self.sideHustleCache.STATIC_CACHE_NAME);
        await cache.addAll(PRECACHE_ASSETS);
        console.log('[SW] Precached assets successfully');
        
        // Preload critical menu images
        await self.sideHustleCache.preloadMenuImages();
        
        // Initialize IndexedDB
        await openDB();
        
        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('[SW] Install failed:', error);
      }
    })()
  );
});

// Service Worker Activate Event
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker version:', SW_VERSION);
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          name.startsWith('side-hustle-') && !name.includes(SW_VERSION)
        );
        
        await Promise.all(
          oldCaches.map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
        
        // Take control of all clients
        await self.clients.claim();
        
        console.log('[SW] Service worker activated successfully');
      } catch (error) {
        console.error('[SW] Activation failed:', error);
      }
    })()
  );
});

// Fetch Event - Main request interception
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Skip requests to other origins (except Supabase)
  if (url.origin !== self.location.origin && 
      !url.hostname.includes('supabase') && 
      !url.hostname.includes('firebaseapp.com')) {
    return;
  }
  
  // Get caching strategy from sw-cache.js
  const { strategy, options } = self.sideHustleCache.getStrategy(request);
  
  event.respondWith(
    strategy(options).catch(error => {
      console.error('[SW] Fetch failed:', error);
      
      // Return offline page for navigation requests
      if (request.mode === 'navigate') {
        return caches.match('/offline.html') || 
               new Response('Offline', { status: 503 });
      }
      
      // Return a generic offline response for other requests
      return new Response('Service Unavailable', { 
        status: 503,
        statusText: 'Service Unavailable'
      });
    })
  );
});

// Background Sync Event
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case SYNC_TAGS.WOLFPACK_ACTIONS:
      event.waitUntil(syncWolfpackActions());
      break;
    case SYNC_TAGS.OFFLINE_DATA:
      event.waitUntil(syncOfflineData());
      break;
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

// Periodic Background Sync Event (if supported)
self.addEventListener('periodicsync', event => {
  console.log('[SW] Periodic sync triggered:', event.tag);
  
  if (event.tag === SYNC_TAGS.PERIODIC_CONTENT) {
    event.waitUntil(updateContent());
  }
});

// Message Event - Communication with clients
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: SW_VERSION });
      break;
      
    case 'QUEUE_WOLFPACK_ACTION':
      queueWolfpackAction(data).then(id => {
        event.ports[0].postMessage({ success: true, id });
      }).catch(error => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
      break;
      
    case 'CACHE_FEED_DATA':
      cacheFeedData(data).then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch(error => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
      break;
      
    case 'GET_CACHED_FEED':
      getCachedFeed(data).then(feed => {
        event.ports[0].postMessage({ success: true, feed });
      }).catch(error => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Sync Wolfpack Actions (likes, wolfpack_comments, follows)
async function syncWolfpackActions() {
  try {
    const db = await openDB();
    const transaction = db.transaction('wolfpackActions', 'readonly');
    const store = transaction.objectStore('wolfpackActions');
    const actions = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    console.log(`[SW] Syncing ${actions.length} Wolfpack actions`);
    
    const syncedActions = [];
    const failedActions = [];
    
    for (const action of actions) {
      try {
        // Increment retry count
        action.retryCount = (action.retryCount || 0) + 1;
        
        // Skip if max retries exceeded
        if (action.retryCount > (action.maxRetries || 3)) {
          console.warn('[SW] Max retries exceeded for action:', action.id);
          await removeWolfpackAction(action.id);
          failedActions.push(action);
          continue;
        }
        
        // Use the centralized actions API
        const response = await fetch('/api/wolfpack/actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: action.type.replace('wolfpack_', ''), // Remove prefix
            videoId: action.videoId,
            userId: action.userId,
            targetUserId: action.targetUserId,
            content: action.content,
            parentId: action.parentId
          })
        });
        
        if (response.ok) {
          // Remove successful action from queue
          await removeWolfpackAction(action.id);
          syncedActions.push(action.id);
          console.log('[SW] Synced action:', action.type, action.id);
        } else if (response.status === 400) {
          // Bad request - don't retry, remove from queue
          console.warn('[SW] Removing invalid action from queue:', action.id);
          await removeWolfpackAction(action.id);
          failedActions.push(action);
        } else {
          // Server error - update retry count and try again later
          await updateWolfpackActionRetryCount(action.id, action.retryCount);
          failedActions.push(action);
          console.error('[SW] Failed to sync action (will retry):', action.type, response.status);
        }
      } catch (error) {
        // Network error - update retry count
        await updateWolfpackActionRetryCount(action.id, action.retryCount);
        failedActions.push(action);
        console.error('[SW] Error syncing action (will retry):', error);
      }
    }
    
    // Notify clients about sync results
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'WOLFPACK_SYNC_COMPLETE',
        syncedActions,
        failedActions: failedActions.map(a => a.id),
        timestamp: Date.now()
      });
    });
    
    console.log(`[SW] Wolfpack sync completed: ${syncedActions.length} synced, ${failedActions.length} failed`);
    
  } catch (error) {
    console.error('[SW] Wolfpack sync failed:', error);
    
    // Notify clients about sync failure
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'WOLFPACK_SYNC_FAILED',
        error: error.message,
        timestamp: Date.now()
      });
    });
  }
}

// Sync general offline data
async function syncOfflineData() {
  try {
    const db = await openDB();
    const transaction = db.transaction('syncQueue', 'readonly');
    const store = transaction.objectStore('syncQueue');
    const items = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    console.log(`[SW] Syncing ${items.length} offline items`);
    
    for (const item of items) {
      try {
        let endpoint;
        
        switch (item.type) {
          case 'order':
            endpoint = '/api/orders';
            break;
          case 'profile':
            endpoint = '/api/profile';
            break;
          case 'feedback':
            endpoint = '/api/feedback';
            break;
          default:
            continue;
        }
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        
        if (response.ok) {
          // Remove successful item from queue
          await removeSyncItem(item.id);
          console.log('[SW] Synced item:', item.type, item.id);
        }
      } catch (error) {
        console.error('[SW] Error syncing item:', error);
      }
    }
    
    // Notify clients that sync is complete
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('[SW] Offline data sync failed:', error);
  }
}

// Update content periodically
async function updateContent() {
  try {
    console.log('[SW] Updating content via periodic sync');
    
    // Update feed cache with fresh data
    const response = await fetch('/api/wolfpack/wolfpack_videos?limit=20');
    if (response.ok) {
      const data = await response.json();
      await cacheFeedData(data);
    }
    
    // Notify clients about content update
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'CONTENT_UPDATED',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('[SW] Content update failed:', error);
  }
}

// Queue Wolfpack action for background sync
async function queueWolfpackAction(actionData) {
  const db = await openDB();
  const action = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
    timestamp: Date.now(),
    ...actionData
  };
  
  const transaction = db.transaction('wolfpackActions', 'readwrite');
  const store = transaction.objectStore('wolfpackActions');
  
  return new Promise((resolve, reject) => {
    const request = store.add(action);
    request.onsuccess = () => {
      // Register for background sync
      self.registration.sync.register(SYNC_TAGS.WOLFPACK_ACTIONS)
        .catch(console.error);
      resolve(action.id);
    };
    request.onerror = () => reject(request.error);
  });
}

// Remove Wolfpack action from queue
async function removeWolfpackAction(id) {
  const db = await openDB();
  const transaction = db.transaction('wolfpackActions', 'readwrite');
  const store = transaction.objectStore('wolfpackActions');
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Update Wolfpack action retry count
async function updateWolfpackActionRetryCount(id, retryCount) {
  const db = await openDB();
  const transaction = db.transaction('wolfpackActions', 'readwrite');
  const store = transaction.objectStore('wolfpackActions');
  
  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const action = getRequest.result;
      if (action) {
        action.retryCount = retryCount;
        action.lastRetryAt = Date.now();
        
        const putRequest = store.put(action);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve(); // Action doesn't exist anymore
      }
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Remove sync item from queue
async function removeSyncItem(id) {
  const db = await openDB();
  const transaction = db.transaction('syncQueue', 'readwrite');
  const store = transaction.objectStore('syncQueue');
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Cache feed data for offline viewing
async function cacheFeedData(feedData) {
  const db = await openDB();
  const transaction = db.transaction('feedCache', 'readwrite');
  const store = transaction.objectStore('feedCache');
  
  if (Array.isArray(feedData)) {
    // Cache multiple feed items
    for (const item of feedData) {
      const cacheItem = {
        ...item,
        cached_at: Date.now()
      };
      
      await new Promise((resolve, reject) => {
        const request = store.put(cacheItem);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  } else {
    // Cache single feed item
    const cacheItem = {
      ...feedData,
      cached_at: Date.now()
    };
    
    await new Promise((resolve, reject) => {
      const request = store.put(cacheItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  // Trim cache to prevent excessive storage usage
  await trimFeedCache();
}

// Get cached feed data
async function getCachedFeed({ limit = 20, offset = 0 } = {}) {
  const db = await openDB();
  const transaction = db.transaction('feedCache', 'readonly');
  const store = transaction.objectStore('feedCache');
  const index = store.index('timestamp');
  
  return new Promise((resolve, reject) => {
    const items = [];
    const request = index.openCursor(null, 'prev'); // Most recent first
    let count = 0;
    let skipped = 0;
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      
      if (cursor && count < limit) {
        if (skipped >= offset) {
          items.push(cursor.value);
          count++;
        } else {
          skipped++;
        }
        cursor.continue();
      } else {
        resolve(items);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Trim feed cache to maintain reasonable size
async function trimFeedCache(maxItems = 100) {
  const db = await openDB();
  const transaction = db.transaction('feedCache', 'readwrite');
  const store = transaction.objectStore('feedCache');
  const index = store.index('timestamp');
  
  return new Promise((resolve, reject) => {
    const request = index.count();
    
    request.onsuccess = () => {
      const count = request.result;
      
      if (count > maxItems) {
        const deleteCount = count - maxItems;
        const deleteRequest = index.openCursor(); // Oldest first
        let deleted = 0;
        
        deleteRequest.onsuccess = (event) => {
          const cursor = event.target.result;
          
          if (cursor && deleted < deleteCount) {
            cursor.delete();
            deleted++;
            cursor.continue();
          } else {
            resolve();
          }
        };
        
        deleteRequest.onerror = () => reject(deleteRequest.error);
      } else {
        resolve();
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

console.log('[SW] Service worker loaded, version:', SW_VERSION);