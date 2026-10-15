import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originGhoul: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'ghoul' as const,
    hasRadiationImmunity: true,
    characterSvg: 'ghoul',
    getWhitelistedSpecialties: () => ['survival' as const],
    getSpecialtyPointsBonus: () => 1,
};

export default originGhoul;
