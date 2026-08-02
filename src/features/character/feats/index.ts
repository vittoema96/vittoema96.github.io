import { Character, CompanionId } from '@/types';
import { PerkId } from '@/features/character/feats/perks/perks.ts';
import { TraitId } from '@/features/character/feats/traits/traits.ts';
import { WeaponItem } from '@/data/item/weapon.schemas.ts';
import { TFunction } from 'i18next';

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

interface FeatImplementation {
    applyPassiveModifiers?: (character: Character) => void;

    onExecuteAction?: (character: Character, payload?: any) => void;

    onBeforeRoll?: (character: Character, diceContext: any) => void;

    getAvailableCompanions?: () => CompanionId[]

    getSpecialtyPointBonus?: (character: Character) => number

    getDamageRatingBonus?: (character: Character, itemData: WeaponItem) => number

    getFireRateBonus?: (character: Character, itemData: WeaponItem) => number

    getWeaponEffects?: (character: Character, itemData: WeaponItem, isAiming: boolean) => `${string}:${number}`[]

    getRollActions?: (character: Character) => FeatRollAction[]

    getFreeRerolls?: (character: Character, itemData: WeaponItem) => number
}

export type PerkImplementation = FeatImplementation & { id: PerkId }
export type TraitImplementation = FeatImplementation & { id: TraitId }


function getActiveFeats(character: Character): FeatImplementation[] {
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

export function getAvailableCompanions(character: Character): CompanionId[] {
    return getActiveFeats(character).flatMap(
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

export function getFreeRerolls(character: Character, itemData: WeaponItem){
    return getActiveFeats(character).reduce(
        (acc, feat) => acc + (feat.getFreeRerolls?.(character, itemData) ?? 0),
        0
    );
}
