import { ItemCategory, ItemType } from '@/types/item.ts';
import { WeaponItem } from '@/data/item/weapon.schemas.ts';
import { ApparelItem } from '@/data/item/apparel.schemas.ts';
import { AidItem, AmmoItem, LegendaryEffect, ModItem } from '@/types';
import { PerkData, PerkId } from '@/features/character/feats/perks/perks.ts';
import { TraitData, TraitId } from '@/features/character/feats/traits/traits.ts';

export interface CompanionPerkData {
    ID: string;
}
export interface BaseItem {
    ID: string;
    TYPE: ItemType;
    CATEGORY: ItemCategory;

    WEIGHT: number | '-'; // WEIGHT is in Kg!!
    COST: number | '-';
    RARITY: number | '-';
}
export interface GameDatabaseType {
    weapon: Record<string, WeaponItem>;
    apparel: Record<string, ApparelItem>;
    aid: Record<string, AidItem>;
    ammo: Record<string, AmmoItem>;
    other: Record<string, BaseItem>;
    mod: Record<string, ModItem>;
    perks: Record<PerkId, PerkData>;
    companionPerks: Record<string, CompanionPerkData>;
    traits: Record<TraitId, TraitData>;
    legendaryEffects: Record<string, LegendaryEffect>;
}
