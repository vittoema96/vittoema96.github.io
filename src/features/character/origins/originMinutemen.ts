import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originMinutemen: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'minutemen' as const,
    // TODO add the origin-specific fixed trait.
};

export default originMinutemen;
