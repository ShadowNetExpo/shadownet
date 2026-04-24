var CACHE='shadownet-v6';
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
