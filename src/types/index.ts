// Type definitions for the Pip-Boy 3000 application


// **---- Character sheet related----**
import { Origin, OriginId } from '@/services/character/Origin.ts';
import {
    CompanionSkillType,
    CompanionSpecialType,
    SkillType,
    SpecialType,
} from '@/services/character/utils.ts';

// **---- Currency related ----**
export const CURRENCIES = [
    "caps",
    "ncrDollars",
    "legionDenarius",
    "prewarMoney",
] as const;
export type CurrencyType = (typeof CURRENCIES)[number];

// Default exchange rates: how many of each currency equals 1 Cap
// These are defaults that can be overridden by user in character data
export const DEFAULT_EXCHANGE_RATES: Record<CurrencyType, number> = {
    caps: 1,
    ncrDollars: 2.5,      // 2.5 NCR Dollars = 1 Cap
    legionDenarius: 4,    // 4 Legion Denarius = 1 Cap
    prewarMoney: 10,      // 10 Pre-war Money = 1 Cap
};

// Type for user-configurable exchange rates (excludes caps which is always 1:1)
export type ExchangeRates = Record<Exclude<CurrencyType, 'caps'>, number>;

export const TRAITS = [
    "traitFastShot",
    "traitGifted",
    "traitEducated",
    "traitHeavyHanded",
    "traitSmallFrame",
    "traitExtraPerk",
    "traitGoodNatured",
    "traitGrunt",
    "traitHomeOnTheRange",
    "traitTriggerDiscipline",
    "traitBrahminBaron",
    "traitMotherWasteland",
    "traitNomad",
    "traitRiteOfPassage",
    "traitToolsOfTheOldWorld",
    "traitTheChosenOne",
    "traitMrHandyLaserEmitter",
    "traitMrHandyFlamethrower",
    "traitMrHandyAutomaticPistol",
    "traitMrHandyCircularSaw",
    "traitMrHandyPliers",
    "traitGhoulRadiationHealing",
    "traitGhoulRadiationRest",
    "traitGhoulAgeless",
    "traitGhoulDiscrimination",
    "traitBrotherhoodChain",
] as const
export type TraitId = (typeof TRAITS)[number];

// Trait data from CSV
export interface TraitData {
    ID: TraitId;
    EFFECTS: string[];
    ORIGINS: OriginId[];
    IMPLEMENTED: boolean;
    FIXED: boolean;
}

const _BODY_PARTS = [
    'head',
    'leftArm',
    'rightArm',
    'torso',
    'leftLeg',
    'rightLeg',
] as const
export type BodyPart = (typeof _BODY_PARTS)[number];
export const BODY_PARTS: Set<BodyPart> = new Set(_BODY_PARTS)

const _MR_HANDY_PARTS = [
    'robotPartSensors',
    'robotPartBody',
    'robotPartArms',
    'robotPartThrusters',
] as const
export type MrHandyPart = (typeof _MR_HANDY_PARTS)[number];
export const MR_HANDY_PARTS: Set<MrHandyPart> = new Set(_MR_HANDY_PARTS)

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

export const LEFT = "left"
export const RIGHT = "right"
export type Side = typeof LEFT | typeof RIGHT

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
export const COMPANION_IDS = ['eyebot', 'dog', 'mrHandy', 'humanoid'] as const
export type CompanionId = (typeof COMPANION_IDS)[number]

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
    customItems: CustomItem[];  // Custom items created by user (separate from database items)
    mapCodes: string[];
    companion?: CompanionData | undefined;  // Optional companion data

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
    rads: number ;

    items: CharacterItem[];
    customItems: CustomItem[];

    mapCodes: string[];
    companion?: CompanionData | undefined;  // Optional companion data
}


export interface GenericPopupProps {
    onClose: () => void;
}


// **---- Item related----**


export interface PopupContextValue {
    showAlert: (message: string) => void;
    showConfirm: (message: string, onConfirm: () => void) => void;
    closeAlert: () => void;

    showD20Popup: (skillId: SkillType | CompanionSkillType, usingItem?: CharacterItem | null, roller?: 'companion' | 'mysteriousStranger') => void;
    closeD20Popup: () => void;

    showD6Popup: (usingItem: CharacterItem, hasAimed?: boolean, isMysteriousStranger?: boolean) => void;
    closeD6Popup: () => void;

    showNd6Popup: (diceCount: number, title: string, description?: string, resultDisplay?: 'damage' | 'effects' | 'both', onResult?: (result: { totalDamage: number; totalEffects: number; rolls: number[] }) => void) => void;
    closeNd6Popup: () => void;

