const CACHE_NAME = 'PB3K-v0.1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.webmanifest',

    '/js/app.js',
    '/js/character.js',
    '/js/display.js',
    '/js/popup.js',
    '/js/tabs.js',
    '/js/utils.js',

    '/js/lang/translator.js',
    '/js/lang/en.json',
    '/js/lang/it.json',

    '/css/styles.css',
    '/css/invStyles.css',
    '/css/statStyles.css',
    '/css/popupStyles.css',

    '/data/supplies/drinks.csv',
    '/data/supplies/food.csv',
    '/data/supplies/meds.csv',

    '/data/weapons/bigGuns.csv',
    '/data/weapons/energyWeapons.csv',
    '/data/weapons/explosives.csv',
    '/data/weapons/meleeWeapons.csv',
    '/data/weapons/smallGuns.csv',
    '/data/weapons/throwing.csv',

    '/img/svg/attack.svg',
    '/img/svg/bigGuns.svg',
    '/img/svg/caps.svg',
    '/img/svg/drinks.svg',
    '/img/svg/energyWeapons.svg',
    '/img/svg/explosives.svg',
    '/img/svg/food.svg',
    '/img/svg/gear.svg',
    '/img/svg/hp.svg',
    '/img/svg/luck.svg',
    '/img/svg/luck-gear.svg',
    '/img/svg/meds.svg',
    '/img/svg/meleeWeapons.svg',
    '/img/svg/smallGuns.svg',
    '/img/svg/throwing.svg',
    '/img/svg/unarmed.svg',
    '/img/svg/vaultboy.svg',
    '/img/svg/weight.svg',

    '/img/icons/192x192.png',
    '/img/icons/512x512.png',
];

// Install the service worker and cache assets
// Happens the first time and when a new version of this file is updated with a new version
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
                console.log('Fetching cache');
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

//PWA registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/js/sw.js')
            .then(registration => {
                console.log('Service Worker registered! 😎', registration);
            })
            .catch(err => {
                console.log('Service Worker registration failed! 😥', err);
            });
    });
}