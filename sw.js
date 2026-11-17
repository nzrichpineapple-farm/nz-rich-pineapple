const CACHE_NAME = 'nzrich-v19';
const urlsToCache = [
  './',
  './index.html',
  './patch-v2.js?v=3',
  './patch-v3.js?v=4'
  './logo.jpeg.JPG',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js'
];

// Pasang: simpan fail ke dalam cache telefon dan terus aktif
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Aktif: buang semua cache lama (v1 hingga v6)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Ambil: fail app dari internet dahulu, cache hanya jika tiada internet
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.origin === location.origin) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(res => {
          if (res.ok) {
            const salin = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, salin));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(r => r || fetch(event.request))
  );
});
