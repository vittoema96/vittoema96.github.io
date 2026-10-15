import type { GenericBodyPart } from '@/types';
import type { SpecialMap } from '@/features/character/special/special.ts';
import type {
    FeatImplementation,
    SpecialtySkillBonus,
} from '@/features/character/feats/types.ts';

export const ORIGIN_IDS = [
    'vaultDweller', 'ghoul', 'survivor', 'mrHandy',
    'brotherhoodInitiate', 'superMutant', 'minutemen', 'ncr',
    'protectron', 'robobrain', 'securitron', 'synth', 'assaultron',
    'brotherhoodOutcast', 'childOfAtom', 'nightkin', 'tribal',
] as const;

export type OriginId = (typeof ORIGIN_IDS)[number] | undefined;
export type DefinedOriginId = (typeof ORIGIN_IDS)[number];

export type OriginSpecialtySkillBonus = SpecialtySkillBonus;

export interface Origin extends FeatImplementation {
    id: OriginId;
    getMaxWeightBase: (strengthVal: number) => number;
    allowsPerkAndTraitWeightModifiers: boolean;
    hasRadiationImmunity: boolean;
    hasPoisonImmunity: boolean;
    bodyParts: ReadonlySet<GenericBodyPart>;
    numberOfTraits: number;
    isRobot: boolean;
    specialMinValues: SpecialMap;
    specialMaxValues: SpecialMap;
    skillMaxValue: number;
    needsSpecializedArmor: boolean;
    needsSpecializedWeapons: boolean;
    characterSvg: string;
}
