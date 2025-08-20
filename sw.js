const staticCacheName = 'panthertalk-static-v1';

// Add the files you want to cache to this array
const assetsToCache = [
  '/',
  '/index.html' 
  // If you had separate css/js files, you would add them here too.
];

// Listen for the 'install' event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      console.log('caching shell assets');
      return cache.addAll(assetsToCache);
    })
  );
});

// Listen for the 'fetch' event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cacheRes => {
      return cacheRes || fetch(event.request);
    })
  );
});
