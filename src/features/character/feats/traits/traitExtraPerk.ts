import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitExtraPerk: TraitImplementation = {
    id: 'traitExtraPerk',
    getPerkSlotsBonus: () => 1,
};

export default traitExtraPerk;
