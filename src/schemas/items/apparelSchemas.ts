import { z } from 'zod';
import { GenericBodyPart } from '@/types';
import { BaseItem, BaseItemSchema } from '@/schemas/items/baseItemSchemas.ts';
import { APPAREL_CATEGORIES, ApparelCategory } from '@/types/item.ts';

export interface ApparelItem extends BaseItem {
    TYPE: 'apparel';
    CATEGORY: ApparelCategory;

    PHYSICAL_RES: number;
    ENERGY_RES: number;
    RADIATION_RES: number;
    LOCATIONS_COVERED: (GenericBodyPart | 'arm' | 'arms' | 'leg' | 'legs')[]; // JSON array

    EFFECTS: string[];
    AVAILABLE_MODS: string[]; // JSON array
}

export const ApparelSchema: z.ZodType<ApparelItem> = BaseItemSchema.extend({
    // Narrow down already defined attributes
    ID: z.string().regex(/^(apparel|armor|robotPart)/),
    TYPE: z.literal("apparel"),
    CATEGORY: z.enum(APPAREL_CATEGORIES),

    // Apparel specific attributes
    PHYSICAL_RES: z.number().int().min(0).or(z.literal(Infinity)),
    ENERGY_RES: z.number().int().min(0).or(z.literal(Infinity)),
    RADIATION_RES: z.number().int().min(0).or(z.literal(Infinity)),

    LOCATIONS_COVERED: z.array(z.string()).default([]), // TODO change this as it sucks

    EFFECTS: z.array(z.string()).default([]),
    //QUALITIES: z.array(z.string()).default([]),
    AVAILABLE_MODS: z.array(z.string()).default([]),
});
