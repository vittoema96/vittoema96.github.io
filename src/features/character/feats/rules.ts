import type { Character, CharacterItem, CompanionId } from '@/types';
import type { PerkId } from './perks.ts';
import type { TraitId } from './traits.ts';
import type { WeaponItem } from '@/data/item/weapon.schemas.ts';
import type { SkillType } from '@/features/character/skills/skills.ts';
import type { SpecialMap, SpecialType } from '@/features/character/special/special.ts';
import type { Origin } from '@/features/character/origins/types.ts';
import { getActiveFeats } from './registry.ts';
import { mergeWeaponEffects } from './weaponEffects.ts';
import type {
    FeatImplementation,
    FeatManualAction,
    FeatSelection,
    RollContext,
    RollComplicationContext,
    RollComplicationModifier,
    SpecialModifierContext,
    SpecialtySkillBonus,
    Toggleables,
} from './types.ts';

function sumActiveFeatModifiers(
    selection: FeatSelection,
    getModifier: (feat: FeatImplementation) => number | undefined,
): number {
    return getActiveFeats(selection).reduce((total, feat) => total + (getModifier(feat) ?? 0), 0);
}

function collectActiveFeatValues<T>(
    selection: FeatSelection,
    getValues: (feat: FeatImplementation) => T[] | undefined,
): T[] {
    return getActiveFeats(selection).flatMap(feat => getValues(feat) ?? []);
}

export function getManualActions(character: Character): Map<string, FeatManualAction> {
    const actions = new Map<string, FeatManualAction>();
    for (const feat of getActiveFeats(character)) {
        if (feat.id && feat.manualAction) {
            actions.set(feat.id, feat.manualAction);
        }
    }
    return actions;
}

export function getSpecialtyPointsBonus(
    perks: PerkId[],
    traits: TraitId[],
    origin?: Origin,
): number {
    return sumActiveFeatModifiers({ perks, traits, origin }, feat =>
        feat.getSpecialtyPointsBonus?.(perks, traits),
    );
}

export function getMaxSpecialValueModifier(
    special: SpecialType,
    perks: PerkId[],
    traits: TraitId[],
    origin?: Origin,
): number {
    return sumActiveFeatModifiers({ perks, traits, origin }, feat =>
        feat.getMaxSpecialValueModifier?.(special, perks, traits),
    );
}

export function getWhitelistedSpecialties(
    perks: PerkId[],
    traits: TraitId[],
    origin?: Origin,
): SkillType[] {
    return collectActiveFeatValues({ perks, traits, origin }, feat =>
        feat.getWhitelistedSpecialties?.(),
    );
}

export function getSpecialtySkillBonuses(
    perks: PerkId[],
    traits: TraitId[],
    origin?: Origin,
): SpecialtySkillBonus[] {
    return collectActiveFeatValues({ perks, traits, origin }, feat =>
        feat.getSpecialtySkillBonuses?.(perks, traits),
    );
}

export function getSkillMaxModifier(
    skillId: SkillType,
    isSpecialty: boolean,
    perks: PerkId[],
    traits: TraitId[],
    origin?: Origin,
): number {
    return sumActiveFeatModifiers({ perks, traits, origin }, feat =>
        feat.getSkillMaxModifier?.(skillId, isSpecialty, perks, traits),
    );
}

export function getSkillPointsBonus(perks: PerkId[], traits: TraitId[], origin?: Origin): number {
    return sumActiveFeatModifiers({ perks, traits, origin }, feat =>
        feat.getSkillPointsBonus?.(perks, traits),
    );
}

export function getPerkSlotsBonus(perks: PerkId[], traits: TraitId[], origin?: Origin): number {
    return sumActiveFeatModifiers({ perks, traits, origin }, feat =>
        feat.getPerkSlotsBonus?.(perks, traits),
    );
}

