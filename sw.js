/* ═══════════════════════════════════════════════════════════════
   CIFIKA — Service Worker
   - Precaches the app shell so the portal opens offline / installs as a PWA.
   - Network-first for page navigations (fresh when online, cached fallback).
   - NEVER touches Supabase API requests (always live network).
   Bump CACHE_VERSION whenever you deploy an updated page.
   ═══════════════════════════════════════════════════════════════ */
const CACHE_VERSION = 'cifika-v2';
const PRECACHE = [
  './',
  './portal.html',
  './attendance.html',
  './registration.html',
  './checkin.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // only GET
  if (event.request.method !== 'GET') return;
  // always live: database, auth, storage
  if (url.hostname.includes('supabase')) return;

  // page navigations → network first, cache fallback (offline)
  if (event.request.mode === 'navigate' || (event.request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match('./portal.html'))
        )
    );
    return;
  }

  // everything else → cache first, then network (and cache it)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok || response.type === 'opaque') {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
