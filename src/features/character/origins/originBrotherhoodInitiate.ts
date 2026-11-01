import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originBrotherhoodInitiate: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'brotherhoodInitiate' as const,
};

export default originBrotherhoodInitiate;
