import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitProtectOrDestroy_immunities: TraitImplementation = {
    id: 'traitProtectOrDestroy_immunities',
    isRadiationImmune: () => true,
    isPoisonImmune: () => true,
};

export default traitProtectOrDestroy_immunities;
