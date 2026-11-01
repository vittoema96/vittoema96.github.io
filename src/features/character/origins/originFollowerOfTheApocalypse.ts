import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originFollowerOfTheApocalypse: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'followerOfTheApocalypse' as const,
};

export default originFollowerOfTheApocalypse;
