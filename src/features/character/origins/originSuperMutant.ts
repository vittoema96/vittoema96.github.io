import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originSuperMutant: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'superMutant' as const,
    needsSpecializedArmor: true,
};

export default originSuperMutant;
