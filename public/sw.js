// LIENCOLIS Driver Community - Progressive Web App (PWA) Service Worker
// Offline Caching, Background Sync & Push Notifications Engine

const CACHE_NAME = 'liencolis-offline-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
];

// Install Event: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-caching assets skipped in development mode:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Cleanup old caches & claim clients immediately
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

// Fetch Event: Network-First with Cache Fallback for offline continuity
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Avoid intercepting non-http, websockets, chrome extensions, or external services
  if (
    url.protocol.startsWith('chrome') ||
    url.protocol.startsWith('ws') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('google-analytics') ||
    url.hostname.includes('googletagmanager') ||
    url.hostname.includes('kkiapay') ||
    url.hostname.includes('fedapay')
  ) {
    return;
  }

  // Only manage same-origin assets
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful responses for offline use
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Network failed -> Retrieve from cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If requesting a page/navigation, return the cached index.html
        if (event.request.mode === 'navigate') {
          const fallbackIndex = await caches.match('/index.html');
          if (fallbackIndex) return fallbackIndex;
          const fallbackRoot = await caches.match('/');
          if (fallbackRoot) return fallbackRoot;

          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>LIENCOLIS Hors-Ligne</title></head><body style="font-family:sans-serif;padding:24px;text-align:center;background:#0f172a;color:#f8fafc;"><h2>📡 Mode Hors-Ligne Actif</h2><p>L\'application LIENCOLIS fonctionne en mode local. Vos données sont enregistrées dans votre appareil.</p></body></html>',
            {
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
              status: 200,
            }
          );
        }

        // Return a proper 503 response for failed script/json requests to prevent Unexpected token '<' errors
        return new Response('Network error or asset missing', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' },
        });
      })
  );
});

// Web Push notifications
self.addEventListener('push', (event) => {
  let data = {
    title: 'LIENCOLIS Driver Community',
    body: 'Nouvelle alerte disponible pour les livreurs.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'liencolis-alert',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || 'liencolis-push',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      { action: 'open', title: 'Ouvrir l\'application' },
      { action: 'close', title: 'Ignorer' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
