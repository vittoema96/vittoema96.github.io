import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originThreeFamilies: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'threeFamilies' as const,
};

export default originThreeFamilies;
