import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originAssaultron: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'assaultron' as const,
    // TODO model Assaultron's specialized weapons.
    allowsPerkAndTraitWeightModifiers: false,
    isRobot: true,
    needsSpecializedArmor: true,
    needsSpecializedWeapons: true,
};

export default originAssaultron;
