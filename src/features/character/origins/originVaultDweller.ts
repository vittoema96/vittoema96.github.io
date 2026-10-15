import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import type { Origin } from './types.ts';

const originVaultDweller: Origin = {
    ...DEFAULT_ORIGIN,
    id: 'vaultDweller' as const,
    // TODO add the action that grants Luck when the origin is clicked.
};

export default originVaultDweller;
