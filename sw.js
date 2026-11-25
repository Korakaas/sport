// Service worker : l'appli fonctionne hors ligne.
// Pour publier une mise à jour, change le numéro de VERSION.
const VERSION = 'v1';
const CACHE = 'programme-12s-' + VERSION;
const FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
  'fonts/bricolage-grotesque-latin-600-normal.woff2', 'fonts/bricolage-grotesque-latin-800-normal.woff2',
  'fonts/hanken-grotesk-latin-400-normal.woff2', 'fonts/hanken-grotesk-latin-500-normal.woff2',
  'fonts/hanken-grotesk-latin-600-normal.woff2', 'fonts/hanken-grotesk-latin-700-normal.woff2'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('programme-12s-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord pour la page (mises à jour rapides), cache en secours ; cache d'abord pour le reste.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === 'navigate';
  if (isPage) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('index.html', copy));
        return res;
      }).catch(() => caches.match('index.html').then((r) => r || caches.match('./')))
    );
    return;
  }
  e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
    return res;
  })));
});
