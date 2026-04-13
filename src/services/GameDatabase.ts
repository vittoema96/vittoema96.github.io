import { AidItem, AmmoItem, Item, ModItem, TraitData } from '@/types';
import { GameDataRepository } from '@/services/GameDataRepository';
import { WeaponItem } from '@/schemas/items/weaponSchemas.ts';
import { BaseItem } from '@/schemas/items/baseItemSchemas.ts';
import { ApparelItem } from '@/schemas/items/apparelSchemas.ts';

// Define the shape of your DB
interface DatabaseCollections {
    weapon: Record<string, WeaponItem>;
    apparel: Record<string, ApparelItem>;
    aid: Record<string, AidItem>;
    ammo: Record<string, AmmoItem>;
    other: Record<string, BaseItem>;
    mod: Record<string, ModItem>;
    perks: Record<string, any>;
    traits: Record<string, TraitData>;
    allItems: Record<string, Item>; // Pre-calculated lookup for speed
}

// 1. The Singleton Instance (Hidden)
let db: DatabaseCollections | null = null;

// 2. Constants
export const UNACQUIRABLE_IDS = [
    'weaponUnarmedStrike',
    'weaponIronFist',
    'weaponWeaponStock',
    'weaponWeaponStockOneHanded',
    'weaponBayonet',
    'weaponMissileLauncherBayonet',
    'weaponShredder',
    'robotPartSensors',
    'robotPartBody',
    'robotPartArms',
    'robotPartThrusters',
] as const;

// 3. The Service Object
export const GameDatabase = {
    /**
     * Initializes the database. Call this ONCE at app startup.
     */
    async init(): Promise<void> {
        if (db) {
            return;
        } // Already initialized

        const rawData = await GameDataRepository.loadAllData();

        // Create a flat map for O(1) access by ID
        const allItems = {
            ...rawData.weapon,
            ...rawData.apparel,
            ...rawData.aid,
            ...rawData.ammo,
            ...rawData.mod,
            ...rawData.other,
        };

        db = { ...rawData, allItems };
    },

    /**
     * Returns the full DB. Throws if accessed before init.
     */
    get data() {
        if (!db) {
            throw new Error('GameDatabase not initialized! Call GameDatabase.init() first.');
        }
        return db;
    },

    getItem(id: string | undefined): Readonly<Item> | null {
        if (!id) {
            return null;
        }
        return this.data.allItems[id] || null;
    },

    isUnacquirable(target: string | { ID: string }): boolean {
        const id = typeof target === 'string' ? target : target.ID;
        return UNACQUIRABLE_IDS.includes(id as any);
    },
};
