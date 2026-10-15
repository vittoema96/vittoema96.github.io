import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originRobobrain: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'robobrain' as const,
    // TODO model Mesmetron and whether normal weapons are allowed.
    getMaxWeightBase: () => 150 / 2,
    hasRadiationImmunity: true,
    hasPoisonImmunity: true,
    isRobot: true,
    needsSpecializedArmor: true,
    needsSpecializedWeapons: true,
    // TODO add a dedicated Robobrain SVG.
};

export default originRobobrain;
