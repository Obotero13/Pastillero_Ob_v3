// ============================================================
// EL PASTILLERO Ob — Service Worker (sw.js v3.1)
// Estrategia Network-First: Actualizaciones inmediatas
// ============================================================

const CACHE_NAME = 'pastillero-v3.1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css?v=3.1',
  './layout.css?v=3.1',
  './app.js?v=3.1',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia: Network-First (Consulta red primero; si no hay internet, usa caché)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CDNs externas (SheetJS, Google Fonts)
  if (url.origin !== location.origin) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Recursos locales de la app
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // En caso de no tener internet (offline total)
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