export function getPerkSlotCount(
    level: number,
    perks: PerkId[],
    traits: TraitId[],
    origin?: Origin,
): number {
    return level + getPerkSlotsBonus(perks, traits, origin);
}

export function getBlacklistedSpecialties(
    perks: PerkId[],
    traits: TraitId[],
    origin?: Origin,
): SkillType[] {
    return collectActiveFeatValues({ perks, traits, origin }, feat =>
        feat.getBlacklistedSpecialties?.(),
    );
}

export function getSpecialAllocationPointsBonus(
    perks: PerkId[],
    traits: TraitId[],
    origin?: Origin,
): number {
    return sumActiveFeatModifiers({ perks, traits, origin }, feat =>
        feat.getSpecialAllocationPointsBonus?.(perks, traits),
    );
}

export function getMaxLuckBonus(perks: PerkId[], traits: TraitId[], origin?: Origin): number {
    return sumActiveFeatModifiers({ perks, traits, origin }, feat =>
        feat.getMaxLuckBonus?.(perks, traits),
    );
}

export function getMaxHpBonus(
    special: SpecialMap,
    perks: PerkId[],
    traits: TraitId[] = [],
    origin?: Origin,
): number {
    return sumActiveFeatModifiers({ perks, traits, origin }, feat =>
        feat.getMaxHpBonus?.(special, perks, traits),
    );
}

export function getMaxWeightOverride(
    special: SpecialMap,
    perks: PerkId[],
    traits: TraitId[],
    origin?: Origin,
): number | undefined {
    const overrides = getActiveFeats({ perks, traits, origin })
        .map(feat => feat.getMaxWeightOverride?.(special, perks, traits))
        .filter((value): value is number => value !== undefined);
    if (overrides.length > 1) {
        throw new Error('Multiple maximum carry weight overrides are active');
    }
    return overrides[0];
}

export function applyMaxWeightModifiers(
    currentMaxWeight: number,
    special: SpecialMap,
    perks: PerkId[],
    traits: TraitId[],
    origin?: Origin,
): number {
    return getActiveFeats({ perks, traits, origin }).reduce(
        (weight, feat) => feat.modifyMaxWeight?.(weight, special, perks, traits) ?? weight,
        currentMaxWeight,
    );
}

export function getWeaponItemEffects(itemData: WeaponItem, perks: PerkId[]): string[] {
    return collectActiveFeatValues({ perks, traits: [] }, feat =>
        feat.getWeaponItemEffects?.(itemData, perks),
    );
}

export function getMeleeDamageBonus(perks: PerkId[], traits: TraitId[], origin?: Origin): number {
    return sumActiveFeatModifiers({ perks, traits, origin }, feat =>
        feat.getMeleeDamageBonus?.(perks, traits),
    );
}

export function getDamageRatingBonus(
    character: Character,
    item: CharacterItem,
    itemData: WeaponItem,
    isSneakAttack?: boolean,
): number {
    return sumActiveFeatModifiers(character, feat =>
        feat.getDamageRatingBonus?.(character, item, itemData, isSneakAttack),
    );
}

export function getFireRateBonus(character: Character, itemData: WeaponItem): number {
    return sumActiveFeatModifiers(character, feat => feat.getFireRateBonus?.(character, itemData));
}

export function getAvailableCompanions(
    perks: PerkId[],
    traits: TraitId[],
    origin?: Origin,
): CompanionId[] {
    return collectActiveFeatValues({ perks, traits, origin }, feat =>
        feat.getAvailableCompanions?.(),
    );
}

