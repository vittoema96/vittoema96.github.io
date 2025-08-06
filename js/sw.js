const CACHE_VERSION = "v0.0.1-alpha+9";
const PROJECT_NAME = "PB3K";



const CACHE_NAME = `${PROJECT_NAME}-${CACHE_VERSION}`;

/* TODO automate stuff with Node.js or Webpack */
const urlsToCache = [
    '/', // Main entrypoint
    '/index.html',
    '/manifest.json',

    /* JAVASCRIPT files */
    '/js/app.js',
    '/js/character.js',
    '/js/display.js',
    '/js/map.js',
    '/js/popup.js',
    /* DON'T ADD sw.js */
    '/js/tabs.js',
    '/js/utils.js',

    /* Translation stuff */
    '/js/lang/translator.js',
    '/js/lang/en.json',
    '/js/lang/it.json',

    /* CSS */
    '/css/styles.css',

    /* DATA (CSVs) */
    '/data/supplies/drinks.csv',
    '/data/supplies/food.csv',
    '/data/supplies/meds.csv',

    '/data/weapons/bigGuns.csv',
    '/data/weapons/energyWeapons.csv',
    '/data/weapons/explosives.csv',
    '/data/weapons/meleeWeapons.csv',
    '/data/weapons/smallGuns.csv',
    '/data/weapons/throwing.csv',

    '/data/ammo.csv',

    /* IMAGES */
    '/img/icons/192x192.png',
    '/img/icons/512x512.png',

    '/img/png/map.png',

    '/img/svg/attack.svg',
    '/img/svg/bigGuns.svg',
    '/img/svg/caps.svg',
    '/img/svg/damage1.svg',
    '/img/svg/damage2.svg',
    '/img/svg/drinks.svg',
    '/img/svg/energyWeapons.svg',
    '/img/svg/explosives.svg',
    '/img/svg/food.svg',
    '/img/svg/gear.svg',
    '/img/svg/gear-full.svg',
    '/img/svg/hp.svg',
    '/img/svg/luck.svg',
    '/img/svg/meds.svg',
    '/img/svg/meleeWeapons.svg',
    '/img/svg/smallGuns.svg',
    '/img/svg/throwing.svg',
    '/img/svg/unarmed.svg',
    '/img/svg/vaultboy.svg',
    '/img/svg/weight.svg',
];

// Install: triggered when the service worker is first registered or updated.
self.addEventListener('install', (event) => {
    console.log(`SW Event: install - Caching assets for version ${CACHE_NAME} 💾`);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('All assets cached successfully! ✅');
            })
            .catch(error => {
                console.error('Caching failed: ❌', error);
            })
   );
});

// Fetch: triggered for every network request made by the page.
self.addEventListener('fetch', (event) => {
    // We only want to handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // If the asset is in the cache, serve it from there.
            if (cachedResponse) {
                console.log(`CACHE HIT: ${event.request.url} ⚡`);
                return cachedResponse;
            }

            // If the asset is not in the cache, fetch it from the network.
            console.log(`NETWORK FETCH: ${event.request.url} 🌐`);
            return fetch(event.request);
        })
   );
});

// Activate: triggered after a new service worker has been installed and the old one is gone.
self.addEventListener('activate', (event) => {
    console.log('SW Event: activate - Activating new service worker... ✨');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete any caches that are not our current one
                    if (cacheName.startsWith(PROJECT_NAME) && cacheName !== CACHE_NAME) {
                        console.log(`Deleting old cache: ${cacheName} 🗑️`);
                        return caches.delete(cacheName);
                    }
                    return null;
                })
           );
        })
   );
});