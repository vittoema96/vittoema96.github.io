import { Origin, OriginId } from '@/services/character/Origin.ts';
import {
    CompanionSkillType,
    CompanionSpecialType,
    SkillType,
    SpecialType,
} from '@/services/character/utils.ts';
import { WeaponItem } from '@/schemas/items/weaponSchemas.ts';
import { BaseItem } from '@/schemas/items/baseItemSchemas.ts';
import { ApparelItem } from '@/schemas/items/apparelSchemas.ts';
import { AidCategory, AmmoCategory, ItemCategory, ItemType } from '@/types/item.ts';

// **---- Currency related ----**
export const CURRENCIES = ['caps', 'ncrDollars', 'legionDenarius', 'prewarMoney'] as const;
export type CurrencyType = (typeof CURRENCIES)[number];

// Default exchange rates: how many of each currency equals 1 Cap
// These are defaults that can be overridden by user in character data
export const DEFAULT_EXCHANGE_RATES: Record<CurrencyType, number> = {
    caps: 1,
    ncrDollars: 2.5, // 2.5 NCR Dollars = 1 Cap
    legionDenarius: 4, // 4 Legion Denarius = 1 Cap
    prewarMoney: 10, // 10 Pre-war Money = 1 Cap
};

// Type for user-configurable exchange rates (excludes caps which is always 1:1)
export type ExchangeRates = Record<Exclude<CurrencyType, 'caps'>, number>;

export const TRAITS = [
    'traitFastShot',
    'traitGifted',
    'traitEducated',
    'traitHeavyHanded',
    'traitSmallFrame',
    'traitExtraPerk',
    'traitGoodNatured',
    'traitGrunt',
    'traitHomeOnTheRange',
    'traitTriggerDiscipline',
    'traitBrahminBaron',
    'traitMotherWasteland',
    'traitNomad',
    'traitRiteOfPassage',
    'traitToolsOfTheOldWorld',
    'traitTheChosenOne',
    'traitMrHandyLaserEmitter',
    'traitMrHandyFlamethrower',
    'traitMrHandyAutomaticPistol',
    'traitMrHandyCircularSaw',
    'traitMrHandyPliers',
    'traitGhoulRadiationHealing',
    'traitGhoulRadiationRest',
    'traitGhoulAgeless',
    'traitGhoulDiscrimination',
    'traitBrotherhoodChain',
    'traitVaultKid',
    'traitMrHandy',
] as const;
export type TraitId = (typeof TRAITS)[number];

// Trait data from CSV
export interface TraitData {
    ID: TraitId;
    EFFECTS: string[];
    ORIGINS: OriginId[];
    IMPLEMENTED: boolean;
    FIXED: boolean;
}

const _BODY_PARTS = ['head', 'leftArm', 'rightArm', 'torso', 'leftLeg', 'rightLeg'] as const;
export type BodyPart = (typeof _BODY_PARTS)[number];
export const BODY_PARTS: Set<BodyPart> = new Set(_BODY_PARTS);

const _MR_HANDY_PARTS = [
    'robotPartSensors',
    'robotPartBody',
    'robotPartArms',
    'robotPartThrusters',
] as const;
export type MrHandyPart = (typeof _MR_HANDY_PARTS)[number];
export const MR_HANDY_PARTS: Set<MrHandyPart> = new Set(_MR_HANDY_PARTS);

export type GenericBodyPart = BodyPart | MrHandyPart;

// TODO needed? probably, but might have to change name / location of type definition
export type ModSlot =
    | 'barrel'
    | 'magazine'
    | 'receiver'
    | 'stock'
    | 'sight'
    | 'muzzle'
    | 'grip'
    | 'material'
    | 'lining'
    | 'weave'
    | 'misc';

export const LEFT = 'left';
export const RIGHT = 'right';
export type Side = typeof LEFT | typeof RIGHT;

export interface CharacterItem {
    id: string;
    variation?: Side | undefined;
    quantity: number;
    equipped?: boolean;
    mods: string[];
    customName?: string | undefined;
}

/**
 * Custom items created by the user
 * Stored separately from database items
 */
export interface CustomItem {
    customName: string;
    quantity: number;

    ID?: undefined;
    COST: number;
    WEIGHT: number;
    RARITY: number;
    CATEGORY: ItemCategory;
    TYPE: ItemType;

    description?: string | undefined;
}

