import { z } from 'zod';
import { ITEM_CATEGORIES, ITEM_TYPES } from '@/types/item.ts';

export const BaseItemSchema = z.object({
    ID: z.string(),
    TYPE: z.enum(ITEM_TYPES),
    CATEGORY: z.enum(ITEM_CATEGORIES),

    WEIGHT: z.number().min(0).or(z.literal('-')),
    COST: z.number().int().min(0).or(z.literal('-')),
    RARITY: z.number().int().min(0).max(6).or(z.literal('-')),
});
