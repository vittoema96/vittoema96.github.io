const PROJECT_VERSION = "PLACEHOLDER"; // Set by deploy stage

const PROJECT_NAME = "PB3K";
const CACHE_NAME = `${PROJECT_NAME}-${PROJECT_VERSION}`;
const FONT_CACHE_NAME = 'google-fonts-cache';

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

    /* Translation stuff */
    '/js/lang/translator.js',
    '/js/lang/en.json',
    '/js/lang/it.json',

    /* CSS */
    '/css/styles.css',

    /* DATA (CSVs) */
        // Supplies
    '/data/supplies/drinks.csv',
    '/data/supplies/food.csv',
    '/data/supplies/meds.csv',
        // Weapons
    '/data/weapons/bigGuns.csv',
    '/data/weapons/energyWeapons.csv',
    '/data/weapons/explosives.csv',
    '/data/weapons/meleeWeapons.csv',
    '/data/weapons/smallGuns.csv',
    '/data/weapons/throwing.csv',
        // Other
    '/data/ammo.csv',
    '/data/perks.csv',

    /* IMAGES */
    '/img/icons/192x192.png',
    '/img/icons/512x512.png',

    /* Maps */
    '/img/png/map.png',

    /* SVG Images */
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

    /* External Files (Libraries) */
    'https://unpkg.com/@panzoom/panzoom@4.6.0/dist/panzoom.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install: triggered when the service worker is first registered or updated.
self.addEventListener('install', (event) => {
    console.log(`SW Event: install - Caching assets for ${CACHE_NAME} 💾`);
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

// Fetch: triggered for every network request made by the page.
self.addEventListener('fetch', (event) => {
    // We only want to handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Stale-While-Revalidate for Google Fonts
    const requestUrl = new URL(event.request.url);
    if (requestUrl.hostname === 'fonts.googleapis.com' || requestUrl.hostname === 'fonts.gstatic.com') {
        event.respondWith(
            caches.open(FONT_CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    const networkFetch = fetch(event.request).then((networkResponse) => {
                        cache.put(event.request, networkResponse.clone())
                            .catch(err => {
                                console.warn(`SW: Failed to cache font request: ${event.request.url}`, err);
                            }) ;
                        return networkResponse;
                    });
                    // Return cached response immediately, then update cache in background
                    return cachedResponse || networkFetch;
                });
            })
        );
        return; // End execution for this strategy
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