export function getGrantedItems(selection: FeatSelection) {
    const activeItems = new Set(
        (selection.items ?? [])
            .filter(item => !item.grantedBy)
            .map(item => item.id),
    );
    const grantedItems = getActiveFeats(selection).flatMap(feat => {
        const id = feat.id;
        if (!id) {
            return [];
        }
        return (feat.getGrantedItems?.(selection) ?? []).map(item => ({
            ...item,
            grantedBy: id,
        }));
    });

    const accepted: typeof grantedItems = [];
    let pending = grantedItems;
    // Only accepted grants make a replacement target available.
    while (pending.length) {
        const remaining: typeof grantedItems = [];
        for (const item of pending) {
            if (!item.replaces?.length || item.replaces.some(id => activeItems.has(id))) {
                accepted.push(item);
                activeItems.add(item.id);
            } else {
                remaining.push(item);
            }
        }
        if (remaining.length === pending.length) {
            break;
        }
        pending = remaining;
    }
    return accepted;
}

export function getWeaponEffects(character: Character, itemData: WeaponItem, isAiming: boolean) {
    const bonuses = collectActiveFeatValues(character, feat =>
        feat.getWeaponEffects?.(character, itemData, isAiming),
    );
    return mergeWeaponEffects(itemData.EFFECTS, bonuses);
}

export function getRollActions(character: Character) {
    return collectActiveFeatValues(character, feat => feat.getRollActions?.(character));
}

export function getFreeRerolls(
    character: Character,
    itemData?: WeaponItem,
    ctx?: RollContext,
): number {
    return sumActiveFeatModifiers(character, feat =>
        feat.getFreeRerolls?.(character, itemData, ctx),
    );
}

export function getRollSpecial(
    character: Character,
    context: SpecialModifierContext = {},
): SpecialMap {
    const effectiveSpecial = { ...character.special };
    const modifiers = collectActiveFeatValues(character, feat =>
        feat.getRollSpecialModifiers?.(character, context),
    );

    // TODO define precedence between replacement and additive SPECIAL modifiers.
    for (const modifier of modifiers) {
        const baseValue = character.special[modifier.special];
        const currentValue = effectiveSpecial[modifier.special];
        effectiveSpecial[modifier.special] = modifier.apply(currentValue, baseValue);
    }
    return effectiveSpecial;
}

export function getRollComplicationModifiers(
    character: Character,
    context: RollComplicationContext = {},
): Required<RollComplicationModifier> {
    const activeFeats = getActiveFeats({
        ...character,
        traits: context.traits ?? character.traits,
    });
    // Range changes and explicit complication faces remain separate rule concepts.
    return activeFeats.reduce<Required<RollComplicationModifier>>(
        (acc, feat) => {
            const modifier = feat.getRollComplicationModifiers?.(character, context);
            return {
                thresholdDelta: acc.thresholdDelta + (modifier?.thresholdDelta ?? 0),
                additionalThresholds: [
                    ...acc.additionalThresholds,
                    ...(modifier?.additionalThresholds ?? []),
                ],
            };
        },
        { thresholdDelta: 0, additionalThresholds: [] },
    );
}

export function getRollToggleables(character: Character, itemData: WeaponItem): Toggleables {
    return getActiveFeats(character).reduce<Toggleables>((acc, feat) => {
        const locations = feat.getRollToggleables?.(character, itemData)?.hitLocation;
        if (locations) {
            acc.hitLocation = [...(acc.hitLocation ?? []), ...locations];
        }
        return acc;
    }, {});
}

export function getPerkBlacklist(character: Character): PerkId[] {
    return collectActiveFeatValues(character, feat => feat.getBlacklistedPerks?.());
}

export function getLocationDRBonus(
    special: SpecialMap,
    items: CharacterItem[],
    perks: PerkId[],
    traits: TraitId[],
    origin?: Origin,
) {
    return getActiveFeats({ perks, traits, origin }).reduce(
        (acc, feat) => {
            const bonus = feat.getLocationDRBonus?.(special, items, perks, traits);
            return {
                physical: acc.physical + (bonus?.physical ?? 0),
                energy: acc.energy + (bonus?.energy ?? 0),
                radiation: acc.radiation + (bonus?.radiation ?? 0),
            };
        },
        { physical: 0, energy: 0, radiation: 0 },
    );
}
