import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originSuperMutant: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'superMutant' as const,
    hasRadiationImmunity: true,
    hasPoisonImmunity: true,
    specialMaxValues: {
        ...DEFAULT_ORIGIN.specialMaxValues,
        strength: 12,
        endurance: 12,
        intelligence: 6,
        charisma: 6,
    },
    specialMinValues: {
        ...DEFAULT_ORIGIN.specialMinValues,
        strength: 6,
        endurance: 6,
    },
    skillMaxValue: 4,
    needsSpecializedArmor: true,
    getSpecialAllocationPointsBonus: () => 4,
};

export default originSuperMutant;
