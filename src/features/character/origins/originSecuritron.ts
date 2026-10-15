import { BODY_PARTS } from '@/types';
import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originSecuritron: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'securitron' as const,
    // TODO model Securitron's specialized weapons.
    getMaxWeightBase: () => 150 / 2,
    hasRadiationImmunity: true,
    hasPoisonImmunity: true,
    bodyParts: BODY_PARTS,
    // TODO replace the two legs with the single wheel body part.
    isRobot: true,
    needsSpecializedArmor: true,
    needsSpecializedWeapons: true,
    // TODO add a dedicated Securitron SVG.
};

export default originSecuritron;
