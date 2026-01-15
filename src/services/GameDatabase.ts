import type {
    Item, WeaponItem, ApparelItem, AidItem, ModItem, GenericItem, ItemType, ItemCategory
} from '@/types';
import {GameDataRepository} from "@/services/GameDataRepostory";

// Define the shape of your DB
interface DatabaseCollections {
    weapon: Record<string, WeaponItem>;
    apparel: Record<string, ApparelItem>;
    aid: Record<string, AidItem>;
    other: Record<string, GenericItem>;
    mod: Record<string, ModItem>;
    perks: Record<string, any>;
    allItems: Record<string, Item>; // Pre-calculated lookup for speed
}

// 1. The Singleton Instance (Hidden)
let db: DatabaseCollections | null = null;

// 2. Constants
export const UNACQUIRABLE_IDS = [
    'weaponUnarmedStrike',
    'weaponWeaponStock',
    'weaponWeaponStockOneHanded',
    'weaponBayonet',
    'weaponMissileLauncherBayonet',
    'weaponShredder',
    'robotPartSensors',
    'robotPartBody',
    'robotPartArms',
    'robotPartThrusters'
] as const;

export const ITEM_TYPE_MAP: Record<ItemType, ItemCategory[]> = {
    weapon: [
        'smallGuns',
        'energyWeapons',
        'bigGuns',
        'meleeWeapons',
        'explosives',
        'throwing',
        'unarmed',
    ],
    apparel: [
        'clothing',
        'outfit',
        'headgear',
        'raiderArmor',
        'leatherArmor',
        'metalArmor',
        'combatArmor',
        'syntheticArmor',
        'vaultTecSecurity'
    ],
    aid: ['food', 'drinks', 'meds'],
    mod: ['mods'], // TODO HAVE to decide how to handle mod categories
    other: ['ammo'],
};

// 3. The Service Object
export const GameDatabase = {
    /**
     * Initializes the database. Call this ONCE at app startup.
     */
    async init(): Promise<void> {
        if (db) { return } // Already initialized

        const rawData = await GameDataRepository.loadAllData();

        // Create a flat map for O(1) access by ID
        const allItems = {
            ...rawData.weapon,
            ...rawData.apparel,
            ...rawData.aid,
            ...rawData.mod,
            ...rawData.other,
        };

        db = { ...rawData, allItems };
    },

    /**
     * Returns the full DB. Throws if accessed before init.
     */
    get data() {
        if (!db) { throw new Error("GameDatabase not initialized! Call GameDatabase.init() first.") }
        return db;
    },

    getItem(id: string): Item | null {
        return this.data.allItems[id] || null;
    },

    isUnacquirable(target: string | { ID: string }): boolean {
        const id = typeof target === 'string' ? target : target.ID;
        return UNACQUIRABLE_IDS.includes(id as any);
    }
};
