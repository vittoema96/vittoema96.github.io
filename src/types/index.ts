// Type definitions for the Pip-Boy 3000 application


// **---- Character sheet related----**
export const SPECIAL = [
    "strength",
    "perception",
    "endurance",
    "charisma",
    "intelligence",
    "agility",
    "luck",
] as const
export type SpecialType = (typeof SPECIAL)[number];

export const SKILLS = [
    "athletics",
    "barter",
    "bigGuns",
    "energyWeapons",
    "explosives",
    "lockpick",
    "medicine",
    "meleeWeapons",
    "pilot",
    "repair",
    "science",
    "smallGuns",
    "sneak",
    "speech",
    "survival",
    "throwing",
    "unarmed",
] as const
export type SkillType = (typeof SKILLS)[number];


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

export type OriginId = 'vaultDweller' | 'ghoul' | 'survivor' | 'mrHandy' | 'brotherhoodInitiate' | 'superMutant' | undefined;

export interface Origin {
    id: OriginId;
    calcMaxCarryWeight: (strengthVal: number) => number;
    hasRadiationImmunity: boolean;
    hasPoisonImmunity: boolean;
    bodyParts: Set<GenericBodyPart>;
    isRobot: boolean;
    specialMaxValues: Record<SpecialType, number>;
    skillMaxValue: number;
    needsSpecializedArmor: boolean;
    needsSpecializedWeapons: boolean;
    canUseAid: boolean;
    characterSvg: string;
}

export const LEFT = "left"
export const RIGHT = "right"
export type Side = typeof LEFT | typeof RIGHT
export interface CharacterItem {
    id: string;
    variation?: Side;
    quantity: number;
    equipped?: boolean;
    mods: string[];
}

export interface Character extends Omit<RawCharacter, 'origin'> {
    name: string | undefined;
    background: string | undefined;

    origin: Origin;
    level: number;
    caps: number;
    special: Record<SpecialType, number>;
    skills: Record<SkillType, number>;
    specialties: SkillType[];
    items: CharacterItem[];

    maxHp: number;
    currentHp: number;
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
    background?: string | undefined;

    origin?: OriginId;
    level?: number | undefined;
    caps?: number | undefined;
    special?: Partial<Record<SpecialType, number>> | undefined;
    skills?: Partial<Record<SkillType, number>> | undefined;
    specialties?: SkillType[] | undefined;
    items?: CharacterItem[] | undefined;

    currentLuck?: number | undefined;
    currentHp?: number | undefined;
}


export interface GenericPopupProps {
    onClose: () => void;
}


// **---- Item related----**


export interface PopupContextValue {
    showAlert: (message: string) => void;
    showConfirm: (message: string, onConfirm: () => void) => void;
    closeAlert: () => void;

    showD20Popup: (skillId: SkillType, usingItem?: CharacterItem) => void;
    closeD20Popup: () => void;

    showD6Popup: (usingItem: CharacterItem, hasAimed?: boolean) => void;
    closeD6Popup: () => void;

    showAddItemPopup: (itemType: ItemType) => void;
    closeAddItemPopup: () => void;

    showStatAdjustmentPopup: () => void;
    closeStatAdjustmentPopup: () => void;

    showTradeItemPopup: (usingItem: CharacterItem, itemData: Item, onConfirm: (quantity: number, price: number) => void) => void;
    closeTradeItemPopup: () => void;

    showModifyItemPopup: (usingItem: CharacterItem, itemData: Item) => void;
    closeModifyItemPopup: () => void;
}



export type DamageType = "physical" | 'energy' | 'radiation';
export type DamageResistanceMap = Record<DamageType, number>

export type ItemType = 'weapon' | 'apparel' | 'aid' | 'other' | 'mod';
export type WeaponCategories = 'smallGuns' | 'bigGuns' | 'energyWeapons' | 'meleeWeapons' | 'explosives' | 'throwing' | 'unarmed';
export type ApparelCategories = 'clothing' | 'headgear' | 'outfit' | 'raiderArmor' | 'leatherArmor' | 'metalArmor' | 'combatArmor' | 'syntheticArmor' | 'vaultTecSecurity' | 'robotPart';
export type AidCategories = 'food' | 'drinks' | 'meds';
export type OtherCategories = 'ammo' | 'mods';
export type ItemCategory = WeaponCategories | ApparelCategories | AidCategories | OtherCategories;
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
    EFFECTS?: string[];  // JSON array
}

// Comune a Weapons, Apparel
export interface ModdableItem extends ItemWithEffects {
    AVAILABLE_MODS: string[];  // JSON array
}

export interface WeaponItem extends ModdableItem {
    DAMAGE_RATING: number;
    DAMAGE_TYPE: DamageType;
    FIRE_RATE: number | '-';  // number o "-" per melee TODO should change type (only number? number + undefined?)
    RANGE: Range;
    QUALITIES?: string[];  // JSON array
    AMMO_TYPE: string;
    CATEGORY: WeaponCategories;
}

export interface ApparelItem extends ModdableItem {
    PHYSICAL_RES: number;
    ENERGY_RES: number;
    RADIATION_RES: number;
    LOCATIONS_COVERED: (GenericBodyPart | 'arm' | 'arms' | 'leg' | 'legs')[];  // JSON array
    CATEGORY: ApparelCategories;
}

interface AidItemBase extends GenericItem {
    EFFECT: string;
    DESCRIPTION?: string;
    CATEGORY: AidCategories;
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

interface AmmoItem extends GenericItem {
    // Solo le colonne base (ID, TYPE, WEIGHT, COST, RARITY)
}

export type Item = WeaponItem | ApparelItem | AidItem | ModItem | AmmoItem;
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
