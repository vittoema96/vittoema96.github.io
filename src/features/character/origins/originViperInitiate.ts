import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originViperInitiate: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'viperInitiate' as const,
};

export default originViperInitiate;
