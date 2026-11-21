// Service worker : appli installable + lecture hors ligne des fichiers déjà chargés.
const CACHE = 'vcn-v1';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './css/app.css',
  './js/app.js', './js/api.js', './js/ui.js', './js/art.js', './js/components.js', './js/config.js',
  './js/views/home.js', './js/views/article.js', './js/views/feed.js', './js/views/secrets.js', './js/views/map.js',
  './js/views/games.js', './js/views/vip.js', './js/views/account.js', './js/views/legal.js', './js/views/admin.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const cacheable = url.origin === self.location.origin || url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'fonts.bunny.net';
  if (!cacheable) return; // Données Supabase, Stripe : toujours en direct
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))),
  );
});
