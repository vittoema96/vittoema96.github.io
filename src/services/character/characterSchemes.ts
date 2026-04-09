import { z } from 'zod';
import { COMPANION_IDS, ITEM_CATEGORIES, ITEM_TYPES, LEFT, RIGHT, TraitId, TRAITS } from '@/types';
import { ORIGIN_IDS } from '@/services/character/Origin.ts';
import {
    COMPANION_SKILLS,
    COMPANION_SPECIAL,
    CompanionSkillType,
    CompanionSpecialType,
    SKILLS,
    SkillType,
    SPECIAL,
    SpecialType,
} from '@/services/character/utils.ts';

// Fills all missing special with value 4. Validates 4 <= SPECIAL <= 12
const SpecialMapSchema = z.object(
    SPECIAL.reduce(
        (map, key) => {
            map[key] = z.number().int()
                .min(4).max(12)
                .default(4);
            return map;
        },
        {} as Record<SpecialType, z.ZodDefault<z.ZodNumber>>,
    ),
);

// Fills all missing skills with value 0. Validates 0 <= SPECIAL <= 6
const SkillMapSchema = z.object(
    SKILLS.reduce(
        (map, key) => {
            map[key] = z.number().int()
                .min(0).max(6)
                .default(0);
            return map;
        },
        {} as Record<SkillType, z.ZodDefault<z.ZodNumber>>,
    ),
)
// Validates CharacterItems
const CharacterItemSchema = z.object({
    id: z.string(),
    customName: z.string().optional(),
    quantity: z.number().default(1),
    equipped: z.boolean().default(false),
    mods: z.array(z.string()).default([]),
    variation: z.enum([LEFT, RIGHT]).optional(),
})
// Validates CustomItems
const CustomItemSchema = z.preprocess((input: any) => {
        // MIGRATION FOR OLDER NAME TODO remove this once everyone migrated
        // Migrates name to customName
        if (input && typeof input === 'object') {
            return {
                customName: input.customName ?? input.name,
                quantity: input.quantity,
                COST: input.COST ?? input.value,
                WEIGHT: input.WEIGHT ?? input.weight,
                RARITY: input.RARITY ?? input.rarity,
                CATEGORY: input.CATEGORY ?? input.category,
                TYPE: input.TYPE ?? input.type,
                description: input.description,
            }
        }
        return input;
    },
    z.object({
        customName: z.string(),
        quantity: z.number().int().min(1),
        ID: z.undefined().optional(),
        COST: z.number().int().min(0),
        WEIGHT: z.number().min(0),
        RARITY: z.number().int().min(0).max(6),
        TYPE: z.enum(ITEM_TYPES),
        CATEGORY: z.enum(ITEM_CATEGORIES),
        description: z.string().optional(),
    })
)
// Validates exchange rates filling defaults
const ExchangeRatesSchema = z.object({
    ncrDollars: z.number().min(0.001).default(2.5),
    legionDenarius: z.number().int().min(0.001).default(4),
    prewarMoney: z.number().int().min(0.001).default(10),
})

// Validates companion data TODO to review
const CompanionDataSchema = z.preprocess((input: any) => {
    // MIGRATION FOR OLDER COMPANIONS TODO remove this once everyone migrated
    // Migrates weapons to items
    if (input && typeof input === 'object' && input.items === undefined && input.weapons !== undefined) {
        return {
            ...input,
            items: input.weapons,
        };
    }
    return input;
}, z.object({
    type: z.enum(COMPANION_IDS),
    name: z.string().optional(),
    // TODO might want to set defaults for special and skills (or maybe not, we set them all everytime)
    // TODO when implementing non body/mind companions review this bit
    special: z.object(
        COMPANION_SPECIAL.reduce(
            (map, key) => {
                map[key] = z.number().int().min(4).max(10);
                return map;
            },
            {} as Record<CompanionSpecialType, z.ZodNumber>,
        ),
    ),
    skills: z.object(
        COMPANION_SKILLS.reduce(
            (map, key) => {
                map[key] = z.number().int().min(0).max(6);
                return map;
            },
            {} as Record<CompanionSkillType, z.ZodNumber>,
        ),
    ),
    // Current HP
    currentHp: z.number().min(0),
    perks: z.array(z.string()).default([]),
    items: z.array(CharacterItemSchema).default([]),
}))

export const RawCharacterSchema = z.object({
    name: z.string().optional(),
    level: z.number().int().min(1).default(1),
    origin: z.enum(ORIGIN_IDS).optional(),
    background: z.string().optional(),

    caps: z.number().int().default(0),
    ncrDollars: z.number().int().default(0),
    legionDenarius: z.number().int().default(0),
    prewarMoney: z.number().int().default(0),

    exchangeRates: ExchangeRatesSchema.default({} as z.infer<typeof ExchangeRatesSchema>),
    // FIXME exchange rates

    special: SpecialMapSchema.default({} as z.infer<typeof SpecialMapSchema>),
    skills: SkillMapSchema.default({} as z.infer<typeof SkillMapSchema>),
    specialties: z.array(z.enum(SKILLS)).default([] as SkillType[]),
    traits: z.array(z.enum(TRAITS)).default([] as TraitId[]),
    perks: z.array(z.string()).default([]),

    currentHp: z.number().optional(),
    currentLuck: z.number().optional(),
    rads: z.number().default(0),

    items: z.array(CharacterItemSchema).default([]),
    customItems: z.array(CustomItemSchema).default([]),

    mapCodes: z.array(z.string()).default([]),

    companion: CompanionDataSchema.optional(),
});
