const CACHE_NAME = 'bubble-pop-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/styles/styles.css',
  '/src/js/main.js',
  '/src/js/game.js',
  '/src/js/bubbles.js',
  '/src/js/ui/messageBox.js',
  '/src/js/ui/urgentMessage.js',
  '/src/js/utils/randomColor.js',
  '/src/js/utils/resizeCanvas.js',
  '/src/js/effects/ExplosionEffect.js',
  '/src/js/effects/FloatingTextEffect.js',
  '/src/js/effects/GiftUnwrapEffect.js',
  '/src/js/effects/PopEffect.js',
  '/src/js/effects/ScreenFlashEffect.js',
  '/src/js/effects/BombPrimedEffect.js',
  '/src/js/effects/BubbleSplatEffect.js',
  '/src/js/effects/EffectManager.js',
  '/manifest.json',
  // Add your icon paths when created
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});