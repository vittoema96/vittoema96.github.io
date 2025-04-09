const CACHE_NAME = 'pipboy-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/js/app.js',
    '/js/popup.js',
    '/js/sw.js',
    '/js/lang/translator.js',
    '/js/lang/en.json',
    '/css/styles.css',
    '/css/invStyles.css',
    '/css/statStyles.css',
    '/css/popupStyles.css',
    '/manifest.webmanifest'
    // Add any other assets (images, fonts, etc.) you want to cache
];

// Install the service worker and cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
   );
});

// Serve cached assets or fetch from the network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(() => {
                console.log('fetching cache');
                return fetch(event.request);
            })
   );
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    console.log('Activating cache');
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                    return null;
                })
           );
        })
   );
});
