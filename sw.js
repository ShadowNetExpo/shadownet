var CACHE='shadownet-v7';
var URLS=['/','/feed.html','/explore.html','/reels.html','/profile.html','/messages.html','/settings.html','/editor.html','/live.html','/stats.html','/notifications.html','/search.html','/dashboard.html','/stories.html','/almas.html','/leaderboard.html','/sounds.html','/sound.html','/creator-signup.html','/creator-analytics.html','/welcome-setup.html','/messaging-tools.html','/promos-trials.html','/outreach.html','/admin.html','/landing.html','/index.html','/legal18.html','/soporte.html','/cookies.html','/privacy.html','/terms.html','/dmca.html','/sn-design.css','/manifest.json','/icon.svg','/push.js','/antipiracy.js','/profile-enhancer.js','/outreach-dm-generator.js'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        if(response.ok){
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        return caches.match(e.request).then(function(r) {
          return r || caches.match('/feed.html');
        });
      })
  );
});

// === PUSH NOTIFICATIONS (web push protocol) ===
self.addEventListener('push', function(event) {
  var data = {};
  try {
    if (event.data) data = event.data.json();
  } catch (_) {
    try { data = { title: 'SHADOWNET', body: event.data ? event.data.text() : '' }; } catch (__) {}
  }
  var title = data.title || 'SHADOWNET';
  var options = {
    body: data.body || '',
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/icon.svg',
    tag: data.tag || 'shadownet-notif',
    renotify: data.renotify === true,
    data: { url: data.url || '/', raw: data },
    requireInteraction: false,
    silent: false
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var targetUrl = (event.notification.data && event.notification.data.url) || '/';
  // Make absolute
  try {
    if (targetUrl.indexOf('http') !== 0) {
      targetUrl = self.location.origin + (targetUrl.charAt(0) === '/' ? targetUrl : '/' + targetUrl);
    }
  } catch(_) {}
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // If a window is already open on this URL, focus it
      for (var i = 0; i < windowClients.length; i++) {
        var c = windowClients[i];
        if (c.url === targetUrl && 'focus' in c) return c.focus();
      }
      // Otherwise open a new tab
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('pushsubscriptionchange', function(event) {
  // Best-effort re-subscribe; the next page load will re-subscribe via push.js
  console.log('[sw] pushsubscriptionchange - will re-subscribe on next load');
});
