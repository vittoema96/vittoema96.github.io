import { z } from 'zod';
import { COMPANION_IDS, LEFT, RIGHT } from '@/types';
import { ORIGIN_IDS } from '@/features/character/origins/types';
import { ITEM_CATEGORIES, ITEM_TYPES } from '@/types/item.ts';
import { SPECIAL, SpecialType } from '@/features/character/special/special.ts';
import {
    COMPANION_SKILLS,
    CompanionSkillType,
    SKILLS,
    SkillType,
} from '@/features/character/skills/skills.ts';
import { traits, perks } from '@/data';
import {
    COMPANION_SPECIAL,
    CompanionSpecialType,
} from '@/features/character/special/special.companion.ts';

// Fills all missing special with value 4. Validates 4 <= SPECIAL <= 12
const SpecialMapSchema = z.object(
    SPECIAL.reduce(
        (map, key) => {
            map[key] = z.number().int().min(4).max(12).default(4);
            return map;
        },
        {} as Record<SpecialType, z.ZodDefault<z.ZodNumber>>,
    ),
);

// Fills all missing skills with value 0. Validates 0 <= SPECIAL <= 6
const SkillMapSchema = z.object(
    SKILLS.reduce(
        (map, key) => {
            map[key] = z.number().int().min(0).max(6).default(0);
            return map;
        },
        {} as Record<SkillType, z.ZodDefault<z.ZodNumber>>,
    ),
);

import { CompanionData } from '@/utils/companionTypes.ts';

// Saves are migrated before validation, in loadCharacter (state/saveMigrations.ts).
export const CharacterItemSchema = z.object({
    id: z.string(),
    customName: z.string().optional(),
    quantity: z.number().default(1),
    equipped: z.boolean().default(false),
    mods: z.array(z.string()).default([]),
    side: z.enum([LEFT, RIGHT]).optional(),
    grantedBy: z.string().optional(),
});

// Validates CustomItems
const CustomItemSchema = z.object({
    customName: z.string(),
    quantity: z.number().int().min(1),
    ID: z.undefined().optional(),
    COST: z.number().int().min(0),
    WEIGHT: z.number().min(0),
    RARITY: z.number().int().min(0).max(6),
    TYPE: z.enum(ITEM_TYPES),
    CATEGORY: z.enum(ITEM_CATEGORIES),
    description: z.string().optional(),
});
// Validates exchange rates filling defaults
const ExchangeRatesSchema = z.object({
    ncrDollars: z.number().min(0.001).default(2.5),
    legionDenarius: z.number().int().min(0.001).default(4),
    prewarMoney: z.number().int().min(0.001).default(10),
});

// Validates companion data TODO to review
const CompanionDataSchema = z.object({
    type: z.enum(COMPANION_IDS),
    name: z.string().optional(),
    // TODO might want to set defaults for special and skills (or maybe not, we set them all everytime)
    // TODO when implementing non body/mind companions review this bit
    special: z.object(
        COMPANION_SPECIAL.reduce(
            (map, key) => {
                // Companion baselines can be below the player minimum (Dogmeat has MIND 1).
                map[key] = z.number().int().min(1).max(10);
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
});

export const CompanionsMapSchema = z.record(
    z.string().refine(key => (COMPANION_IDS as readonly string[]).includes(key), {
        message: 'Invalid companion ID',
    }),
    CompanionDataSchema,
) as z.ZodType<Partial<Record<(typeof COMPANION_IDS)[number], CompanionData>>>;

export const ItemsSchema = z.array(CharacterItemSchema).transform(items => {
    // Split equipped items (only 1 item equipped at a time)
    const unrolledItems = [];
    for (const item of items) {
        if (item.equipped && item.quantity > 1) {
            // 1 equipped item
            unrolledItems.push(
                {
                    ...item,
                    quantity: 1,
                },
                {
                    ...item,
                    quantity: item.quantity - 1,
                    equipped: false,
                    side: undefined,
                },
            );
        } else {
            unrolledItems.push(item);
        }
    }

    // Aggregate same time items
    const unequippedMap = new Map<string, z.infer<typeof CharacterItemSchema>>();
    const result: z.infer<typeof CharacterItemSchema>[] = [];

    for (const item of unrolledItems) {
        if (item.equipped) {
            // Equipped items stay as individual single-quantity entries
            result.push(item);
        } else {
            const modsKey = item.mods.toSorted().join(',');
            const key = [item.id, item.customName ?? '', modsKey, item.grantedBy ?? ''].join('|');

            const existing = unequippedMap.get(key);
            if (existing) {
                existing.quantity += item.quantity;
            } else {
                const copy = { ...item };
                unequippedMap.set(key, copy);
                result.push(copy);
            }
        }
    }

    return result;
});
export const RawCharacterSchema = z.object({
    name: z.string().optional(),
    level: z.number().int().min(1).default(1),
    origin: z.enum(ORIGIN_IDS).optional(),
    background: z.string().optional(),

    caps: z.number().int().default(0),
    ncrDollars: z.number().int().default(0),
    legionDenarius: z.number().int().default(0),
    prewarMoney: z.number().int().default(0),

    exchangeRates: ExchangeRatesSchema.default(() => ExchangeRatesSchema.parse({})),

    special: SpecialMapSchema.default(() => SpecialMapSchema.parse({})),
    skills: SkillMapSchema.default(() => SkillMapSchema.parse({})),
    specialties: z.array(z.enum(SKILLS)).default([] as SkillType[]),
    traits: z.array(z.enum(Object.values(traits).map(t => t.ID))).default([]),
    perks: z.array(z.enum(Object.values(perks).map(p => p.ID))).default([]),

    // TODO: enforce non-negative resource values after the legacy migration window.
    currentHp: z.number().optional(),
    currentLuck: z.number().optional(),
    rads: z.number().default(0),
    maxHpBonus: z.number().int().default(0),

    items: ItemsSchema.default([]),
    customItems: z.array(CustomItemSchema).default([]),

    mapCodes: z.array(z.string()).default([]),

    activeCompanionId: z.enum(COMPANION_IDS).optional(),
    companions: CompanionsMapSchema.default({}),

    // Party (group) this character is connected to. null/missing = not in a group.
    partyCode: z.string().max(32).nullable().optional(),
    // Group AP kept on this character while not connected to a party (0..99).
    localGroupAP: z.number().int().min(0).max(99).default(0),

    // Stable id of this character inside a group (members are listed by this id).
    memberId: z
        .string()
        .regex(/^[a-z0-9]{1,32}$/)
        .optional(),

    // This character's group state (its own PA contribution, not yet confirmed by relays).
    groupPA: z
        .object({
            code: z.string().max(32),
            myPA: z.number().int().min(-999).max(999),
            pending: z.boolean(),
        })
        .nullable()
        .optional()
        // Saves from earlier spike versions have another shape: drop it instead of failing the load.
        .catch(null),
});
