// Service Worker for QFI PWA
const CACHE_NAME = 'qfi-app-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
];

// インストール時にキャッシュを作成
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache).catch((err) => {
          // In dev environments some resources may be unavailable during SW install.
          // Log and continue so the service worker still installs.
          console.warn('cache.addAll failed during install, continuing without full cache', err);
          return Promise.resolve();
        });
      })
  );
});

// フェッチ時にキャッシュから返す（ネットワークフォールバック付き）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) return response;
        // If network fetch fails (dev server, CORS, offline), catch and return a graceful fallback response
        return fetch(event.request).catch((err) => {
          console.warn('Fetch failed for', event.request.url, err);
          // Return a simple 504 response so callers get a non-unhandled rejection
          return new Response('Service Worker fetch failed', {
            status: 504,
            statusText: 'Gateway Timeout',
            headers: { 'Content-Type': 'text/plain' },
          });
        });
      })
      .catch((err) => {
        // Catch any cache.match errors as well
        console.error('Service Worker fetch handler error', err);
        return fetch(event.request).catch(() => new Response(null, { status: 504 }));
      })
  );
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});


