// HERA Service Worker v2.0.0 - Enhanced Update System
const CACHE_NAME = 'hera-cache-v20250822161506';
const APP_VERSION = '20250822161506';
const UPDATE_CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds in production
const SKIP_CACHE_PATTERNS = [
  /\/api\//,
  /\.json$/,
  /manifest\.json$/,
  /sw\.js$/,
  /\/version/,
  /\?v=/
];

// Resources to cache - only critical offline resources
const urlsToCache = [
  '/offline',
  // Only cache absolutely necessary offline resources
];

// Network-first resources (always fetch fresh)
const networkFirstRoutes = [
  '/',
  '/auth',
  '/dashboard',
  '/profitability-progressive',
  '/financial-progressive',
  // All app routes should be network-first
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Service Worker v' + APP_VERSION + ' installed');
        // Force activation
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('hera-cache-')) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service Worker v' + APP_VERSION + ' activated');
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - Network-first strategy for app routes
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Skip patterns that should never be cached
  const shouldSkipCache = SKIP_CACHE_PATTERNS.some(pattern => pattern.test(event.request.url));
  if (shouldSkipCache) return;

  // Skip API calls and Supabase requests
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase')) return;

  // Parse URL
  const url = new URL(event.request.url);
  const isNavigationRequest = event.request.mode === 'navigate';
  const isHTMLRequest = event.request.headers.get('accept')?.includes('text/html');
  
  // For navigation requests (page loads), always try network first
  if (isNavigationRequest || isHTMLRequest) {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store',
        credentials: 'same-origin'
      })
        .then(response => {
          // Don't cache error responses
          if (!response || response.status !== 200) {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Update cache in background only for successful responses
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Last resort: offline page
            return caches.match('/offline');
          });
        })
    );
    return;
  }

  // For other resources (CSS, JS, images), use cache-first
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // Return cached version but update in background
          fetch(event.request).then(freshResponse => {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, freshResponse);
            });
          });
          return response;
        }

        // No cache, fetch from network
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'New notification from HERA',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'HERA ERP', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message event - handle version updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: APP_VERSION });
  }
  
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    // Force check for updates
    self.registration.update();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    // Clear all caches
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('[SW] Clearing cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    });
  }
});

// Periodic update check
setInterval(() => {
  self.registration.update();
}, UPDATE_CHECK_INTERVAL);