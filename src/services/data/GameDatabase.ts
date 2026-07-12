import { AidItem, AmmoItem, Item, LegendaryEffect, ModItem } from '@/types';
import { compiledData, weapon, apparel } from '@/data';
import { WeaponItem } from '@/data/item/weapon.schemas.ts';
import { ApparelItem } from '@/data/item/apparel.schemas.ts';
import { BaseItem, CompanionPerkData, PerkData } from '@/data/types.ts';
import { TraitData } from '@/features/character/feats/traits/traits.ts';

export interface GameDatabaseType {
    weapon: Record<string, WeaponItem>;
    apparel: Record<string, ApparelItem>;
    aid: Record<string, AidItem>;
    ammo: Record<string, AmmoItem>;
    other: Record<string, BaseItem>;
    mod: Record<string, ModItem>;
    perks: Record<string, PerkData>;
    companionPerks: Record<string, CompanionPerkData>;
    traits: Record<string, TraitData>;
    legendaryEffects: Record<string, LegendaryEffect>;
}

export type GameItemCollections = Pick<
    GameDatabaseType,
    'weapon' | 'apparel' | 'aid' | 'ammo' | 'mod' | 'other'
>;

const getItemCollections = (data: GameDatabaseType): GameItemCollections => ({
    weapon: data.weapon,
    apparel: data.apparel,
    aid: data.aid,
    ammo: data.ammo,
    mod: data.mod,
    other: data.other,
});

// The Singleton Instance (Hidden)
let db: GameDatabaseType | null = null;

// Constants
export const UNACQUIRABLE_IDS: (keyof typeof weapon | keyof typeof apparel)[] = [
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

// The Service Object
export const GameDatabase = {
    /**
     * Initializes the database. Call this ONCE at app startup.
     */
    async init(): Promise<void> {
        if (db) {
            return;
        } // Already initialized

        db = compiledData;
    },

    /**
     * Returns the full DB. Throws if accessed before init.
     */
    get data() {
        if (!db) { throw new Error('GameDatabase not initialized! Call GameDatabase.init() first.') }
        return db;
    },

    getItem(id: string | undefined): Readonly<Item> | null {
        if (!id) { return null }
        const itemCollections = getItemCollections(this.data);
        return (
            itemCollections.weapon[id] ??
            itemCollections.apparel[id] ??
            itemCollections.aid[id] ??
            itemCollections.ammo[id] ??
            itemCollections.mod[id] ??
            itemCollections.other[id] ??
            null
        );
    },

    isUnacquirable(target: string | { ID: string }): boolean {
        const id = typeof target === 'string' ? target : target.ID;
        return UNACQUIRABLE_IDS.includes(id as any);
    },
};
