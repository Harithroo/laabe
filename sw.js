// IMPORTANT:
// Use network-first so updated deploys are picked up immediately (no "clear site data" needed),
// while still supporting offline fallback via Cache Storage.

const CACHE_PREFIX = 'laabe-cache-';
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const scope = self.registration?.scope || self.location.origin + '/';
const urlForScope = (path) => new URL(path, scope).toString();

const ASSET_PATHS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/storage.js',
  './js/calculations.js',
  './js/export.js',
  './js/ui.js',
  './js/pwa.js',
  './js/app.js',
  './icons/favicon-32.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

const ASSETS_TO_CACHE = ASSET_PATHS.map((path) => urlForScope(path));

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        await cache.addAll(ASSETS_TO_CACHE);
      } catch {
        await Promise.all(
          ASSETS_TO_CACHE.map(async (assetUrl) => {
            try {
              await cache.add(assetUrl);
            } catch {
              // ignore
            }
          })
        );
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event?.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkRequest = new Request(request, { cache: 'no-store' });
    const response = await fetch(networkRequest);

    if (response && response.ok && response.type === 'basic') {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;

    if (request.mode === 'navigate') {
      const index = await cache.match(urlForScope('./index.html'));
      if (index) return index;
    }

    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(networkFirst(event.request));
});
