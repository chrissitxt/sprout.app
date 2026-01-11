// service worker for sprout
const CACHE_NAME = 'sprout-v0.4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-512.webp'
];

// cache assets on install
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// clear old caches on activate
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
           .map(key => caches.delete(key))
      )
    )
  );
  return self.clients.claim();
});

// serve from cache, update cache in background
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(response => {
        if (response.ok) {
          caches.open(CACHE_NAME).then(cache =>
            cache.put(e.request, response.clone())
          );
        }
        return response;
      });
      return cached || fetchPromise;
    })
  );
});
