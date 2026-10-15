import { BODY_PARTS } from '@/types';
import type { Origin } from './types.ts';
import { SPECIAL, SpecialType } from '@/features/character/special/special.ts';

// TODO implement additional tag apparel on origins.
export const DEFAULT_ORIGIN: Origin = Object.freeze({
    id: undefined,
    getMaxWeightBase: (strengthVal: number) => 75 + strengthVal * 5,
    allowsPerkAndTraitWeightModifiers: true,
    hasRadiationImmunity: false,
    hasPoisonImmunity: false,
    bodyParts: Object.freeze(new Set(BODY_PARTS)),
    numberOfTraits: 0,
    isRobot: false,
    specialMinValues: Object.freeze(Object.fromEntries(
        SPECIAL.map((key) => [key, 4])
    ) as Record<SpecialType, number>),
    specialMaxValues: Object.freeze(Object.fromEntries(
        SPECIAL.map((key) => [key, 10])
    ) as Record<SpecialType, number>),
    skillMaxValue: 6,
    needsSpecializedArmor: false,
    needsSpecializedWeapons: false,
    characterSvg: 'vaultboy-open-arms',
});
