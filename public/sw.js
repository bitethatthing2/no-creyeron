// Side Hustle Service Worker - Modern Next.js 15 PWA Implementation
// Optimized for TikTok-style social feed and restaurant app

const SW_VERSION = '2.0.0';
const CACHE_NAME = `side-hustle-v${SW_VERSION}`;
const RUNTIME_CACHE = `runtime-v${SW_VERSION}`;
const SOCIAL_CACHE = `social-v${SW_VERSION}`;

// Critical assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/social/feed',
  '/menu', 
  '/profile',
  '/offline.html'
];

// Network-first routes (always try network)
const NETWORK_FIRST_ROUTES = [
  '/api/',
  '/social/feed',
  'supabase.co'
];

// Cache-first routes (offline-friendly static content)
const CACHE_FIRST_ROUTES = [
  '/icons/',
  '/images/',
  '/screenshots/',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
  '.ico'
];

// Service Worker Install Event
self.addEventListener('install', event => {
  console.log('[SW] Installing version:', SW_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      // Don't skip waiting automatically - wait for user confirmation
      .catch(err => console.error('[SW] Precache failed:', err))
  );
});

// Service Worker Activate Event  
self.addEventListener('activate', event => {
  console.log('[SW] Activating version:', SW_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('side-hustle-') && name !== CACHE_NAME && name !== RUNTIME_CACHE && name !== SOCIAL_CACHE)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
      .catch(err => console.error('[SW] Activation failed:', err))
  );
});

// Fetch Event - Smart caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) return;
  
  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Network-first strategy for API calls and dynamic content
    if (NETWORK_FIRST_ROUTES.some(route => url.pathname.startsWith(route) || url.hostname.includes(route))) {
      return await networkFirst(request);
    }
    
    // Cache-first strategy for static assets
    if (CACHE_FIRST_ROUTES.some(route => url.pathname.includes(route))) {
      return await cacheFirst(request);
    }
    
    // Stale-while-revalidate for pages and social content
    if (url.origin === self.location.origin) {
      return await staleWhileRevalidate(request);
    }
    
    // Default: try network, fallback to cache
    return await networkFirst(request);
    
  } catch (error) {
    console.error('[SW] Request failed:', error);
    return await handleOffline(request);
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone()).catch(() => {});
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Cache-first strategy  
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request)
      .then(response => {
        if (response.ok) {
          const cache = caches.open(RUNTIME_CACHE);
          cache.then(c => c.put(request, response.clone()));
        }
      })
      .catch(() => {});
      
    return cachedResponse;
  }
  
  // If not in cache, fetch and cache
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, networkResponse.clone()).catch(() => {});
  }
  
  return networkResponse;
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Always try to update from network
  const networkUpdate = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => cachedResponse);
  
  // Return cached version immediately if available
  return cachedResponse || networkUpdate;
}

// Handle offline scenarios
async function handleOffline(request) {
  const url = new URL(request.url);
  
  // Try to find any cached version
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // For navigation requests, return offline page
  if (request.mode === 'navigate') {
    const offlinePage = await caches.match('/offline.html');
    return offlinePage || new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
  
  // For other requests, return a generic offline response
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// Background sync for social actions (simplified)
self.addEventListener('sync', event => {
  if (event.tag === 'social-action') {
    event.waitUntil(handleSocialSync());
  }
});

async function handleSocialSync() {
  // Simple background sync for social actions
  console.log('[SW] Background sync triggered for social actions');
  
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_SOCIAL_ACTIONS'
      });
    });
  } catch (error) {
    console.error('[SW] Social sync failed:', error);
  }
}

// Message handling for client communication
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: SW_VERSION });
      break;
      
    case 'CACHE_SOCIAL_POST':
      cacheSocialPost(data).then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch(error => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Cache social post data for offline viewing
async function cacheSocialPost(postData) {
  try {
    const cache = await caches.open(SOCIAL_CACHE);
    
    // Create a synthetic request/response for the post data
    const request = new Request(`/api/cached-post/${postData.id}`);
    const response = new Response(JSON.stringify(postData), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put(request, response);
  } catch (error) {
    console.error('[SW] Failed to cache social post:', error);
    throw error;
  }
}

console.log('[SW] Service worker loaded, version:', SW_VERSION);