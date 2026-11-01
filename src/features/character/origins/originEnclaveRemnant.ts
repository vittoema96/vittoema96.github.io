import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originEnclaveRemnant: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'enclaveRemnant' as const,
};

export default originEnclaveRemnant;
