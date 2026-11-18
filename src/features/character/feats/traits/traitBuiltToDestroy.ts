import type { TraitImplementation } from '@/features/character/feats/types.ts';

const traitBuiltToDestroy: TraitImplementation = {
    id: 'traitBuiltToDestroy',
    // TODO: reduce the damage threshold required for a critical hit when critical-hit modifiers are supported.
    getRollComplicationModifiers: (_, context) =>
        context.itemData ? { thresholdDelta: 1 } : {},
};

export default traitBuiltToDestroy;
