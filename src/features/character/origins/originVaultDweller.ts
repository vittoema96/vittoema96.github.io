import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originVaultDweller: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'vaultDweller' as const,
};

export default originVaultDweller;
