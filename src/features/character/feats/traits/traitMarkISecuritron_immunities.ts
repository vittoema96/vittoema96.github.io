import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitMarkISecuritron_immunities: TraitImplementation = {
    id: 'traitMarkISecuritron_immunities',
    isRadiationImmune: () => true,
    isPoisonImmune: () => true,
};

export default traitMarkISecuritron_immunities;
