import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originNcr: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'ncr' as const,
    numberOfTraits: 2,
    // TODO add the origin-specific fixed traits.
};

export default originNcr;
