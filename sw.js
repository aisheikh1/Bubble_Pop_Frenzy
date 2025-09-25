const CACHE_NAME = 'bubble-pop-frenzy-v2';

// Core files that must exist - using relative paths
const essentialFiles = [
  './',
  './index.html',
  './manifest.json',
  './src/styles/styles.css',
  './src/js/main.js',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// External resources
const externalResources = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Bangers&family=Fredoka+One&family=Inter:wght@400;700&display=swap'
];

self.addEventListener('install', function(event) {
  console.log('ServiceWorker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache opened, adding files...');
        
        // Cache essential files one by one with error handling
        const cachePromises = essentialFiles.map(url => {
          return fetch(url)
            .then(response => {
              if (response.ok) {
                return cache.put(url, response);
              }
              console.log('Skipping missing file:', url);
              return Promise.resolve();
            })
            .catch(err => {
              console.log('Failed to cache:', url, err);
              return Promise.resolve();
            });
        });
        
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('All essential files processed');
        return self.skipWaiting(); // Force activation
      })
  );
});

self.addEventListener('activate', function(event) {
  console.log('ServiceWorker activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(function(networkResponse) {
            // Cache successful responses for future use
            if (networkResponse.ok) {
              caches.open(CACHE_NAME)
                .then(function(cache) {
                  cache.put(event.request, networkResponse);
                });
            }
            return networkResponse.clone();
          })
          .catch(function() {
            // If both cache and network fail, you could return a fallback
            return new Response('Offline content not available');
          });
      })
  );
});