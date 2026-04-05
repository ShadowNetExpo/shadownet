// SHADOWNET SW v5 - auto-clear all caches and unregister
self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.matchAll({type:'window',includeUncontrolled:true}))
      .then(clients => { clients.forEach(c => c.navigate(c.url)); })
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // No caching - always go to network
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(data.title || 'SHADOWNET', {
    body: data.body || 'Nueva notificacion',
    icon: 'https://ui-avatars.com/api/?name=SN&background=ff2255&color=fff&size=192',
    badge: 'https://ui-avatars.com/api/?name=SN&background=ff2255&color=fff&size=72',
    data: { url: data.url || '/' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url || '/'));
});
