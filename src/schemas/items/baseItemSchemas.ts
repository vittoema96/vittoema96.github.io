import { z } from 'zod';
import { ITEM_CATEGORIES, ItemCategory, ITEM_TYPES, ItemType } from '@/types/item.ts';

export interface BaseItem {
    ID: string;
    TYPE: ItemType;
    CATEGORY: ItemCategory;

    WEIGHT: number | '-'; // WEIGHT is in Kg!!
    COST: number | '-';
    RARITY: number | '-';
}

export const BaseItemSchema = z.object({
    ID: z.string(),
    TYPE: z.enum(ITEM_TYPES),
    CATEGORY: z.enum(ITEM_CATEGORIES),

    WEIGHT: z.number().min(0)
        .or(z.literal('-')),
    COST: z.number().int().min(0)
        .or(z.literal('-')),
    RARITY: z.number().int().min(0).max(6)
        .or(z.literal('-')),
});