// Companion-specific types (same structure as Character, but with different stat names)
export const COMPANION_IDS = ['eyebot', 'dog', 'mrHandy', 'humanoid'] as const;
export type CompanionId = (typeof COMPANION_IDS)[number];

export interface CompanionData {
    type: CompanionId;
    name?: string | undefined;
    // SPECIAL equivalent (body/mind instead of strength/perception/etc)
    special: Record<CompanionSpecialType, number>;
    // Skills (melee/guns/other instead of meleeWeapons/smallGuns/etc)
    skills: Record<CompanionSkillType, number>;
    // Current HP
    currentHp: number;
    // Perks
    perks: string[];
    // Weapons (stored as CharacterItem for compatibility)
    items: CharacterItem[];
}

export interface Character extends Omit<RawCharacter, 'origin'> {
    origin: Origin;

    exchangeRates: ExchangeRates;

    items: CharacterItem[];
    customItems: CustomItem[]; // Custom items created by user (separate from database items)
    mapCodes: string[];
    companion?: CompanionData | undefined; // Optional companion data

    maxHp: number;
    currentHp: number;
    rads: number;
    maxLuck: number;
    currentLuck: number;
    maxWeight: number;
    currentWeight: number;
    defense: number;
    initiative: number;
    meleeDamage: number;
    locationsDR: Record<GenericBodyPart, Record<DamageType, number>>;
}

export interface RawCharacter {
    name?: string | undefined;
    level: number;
    origin?: OriginId;
    background?: string | undefined;

    caps: number;
    ncrDollars: number;
    legionDenarius: number;
    prewarMoney: number;
    exchangeRates: ExchangeRates;

    special: Record<SpecialType, number>;
    skills: Record<SkillType, number>;
    specialties: SkillType[];
    traits: TraitId[];
    perks: string[];

    currentLuck?: number | undefined;
    currentHp?: number | undefined;
    rads: number;

    items: CharacterItem[];
    customItems: CustomItem[];

    mapCodes: string[];
    companion?: CompanionData | undefined; // Optional companion data
}

export interface GenericPopupProps {
    onClose: () => void;
}

// **---- Item related----**

export const DAMAGE_TYPES = ['physical', 'energy', 'radiation'] as const;
export type DamageType = (typeof DAMAGE_TYPES)[number];
export type DamageResistanceMap = Record<DamageType, number>;

// Comune a Weapons, Apparel, Mods
export interface ItemWithEffects extends BaseItem {
    EFFECTS: string[]; // JSON array
}

interface AidItemBase extends BaseItem {
    EFFECT: string;
    DESCRIPTION?: string;
    CATEGORY: AidCategory;
}

interface MedItem extends AidItemBase {
    DURATION: string;
    ADDICTIVE: number; // 0 o 1
}

interface FoodItem extends AidItemBase {
    HP_GAIN: number;
    RADIOACTIVE: number; // 0 o 1
}

// Union type per Aid
export type AidItem = MedItem | FoodItem;

export interface ModItem extends ItemWithEffects {
    SLOT_TYPE: string;
    DESCRIPTOR?: string; // TODO implement descriptors
    SKILL: SkillType;
    PERKS: string[]; // JSON array // TODO should be perk type
    WEAPON_TYPES?: string[]; // TODO might not be needed anymore
    ARMOR_TYPES?: string[]; // TODO might not be needed anymore
}

export interface AmmoItem extends BaseItem {
    TYPE: 'ammo';
    CATEGORY: AmmoCategory;
}

export type Item = WeaponItem | ApparelItem | AidItem | AmmoItem | ModItem | BaseItem;
// Mod slots for weapon/armor modifications
export const MOD_SLOTS = Object.freeze({
    BARREL: 'barrel' as ModSlot,
    MAGAZINE: 'magazine' as ModSlot,
    RECEIVER: 'receiver' as ModSlot,
    STOCK: 'stock' as ModSlot,
    SIGHT: 'sight' as ModSlot,
    MUZZLE: 'muzzle' as ModSlot,
    GRIP: 'grip' as ModSlot,
    MATERIAL: 'material' as ModSlot,
    LINING: 'lining' as ModSlot,
    WEAVE: 'weave' as ModSlot,
    MISC: 'misc' as ModSlot,
});

export interface LegendaryEffect {
    ID: string;
    FOR_TYPE: ItemType;
    FOR_CATEGORY: ItemCategory[];
    EFFECTS: string[];
}
