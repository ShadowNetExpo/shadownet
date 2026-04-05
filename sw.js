const CACHE = 'shadownet-v4';
const OFFLINE_URLS = ['/', '/feed.html', '/profile.html', '/explore.html', '/messages.html', '/stories.html', '/leaderboard.html', '/live.html', '/stats.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(OFFLINE_URLS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  if(e.request.url.includes('supabase.co')) return;
  e.respondWith(
    fetch(e.request).then(res => {
      if(res.ok && res.type === 'basic'){
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request).then(c => c || caches.match('/')))
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(data.title || 'SHADOWNET', {
    body: data.body || 'Nueva notificación',
    icon: 'https://ui-avatars.com/api/?name=SN&background=ff2255&color=fff&size=192',
    badge: 'https://ui-avatars.com/api/?name=SN&background=ff2255&color=fff&size=72',
    data: { url: data.url || '/' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url || '/'));
});
