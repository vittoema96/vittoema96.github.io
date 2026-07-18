import { ItemCategory, ItemType } from '@/types/item.ts';

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
