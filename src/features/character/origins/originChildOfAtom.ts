import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originChildOfAtom: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'childOfAtom' as const,
    // TODO add the base radiation resistance and remaining mechanics.
};

export default originChildOfAtom;
