// sw-cache.js - Enhanced caching strategy for Side Hustle PWA
// This integrates with your existing Firebase service worker

const CACHE_VERSION = '1.0.12';
const CACHE_PREFIX = 'side-hustle-';

// Cache names
const STATIC_CACHE_NAME = `${CACHE_PREFIX}static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `${CACHE_PREFIX}dynamic-v${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `${CACHE_PREFIX}images-v${CACHE_VERSION}`;
const API_CACHE_NAME = `${CACHE_PREFIX}api-v${CACHE_VERSION}`;
const MENU_CACHE_NAME = `${CACHE_PREFIX}menu-v${CACHE_VERSION}`;

// Cache limits
const CACHE_LIMITS = {
  dynamic: 50,
  images: 100,
  api: 30,
  menu: 200
};

// Sync queue for offline requests
let syncQueue = [];

// Enhanced caching strategies
self.sideHustleCache = {
  STATIC_CACHE_NAME,
  DYNAMIC_CACHE_NAME,
  IMAGE_CACHE_NAME,
  API_CACHE_NAME,
  MENU_CACHE_NAME,

  // Get appropriate caching strategy based on request
  getStrategy(request) {
    const url = new URL(request.url);
    
    // Check if we're in development mode - bypass all caching for menu images
    const isDevelopment = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.port === '3000';
    
    // Menu images - use network first if cache-busting params are present
    if (url.pathname.includes('/food-menu-images/') || 
        url.pathname.includes('/drink-menu-images/') ||
        url.pathname.includes('/menu-images/')) {
      
      // In development, always bypass cache for immediate updates
      if (isDevelopment) {
        return {
          strategy: this.networkOnly.bind(this),
          options: { request }
        };
      }
      
      // If cache-busting parameters are present (like ?v=timestamp), bypass cache
      const hasCacheBustingParams = url.searchParams.has('v') || 
                                  url.searchParams.has('t') || 
                                  url.searchParams.has('_');
      
      if (hasCacheBustingParams) {
        return {
          strategy: this.networkFirst.bind(this),
          options: {
            request,
            cacheName: MENU_CACHE_NAME,
            networkTimeoutSeconds: 3,
            maxAge: 1, // Very short cache for cache-busted images
            maxEntries: CACHE_LIMITS.menu
          }
        };
      }
      
      // Normal cache-first for regular menu images
      return {
        strategy: this.cacheFirst.bind(this),
        options: {
          request,
          cacheName: MENU_CACHE_NAME,
          networkTimeoutSeconds: 2,
          maxAge: 30 * 24 * 60 * 60, // 30 days
          maxEntries: CACHE_LIMITS.menu
        }
      };
    }
    
    // API requests - network first with cache fallback
    if (url.pathname.includes('/api/') || 
        url.pathname.includes('/supabase/') ||
        url.hostname.includes('supabase')) {
      return {
        strategy: this.networkFirst.bind(this),
        options: {
          request,
          cacheName: API_CACHE_NAME,
          networkTimeoutSeconds: 10,
          maxAge: 5 * 60, // 5 minutes for API responses
          maxEntries: CACHE_LIMITS.api
        }
      };
    }
    
    // Static assets - cache first
    if (url.pathname.match(/\.(js|css|woff2?|ttf|otf)$/)) {
      return {
        strategy: this.cacheFirst.bind(this),
        options: {
          request,
          cacheName: STATIC_CACHE_NAME,
          networkTimeoutSeconds: 2,
          maxAge: 365 * 24 * 60 * 60, // 1 year
        }
      };
    }
    
    // Images - cache first with size limits
    if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|avif)$/)) {
      return {
        strategy: this.cacheFirst.bind(this),
        options: {
          request,
          cacheName: IMAGE_CACHE_NAME,
          networkTimeoutSeconds: 10,
          maxAge: 7 * 24 * 60 * 60, // 7 days
          maxEntries: CACHE_LIMITS.images
        }
      };
    }
    
    // HTML pages - network first
    if (request.mode === 'navigate' || url.pathname === '/' || 
        url.pathname.endsWith('.html')) {
      return {
        strategy: this.networkFirst.bind(this),
        options: {
          request,
          cacheName: DYNAMIC_CACHE_NAME,
          networkTimeoutSeconds: 3,
          maxAge: 24 * 60 * 60, // 1 day
          maxEntries: CACHE_LIMITS.dynamic
        }
      };
    }
    
    // Default - network first
    return {
      strategy: this.networkFirst.bind(this),
      options: {
        request,
        cacheName: DYNAMIC_CACHE_NAME,
        networkTimeoutSeconds: 2,
        maxAge: 24 * 60 * 60, // 1 day
        maxEntries: CACHE_LIMITS.dynamic
      }
    };
  },

  // Cache-first strategy with network fallback
  async cacheFirst(options) {
    const { request, cacheName, networkTimeoutSeconds, maxAge, maxEntries } = options;
    
    try {
      // Try cache first
      const cachedResponse = await caches.match(request);
      
      if (cachedResponse) {
        // Check if cached response is still fresh
        const cachedDate = new Date(cachedResponse.headers.get('date'));
        const now = new Date();
        const age = (now - cachedDate) / 1000; // age in seconds
        
        if (age < maxAge) {
          // Update cache in background if older than 50% of max age
          if (age > maxAge * 0.5) {
            this.fetchAndCache(request, cacheName, maxEntries).catch(() => {});
          }
          return cachedResponse;
        }
      }
      
      // Fetch from network with timeout
      const networkResponse = await this.fetchWithTimeout(request, networkTimeoutSeconds);
      
      // Cache the response
      if (networkResponse && networkResponse.status === 200) {
        await this.cacheResponse(request, networkResponse.clone(), cacheName, maxEntries);
      }
      
      return networkResponse;
    } catch (error) {
      // If network fails, try cache again (even if stale)
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Return offline page for navigation requests
      if (request.mode === 'navigate') {
        const offlineResponse = await caches.match('/offline.html');
        if (offlineResponse) {
          return offlineResponse;
        }
      }
      
      throw error;
    }
  },

  // Network-first strategy with cache fallback
  async networkFirst(options) {
    const { request, cacheName, networkTimeoutSeconds, maxAge, maxEntries } = options;
    
    try {
      // Try network first with timeout
      const networkResponse = await this.fetchWithTimeout(request, networkTimeoutSeconds);
      
      // Cache successful responses
      if (networkResponse && networkResponse.status === 200) {
        await this.cacheResponse(request, networkResponse.clone(), cacheName, maxEntries);
      }
      
      return networkResponse;
    } catch (error) {
      // Network failed, try cache
      const cachedResponse = await caches.match(request);
      
      if (cachedResponse) {
        // Check if cached response is acceptably fresh
        const cachedDate = new Date(cachedResponse.headers.get('date'));
        const now = new Date();
        const age = (now - cachedDate) / 1000;
        
        // For API requests, only use cache if relatively fresh
        if (request.url.includes('/api/') && age > maxAge) {
          throw new Error('Cached API response too old');
        }
        
        return cachedResponse;
      }
      
      // For navigation requests, show offline page
      if (request.mode === 'navigate') {
        const offlineResponse = await caches.match('/offline.html');
        if (offlineResponse) {
          return offlineResponse;
        }
      }
      
      throw error;
    }
  },

  // Network-only strategy (no caching) - for development
  async networkOnly(options) {
    const { request } = options;
    return await fetch(request);
  },

  // Fetch with timeout
  async fetchWithTimeout(request, timeoutSeconds = 10) {
    const controller = new AbortController();
    let timeoutId;
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          // Provide a reason for the abort to prevent the error
          controller.abort(new DOMException('Request timeout', 'TimeoutError'));
          reject(new Error(`Request timeout after ${timeoutSeconds} seconds`));
        }, timeoutSeconds * 1000);
      });
      
      // Create fetch promise with proper error handling
      const fetchPromise = fetch(request.clone(), {
        signal: controller.signal
      }).catch(error => {
        // Handle abort errors gracefully
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          throw new Error(`Request aborted: ${error.message || 'timeout'}`);
        }
        throw error;
      });
      
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      // Clear timeout if fetch succeeds
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      return response;
    } catch (error) {
      // Clear timeout on any error
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Re-throw the error
      throw error;
    }
  },

  // Fetch and cache in background
  async fetchAndCache(request, cacheName, maxEntries) {
    try {
      const response = await fetch(request.clone());
      if (response && response.status === 200) {
        await this.cacheResponse(request, response, cacheName, maxEntries);
      }
    } catch (error) {
      console.warn('[SW Cache] Background fetch failed:', error);
    }
  },

  // Cache response with size management
  async cacheResponse(request, response, cacheName, maxEntries) {
    // Don't cache HEAD requests as they're not supported by Cache API
    if (request.method === 'HEAD') {
      console.warn('[SW Cache] Skipping cache for HEAD request:', request.url);
      return;
    }
    
    // Don't cache non-successful responses
    if (!response.ok || response.status !== 200) {
      return;
    }
    
    const cache = await caches.open(cacheName);
    
    try {
      // Add response to cache
      await cache.put(request, response);
      
      // Manage cache size if maxEntries is specified
      if (maxEntries) {
        await this.trimCache(cacheName, maxEntries);
      }
    } catch (error) {
      console.warn('[SW Cache] Failed to cache response:', error);
    }
  },

  // Trim cache to maintain size limits
  async trimCache(cacheName, maxEntries) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxEntries) {
      // Delete oldest entries
      const keysToDelete = keys.slice(0, keys.length - maxEntries);
      await Promise.all(
        keysToDelete.map(key => cache.delete(key))
      );
    }
  },

  // Process sync queue for offline requests
  async processSyncQueue() {
    console.log(`[SW Cache] Processing ${syncQueue.length} queued requests`);
    
    const failedRequests = [];
    
    for (const queuedRequest of syncQueue) {
      try {
        const response = await fetch(queuedRequest);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        console.log('[SW Cache] Synced request:', queuedRequest.url);
      } catch (error) {
        console.error('[SW Cache] Failed to sync request:', error);
        failedRequests.push(queuedRequest);
      }
    }
    
    // Update queue with failed requests
    syncQueue = failedRequests;
    
    // Save to IndexedDB if any requests failed
    if (syncQueue.length > 0) {
      await this.saveQueueToIndexedDB();
    }
    
    return syncQueue.length === 0;
  },

  // Save sync queue to IndexedDB
  async saveQueueToIndexedDB() {
    try {
      // Implementation depends on your IndexedDB setup
      console.log('[SW Cache] Saving sync queue to IndexedDB');
    } catch (error) {
      console.error('[SW Cache] Failed to save queue:', error);
    }
  },

  // Load sync queue from IndexedDB
  async loadQueueFromIndexedDB() {
    try {
      // Implementation depends on your IndexedDB setup
      console.log('[SW Cache] Loading sync queue from IndexedDB');
      return [];
    } catch (error) {
      console.error('[SW Cache] Failed to load queue:', error);
      return [];
    }
  },

  // Preload critical menu images
  async preloadMenuImages() {
    const criticalImages = [
      '/food-menu-images/tacos.png',
      '/food-menu-images/burrito.png',
      '/food-menu-images/quesadilla.png',
      '/food-menu-images/loaded-nacho.png',
      '/food-menu-images/margarita.png',
      // Add more critical images here
    ];

    const cache = await caches.open(MENU_CACHE_NAME);
    
    for (const imageUrl of criticalImages) {
      try {
        const response = await fetch(imageUrl);
        if (response.ok) {
          await cache.put(imageUrl, response);
        }
      } catch (error) {
        console.warn(`[SW Cache] Failed to preload ${imageUrl}:`, error);
      }
    }
  }
};

// Call preload on service worker activation
self.addEventListener('activate', event => {
  event.waitUntil(
    self.sideHustleCache.preloadMenuImages()
  );
});
