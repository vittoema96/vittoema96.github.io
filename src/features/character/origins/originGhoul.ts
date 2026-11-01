import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originGhoul: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'ghoul' as const,
    characterSvg: 'ghoul',
};

export default originGhoul;
