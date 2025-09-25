const CACHE_NAME = 'bubble-pop-frenzy-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './src/styles/styles.css',
  './src/js/main.js',
  './src/js/game.js',
  './src/js/bubbles.js',
  './src/js/ui/urgentMessage.js',
  './src/js/utils/resizeCanvas.js',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Bangers&family=Fredoka+One&family=Inter:wght@400;700&display=swap'
];

self.addEventListener('install', function(event) {
  console.log('ServiceWorker install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        // Cache only the essential files, skip if any fail
        return cache.addAll(urlsToCache.map(url => {
          return new Request(url, { mode: 'no-cors' });
        })).catch(err => {
          console.log('Cache addAll failed:', err);
          // Still resolve the promise so SW activates
          return Promise.resolve();
        });
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});