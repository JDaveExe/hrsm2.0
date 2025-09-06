const CACHE_NAME = 'hrsm-v2'; // Updated version to force cache refresh
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
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
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim control of all clients
      return self.clients.claim();
    })
  );
});

// Fetch event - Network first strategy for CSS/JS, cache first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Don't cache API requests
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // Network first for CSS and JS files to prevent stale assets
  if (request.url.includes('.css') || request.url.includes('.js') || request.url.includes('/static/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If fetch succeeds, update cache and return response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If fetch fails, try cache
          return caches.match(request);
        })
    );
  } else {
    // Cache first for other resources
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request);
        })
    );
  }
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
