// HERA Salon Service Worker
// Next.js-compatible PWA service worker with intelligent caching

const CACHE_NAME = 'hera-salon-v1'
const CACHE_VERSION = '1.0.0'

// Routes to cache for offline access
const ROUTES_TO_CACHE = [
  '/',
  '/salon',
  '/salon/appointments',
  '/offline' // Offline fallback page
]

// Install event - pre-cache critical routes
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching routes')
        // Only cache the root, let Next.js handle its assets
        return cache.addAll(['/'])
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activating...')
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip Next.js internal requests and API calls
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('hot-update')
  ) {
    return // Let Next.js handle these
  }

  // Network-first strategy for HTML pages
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(request)
            .then(cachedResponse => {
              return cachedResponse || caches.match('/offline')
            })
        })
    )
    return
  }

  // Cache-first strategy for other assets
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(request).then(response => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
  )
})