import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originTribal: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'tribal' as const,
    numberOfTraits: 2,
    // TODO review and implement the remaining Tribal mechanics.
};

export default originTribal;
