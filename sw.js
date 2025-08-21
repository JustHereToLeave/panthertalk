// Define a unique cache name. Change this string to force an update.
const staticCacheName = 'panthertalk-static-v4.5';

// Add the files you want to cache to this array
const assetsToCache = [
  '/',
  '/index.html'
];

// Listen for the 'install' event, which fires when the service worker is installing.
self.addEventListener('install', event => {
  console.log('attempting to install new service worker and cache static assets');
  // Cache the core assets of the app.
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      return cache.addAll(assetsToCache);
    })
  );
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

// Listen for the 'activate' event, which fires when the service worker activates.
self.addEventListener('activate', event => {
  console.log('activating new service worker...');
  // Clean up old caches.
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          // Delete any caches that aren't the current static cache.
          return cacheName.startsWith('panthertalk-static-') && cacheName !== staticCacheName;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Listen for the 'fetch' event, which fires for every network request.
self.addEventListener('fetch', event => {
  // Use a "cache, falling back to network" strategy.
  event.respondWith(
    caches.match(event.request).then(cacheRes => {
      // If the request is in the cache, return it. Otherwise, fetch from the network.
      return cacheRes || fetch(event.request);
    })
  );
});
