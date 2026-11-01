import { MR_HANDY_PARTS } from '@/types';
import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originMrHandy: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'mrHandy' as const,
    // TODO prevent aid consumption when the origin rule is modeled by the engine.
    allowsPerkAndTraitWeightModifiers: false,
    bodyParts: MR_HANDY_PARTS,
    isRobot: true,
    numberOfTraits: 3,
    needsSpecializedArmor: true,
    needsSpecializedWeapons: true,
    characterSvg: 'mrHandy',
};

export default originMrHandy;
