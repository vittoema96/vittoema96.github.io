// Game data type definitions for Fallout PIP-Boy app

export interface CharacterData {
    name: string | null;
    origin: string | null;
    level: number;
    special: SpecialStats;
    currentLuck: number;
    currentHp: number;
    skills: SkillStats;
    specialties: string[];
    caps: number;
    background: string | null;
    items: GameItem[];
}

export interface SpecialStats {
    strength: number;
    perception: number;
    endurance: number;
    charisma: number;
    intelligence: number;
    agility: number;
    luck: number;
}

export interface SkillStats {
    smallGuns: number;
    bigGuns: number;
    energyWeapons: number;
    unarmed: number;
    meleeWeapons: number;
    throwing: number;
    explosives: number;
    firstAid: number;
    doctor: number;
    sneak: number;
    lockpick: number;
    steal: number;
    traps: number;
    science: number;
    repair: number;
    pilot: number;
    barter: number;
    gambling: number;
    outdoorsman: number;
    speech: number;
}

export interface GameItem {
    id: string;
    type: 'weapon' | 'apparel' | 'aid' | 'other';
    quantity?: number;
    condition?: number;
    side?: 'left' | 'right';
}

export interface WeaponData {
    ID: string;
    NAME: string;
    DAMAGE_DICE: string;
    DAMAGE_TYPE: string;
    FIRE_RATE: string;
    RANGE: string;
    AMMO_TYPE?: string;
    WEIGHT: number;
    COST: number;
    RARITY: string;
    QUALITIES?: string;
    EFFECTS?: string;
}

export interface ApparelData {
    ID: string;
    NAME: string;
    PHYSICAL_DR: number;
    ENERGY_DR: number;
    RADIATION_DR: number;
    WEIGHT: number;
    COST: number;
    RARITY: string;
    PROTECTS: string;
}

export interface AidData {
    ID: string;
    NAME: string;
    EFFECT: string;
    WEIGHT: number;
    COST: number;
    RARITY: string;
}

export interface DiceRoll {
    value: number;
    isRerolled: boolean;
    isActive: boolean;
}

export interface PopupConfig {
    title: string;
    content: string;
    confirmCallback?: () => void;
    cancelCallback?: () => void;
}

export type BodyPart = 'head' | 'leftArm' | 'rightArm' | 'torso' | 'leftLeg' | 'rightLeg';

export type DamageType = 'physical' | 'energy' | 'radiation';

export type ItemType = 'weapons' | 'apparel' | 'aid' | 'other';

export type Origin =
    | 'vaultDweller'
    | 'ghoul'
    | 'survivor'
    | 'mrHandy'
    | 'brotherhoodInitiate'
    | 'superMutant';

export type Language = 'en' | 'it';

export type Theme = 'theme-fallout-3' | 'theme-fallout-new-vegas';
