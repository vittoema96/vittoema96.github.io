import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitJinxed: TraitImplementation = {
    id: 'traitJinxed',
    // TODO: increase attackers' complication range when targeting this character or attacking within Close range.
    getRollComplicationModifiers: () => ({ thresholdDelta: -2 }),
};

export default traitJinxed;
