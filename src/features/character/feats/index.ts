import { BodyPart, Character, CharacterItem, CompanionId } from '@/types';
import { PerkId } from '@/features/character/feats/perks/perks.ts';
import { TraitId } from '@/features/character/feats/traits/traits.ts';
import { WeaponItem } from '@/data/item/weapon.schemas.ts';
import { TFunction } from 'i18next';
import { SkillType } from '@/features/character/skills/skills.ts';
import { SpecialMap, SpecialType } from '@/features/character/special/special.ts';

/* Load all trait*.ts and perk*.ts in implementation and put them in registry */
const perkRegistry: Partial<Record<PerkId, PerkImplementation>> = {};
const traitRegistry: Partial<Record<TraitId, TraitImplementation>> = {};

const perkModules = import.meta.glob<{ default: PerkImplementation }>(
    './perks/implementations/perk*.ts',
    { eager: true }
);
Object.values(perkModules).forEach((module) => {
    if (module.default?.id) {
        perkRegistry[module.default.id] = module.default;
    }
});

const traitModules = import.meta.glob<{ default: TraitImplementation }>(
    './traits/implementations/trait*.ts',
    { eager: true }
);
Object.values(traitModules).forEach((module) => {
    if (module.default?.id) {
        traitRegistry[module.default.id] = module.default;
    }
});

export interface FeatRollAction {
    id: PerkId | TraitId,
    isApplicable: (char: Character, item: WeaponItem) => boolean,
    getMaxUses?: (char: Character) => number,
    cost?: { ammo?: number, luck?: number },
    getContent: (t: TFunction, totalDamage: string) => string,
    modalId?: string
}

export interface SpecialModifierContext {
    skillId?: SkillType;
    usingItem?: WeaponItem;
}

export interface SpecialModifier {
    special: SpecialType;
    apply: (currentValue: number, baseValue: number) => number;
}
interface RollContext {
    hitLocation?: BodyPart,
    bought?: number
}

interface Toggleables {
    hitLocation?: BodyPart[],
}

interface FeatImplementation {
    applyPassiveModifiers?: (character: Character) => void;

    onExecuteAction?: (character: Character, payload?: any) => void;

    onBeforeRoll?: (character: Character, diceContext: any) => void;

    getAvailableCompanions?: () => CompanionId[];

    getSpecialtyPointBonus?: (character: Character) => number;

    getDamageRatingBonus?: (character: Character, itemData: WeaponItem) => number;

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
        ctx?: RollContext,
    ) => number;

    getBlacklistedPerks?: () => PerkId[]

    getRollSpecialModifiers?: (
        character: Character,
        context: SpecialModifierContext,
    ) => SpecialModifier[];

    getRollToggleables?: (character: Character, itemData: WeaponItem) => Toggleables;

    getLocationDRBonus?: (
        special: SpecialMap, items: CharacterItem[],
        perks: PerkId[], traits: TraitId[]
    ) => Partial<Record<'physical' | 'energy' | 'radiation', number>>
}

export type PerkImplementation = FeatImplementation & { id: PerkId }
export type TraitImplementation = FeatImplementation & { id: TraitId }


function getActiveFeats(character: {perks: PerkId[], traits: TraitId[]}): FeatImplementation[] {
    const active: FeatImplementation[] = [];

    // Perk ranks are stored as duplicated IDs, but implementation hooks must run once per feat ID.
    const uniquePerks = new Set(character.perks ?? []);
    uniquePerks.forEach((perkId) => {
        const feat = perkRegistry[perkId];
        if (feat) {active.push(feat);}
    });

    const uniqueTraits = new Set(character.traits ?? []);
    uniqueTraits.forEach((traitId) => {
        const feat = traitRegistry[traitId];
        if (feat) {active.push(feat);}
    });

    return active;
}


export function getSpecialtyPointBonus(character: Character): number {
    return getActiveFeats(character).reduce(
        (acc, feat) => acc + (feat.getSpecialtyPointBonus?.(character) ?? 0),
        0
    );
}

export function getDamageRatingBonus(character: Character, itemData: WeaponItem): number {
    return getActiveFeats(character).reduce(
        (acc, feat) => acc + (feat.getDamageRatingBonus?.(character, itemData) ?? 0),
        0
    );
}

