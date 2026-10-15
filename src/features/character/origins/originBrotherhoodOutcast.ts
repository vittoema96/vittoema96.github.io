import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originBrotherhoodOutcast: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'brotherhoodOutcast' as const,
};

export default originBrotherhoodOutcast;
