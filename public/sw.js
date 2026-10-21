// Service worker: push notifications and an offline page.

const CACHE = 'koris-v1';
const OFFLINE = ['/offline.html', '/style.css', '/fonts/schibsted-grotesk-latin-wght-normal.woff2', '/fonts/schibsted-grotesk-latin-ext-wght-normal.woff2', '/icons/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(OFFLINE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

// Pages always come from the network; the offline page only stands in when there is none.
self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  if (request.mode === 'navigate') {
    e.respondWith(fetch(request).catch(() => caches.match('/offline.html')));
    return;
  }
  if (OFFLINE.includes(new URL(request.url).pathname)) {
    e.respondWith(fetch(request).catch(() => caches.match(request)));
  }
});

self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data.json(); } catch { data = { title: e.data?.text() }; }
  e.waitUntil(self.registration.showNotification(data.title || 'Koris', {
    body: data.body,
    tag: data.tag,
    lang: 'lv',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    data: { url: data.url || '/' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || '/', self.location.origin).href;
  e.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin && 'navigate' in client) {
        await client.focus();
        return client.navigate(url);
      }
    }
    return self.clients.openWindow(url);
  })());
});
