import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitMoreThanHuman_immunities: TraitImplementation = {
    id: 'traitMoreThanHuman_immunities',
    isRadiationImmune: () => true,
    isPoisonImmune: () => true,
};

export default traitMoreThanHuman_immunities;
