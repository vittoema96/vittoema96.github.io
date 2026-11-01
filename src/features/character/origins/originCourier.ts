import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originCourier: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'courier' as const,
    numberOfTraits: 1,
};

export default originCourier;
