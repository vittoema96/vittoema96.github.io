import type { BodyPart, Character, CharacterItem, CompanionId, RollerType } from '@/types';
import type { PerkId } from '@/features/character/feats/perks.ts';
import type { TraitId } from '@/features/character/feats/traits.ts';
import type { WeaponItem } from '@/data/item/weapon.schemas.ts';
import type { TFunction } from 'i18next';
import type { SkillType } from '@/features/character/skills/skills.ts';
import type { SpecialMap, SpecialType } from '@/features/character/special/special.ts';
import type { Origin } from '@/features/character/origins/types.ts';

export interface FeatRollAction {
    id: PerkId | TraitId;
    isApplicable: (char: Character, item: WeaponItem) => boolean;
    getMaxUses?: (char: Character) => number;
    cost?: { ammo?: number; luck?: number };
    getContent: (t: TFunction, totalDamage: string) => string;
    modalId?: string;
}

export type FeatManualAction = { label: string } & (
    | {
        type: 'confirm';
        message: string;
        luckCost: number;
    }
    | {
        type: 'combatDice';
        diceCount: number;
        description: string;
        luckOnEffect: number;
    }
    | {
        type: 'skillRoll';
        skillId: SkillType;
        usingItem: CharacterItem;
        roller: Exclude<RollerType, undefined>;
        requiredLuck: number;
    }
);

export interface SpecialModifierContext {
    skillId?: SkillType;
    usingItem?: WeaponItem;
}

export interface SpecialModifier {
    special: SpecialType;
    apply: (currentValue: number, baseValue: number) => number;
}

export interface RollComplicationContext {
    itemData?: WeaponItem;
    skillId?: SkillType;
    traits?: TraitId[];
}

export interface RollComplicationModifier {
    thresholdDelta?: number;
    additionalThresholds?: number[];
}

export interface SpecialtySkillBonus {
    bonus: number;
    skills: SkillType[];
}

export interface RollContext {
    hitLocation?: BodyPart;
    bought?: number;
}

export interface Toggleables {
    hitLocation?: BodyPart[];
}

export interface FeatSelection {
    perks: PerkId[];
    traits: TraitId[];
    origin?: Origin | undefined;
    items?: CharacterItem[];
}

export type GrantedItem = CharacterItem & {
    replaces?: string[];
};

/** Common behavior implemented by origins, perks and traits. */
export interface FeatImplementation {
    manualAction?: FeatManualAction;

    getGrantedItems?: (selection: FeatSelection) => GrantedItem[];

    getAvailableCompanions?: () => CompanionId[];

    getWhitelistedSpecialties?: () => SkillType[];
    getBlacklistedSpecialties?: () => SkillType[];

    getSpecialtyPointsBonus?: (perks: PerkId[], traits: TraitId[]) => number;
    getSpecialtySkillBonuses?: (
        perks: PerkId[],
        traits: TraitId[],
    ) => SpecialtySkillBonus[];
    getSkillMaxModifier?: (
        skillId: SkillType,
        isSpecialty: boolean,
        perks: PerkId[],
        traits: TraitId[],
    ) => number;
    getSkillPointsBonus?: (perks: PerkId[], traits: TraitId[]) => number;
    getPerkSlotsBonus?: (perks: PerkId[], traits: TraitId[]) => number;
    getSpecialAllocationPointsBonus?: (perks: PerkId[], traits: TraitId[]) => number;
    getMaxSpecialValueModifier?: (
        special: SpecialType,
        perks: PerkId[],
        traits: TraitId[],
    ) => number;
    getMaxLuckBonus?: (perks: PerkId[], traits: TraitId[]) => number;
    getMaxHpBonus?: (special: SpecialMap, perks: PerkId[], traits: TraitId[]) => number;
    getMaxWeightOverride?: (
        special: SpecialMap,
        perks: PerkId[],
        traits: TraitId[],
    ) => number | undefined;
    modifyMaxWeight?: (
        currentMaxWeight: number,
        special: SpecialMap,
        perks: PerkId[],
        traits: TraitId[],
    ) => number;
    getMeleeDamageBonus?: (perks: PerkId[], traits: TraitId[]) => number;

    getWeaponItemEffects?: (itemData: WeaponItem, perks: PerkId[]) => string[];
    getDamageRatingBonus?: (
        character: Character,
        item: CharacterItem,
        itemData: WeaponItem,
        isSneakAttack?: boolean,
    ) => number;
    getFireRateBonus?: (character: Character, itemData: WeaponItem) => number;
    getWeaponEffects?: (
        character: Character,
        itemData: WeaponItem,
        isAiming: boolean,
    ) => `${string}:${number}`[];

    getRollActions?: (character: Character) => FeatRollAction[];
    getFreeRerolls?: (
        character: Character,
        itemData?: WeaponItem,
        context?: RollContext,
    ) => number;
    getBlacklistedPerks?: () => PerkId[];
    getRollSpecialModifiers?: (
        character: Character,
        context: SpecialModifierContext,
    ) => SpecialModifier[];
    getRollComplicationModifiers?: (
        character: Character,
        context: RollComplicationContext,
    ) => RollComplicationModifier;
    getRollToggleables?: (character: Character, itemData: WeaponItem) => Toggleables;
    getLocationDRBonus?: (
        special: SpecialMap,
        items: CharacterItem[],
        perks: PerkId[],
        traits: TraitId[],
    ) => Partial<Record<'physical' | 'energy' | 'radiation', number>>;

}

export type PerkImplementation = FeatImplementation & { id: PerkId };
export type TraitImplementation = FeatImplementation & { id: TraitId };
