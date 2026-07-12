import { ItemCategory, ItemType } from '@/types/item.ts';
import { SpecialType } from '@/features/character/special/special.ts';

type PerkRequirementKey = SpecialType | 'level';
export type PerkRequirements = Partial<Record<PerkRequirementKey, number>> &
    Record<string, number | undefined>;

export type PerkData = {
    ID: string;
    REQUISITES: PerkRequirements;
} & ({
    TIER: 1;
    LEVEL_REQ_INCREASE: null
} | {
    TIER: number,
    LEVEL_REQ_INCREASE: number
})

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
