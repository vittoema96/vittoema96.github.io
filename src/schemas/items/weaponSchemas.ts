import { z } from 'zod';
import { DAMAGE_TYPES, DamageType } from '@/types';
import { BaseItem, BaseItemSchema } from '@/schemas/items/baseItemSchemas.ts';
import { WEAPON_CATEGORIES, WeaponCategory } from '@/types/item.ts';

export const RANGES = ['rangeR', 'rangeC', 'rangeM', 'rangeL', 'rangeE'];
export type Range = (typeof RANGES)[number];

export interface WeaponItem extends BaseItem {
    TYPE: 'weapon';
    CATEGORY: WeaponCategory;

    DAMAGE_RATING: number;
    DAMAGE_TYPES: DamageType[];
    FIRE_RATE: number | '-'; // number o "-" per melee TODO should change type (only number? number + undefined?)
    RANGE: Range | '-';
    AMMO_TYPE: string;

    EFFECTS: string[]; // JSON array
    QUALITIES: string[]; // JSON array
    AVAILABLE_MODS: string[]; // JSON array
}


export const WeaponSchema: z.ZodType<WeaponItem> = BaseItemSchema.extend({
    // Narrow down already defined attributes
    ID: z.string().startsWith("weapon"),
    TYPE: z.literal("weapon"),
    CATEGORY: z.enum(WEAPON_CATEGORIES),

    // Weapon specific attributes
    DAMAGE_RATING: z.number().min(0),
    DAMAGE_TYPES: z.array(z.enum(DAMAGE_TYPES)),
    FIRE_RATE: z.number().or(z.literal("-")),
    RANGE: z.enum(RANGES).or(z.literal("-")),
    AMMO_TYPE: z.string(),

    EFFECTS: z.array(z.string()).default([]),
    QUALITIES: z.array(z.string()).default([]),
    AVAILABLE_MODS: z.array(z.string()).default([]),
});
