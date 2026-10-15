import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originProtectron: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'protectron' as const,
    // TODO model Protectron weapons as origin-provided equipment.
    getMaxWeightBase: () => 225 / 2,
    hasRadiationImmunity: true,
    hasPoisonImmunity: true,
    numberOfTraits: 2,
    // TODO add origin-specific traits and disease immunity.
    isRobot: true,
    needsSpecializedArmor: true,
    needsSpecializedWeapons: true,
    // TODO add a dedicated Protectron SVG.
};

export default originProtectron;
