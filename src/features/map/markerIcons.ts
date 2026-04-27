import { MapMarkerCategory, MapMarkerIconKey } from '@/features/map/mapMarkerTypes';

export const markerIconRegistry: Record<MapMarkerIconKey, string> = {
    bunker:     'game-icons:bunker',       // Hidden Valley (BoS) – silhouette bunker
    camp:       'fa6-solid:tent',          // Cottonwood Cove, Bitter Springs, Camp Golf, Legate's Camp
    canyon:     'game-icons:mountaintop',  // Red Rock Canyon, Black Mountain
    cemetery:   'mdi:grave-stone',         // Goodsprings Cemetery
    city:       'mdi:city-variant',        // New Vegas Strip, Freeside, North Vegas, Westside
    dam:        'game-icons:dam',          // Hoover Dam
    fortress:   'fa6-solid:chess-rook',    // The Fort (Legion HQ), The Thorn
    hazard:     'mdi:radioactive',         // Camp Searchlight (irradiata), HELIOS One override
    industrial: 'fa6-solid:rocket',        // REPCONN Test Site & HQ (azienda missilistica)
    medical:    'game-icons:medical-pack', // Followers of the Apocalypse
    military:   'fa6-solid:flag',          // Mojave Outpost, Camp McCarran, Nellis AFB
    prison:     'fa6-solid:lock',          // NCRCF
    scrapyard:  'mdi:pickaxe',             // Gibson Scrap Yard, Quarry Junction (cava/rottami)
    school:     'fa6-solid:star',          // King's School of Impersonation = banda dei Kings
    settlement: 'mdi:home',               // Goodsprings, Primm, Novac, Boulder City…
    store:      'mdi:store',               // Crimson Caravan Company
    vault:      'mdi:cog',                 // Vault-Tec cog
};

export const markerCategoryIcons: Record<MapMarkerCategory, MapMarkerIconKey> = {
    bunker: 'bunker',
    camp: 'camp',
    canyon: 'canyon',
    cemetery: 'cemetery',
    city: 'city',
    dam: 'dam',
    fortress: 'fortress',
    hazard: 'hazard',
    industrial: 'industrial',
    medical: 'medical',
    military: 'military',
    prison: 'prison',
    scrapyard: 'scrapyard',
    school: 'school',
    settlement: 'settlement',
    store: 'store',
    vault: 'vault',
};