    showAddItemPopup: (itemType: ItemType) => void;
    closeAddItemPopup: () => void;

    showTradeItemPopup: (usingItem: CharacterItem | CustomItem) => void;
    closeTradeItemPopup: () => void;

    showModifyItemPopup: (usingItem: CharacterItem) => void;
    closeModifyItemPopup: () => void;
}



export type DamageType = "physical" | 'energy' | 'radiation';
export type DamageResistanceMap = Record<DamageType, number>

export const ITEM_TYPES = ['weapon', 'apparel', 'aid', 'ammo', 'other', 'mod'] as const
export type ItemType = (typeof ITEM_TYPES)[number]


export const WEAPON_CATEGORIES = ['smallGuns', 'bigGuns', 'energyWeapons', 'meleeWeapons', 'explosives', 'throwing', 'unarmed'] as const;
export const APPAREL_CATEGORIES = ['clothing', 'headgear', 'outfit', 'raiderArmor', 'leatherArmor', 'metalArmor', 'combatArmor', 'syntheticArmor', 'vaultTecSecurity', 'robotPart'] as const;
export const AID_CATEGORIES = ['food', 'drinks', 'meds'] as const;
export const AMMO_CATEGORIES = ['ammo'] as const;
export const OTHER_CATEGORIES = ['misc', 'junk', 'custom'] as const;

export type WeaponCategory = (typeof WEAPON_CATEGORIES)[number];
export type ApparelCategory = (typeof APPAREL_CATEGORIES)[number];
export type AidCategory = (typeof AID_CATEGORIES)[number];
export type AmmoCategory = (typeof AMMO_CATEGORIES)[number];
export type OtherCategory = (typeof OTHER_CATEGORIES)[number]

export const ITEM_CATEGORIES = [
    ...WEAPON_CATEGORIES,
    ...APPAREL_CATEGORIES,
    ...AID_CATEGORIES,
    ...AMMO_CATEGORIES,
    ...OTHER_CATEGORIES
]
export type ItemCategory = WeaponCategory | ApparelCategory | AidCategory | AmmoCategory | OtherCategory;
export type Range = 'rangeR' | 'rangeC' | 'rangeM' | 'rangeL' | 'rangeE';

export interface GenericItem {
    ID: string;
    WEIGHT: number; // WEIGHT is in Kg!
    COST: number;
    RARITY: number;
    TYPE: ItemType;
    CATEGORY: ItemCategory;
}


// Comune a Weapons, Apparel, Mods
interface ItemWithEffects extends GenericItem {
    EFFECTS: string[];  // JSON array
}

export interface WeaponItem extends ItemWithEffects {
    DAMAGE_RATING: number;
    DAMAGE_TYPE: DamageType;
    FIRE_RATE: number | '-';  // number o "-" per melee TODO should change type (only number? number + undefined?)
    RANGE: Range;
    QUALITIES: string[];  // JSON array
    AMMO_TYPE: string;
    CATEGORY: WeaponCategory;
    AVAILABLE_MODS: string[];  // JSON array
}

export interface ApparelItem extends ItemWithEffects {
    PHYSICAL_RES: number;
    ENERGY_RES: number;
    RADIATION_RES: number;
    LOCATIONS_COVERED: (GenericBodyPart | 'arm' | 'arms' | 'leg' | 'legs')[];  // JSON array
    CATEGORY: ApparelCategory;
    AVAILABLE_MODS: string[];  // JSON array
}

interface AidItemBase extends GenericItem {
    EFFECT: string;
    DESCRIPTION?: string;
    CATEGORY: AidCategory;
}

interface MedItem extends AidItemBase {
    DURATION: string;
    ADDICTIVE: number;  // 0 o 1
}

interface FoodItem extends AidItemBase {
    HP_GAIN: number;
    RADIOACTIVE: number;  // 0 o 1
}

// Union type per Aid
export type AidItem = MedItem | FoodItem;

export interface ModItem extends ItemWithEffects {
    SLOT_TYPE: string;
    DESCRIPTOR?: string;  // Alcuni mods usano DESCRIPTOR invece di SLOT_TYPE
    SKILL: SkillType;
    PERKS: string[];  // JSON array // TODO should be perk type
    WEAPON_TYPES?: string[];  // JSON array (per weapon mods)
    ARMOR_TYPES?: string[];   // JSON array (per armor mods)
}

export interface AmmoItem extends GenericItem {
    TYPE: 'ammo';
    CATEGORY: AmmoCategory;
}

export type Item = WeaponItem | ApparelItem | AidItem | AmmoItem | ModItem | GenericItem;
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
