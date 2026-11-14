const CACHE_NAME = 'nzrich-v4';
const urlsToCache = [
  './',
  './index.html',
  './logo.jpeg.JPG',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js'
];

// Simpan fail ke dalam cache telefon
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Ambil fail dari cache jika tiada internet
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Guna fail dalam telefon
        }
        return fetch(event.request); // Cuba ambil dari internet
      })
  );
});