export function getFireRateBonus(character: Character, itemData: WeaponItem): number {
    return getActiveFeats(character).reduce(
        (acc, feat) => acc + (feat.getFireRateBonus?.(character, itemData) ?? 0),
        0
    );
}

export function getAvailableCompanions(perks: PerkId[], traits: TraitId[]): CompanionId[] {
    return getActiveFeats({perks, traits}).flatMap(
        (feat) => feat.getAvailableCompanions?.() ?? []
    );
}


interface WeaponEffect {
    effect: string;
    level?: number | undefined;
    bonus?: number | undefined;
}

export function getWeaponEffects(
    character: Character,
    itemData: WeaponItem,
    isAiming: boolean
): WeaponEffect[] {
    // TODO we might be assigning a "level" to ALL effects here... fix it.
    const effectsDict: Record<string, WeaponEffect> = {};

    // Weapon effects
    for (const e of itemData.EFFECTS) {
        const [effect, rawLevel] = e.split(':');
        if(!effect) {continue}

        const level = rawLevel ? Number.parseInt(rawLevel, 10) || 1 : undefined;
        effectsDict[effect] = {
            effect: effect,
            ...(level ? { level, bonus: 0 } : {}),
        };
    }

    // Bonus effects
    const bonusEffects = getActiveFeats(character).flatMap(
        (feat) => feat.getWeaponEffects?.(character, itemData, isAiming) ?? []
    );

    // Merge bonuses
    for (const bonus of bonusEffects) {
        const [effect, rawLevel] = bonus.split(":");
        if(effect) {
            const level = rawLevel ? Number.parseInt(rawLevel, 10) || 1 : undefined;
            if(!effectsDict[effect]){
                effectsDict[effect] = {
                    effect,
                ...( level ? { level: 0, bonus: level } : {})
                }
            } else {
                effectsDict[effect].bonus ??= 0
                effectsDict[effect].bonus += level ?? 1; // TODO not sure about this
            }
        }
    }

    return Object.values(effectsDict);
}

export function getRollActions(character: Character){
    return getActiveFeats(character).flatMap(
        feat => feat.getRollActions?.(character) ?? []
    )
}

export function getFreeRerolls(
    character: Character,
    itemData?: WeaponItem,
    ctx?: RollContext
){
    return getActiveFeats(character).reduce(
        (acc, feat) => acc + (feat.getFreeRerolls?.(character, itemData, ctx) ?? 0),
        0
    );
}

export function getRollSpecial(
    character: Character,
    context: SpecialModifierContext = {}
): SpecialMap {
    const effectiveSpecial: SpecialMap = { ...character.special };

    const modifiers = getActiveFeats(character).flatMap(
        (feat) => feat.getRollSpecialModifiers?.(character, context) ?? []
    );

    // TODO Might want to give priority to set / modify apply()
    for (const modifier of modifiers) {
        const baseValue = character.special[modifier.special];
        const currentValue = effectiveSpecial[modifier.special];
        effectiveSpecial[modifier.special] = modifier.apply(currentValue, baseValue);
    }

    return effectiveSpecial;
}

export function getRollToggleables(
    character: Character,
    itemData: WeaponItem
) {
    // TODO implementation still needs improvements, now currently tailored to perkCenterOfMass
    return getActiveFeats(character).reduce((acc, feat) => {
        const incoming = feat.getRollToggleables?.(character, itemData);
        if (!incoming) {return acc}

        for (const k in incoming) {
            const key = (k as keyof Toggleables)!;
            acc[key] = acc[key]
                ? [...acc[key], ...incoming[key] ?? []]
                : incoming[key] ?? [];
        }

        return acc;
    }, {} as Toggleables);
}

export function getPerkBlacklist(character: Character) {
    return getActiveFeats(character).flatMap(
        (feat) => feat.getBlacklistedPerks?.() ?? []
    );
}

export function getLocationDRBonus(
    special: SpecialMap, items: CharacterItem[],
    perks: PerkId[], traits: TraitId[]
) {
    return getActiveFeats({perks, traits}).reduce((acc, feat) => {
        const bonus = feat.getLocationDRBonus?.(special, items, perks, traits);

        return {
            physical: acc.physical + (bonus?.physical ?? 0),
            energy: acc.energy + (bonus?.energy ?? 0),
            radiation: acc.radiation + (bonus?.radiation ?? 0)
        }
    }, {physical: 0, energy: 0, radiation: 0});
}
