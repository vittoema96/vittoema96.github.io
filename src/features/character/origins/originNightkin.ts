import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originNightkin: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'nightkin' as const,
    // TODO add a dedicated Nightkin SVG.
    hasRadiationImmunity: true,
    hasPoisonImmunity: true,
    specialMaxValues: {
        ...DEFAULT_ORIGIN.specialMaxValues,
        strength: 12,
        endurance: 12,
        intelligence: 8,
        charisma: 8,
    },
    skillMaxValue: 4,
    needsSpecializedArmor: true,
};

export default originNightkin;
