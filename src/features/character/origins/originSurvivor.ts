import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originSurvivor: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'survivor' as const,
    numberOfTraits: 2,
};

export default originSurvivor;
