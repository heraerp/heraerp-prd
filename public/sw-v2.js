// HERA Service Worker v3.0.2 - Aggressive Update Strategy
const CACHE_NAME = 'hera-cache-v20250910075511';
const APP_VERSION = '20250910075511';

// Skip caching for these patterns - always fetch fresh
const SKIP_CACHE_PATTERNS = [
  /\/api\//,          // All API calls
  /\.json$/,          // All JSON files
  /manifest\.json$/,  // PWA manifest
  /sw\.js$/,          // Service worker itself
  /sw-v2\.js$/,       // This service worker
  /\/version/,        // Version endpoint
  /\?v=/,            // Versioned URLs
  /\.hot-update/,     // Webpack hot updates
  /_next\/static/,    // Next.js static assets with hash
  /\/_next\//,        // All Next.js resources
];

// Minimal offline cache - only for true offline support
const OFFLINE_CACHE = [
  '/offline',
  '/favicon.ico'
];

// Install event - minimal caching
self.addEventListener('install', (event) => {
  console.log('[SW v3] Installing new service worker:', APP_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW v3] Caching offline resources');
        return cache.addAll(OFFLINE_CACHE);
      })
      .then(() => {
        console.log('[SW v3] Skip waiting - activate immediately');
        return self.skipWaiting(); // Activate immediately
      })
  );
});

// Activate event - aggressive cleanup
self.addEventListener('activate', (event) => {
  console.log('[SW v3] Activating new service worker:', APP_VERSION);
  event.waitUntil(
    Promise.all([
      // Delete ALL old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW v3] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('[SW v3] Service worker activated, broadcasting update');
      // Notify all clients about the update
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATE_AVAILABLE',
            version: APP_VERSION
          });
        });
      });
    })
  );
});

// Fetch event - Network First strategy for everything
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cache for patterns that should always be fresh
  const shouldSkipCache = SKIP_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
  
  if (shouldSkipCache) {
    // Always fetch from network, no caching
    event.respondWith(
      fetch(request).catch(() => {
        // For API calls and other skipped resources, return empty response on failure
        return new Response('', { status: 204 });
      })
    );
    return;
  }

  // For navigation requests (page loads), always try network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone the response before using it
          const responseToCache = response.clone();
          
          // Update cache in background
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // Only use cache as fallback for offline
          return caches.match(request)
            .then(response => {
              if (response) return response;
              // Return a fallback response instead of undefined
              return new Response('Offline - Page not available', { 
                status: 503,
                headers: { 'Content-Type': 'text/plain' }
              });
            });
        })
    );
    return;
  }

  // For all other requests, try network first with timeout
  event.respondWith(
    Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 5000)
      )
    ])
    .then(response => {
      // Cache successful responses
      if (response && response.status === 200) {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });
      }
      return response;
    })
    .catch(() => {
      // Fall back to cache only if network fails
      return caches.match(request).then(cached => {
        if (cached) return cached;
        // Return a proper error response instead of undefined
        return new Response('Service temporarily unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      });
    })
  );
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW v3] Received skip waiting signal');
    self.skipWaiting();
  }
});