// HERA PWA Kill Switch Service Worker
// This service worker unregisters itself and clears all caches
// Purpose: Safe removal of PWA functionality from HERA

self.addEventListener('install', () => {
  // Skip waiting to become active immediately
  self.skipWaiting();
});

self.addEventListener('activate', async (event) => {
  console.log('[Kill Switch] Activating PWA removal service worker');
  
  event.waitUntil(
    (async () => {
      // 1. Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('[Kill Switch] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
      
      // 2. Clear all clients
      const clients = await self.clients.matchAll({ includeUncontrolled: true });
      clients.forEach(client => {
        client.postMessage({ type: 'PWA_REMOVED' });
      });
      
      // 3. Take control of all pages
      await self.clients.claim();
      
      // 4. Unregister this service worker
      setTimeout(async () => {
        console.log('[Kill Switch] Unregistering service worker');
        await self.registration.unregister();
      }, 100);
    })()
  );
});

// Handle fetch by going straight to network
self.addEventListener('fetch', (event) => {
  // Just pass through to network
  event.respondWith(fetch(event.request));
});